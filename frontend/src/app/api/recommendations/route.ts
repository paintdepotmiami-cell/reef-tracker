import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

/**
 * Create a Supabase client authenticated with the user's JWT.
 * This ensures queries respect RLS and the user can only access their own data.
 */
function getSupabaseForUser(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

const SYSTEM_PROMPT = `You are ReefOS AI, an expert marine aquarium advisor. You analyze a reefer's COMPLETE profile — their livestock (corals, fish, invertebrates), latest water parameters, and current products/supplements — to provide personalized product recommendations.

Your goal: recommend products from the catalog that would GENUINELY help this specific tank. Be practical, not salesy.

RULES:
1. Only recommend products from the PROVIDED catalog — never invent products
2. Max 5-7 recommendations, ranked by importance
3. Each recommendation must have a clear "why" tied to the user's actual data
4. Categories of recommendations:
   - CRITICAL: Something the tank urgently needs based on water params (e.g., alk low → suggest alk supplement)
   - UPGRADE: A better product than what they currently use
   - MISSING: A product category they should have but don't (e.g., no coral food, no amino acids)
   - COMPLEMENT: Products that synergize with what they already use
5. Never recommend products the user already owns
6. Consider coral types: SPS needs pristine params, LPS is more forgiving, softies are hardy
7. Consider fish load vs coral load for feeding recommendations
8. Be specific about WHY based on their actual animals and parameters

Return ONLY a JSON array. Each object must have:
- product_id: string (exact ID from catalog)
- priority: "critical" | "recommended" | "nice_to_have"
- reason: string (1-2 sentences explaining why, referencing their specific animals/params)
- category_tag: string (short tag like "Water Chemistry", "Coral Nutrition", "Pest Prevention", etc.)

Example: [{"product_id":"abc-123","priority":"critical","reason":"Your alkalinity is 6.2 dKH — too low for your SPS corals (Montipora, Acropora). This will stabilize it.","category_tag":"Water Chemistry"}]

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    // Extract and verify JWT from Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    // Verify token and get authenticated user
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Use verified user_id from JWT — never trust body
    const user_id = authUser.id;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Gather all user context in parallel (using authenticated client)
    const supabase = getSupabaseForUser(token);
    const [animalsRes, testRes, userProductsRes, catalogRes, equipmentRes] = await Promise.all([
      supabase
        .from('reef_animals')
        .select('name, species, type, subtype, quantity, condition, difficulty, light_need, flow_need, aggression, growth_speed, placement_zone')
        .eq('user_id', user_id),
      supabase
        .from('reef_water_tests')
        .select('*')
        .eq('user_id', user_id)
        .order('test_date', { ascending: false })
        .limit(3),
      supabase
        .from('reef_user_products')
        .select('product_id, status, notes, product:reef_products(id, name, brand, category)')
        .eq('user_id', user_id),
      supabase
        .from('reef_products')
        .select('id, name, brand, category, description, rating, affects_params, dosing_instructions')
        .order('rating', { ascending: false }),
      supabase
        .from('reef_equipment')
        .select('name, brand, category')
        .eq('user_id', user_id),
    ]);

    const animals = animalsRes.data || [];
    const recentTests = testRes.data || [];
    const userProducts = userProductsRes.data || [];
    const catalog = catalogRes.data || [];
    const equipment = equipmentRes.data || [];

    const ownedIds = new Set(userProducts.map((up: any) => up.product_id));
    const availableCatalog = catalog.filter((p: any) => !ownedIds.has(p.id));

    // Build context message
    const context = {
      livestock: {
        summary: `${animals.filter((a: any) => a.type === 'coral').length} corals, ${animals.filter((a: any) => a.type === 'fish').length} fish, ${animals.filter((a: any) => a.type === 'invertebrate').length} invertebrates`,
        animals: animals.map((a: any) => ({
          name: a.name,
          species: a.species,
          type: a.type,
          subtype: a.subtype,
          quantity: a.quantity,
          condition: a.condition,
          difficulty: a.difficulty,
          light_need: a.light_need,
          flow_need: a.flow_need,
        })),
      },
      water_params: recentTests.length > 0 ? {
        latest: recentTests[0],
        trend: recentTests.length > 1 ? 'Multiple tests available for trend analysis' : 'Only 1 test recorded',
      } : null,
      current_products: userProducts.map((up: any) => {
        const prod = Array.isArray(up.product) ? up.product[0] : up.product;
        return {
          name: prod?.name,
          brand: prod?.brand,
          category: prod?.category,
          status: up.status,
        };
      }),
      equipment: equipment.map((e: any) => ({
        name: e.name,
        brand: e.brand,
        category: e.category,
      })),
      available_catalog: availableCatalog.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description?.slice(0, 120),
        rating: p.rating,
        affects: p.affects_params,
      })),
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Here is the reefer's complete profile. Analyze and recommend products from the available catalog.\n\n${JSON.stringify(context, null, 2)}`,
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
    const text = data.choices?.[0]?.message?.content || '[]';
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let recommendations;
    try {
      recommendations = JSON.parse(cleaned);
    } catch {
      console.error('[recommendations] Failed to parse AI response:', cleaned.slice(0, 200));
      return NextResponse.json({ error: 'AI returned invalid JSON', raw: cleaned.slice(0, 200) }, { status: 500 });
    }

    // Enrich recommendations with full product data
    const enriched = recommendations.map((rec: any) => {
      const product = catalog.find((p: any) => p.id === rec.product_id);
      return {
        ...rec,
        product: product || null,
      };
    }).filter((rec: any) => rec.product !== null);

    return NextResponse.json({
      recommendations: enriched,
      context_summary: {
        animals_count: animals.length,
        tests_count: recentTests.length,
        products_count: userProducts.length,
        latest_test_date: recentTests[0]?.test_date || null,
      },
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
