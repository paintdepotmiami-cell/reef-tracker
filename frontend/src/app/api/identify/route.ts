import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless timeout — 10s on Hobby, 60s on Pro
export const maxDuration = 60;

function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  return { key, url };
}

type IdentifyContext = 'equipment' | 'supplement' | 'fish' | 'coral' | 'invertebrate' | 'auto';

const PROMPTS: Record<IdentifyContext, string> = {
  auto: `You are ReefOS AI, an expert reef aquarium identifier. Analyze this image and identify the SINGLE MOST PROMINENT item.
If multiple items are visible, pick the one that is most centered or largest in the frame.
Determine if it's: equipment, supplement/product, fish, coral, or invertebrate.
Return ONLY a single valid JSON object with NO markdown formatting, NO code fences, NO backticks:
{"type":"equipment","name":"product name","brand":"brand or null","scientific_name":"scientific name or null","category":"specific category","confidence":0.9,"details":"brief description"}`,

  equipment: `You are ReefOS AI, an expert at identifying reef aquarium equipment.
Identify the SINGLE MOST PROMINENT piece of equipment in this image. If multiple items are visible, pick the one most centered or largest.
Recognize brands like Aqua Illumination, EcoTech Marine, Kessil, Neptune, Tunze, Jebao, Reef Octopus, Bubble Magus, etc.
Return ONLY a single valid JSON object with NO markdown formatting, NO code fences, NO backticks:
{"type":"equipment","name":"model name","brand":"manufacturer","category":"lighting|circulation|filtration|heating|water_management|testing|controller|sump|accessories","confidence":0.9,"details":"brief description"}`,

  supplement: `You are ReefOS AI, an expert at identifying reef aquarium supplements and products.
Identify the product in this image. Recognize brands like Red Sea, Brightwell, Seachem, Fauna Marin, Fritz, Two Little Fishies, etc.
Return ONLY valid JSON (no markdown):
{
  "type": "supplement",
  "name": "product name (e.g. Foundation A, MicroBacter7, Reef-Roids)",
  "brand": "manufacturer (e.g. Red Sea, Brightwell Aquatics)",
  "category": "calcium supplement | alkalinity supplement | magnesium supplement | trace elements | coral food | bacteria | phosphate remover | salt mix | coral dip | fish food | amino acids | other",
  "confidence": 0.0-1.0,
  "details": "brief description"
}`,

  fish: `You are ReefOS AI, a marine biologist expert at identifying reef aquarium fish.
Identify the fish species in this image.
Return ONLY valid JSON (no markdown):
{
  "type": "fish",
  "name": "common name (e.g. Ocellaris Clownfish, Yellow Tang, Mandarin Dragonet)",
  "scientific_name": "scientific name (e.g. Amphiprion ocellaris)",
  "brand": null,
  "category": "subcategory (e.g. Clownfish, Tang, Wrasse, Goby, Blenny, Angel, Damsel)",
  "confidence": 0.0-1.0,
  "details": "brief description including care level and temperament"
}`,

  coral: `You are ReefOS AI, a marine biologist expert at identifying reef corals.
Identify the coral species in this image. Distinguish between SPS (Acropora, Montipora, Stylophora), LPS (Hammer, Torch, Frogspawn, Brain, Acan), Soft corals (Mushroom, Zoa, Toadstool, Leather, Xenia), and Anemones.
Return ONLY valid JSON (no markdown):
{
  "type": "coral",
  "name": "common name (e.g. Hammer Coral, Zoanthid, Green Star Polyp)",
  "scientific_name": "scientific name (e.g. Euphyllia ancora)",
  "brand": null,
  "category": "SPS | LPS | Soft | Anemone",
  "confidence": 0.0-1.0,
  "details": "brief description including light/flow needs and placement"
}`,

  invertebrate: `You are ReefOS AI, a marine biologist expert at identifying reef invertebrates.
Identify the invertebrate in this image.
Return ONLY valid JSON (no markdown):
{
  "type": "invertebrate",
  "name": "common name (e.g. Cleaner Shrimp, Emerald Crab, Turbo Snail)",
  "scientific_name": "scientific name",
  "brand": null,
  "category": "Shrimp | Crab | Snail | Urchin | Starfish | other",
  "confidence": 0.0-1.0,
  "details": "brief description including reef safety"
}`,
};

export async function POST(req: NextRequest) {
  const { key: GEMINI_API_KEY, url: GEMINI_URL } = getGeminiConfig();

  if (!GEMINI_API_KEY) {
    console.error('[identify] GEMINI_API_KEY not set');
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { image, context = 'auto' } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // image should be base64 encoded (data:image/jpeg;base64,...)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    console.log(`[identify] context=${context}, imageSize=${Math.round(base64Data.length / 1024)}KB`);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPTS[context as IdentifyContext] || PROMPTS.auto },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[identify] Gemini ${response.status}:`, err.slice(0, 500));
      return NextResponse.json({ error: `AI identification failed (${response.status})`, detail: err.slice(0, 200) }, { status: 502 });
    }

    const data = await response.json();

    // Check for blocked/empty responses
    if (!data.candidates || data.candidates.length === 0) {
      console.error('[identify] No candidates returned:', JSON.stringify(data).slice(0, 500));
      const blockReason = data.promptFeedback?.blockReason || 'unknown';
      return NextResponse.json({ error: `AI returned no results (blocked: ${blockReason})` }, { status: 500 });
    }

    const rawText = data.candidates[0]?.content?.parts?.[0]?.text || '';

    // Aggressively clean AI response
    let text = rawText
      .replace(/```(?:json)?\s*/gi, '')  // opening code fences
      .replace(/```/g, '')               // closing code fences
      .trim();

    console.log('[identify] cleaned:', text.slice(0, 400));

    // Try parsing the full text first (might be clean JSON)
    let result;
    try {
      const parsed = JSON.parse(text);
      // If it's an array, take the first item
      result = Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      // Extract JSON object or array from text
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      const objMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = arrayMatch?.[0] || objMatch?.[0];

      if (!jsonStr) {
        return NextResponse.json({ error: 'Could not parse AI response', raw: rawText.slice(0, 300) }, { status: 500 });
      }

      // Clean common JSON issues
      const cleaned = jsonStr
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ');

      try {
        const parsed = JSON.parse(cleaned);
        result = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        console.error('[identify] Invalid JSON:', cleaned.slice(0, 400));
        return NextResponse.json({ error: 'AI returned invalid JSON', raw: rawText.slice(0, 300) }, { status: 500 });
      }
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Identify error:', msg);
    return NextResponse.json({ error: `Identification failed: ${msg}` }, { status: 500 });
  }
}
