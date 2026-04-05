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
