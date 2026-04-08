import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an aquarium water test reader. You analyze photos of test kit results and extract parameter values.

Common test kits and devices:
- Hanna Instruments multiparameter photometer (digital display showing ALK, Ca, Mg, pH, PHOS, AMMO, NITRITE, NITRATE)
- API Master Test Kit (color tubes compared to a card)
- Salifert, Red Sea, Nyos test kits (color comparison)
- Refractometer (salinity)

CRITICAL UNIT CONVERSIONS:
- Alkalinity: Hanna reports ALK in ppm CaCO3. ALWAYS convert to dKH by dividing by 17.86. Example: ALK 198 ppm = 198/17.86 = 11.1 dKH
- If alkalinity is already in dKH (values typically 6-14), use as-is
- If alkalinity is in meq/L, multiply by 2.8 to get dKH

Return ONLY a JSON object. Use null for parameters you cannot read. Values must be numbers.

Parameters (in these units):
- alkalinity (MUST be in dKH — convert from ppm if needed)
- calcium (ppm)
- magnesium (ppm)
- nitrate (ppm)
- phosphate (ppm)
- ph
- ammonia (ppm)
- nitrite (ppm)
- salinity (ppt — convert from SG if needed)
- temperature (F)

Example: Hanna showing ALK 198, Ca 443, Mg 1596, pH 7.8, PHOS 0.2, AMMO 0.1, NITRITE 0.0, NITRATE 0
Returns: {"alkalinity": 11.1, "calcium": 443, "magnesium": 1596, "nitrate": 0, "phosphate": 0.2, "ph": 7.8, "ammonia": 0.1, "nitrite": 0, "salinity": null, "temperature": null}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`;

/**
 * POST /api/analyze-test
 * Receives a base64 image of a water test kit photo.
 * Uses OpenAI GPT-4o Vision to read the values and return parsed parameters.
 */
export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${image}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'high' },
              },
              {
                type: 'text',
                text: 'Read the water test results from this photo. Return only the JSON.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API error:', err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';

    // Parse the JSON response (strip any accidental markdown)
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const params = JSON.parse(cleaned);

    return NextResponse.json({ params });
  } catch (err) {
    console.error('Analyze test error:', err);
    return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
  }
}
