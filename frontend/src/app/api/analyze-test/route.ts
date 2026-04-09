import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

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

function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  return { key, url };
}

/**
 * POST /api/analyze-test
 * Receives a base64 image of a water test kit photo.
 * Uses Gemini Flash to read values and return parsed parameters.
 */
export async function POST(req: NextRequest) {
  const { key: GEMINI_KEY, url: GEMINI_URL } = getGeminiConfig();

  if (!GEMINI_KEY) {
    console.error('[analyze-test] GEMINI_API_KEY not set');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const mime = mimeType || 'image/jpeg';

    console.log(`[analyze-test] imageSize=${Math.round(base64Data.length / 1024)}KB`);

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: SYSTEM_PROMPT + '\n\nRead the water test results from this photo. Return only the JSON.' },
            {
              inline_data: {
                mime_type: mime,
                data: base64Data,
              },
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[analyze-test] Gemini API error:', err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[analyze-test] Could not parse:', text);
      return NextResponse.json({ error: 'Could not parse AI response', raw: text }, { status: 500 });
    }

    let params;
    try {
      params = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('[analyze-test] Invalid JSON from AI:', jsonMatch[0].slice(0, 200));
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: text.slice(0, 200) }, { status: 500 });
    }
    return NextResponse.json({ params });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[analyze-test] Error:', msg);
    return NextResponse.json({ error: `Failed to analyze image: ${msg}` }, { status: 500 });
  }
}
