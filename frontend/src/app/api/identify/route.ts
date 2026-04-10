import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless timeout — 10s on Hobby, 60s on Pro
export const maxDuration = 60;

function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  return { key, url };
}

type IdentifyContext = 'equipment' | 'supplement' | 'fish' | 'coral' | 'invertebrate' | 'auto';

const BASE_RULES = `CRITICAL: Return ONLY raw JSON. No markdown, no code fences, no backticks, no explanation. If multiple items are visible, return a JSON array. If only one item, return a single JSON object.`;

const PROMPTS: Record<IdentifyContext, string> = {
  auto: `You are ReefOS AI, an expert reef aquarium identifier. Identify ALL items visible in this image.
For each item determine if it's: equipment, supplement/product, fish, coral, or invertebrate.
${BASE_RULES}
Single item: {"type":"equipment","name":"name","brand":"brand or null","scientific_name":"name or null","category":"category","confidence":0.9,"details":"brief"}
Multiple items: [{"type":"fish","name":"name","brand":null,"scientific_name":"name","category":"cat","confidence":0.9,"details":"brief"},{"type":"equipment","name":"name","brand":"brand","scientific_name":null,"category":"cat","confidence":0.8,"details":"brief"}]`,

  equipment: `You are ReefOS AI, an expert at identifying reef aquarium equipment.
Identify ALL equipment visible in this image. Recognize brands like Aqua Illumination, EcoTech Marine, Kessil, Neptune, Tunze, Jebao, Reef Octopus, Bubble Magus, Hydor, Sicce, IceCap, etc.
${BASE_RULES}
Single: {"type":"equipment","name":"model","brand":"manufacturer","category":"lighting|circulation|filtration|heating|water_management|testing|controller|sump|dosing|skimmer|ato|accessories","confidence":0.9,"details":"brief"}
Multiple: [{"type":"equipment","name":"model1","brand":"brand1","category":"cat1","confidence":0.9,"details":"brief"},{"type":"equipment","name":"model2","brand":"brand2","category":"cat2","confidence":0.8,"details":"brief"}]`,

  supplement: `You are ReefOS AI, an expert at identifying reef aquarium supplements and products.
Identify ALL supplements/products visible in this image. Recognize brands like Red Sea, Brightwell, Seachem, Fauna Marin, Fritz, Two Little Fishies, etc.
${BASE_RULES}
Single: {"type":"supplement","name":"product name","brand":"manufacturer","category":"calcium supplement|alkalinity supplement|magnesium supplement|trace elements|coral food|bacteria|phosphate remover|salt mix|coral dip|fish food|amino acids|other","confidence":0.9,"details":"brief"}
Multiple: [{"type":"supplement","name":"name1","brand":"brand1","category":"cat1","confidence":0.9,"details":"brief"},{"type":"supplement","name":"name2","brand":"brand2","category":"cat2","confidence":0.8,"details":"brief"}]`,

  fish: `You are ReefOS AI, a marine biologist expert at identifying reef aquarium fish.
Identify ALL fish visible in this image, even partially visible ones.
${BASE_RULES}
Single: {"type":"fish","name":"common name","scientific_name":"scientific name","brand":null,"category":"Clownfish|Tang|Wrasse|Goby|Blenny|Angel|Damsel|Anthias|Butterflyfish|other","confidence":0.9,"details":"brief with care level"}
Multiple: [{"type":"fish","name":"name1","scientific_name":"sci1","brand":null,"category":"cat1","confidence":0.9,"details":"brief"},{"type":"fish","name":"name2","scientific_name":"sci2","brand":null,"category":"cat2","confidence":0.8,"details":"brief"}]`,

  coral: `You are ReefOS AI, a marine biologist expert at identifying reef corals.
Identify ALL corals visible in this image. Distinguish SPS, LPS, Soft corals, and Anemones.
${BASE_RULES}
Single: {"type":"coral","name":"common name","scientific_name":"scientific name","brand":null,"category":"SPS|LPS|Soft|Anemone","confidence":0.9,"details":"brief with light/flow needs"}
Multiple: [{"type":"coral","name":"name1","scientific_name":"sci1","brand":null,"category":"SPS","confidence":0.9,"details":"brief"},{"type":"coral","name":"name2","scientific_name":"sci2","brand":null,"category":"LPS","confidence":0.8,"details":"brief"}]`,

  invertebrate: `You are ReefOS AI, a marine biologist expert at identifying reef invertebrates.
Identify ALL invertebrates visible in this image.
${BASE_RULES}
Single: {"type":"invertebrate","name":"common name","scientific_name":"scientific name","brand":null,"category":"Shrimp|Crab|Snail|Urchin|Starfish|other","confidence":0.9,"details":"brief with reef safety"}
Multiple: [{"type":"invertebrate","name":"name1","scientific_name":"sci1","brand":null,"category":"cat1","confidence":0.9,"details":"brief"},{"type":"invertebrate","name":"name2","scientific_name":"sci2","brand":null,"category":"cat2","confidence":0.8,"details":"brief"}]`,
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
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Extract JSON array or object from text
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
        parsed = JSON.parse(cleaned);
      } catch {
        console.error('[identify] Invalid JSON:', cleaned.slice(0, 400));
        return NextResponse.json({ error: 'AI returned invalid JSON', raw: rawText.slice(0, 300) }, { status: 500 });
      }
    }
    // Normalize: always return { items: [...] }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return NextResponse.json({ items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Identify error:', msg);
    return NextResponse.json({ error: `Identification failed: ${msg}` }, { status: 500 });
  }
}
