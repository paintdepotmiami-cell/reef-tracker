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
  qt_start_date: string | null;
  user_id: string | null;
  tank_id: string | null;
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
  user_id: string | null;
  tank_id: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  config: string | null;
  notes: string | null;
  user_id: string | null;
  tank_id: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  type: string | null;
  notes: string | null;
  user_id: string | null;
  tank_id: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface Recommendation {
  param: string;
  level: 'ok' | 'warning' | 'action';
  title: string;
  text: string;
  product?: string;
}

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string | null;
  category: string;
  subcategory: string | null;
  difficulty: string | null;
  light_need: string | null;
  flow_need: string | null;
  aggression: string | null;
  growth_speed: string | null;
  min_distance_inches: number | null;
  placement_zone: string | null;
  reef_safe: string | null;
  diet: string | null;
  max_size: string | null;
  description: string | null;
  care_notes: string | null;
  fun_fact: string | null;
  photo_url: string | null;
  warnings: string[] | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string;
  image_url: string | null;
  content: string;
  reading_time: number;
  published: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  species_id: string;
  notes: string | null;
  priority: string;
  created_at: string;
  // joined
  species?: Species;
}

export async function getArticles(category?: string): Promise<Article[]> {
  let q = getSupabase().from('reef_articles').select('*').eq('published', true).order('created_at', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data } = await q;
  return data || [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data } = await getSupabase()
    .from('reef_articles')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await getSupabase()
    .from('reef_wishlist')
    .select('*, species:reef_species(*)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function addToWishlist(speciesId: string, priority = 'medium', notes?: string): Promise<WishlistItem | null> {
  const { data: { user } } = await getSupabase().auth.getUser();
  if (!user) return null;
  const { data } = await getSupabase()
    .from('reef_wishlist')
    .upsert({ user_id: user.id, species_id: speciesId, priority, notes }, { onConflict: 'user_id,species_id' })
    .select()
    .single();
  return data;
}

export async function removeFromWishlist(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('reef_wishlist').delete().eq('id', id);
  return !error;
}

export async function getAnimals(type?: string): Promise<Animal[]> {
  let q = getSupabase().from('reef_animals').select('*').order('name');
  if (type) q = q.eq('type', type);
  const { data } = await q;
  return data || [];
}

export async function updateAnimal(id: string, updates: Partial<Animal>): Promise<void> {
  await getSupabase().from('reef_animals').update(updates).eq('id', id);
}

export async function deleteAnimal(id: string): Promise<void> {
  await getSupabase().from('reef_animals').delete().eq('id', id);
}

export async function updateProfile(userId: string, updates: Record<string, unknown>): Promise<void> {
  await getSupabase().from('reef_profiles').update(updates).eq('id', userId);
}

export async function updateTank(tankId: string, updates: Record<string, unknown>): Promise<void> {
  await getSupabase().from('reef_tanks').update(updates).eq('id', tankId);
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

export async function createEquipment(eq: Partial<Equipment>): Promise<Equipment | null> {
  const { data } = await getSupabase().from('reef_equipment').insert(eq).select().single();
  return data;
}

export async function updateEquipment(id: string, eq: Partial<Equipment>): Promise<Equipment | null> {
  const { data } = await getSupabase().from('reef_equipment').update(eq).eq('id', id).select().single();
  return data;
}

export async function deleteEquipment(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('reef_equipment').delete().eq('id', id);
  return !error;
}

export async function createSupplement(sup: Partial<Supplement>): Promise<Supplement | null> {
  const { data } = await getSupabase().from('reef_supplements').insert(sup).select().single();
  return data;
}

export async function updateSupplement(id: string, sup: Partial<Supplement>): Promise<Supplement | null> {
  const { data } = await getSupabase().from('reef_supplements').update(sup).eq('id', id).select().single();
  return data;
}

export async function deleteSupplement(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('reef_supplements').delete().eq('id', id);
  return !error;
}

export interface MaintenanceTask {
  id: string;
  user_id: string | null;
  tank_id: string | null;
  task_name: string;
  category: string; // water_change, testing, cleaning, dosing, feeding, equipment, other
  interval_days: number;
  last_completed_at: string | null;
  next_due_at: string | null;
  notes: string | null;
  created_at: string;
}

export async function getMaintenanceTasks(): Promise<MaintenanceTask[]> {
  const { data } = await getSupabase()
    .from('reef_maintenance_tasks')
    .select('*')
    .order('next_due_at', { ascending: true });
  return data || [];
}

export async function completeMaintenanceTask(id: string): Promise<MaintenanceTask | null> {
  // First get the task to know the interval
  const { data: task } = await getSupabase()
    .from('reef_maintenance_tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (!task) return null;

  const now = new Date();
  const nextDue = new Date(now.getTime() + task.interval_days * 86400000);

  const { data } = await getSupabase()
    .from('reef_maintenance_tasks')
    .update({
      last_completed_at: now.toISOString(),
      next_due_at: nextDue.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return data;
}

export async function createMaintenanceTask(task: Partial<MaintenanceTask>): Promise<MaintenanceTask | null> {
  const { data } = await getSupabase()
    .from('reef_maintenance_tasks')
    .insert(task)
    .select()
    .single();
  return data;
}

export async function deleteMaintenanceTask(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('reef_maintenance_tasks').delete().eq('id', id);
  return !error;
}

/**
 * Auto-generate maintenance task templates for a new tank.
 * Called after onboarding or manually from settings.
 * Covers daily, weekly, biweekly, monthly, quarterly, and biannual tasks.
 */
export async function generateMaintenanceTemplates(userId: string, tankId?: string): Promise<number> {
  const now = new Date();
  const templates: Partial<MaintenanceTask>[] = [
    // DAILY
    { task_name: 'Feed fish', category: 'feeding', interval_days: 1, notes: '1-2 small feedings per day. Only what they eat in 2 minutes. Alternate frozen and dry foods.' },
    { task_name: 'Check temperature', category: 'testing', interval_days: 1, notes: 'Target 76-80°F (24-27°C). Check heater/chiller if off range.' },
    { task_name: 'Visual inspection', category: 'maintenance', interval_days: 1, notes: 'Look for: stressed animals, pests, dead livestock, equipment issues, unusual behavior.' },
    { task_name: 'Check ATO reservoir', category: 'water_management', interval_days: 1, notes: 'Refill RO/DI water reservoir if low. ATO should maintain stable salinity.' },

    // WEEKLY
    { task_name: 'Water change (10-20%)', category: 'water_change', interval_days: 7, notes: 'Replace 10-20% of tank volume with fresh saltwater at 35 ppt, matched temp. Siphon detritus.' },
    { task_name: 'Clean glass/acrylic', category: 'cleaning', interval_days: 7, notes: 'Use magnetic cleaner or algae scraper. Be careful near silicone seals.' },
    { task_name: 'Test water parameters', category: 'testing', interval_days: 7, notes: 'Core 3: Alkalinity, Calcium, Phosphate. Log results in ReefOS.' },
    { task_name: 'Empty skimmer cup', category: 'cleaning', interval_days: 7, notes: 'Dark, concentrated skimmate = good. Clean the neck for optimal foam production.' },

    // BIWEEKLY (14 days)
    { task_name: 'Clean filter socks/pads', category: 'filtration', interval_days: 14, notes: 'Remove, rinse or replace filter socks. Dirty socks become nitrate factories.' },
    { task_name: 'Check salinity', category: 'testing', interval_days: 14, notes: 'Target 35 ppt (1.026 SG). Use refractometer for accuracy. Calibrate monthly.' },
    { task_name: 'Feed corals (Reef-Roids/Restor)', category: 'feeding', interval_days: 14, notes: 'Target feed corals with pipette. Turn off pumps for 15 min. Amino acids help coloration.' },

    // MONTHLY (30 days)
    { task_name: 'Deep clean skimmer', category: 'cleaning', interval_days: 30, notes: 'Remove skimmer body, soak in vinegar/water. Clean pump impeller. Reassemble.' },
    { task_name: 'Clean powerheads/wavemakers', category: 'cleaning', interval_days: 30, notes: 'Soak in 1:1 vinegar/water for 30 min. Clean impeller and housing. Remove coralline buildup.' },
    { task_name: 'Test Calcium & Magnesium', category: 'testing', interval_days: 30, notes: 'Ca: 380-450 ppm, Mg: 1250-1400 ppm. Adjust dosing if needed.' },
    { task_name: 'Inspect equipment', category: 'equipment', interval_days: 30, notes: 'Check heater, return pump, wavemakers, ATO sensor, dosing pump lines for wear.' },

    // QUARTERLY (90 days)
    { task_name: 'Replace carbon media', category: 'filtration', interval_days: 90, notes: 'Activated carbon saturates in 3-4 weeks of use, but reactor replacement every ~3 months if running intermittently.' },
    { task_name: 'Replace GFO/RowaPhos', category: 'filtration', interval_days: 90, notes: 'GFO exhausts over time. Replace when phosphate starts rising despite reactor running.' },
    { task_name: 'Calibrate test equipment', category: 'testing', interval_days: 90, notes: 'Calibrate refractometer with calibration fluid. Check Hanna Checker reagent expiry dates.' },
    { task_name: 'Clean return pump', category: 'cleaning', interval_days: 90, notes: 'Remove and soak in vinegar solution. Clean impeller. Check flow rate.' },
    { task_name: 'Harvest chaeto/macroalgae', category: 'filtration', interval_days: 90, notes: 'Remove 50% of chaeto mass. This exports nutrients from the system. Discard harvested portion.' },

    // BIANNUAL (180 days)
    { task_name: 'Replace RO membrane', category: 'equipment', interval_days: 180, notes: 'Check TDS output. Replace membrane if TDS rejection drops below 95%. Replace sediment and carbon prefilters.' },
    { task_name: 'Deep clean sump', category: 'cleaning', interval_days: 180, notes: 'Drain sump partially. Vacuum detritus from baffles and chambers. Clean return plumbing.' },
    { task_name: 'ICP-OES water analysis', category: 'testing', interval_days: 180, notes: 'Send water sample to Triton or ATI for comprehensive elemental analysis. Reveals trace element depletion and heavy metal buildup.' },
  ];

  const tasks = templates.map(t => ({
    ...t,
    user_id: userId,
    tank_id: tankId || null,
    next_due_at: new Date(now.getTime() + (t.interval_days || 1) * 86400000).toISOString(),
  }));

  const { data, error } = await getSupabase()
    .from('reef_maintenance_tasks')
    .insert(tasks)
    .select();

  if (error) {
    console.error('Failed to create maintenance templates:', error);
    return 0;
  }
  return data?.length || 0;
}

export async function createWaterTest(test: Partial<WaterTest>): Promise<WaterTest | null> {
  const { data, error } = await getSupabase().from('reef_water_tests').insert(test).select().single();
  if (error) { console.error('createWaterTest error:', error); return null; }
  return data;
}

// --- Products ---

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  affects_params: string[];
  dosing_unit: string | null;
  dosing_instructions: string | null;
  image_url: string | null;
  buy_url: string | null;
  popularity: number;
  rating: number | null;
  pros: string[] | null;
  cons: string[] | null;
  created_at: string;
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  tank_id: string | null;
  status: string;
  daily_dose: number | null;
  dose_unit: string | null;
  notes: string | null;
  created_at: string;
  product?: Product; // joined
}

export interface DoseLog {
  id: string;
  user_id: string;
  product_id: string;
  tank_id: string | null;
  amount: number;
  unit: string;
  dosed_at: string;
  product?: Product; // joined
}

export async function getProducts(category?: string): Promise<Product[]> {
  let q = getSupabase().from('reef_products').select('*').order('popularity', { ascending: false });
  if (category) q = q.eq('category', category);
  const { data } = await q;
  return data || [];
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data } = await getSupabase()
    .from('reef_products')
    .select('*')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
    .order('popularity', { ascending: false })
    .limit(20);
  return data || [];
}

export async function getUserProducts(): Promise<UserProduct[]> {
  const { data } = await getSupabase()
    .from('reef_user_products')
    .select('*, product:reef_products(*)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function addUserProduct(product_id: string, user_id: string, tank_id?: string): Promise<UserProduct | null> {
  const { data } = await getSupabase()
    .from('reef_user_products')
    .insert({ product_id, user_id, tank_id: tank_id || null })
    .select('*, product:reef_products(*)')
    .single();
  return data;
}

export async function updateUserProduct(id: string, updates: Partial<UserProduct>): Promise<UserProduct | null> {
  const { data } = await getSupabase()
    .from('reef_user_products')
    .update(updates)
    .eq('id', id)
    .select('*, product:reef_products(*)')
    .single();
  return data;
}

export async function removeUserProduct(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('reef_user_products').delete().eq('id', id);
  return !error;
}

export async function logDose(product_id: string, user_id: string, amount: number, unit: string, tank_id?: string): Promise<DoseLog | null> {
  const { data } = await getSupabase()
    .from('reef_dose_logs')
    .insert({ product_id, user_id, amount, unit, tank_id: tank_id || null })
    .select()
    .single();
  return data;
}

export async function getDoseLogs(limit = 50): Promise<DoseLog[]> {
  const { data } = await getSupabase()
    .from('reef_dose_logs')
    .select('*, product:reef_products(name, brand, image_url)')
    .order('dosed_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// --- Dosing Config ---

export interface DosingChannel {
  channel: number;
  product: string;       // e.g. "BRS Alkalinity"
  parameter: string;     // 'alkalinity' | 'calcium' | 'magnesium' | 'other'
  ml_per_day: number;
  doses_per_day: number; // how many times per day the pump runs
  enabled: boolean;
}

export interface DosingConfig {
  id: string;
  user_id: string;
  tank_id: string | null;
  pump_model: string | null;
  pump_brand: string | null;
  method: 'pump' | 'manual' | 'kalkwasser' | 'reactor';
  channels: DosingChannel[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function getDosingConfig(): Promise<DosingConfig | null> {
  const { data } = await getSupabase()
    .from('reef_dosing_config')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function saveDosingConfig(config: Partial<DosingConfig>): Promise<DosingConfig | null> {
  const { data } = await getSupabase()
    .from('reef_dosing_config')
    .upsert({ ...config, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  return data;
}

export async function createDosingConfig(config: Omit<DosingConfig, 'id' | 'created_at' | 'updated_at'>): Promise<DosingConfig | null> {
  const { data } = await getSupabase()
    .from('reef_dosing_config')
    .insert(config)
    .select()
    .single();
  return data;
}

export async function updateDosingConfig(id: string, updates: Partial<DosingConfig>): Promise<DosingConfig | null> {
  const { data } = await getSupabase()
    .from('reef_dosing_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return data;
}

export async function getStats() {
  const [fish, corals, inverts, equipment] = await Promise.allSettled([
    getSupabase().from('reef_animals').select('quantity').eq('type', 'fish'),
    getSupabase().from('reef_animals').select('quantity').eq('type', 'coral'),
    getSupabase().from('reef_animals').select('quantity').eq('type', 'invertebrate'),
    getSupabase().from('reef_equipment').select('id'),
  ]);

  const sumQty = (result: PromiseSettledResult<{ data: { quantity: number }[] | null }>) =>
    result.status === 'fulfilled' ? result.value.data?.reduce((s, r) => s + (r.quantity || 1), 0) || 0 : 0;

  const eqCount = equipment.status === 'fulfilled' ? (equipment.value.data?.length || 0) : 0;

  return {
    fish: sumQty(fish as PromiseSettledResult<{ data: { quantity: number }[] | null }>),
    corals: sumQty(corals as PromiseSettledResult<{ data: { quantity: number }[] | null }>),
    inverts: sumQty(inverts as PromiseSettledResult<{ data: { quantity: number }[] | null }>),
    equipment: eqCount,
  };
}

export async function getSpecies(category?: string): Promise<Species[]> {
  let q = getSupabase().from('reef_species').select('*').order('common_name');
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) console.error('[getSpecies] error:', error.message);
  return data || [];
}

export function generateRecommendations(test: WaterTest): Recommendation[] {
  const recs: Recommendation[] = [];

  if (test.calcium != null) {
    if (test.calcium >= 380 && test.calcium <= 450) recs.push({ param: 'calcium', level: 'ok', title: `Calcium: ${test.calcium} ppm`, text: 'Perfect range. Maintain Kalkwasser + Calcium Brightwell.', product: 'Kalkwasser (ATO) + Calcium (Brightwell)' });
    else if (test.calcium < 380) recs.push({ param: 'calcium', level: 'action', title: `Calcium Low: ${test.calcium} ppm`, text: 'Increase Kalkwasser in ATO or Calcium Brightwell dose.', product: 'Kalkwasser + Calcium (Brightwell)' });
    else recs.push({ param: 'calcium', level: 'warning', title: `Calcium High: ${test.calcium} ppm`, text: 'Reduce Calcium. Can cause precipitation if Alk is also high.', product: 'Reduce Calcium (Brightwell)' });
  }

  if (test.alkalinity != null) {
    if (test.alkalinity >= 7 && test.alkalinity <= 11) recs.push({ param: 'alkalinity', level: 'ok', title: `Alkalinity: ${test.alkalinity} dKH`, text: 'Good range. Maintain routine.', product: 'Kalkwasser + Balance (Seachem)' });
    else if (test.alkalinity < 7) recs.push({ param: 'alkalinity', level: 'action', title: `Alk Low: ${test.alkalinity} dKH`, text: 'Increase Balance (Seachem) or Kalkwasser.', product: 'Balance (Seachem) + Kalkwasser' });
    else recs.push({ param: 'alkalinity', level: 'warning', title: `Alk High: ${test.alkalinity} dKH`, text: 'Reduce dosing. >12 can cause tissue necrosis.', product: 'Reduce Balance (Seachem)' });
  }

  if (test.ph != null) {
    if (test.ph >= 8.0 && test.ph <= 8.4) recs.push({ param: 'ph', level: 'ok', title: `pH: ${test.ph}`, text: 'Ideal range.', product: 'Kalkwasser + CO2 reactor' });
    else if (test.ph < 8.0) recs.push({ param: 'ph', level: 'action', title: `pH Low: ${test.ph}`, text: 'Verify Kalkwasser in ATO. CO2 reactor on skimmer helps. Ensure ventilation.', product: 'Kalkwasser (ATO) + CO2 reactor + Balance (Seachem)' });
    else recs.push({ param: 'ph', level: 'warning', title: `pH High: ${test.ph}`, text: 'Reduce Kalkwasser. >8.5 stresses corals.', product: 'Reduce Kalkwasser' });
  }

  if (test.phosphate != null) {
    if (test.phosphate <= 0.1) recs.push({ param: 'phosphate', level: 'ok', title: `Phosphate: ${test.phosphate} ppm`, text: 'Good level. RowaPhos and Phosphat-E working.', product: 'RowaPhos + Phosphat-E (Fauna Marin)' });
    else recs.push({ param: 'phosphate', level: 'action', title: `Phosphate High: ${test.phosphate} ppm`, text: 'Replace RowaPhos. Increase Phosphat-E temporarily.', product: 'RowaPhos (reactor) + Phosphat-E (Fauna Marin)' });
  }

  if (test.magnesium != null) {
    if (test.magnesium >= 1250 && test.magnesium <= 1400) recs.push({ param: 'magnesium', level: 'ok', title: `Magnesium: ${test.magnesium} ppm`, text: 'Perfect range.', product: 'Magnesium (Brightwell)' });
    else if (test.magnesium > 1400) recs.push({ param: 'magnesium', level: 'action', title: `Magnesium High: ${test.magnesium} ppm`, text: 'PAUSE Magnesium Brightwell until it drops to ~1350.', product: 'PAUSE Magnesium (Brightwell)' });
    else recs.push({ param: 'magnesium', level: 'action', title: `Magnesium Low: ${test.magnesium} ppm`, text: 'Increase Magnesium Brightwell.', product: 'Magnesium (Brightwell)' });
  }

  if (test.nitrate != null) {
    if (test.nitrate >= 2 && test.nitrate <= 15) recs.push({ param: 'nitrate', level: 'ok', title: `Nitrate: ${test.nitrate} ppm`, text: 'Good level for mixed reef.' });
    else if (test.nitrate < 2) recs.push({ param: 'nitrate', level: 'action', title: `Nitrate Low: ${test.nitrate} ppm`, text: 'Feed more Reef-Roids. Reduce carbon if needed.', product: 'Reef-Roids (Polyplab) + Restor (Brightwell)' });
    else recs.push({ param: 'nitrate', level: 'warning', title: `Nitrate High: ${test.nitrate} ppm`, text: 'Increase water changes or carbon.', product: 'Carbon reactor + water changes' });
  }

  if (test.ammonia != null) {
    if (test.ammonia === 0) recs.push({ param: 'ammonia', level: 'ok', title: 'Ammonia: 0 ppm', text: 'Perfect.' });
    else recs.push({ param: 'ammonia', level: 'action', title: `Ammonia: ${test.ammonia} ppm`, text: 'Check Klir skimmer. Carbon reactor. Do not overfeed.', product: 'Skimmer Klir + Carbon reactor' });
  }

  if (test.nitrite != null) {
    if (test.nitrite === 0) recs.push({ param: 'nitrite', level: 'ok', title: 'Nitrite: 0 ppm', text: 'Perfect.' });
    else recs.push({ param: 'nitrite', level: 'action', title: `Nitrite: ${test.nitrite} ppm`, text: 'EMERGENCY — immediate water change needed.', product: 'Emergency water change' });
  }

  return recs;
}
