import { NextRequest, NextResponse } from 'next/server';

// Vercel serverless timeout — max 60s on Pro, 10s on Hobby
export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

type IdentifyContext = 'equipment' | 'supplement' | 'fish' | 'coral' | 'invertebrate' | 'auto';

const PROMPTS: Record<IdentifyContext, string> = {
  auto: `You are ReefOS AI, an expert reef aquarium identifier. Analyze this image and identify what it shows.
Determine if it's: equipment, supplement/product, fish, coral, or invertebrate.
Return ONLY valid JSON (no markdown):
{
  "type": "equipment" | "supplement" | "fish" | "coral" | "invertebrate" | "unknown",
  "name": "product/model name or species common name",
  "brand": "brand name if product, or null",
  "scientific_name": "scientific name if animal, or null",
  "category": "specific category (e.g. lighting, filtration, calcium supplement, SPS, LPS, clownfish, etc.)",
  "confidence": 0.0-1.0,
  "details": "brief description of what you see"
}`,

  equipment: `You are ReefOS AI, an expert at identifying reef aquarium equipment.
Identify the equipment in this image. Recognize brands like Aqua Illumination, EcoTech Marine, Kessil, Neptune, Tunze, Jebao, Reef Octopus, Bubble Magus, etc.
Return ONLY valid JSON (no markdown):
{
  "type": "equipment",
  "name": "model name (e.g. Hydra 32 HD, Vortech MP40, Nero 5)",
  "brand": "manufacturer (e.g. Aqua Illumination, EcoTech Marine)",
  "category": "lighting | circulation | filtration | heating | water_management | testing | controller | sump | accessories",
  "confidence": 0.0-1.0,
  "details": "brief description"
}`,

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
  if (!GEMINI_API_KEY) {
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
      console.error('Gemini API error:', err);
      return NextResponse.json({ error: 'AI identification failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response', raw: text }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Identify error:', error);
    return NextResponse.json({ error: 'Identification failed' }, { status: 500 });
  }
}
