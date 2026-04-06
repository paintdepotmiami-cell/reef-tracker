import { getSupabase } from './supabase';

export interface Animal {
  id: string;
  name: string;
  species: string | null;
  type: 'fish' | 'coral' | 'invertebrate';
  subtype: string | null;
  quantity: number;
  condition: string;
  photo_ref: string | null;
  photo_own: string | null;
  description: string | null;
  care_notes: string | null;
  date_added: string | null;
  difficulty: string | null;
  light_need: string | null;
  flow_need: string | null;
  aggression: string | null;
  growth_speed: string | null;
  min_distance_inches: number | null;
  placement_zone: string | null;
  reef_safe: string | null;
  warnings: string[] | null;
}

export interface ActionItem {
  id: string;
  type: 'param_alert' | 'maintenance' | 'compatibility' | 'consumable' | 'general';
  priority: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  action?: string;
}

export function generateTodayFeed(test: WaterTest | null, animals: Animal[]): ActionItem[] {
  const items: ActionItem[] = [];

  // 1. Parameter alerts from latest test
  if (test) {
    const daysSinceTest = Math.floor((Date.now() - new Date(test.test_date).getTime()) / 86400000);
    if (daysSinceTest > 7) {
      items.push({ id: 'test-overdue', type: 'maintenance', priority: 'critical', icon: 'science', title: 'Water test overdue', description: `Last test was ${daysSinceTest} days ago. Weekly testing recommended.`, action: 'Log parameters now' });
    }
    if (test.phosphate != null && test.phosphate > 0.1) {
      items.push({ id: 'po4-high', type: 'param_alert', priority: 'critical', icon: 'priority_high', title: `Phosphate high: ${test.phosphate} ppm`, description: 'Replace RowaPhos media or increase Phosphat-E dosing. Chaeto reactor also helps export PO4.', action: 'Check reactor media' });
    }
    if (test.ph != null && test.ph < 8.0) {
      items.push({ id: 'ph-low', type: 'param_alert', priority: 'warning', icon: 'water_ph', title: `pH trending low: ${test.ph}`, description: 'Verify Kalkwasser concentration in ATO. CO2 scrubber on skimmer helps. Ensure room ventilation.', action: 'Check Kalkwasser' });
    }
    if (test.magnesium != null && test.magnesium > 1400) {
      items.push({ id: 'mg-high', type: 'param_alert', priority: 'warning', icon: 'lab_profile', title: `Magnesium elevated: ${test.magnesium} ppm`, description: 'Pause Magnesium dosing (Brightwell). Water changes will bring it down gradually. Re-test in 1 week.', action: 'Pause Mg dosing' });
    }
    if (test.nitrate != null && test.nitrate < 2) {
      items.push({ id: 'no3-low', type: 'param_alert', priority: 'warning', icon: 'eco', title: `Nitrate too low: ${test.nitrate} ppm`, description: 'Corals need some NO3 (5-10 ppm ideal). Feed more Reef-Roids, reduce carbon, or dim chaeto light.', action: 'Increase feeding' });
    }
    if (test.ammonia != null && test.ammonia > 0) {
      items.push({ id: 'nh3-detected', type: 'param_alert', priority: 'critical', icon: 'dangerous', title: `Ammonia detected: ${test.ammonia} ppm`, description: 'Check for dead animals, uneaten food, or dying coral. Verify skimmer is producing dark skimmate. Carbon reactor fresh?', action: 'Inspect tank' });
    }
  } else {
    items.push({ id: 'no-test', type: 'maintenance', priority: 'critical', icon: 'science', title: 'No water test recorded', description: 'Log your first water test to get personalized recommendations.', action: 'Log parameters' });
  }

  // 2. Compatibility warnings from animals
  const euphylliaCount = animals.filter(a => a.name.includes('Torch') || a.name.includes('Hammer')).length;
  if (euphylliaCount > 0) {
    const nearby = animals.filter(a => a.type === 'coral' && !a.name.includes('Torch') && !a.name.includes('Hammer') && a.min_distance_inches == null);
    if (nearby.length > 0) {
      items.push({ id: 'euphyllia-sweep', type: 'compatibility', priority: 'warning', icon: 'swap_horiz', title: `Euphyllia sweep risk (${euphylliaCount} colonies)`, description: 'Torch & Hammer have 4-6" sweeper tentacles. Ensure 6" minimum distance from all non-Euphyllia corals.' });
    }
  }

  const invasive = animals.filter(a => a.growth_speed === 'Very Fast');
  invasive.forEach(a => {
    items.push({ id: `invasive-${a.id}`, type: 'compatibility', priority: 'info', icon: 'trending_up', title: `${a.name}: fast grower`, description: `${a.name} grows aggressively. Check if it's encroaching on valuable corals. Frag or prune if needed.` });
  });

  const bta = animals.find(a => a.name.includes('Bubble Tip'));
  if (bta) {
    items.push({ id: 'bta-movement', type: 'compatibility', priority: 'info', icon: 'moving', title: 'BTA can relocate', description: 'Bubble Tip Anemones move freely. If it walks toward corals, redirect with flow changes. Protect Nero 3 intakes.' });
  }

  const flameScallop = animals.find(a => a.name.includes('Flame Scallop'));
  if (flameScallop) {
    items.push({ id: 'scallop-feeding', type: 'maintenance', priority: 'warning', icon: 'restaurant', title: 'Flame Scallop needs feeding', description: 'Feed phytoplankton or diluted Reef-Roids 3-4x/week. Flame Scallops are difficult long-term without consistent feeding.' });
  }

  // 3. Sort by priority
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

export interface WaterTest {
  id: string;
  test_date: string;
  calcium: number | null;
  alkalinity: number | null;
  magnesium: number | null;
  ph: number | null;
  phosphate: number | null;
  nitrate: number | null;
  nitrite: number | null;
  ammonia: number | null;
  salinity: number | null;
  temperature: number | null;
  photo_url: string | null;
  notes: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  config: string | null;
  notes: string | null;
}

export interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  type: string | null;
  notes: string | null;
}

export interface Recommendation {
  param: string;
  level: 'ok' | 'warning' | 'action';
  title: string;
  text: string;
  product?: string;
}

export async function getAnimals(type?: string): Promise<Animal[]> {
  let q = getSupabase().from('reef_animals').select('*').order('name');
  if (type) q = q.eq('type', type);
  const { data } = await q;
  return data || [];
}

export async function getLatestTest(): Promise<WaterTest | null> {
  const { data } = await getSupabase()
    .from('reef_water_tests')
    .select('*')
    .order('test_date', { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getAllTests(): Promise<WaterTest[]> {
  const { data } = await getSupabase()
    .from('reef_water_tests')
    .select('*')
    .order('test_date', { ascending: false });
  return data || [];
}

export async function getEquipment(): Promise<Equipment[]> {
  const { data } = await getSupabase().from('reef_equipment').select('*').order('category');
  return data || [];
}

export async function getSupplements(): Promise<Supplement[]> {
  const { data } = await getSupabase().from('reef_supplements').select('*').order('name');
  return data || [];
}

export async function createWaterTest(test: Partial<WaterTest>): Promise<WaterTest | null> {
  const { data } = await getSupabase().from('reef_water_tests').insert(test).select().single();
  return data;
}

export async function getStats() {
  const [fish, corals, inverts, equipment] = await Promise.all([
    getSupabase().from('reef_animals').select('quantity', { count: 'exact' }).eq('type', 'fish'),
    getSupabase().from('reef_animals').select('quantity', { count: 'exact' }).eq('type', 'coral'),
    getSupabase().from('reef_animals').select('quantity', { count: 'exact' }).eq('type', 'invertebrate'),
    getSupabase().from('reef_equipment').select('*', { count: 'exact', head: true }),
  ]);

  const sumQty = (data: { quantity: number }[] | null) => data?.reduce((s, r) => s + (r.quantity || 1), 0) || 0;

  return {
    fish: sumQty(fish.data as { quantity: number }[] | null),
    corals: sumQty(corals.data as { quantity: number }[] | null),
    inverts: sumQty(inverts.data as { quantity: number }[] | null),
    equipment: equipment.count || 0,
  };
}

export function generateRecommendations(test: WaterTest): Recommendation[] {
  const recs: Recommendation[] = [];

  if (test.calcium != null) {
    if (test.calcium >= 380 && test.calcium <= 450) recs.push({ param: 'calcium', level: 'ok', title: `Calcio: ${test.calcium} ppm`, text: 'Rango perfecto. Mantener Kalkwasser + Calcium Brightwell.', product: 'Kalkwasser (ATO) + Calcium (Brightwell)' });
    else if (test.calcium < 380) recs.push({ param: 'calcium', level: 'action', title: `Calcio Bajo: ${test.calcium} ppm`, text: 'Aumentar Kalkwasser en ATO o dosis de Calcium Brightwell.', product: 'Kalkwasser + Calcium (Brightwell)' });
    else recs.push({ param: 'calcium', level: 'warning', title: `Calcio Alto: ${test.calcium} ppm`, text: 'Reducir Calcium. Puede causar precipitacion si Alk esta alto.', product: 'Reducir Calcium (Brightwell)' });
  }

  if (test.alkalinity != null) {
    if (test.alkalinity >= 7 && test.alkalinity <= 11) recs.push({ param: 'alkalinity', level: 'ok', title: `Alkalinity: ${test.alkalinity} dKH`, text: 'Buen rango. Mantener rutina.', product: 'Kalkwasser + Balance (Seachem)' });
    else if (test.alkalinity < 7) recs.push({ param: 'alkalinity', level: 'action', title: `Alk Baja: ${test.alkalinity} dKH`, text: 'Aumentar Balance (Seachem) o Kalkwasser.', product: 'Balance (Seachem) + Kalkwasser' });
    else recs.push({ param: 'alkalinity', level: 'warning', title: `Alk Alta: ${test.alkalinity} dKH`, text: 'Reducir dosificacion. >12 puede causar necrosis.', product: 'Reducir Balance (Seachem)' });
  }

  if (test.ph != null) {
    if (test.ph >= 8.0 && test.ph <= 8.4) recs.push({ param: 'ph', level: 'ok', title: `pH: ${test.ph}`, text: 'Rango ideal.', product: 'Kalkwasser + CO2 reactor' });
    else if (test.ph < 8.0) recs.push({ param: 'ph', level: 'action', title: `pH Bajo: ${test.ph}`, text: 'Verificar Kalkwasser en ATO. CO2 reactor al skimmer ayuda. Asegurar ventilacion.', product: 'Kalkwasser (ATO) + CO2 reactor + Balance (Seachem)' });
    else recs.push({ param: 'ph', level: 'warning', title: `pH Alto: ${test.ph}`, text: 'Reducir Kalkwasser. >8.5 estresa corales.', product: 'Reducir Kalkwasser' });
  }

  if (test.phosphate != null) {
    if (test.phosphate <= 0.1) recs.push({ param: 'phosphate', level: 'ok', title: `Fosfato: ${test.phosphate} ppm`, text: 'Buen nivel. RowaPhos y Phosphat-E funcionan.', product: 'RowaPhos + Phosphat-E (Fauna Marin)' });
    else recs.push({ param: 'phosphate', level: 'action', title: `Fosfato Alto: ${test.phosphate} ppm`, text: 'Cambiar RowaPhos. Aumentar Phosphat-E temporalmente.', product: 'RowaPhos (reactor) + Phosphat-E (Fauna Marin)' });
  }

  if (test.magnesium != null) {
    if (test.magnesium >= 1250 && test.magnesium <= 1400) recs.push({ param: 'magnesium', level: 'ok', title: `Magnesio: ${test.magnesium} ppm`, text: 'Rango perfecto.', product: 'Magnesium (Brightwell)' });
    else if (test.magnesium > 1400) recs.push({ param: 'magnesium', level: 'action', title: `Magnesio Alto: ${test.magnesium} ppm`, text: 'PAUSAR Magnesium Brightwell hasta bajar a ~1350.', product: 'PAUSAR Magnesium (Brightwell)' });
    else recs.push({ param: 'magnesium', level: 'action', title: `Magnesio Bajo: ${test.magnesium} ppm`, text: 'Aumentar Magnesium Brightwell.', product: 'Magnesium (Brightwell)' });
  }

  if (test.nitrate != null) {
    if (test.nitrate >= 2 && test.nitrate <= 15) recs.push({ param: 'nitrate', level: 'ok', title: `Nitrato: ${test.nitrate} ppm`, text: 'Buen nivel para mixed reef.' });
    else if (test.nitrate < 2) recs.push({ param: 'nitrate', level: 'action', title: `Nitrato Bajo: ${test.nitrate} ppm`, text: 'Alimentar mas Reef-Roids. Reducir carbon si necesario.', product: 'Reef-Roids (Polyplab) + Restor (Brightwell)' });
    else recs.push({ param: 'nitrate', level: 'warning', title: `Nitrato Alto: ${test.nitrate} ppm`, text: 'Aumentar cambios de agua o carbon.', product: 'Carbon reactor + cambios de agua' });
  }

  if (test.ammonia != null) {
    if (test.ammonia === 0) recs.push({ param: 'ammonia', level: 'ok', title: 'Amonio: 0 ppm', text: 'Perfecto.' });
    else recs.push({ param: 'ammonia', level: 'action', title: `Amonio: ${test.ammonia} ppm`, text: 'Verificar skimmer Klir. Carbon reactor. No sobrealimentar.', product: 'Skimmer Klir + Carbon reactor' });
  }

  if (test.nitrite != null) {
    if (test.nitrite === 0) recs.push({ param: 'nitrite', level: 'ok', title: 'Nitrito: 0 ppm', text: 'Perfecto.' });
    else recs.push({ param: 'nitrite', level: 'action', title: `Nitrito: ${test.nitrite} ppm`, text: 'EMERGENCIA — cambio de agua inmediato.', product: 'Cambio de agua de emergencia' });
  }

  return recs;
}
