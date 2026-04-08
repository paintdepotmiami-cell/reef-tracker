/**
 * Parameter Management Engine — 360° Action Plans
 *
 * For EVERY parameter deviation, generates a complete plan:
 *   1. Physical/Mechanical action
 *   2. Biological action
 *   3. Chemical/Product action (with monetization placeholder)
 *
 * Covers: PO₄, NO₃, NH₃, NO₂, Salinity, Temperature, pH, Alk, Ca, Mg
 */

import type { WaterTest } from './queries';

/* ─── Types ─── */

export type ParamStatus = 'optimal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'emergency';

export interface ActionItem {
  type: 'mechanical' | 'biological' | 'chemical' | 'routine';
  icon: string;
  color: string;
  title: string;
  description: string;
  product?: ProductRecommendation;
  urgent: boolean;
}

export interface ProductRecommendation {
  name: string;
  brand: string;
  why: string;
  buyUrl: string | null;       // future affiliate link
  placeholder: boolean;         // true = show "Buy" CTA slot
}

export interface ParamAssessment {
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  current: number | null;
  target: string;               // range string like "8-9 dKH"
  targetMin: number;
  targetMax: number;
  status: ParamStatus;
  statusLabel: string;
  statusColor: string;
  summary: string;
  actions: ActionItem[];
  science: string;
}

/* ─── Parameter Definitions ─── */

interface ParamDef {
  key: keyof WaterTest;
  label: string;
  unit: string;
  icon: string;
  color: string;
  targetMin: number;
  targetMax: number;
  targetDisplay: string;
  criticalLow: number | null;
  criticalHigh: number | null;
  emergencyHigh: number | null;
}

const PARAM_DEFS: ParamDef[] = [
  { key: 'ammonia', label: 'Ammonia (NH₃)', unit: 'ppm', icon: 'skull', color: '#ff4444', targetMin: 0, targetMax: 0, targetDisplay: '0.0 ppm', criticalLow: null, criticalHigh: 0.1, emergencyHigh: 0.2 },
  { key: 'nitrite', label: 'Nitrite (NO₂)', unit: 'ppm', icon: 'dangerous', color: '#ff6b6b', targetMin: 0, targetMax: 0, targetDisplay: '0.0 ppm', criticalLow: null, criticalHigh: 0.1, emergencyHigh: 0.3 },
  { key: 'phosphate', label: 'Phosphate (PO₄)', unit: 'ppm', icon: 'science', color: '#FF7F50', targetMin: 0.01, targetMax: 0.03, targetDisplay: '0.01-0.03 ppm', criticalLow: null, criticalHigh: 0.1, emergencyHigh: 0.3 },
  { key: 'nitrate', label: 'Nitrate (NO₃)', unit: 'ppm', icon: 'biotech', color: '#F1C40F', targetMin: 1, targetMax: 10, targetDisplay: '1-10 ppm', criticalLow: null, criticalHigh: 20, emergencyHigh: 40 },
  { key: 'alkalinity', label: 'Alkalinity (dKH)', unit: 'dKH', icon: 'shield', color: '#4cd6fb', targetMin: 8, targetMax: 9, targetDisplay: '8-9 dKH', criticalLow: 6, criticalHigh: 11, emergencyHigh: 13 },
  { key: 'calcium', label: 'Calcium (Ca)', unit: 'ppm', icon: 'labs', color: '#2ff801', targetMin: 400, targetMax: 440, targetDisplay: '400-440 ppm', criticalLow: 350, criticalHigh: 480, emergencyHigh: 520 },
  { key: 'magnesium', label: 'Magnesium (Mg)', unit: 'ppm', icon: 'experiment', color: '#d7ffc5', targetMin: 1280, targetMax: 1380, targetDisplay: '1280-1380 ppm', criticalLow: 1100, criticalHigh: 1450, emergencyHigh: 1600 },
  { key: 'salinity', label: 'Salinity', unit: 'sg', icon: 'water_drop', color: '#c5a3ff', targetMin: 1.024, targetMax: 1.026, targetDisplay: '1.024-1.026 sg', criticalLow: 1.020, criticalHigh: 1.028, emergencyHigh: 1.030 },
  { key: 'ph', label: 'pH', unit: '', icon: 'straighten', color: '#ffb59c', targetMin: 8.0, targetMax: 8.3, targetDisplay: '8.0-8.3', criticalLow: 7.6, criticalHigh: 8.5, emergencyHigh: 8.7 },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: 'thermostat', color: '#FF7F50', targetMin: 76, targetMax: 80, targetDisplay: '76-80°F', criticalLow: 72, criticalHigh: 82, emergencyHigh: 85 },
];

/* ─── Status Detection ─── */

function getStatus(value: number | null, def: ParamDef): { status: ParamStatus; label: string; color: string } {
  if (value === null || value === undefined) return { status: 'optimal', label: 'No data', color: '#8f9097' };

  // Ammonia and Nitrite: ANY reading is bad
  if (def.key === 'ammonia' || def.key === 'nitrite') {
    if (value >= (def.emergencyHigh ?? 999)) return { status: 'emergency', label: 'EMERGENCY', color: '#ff4444' };
    if (value >= (def.criticalHigh ?? 999)) return { status: 'critical_high', label: 'DANGER', color: '#ff4444' };
    if (value > 0) return { status: 'high', label: 'Detected', color: '#FF7F50' };
    return { status: 'optimal', label: 'Safe (0)', color: '#2ff801' };
  }

  if (value >= (def.emergencyHigh ?? 9999)) return { status: 'emergency', label: 'EMERGENCY HIGH', color: '#ff4444' };
  if (def.criticalLow !== null && value <= def.criticalLow) return { status: 'critical_low', label: 'CRITICALLY LOW', color: '#ff4444' };
  if (value >= (def.criticalHigh ?? 9999)) return { status: 'critical_high', label: 'TOO HIGH', color: '#ff4444' };
  if (value < def.targetMin) return { status: 'low', label: 'Low', color: '#F1C40F' };
  if (value > def.targetMax) return { status: 'high', label: 'High', color: '#FF7F50' };
  return { status: 'optimal', label: 'Optimal', color: '#2ff801' };
}

/* ─── Action Plan Generators ─── */

function getAmmoniaActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];
  if (value <= 0) return actions;

  actions.push({
    type: 'chemical', icon: 'medication', color: '#ff4444', urgent: true,
    title: 'Detoxify Immediately',
    description: 'Dose an ammonia binder to protect fish while you fix the root cause. Detoxifies for 48 hours.',
    product: { name: 'Prime', brand: 'Seachem', why: 'Binds NH₃/NO₂ into non-toxic form for 48 hours', buyUrl: null, placeholder: true },
  });
  actions.push({
    type: 'routine', icon: 'water_drop', color: '#4cd6fb', urgent: true,
    title: 'Immediate Water Change (25-50%)',
    description: 'Physically dilute the ammonia. Use pre-mixed saltwater at the same temperature. Search for and remove any dead organisms (fish, snails) decomposing in the tank.',
  });
  actions.push({
    type: 'biological', icon: 'biotech', color: '#2ff801', urgent: true,
    title: 'Add Biological Accelerator',
    description: 'Pour live nitrifying bacteria directly onto your bio-media (ceramic rings, Siporax, live rock) to boost the biological filter.',
    product: { name: 'TurboStart 900', brand: 'Fritz', why: 'Live Nitrosomonas & Nitrobacter — processes ammonia within hours', buyUrl: null, placeholder: true },
  });
  actions.push({
    type: 'mechanical', icon: 'filter_alt', color: '#FF7F50', urgent: false,
    title: 'Check Filtration',
    description: 'Ensure your protein skimmer is running, filter socks aren\'t clogged, and return pump is circulating water through the sump.',
  });

  return actions;
}

function getNitriteActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];
  if (value <= 0) return actions;

  actions.push({
    type: 'chemical', icon: 'medication', color: '#ff4444', urgent: true,
    title: 'Detoxify Nitrite',
    description: 'Nitrite is MORE toxic than ammonia. Dose a water conditioner to bind nitrite into a non-toxic form for 48 hours.',
    product: { name: 'Prime', brand: 'Seachem', why: 'Detoxifies NO₂ for 48 hours — buys time for bacteria to catch up', buyUrl: null, placeholder: true },
  });
  actions.push({
    type: 'routine', icon: 'water_drop', color: '#4cd6fb', urgent: true,
    title: 'Water Change (25%)',
    description: 'Dilute nitrite concentration. Use temperature-matched saltwater.',
  });
  actions.push({
    type: 'biological', icon: 'biotech', color: '#2ff801', urgent: true,
    title: 'Boost Nitrobacter Colony',
    description: 'Add live bacteria targeting nitrite conversion (Nitrobacter). Apply directly on bio-media for fastest colonization.',
    product: { name: 'TurboStart 900', brand: 'Fritz', why: 'Contains Nitrobacter that converts NO₂ → NO₃', buyUrl: null, placeholder: true },
  });

  return actions;
}

function getPhosphateActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];
  if (value <= 0.03) return actions;

  actions.push({
    type: 'mechanical', icon: 'filter_alt', color: '#FF7F50', urgent: value > 0.1,
    title: 'Install GFO Reactor',
    description: 'Granular Ferric Oxide (GFO) binds phosphate and removes it from the water. Set the reactor flow so the media gently tumbles ("boils") — not blasting, not static.',
    product: { name: 'ROWAphos GFO', brand: 'D-D / BRS', why: 'Industry-standard phosphate removal media', buyUrl: null, placeholder: true },
  });
  actions.push({
    type: 'biological', icon: 'park', color: '#2ff801', urgent: false,
    title: 'Grow Refugium Macroalgae',
    description: 'Chaetomorpha in your refugium consumes phosphate as it grows. Harvest regularly to export the phosphate permanently from your system.',
  });
  actions.push({
    type: 'routine', icon: 'restaurant', color: '#F1C40F', urgent: false,
    title: 'Reduce Feeding',
    description: 'Fish food is the #1 source of phosphate. Feed smaller portions, use high-quality frozen food, and remove uneaten food after 3 minutes.',
  });
  actions.push({
    type: 'chemical', icon: 'science', color: '#c5a3ff', urgent: false,
    title: 'Consider Kalkwasser',
    description: 'Kalkwasser (calcium hydroxide) in your ATO helps precipitate phosphate from the water column while also maintaining calcium and alkalinity.',
    product: { name: 'Kalkwasser Powder', brand: 'Two Little Fishies', why: 'Precipitates PO₄ while maintaining Ca/Alk — dual benefit', buyUrl: null, placeholder: true },
  });
  if (value > 0.1) {
    actions.push({
      type: 'chemical', icon: 'labs', color: '#FF7F50', urgent: true,
      title: 'Liquid Phosphate Remover',
      description: 'For quick reduction, use a liquid phosphate remover. Drop PO₄ slowly — never more than 0.05 ppm per day, or corals will bleach from sudden nutrient deprivation.',
      product: { name: 'Phosphat-E', brand: 'Fauna Marin', why: 'Fast-acting liquid PO₄ remover — use cautiously', buyUrl: null, placeholder: true },
    });
  }

  return actions;
}

function getNitrateActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];
  if (value <= 10) return actions;

  actions.push({
    type: 'routine', icon: 'water_drop', color: '#4cd6fb', urgent: value > 20,
    title: 'Water Change (10-20%)',
    description: 'The fastest way to reduce nitrate. Use pure RO/DI water mixed to 1.025 salinity. A 20% change reduces NO₃ by ~20%.',
  });
  actions.push({
    type: 'routine', icon: 'filter_list', color: '#F1C40F', urgent: false,
    title: 'Clean/Replace Filter Socks',
    description: 'Dirty filter socks trap organic waste that decomposes into nitrate. Change every 3-5 days. This single habit can cut nitrate in half.',
  });
  actions.push({
    type: 'biological', icon: 'park', color: '#2ff801', urgent: false,
    title: 'Harvest Refugium Chaetomorpha',
    description: 'Remove 30-50% of the macroalgae from your refugium. This physically exports nitrogen (as biomass) from your system permanently.',
  });
  if (value > 20) {
    actions.push({
      type: 'biological', icon: 'science', color: '#c5a3ff', urgent: false,
      title: 'Carbon Dosing (Biopellets / Vodka)',
      description: 'Organic carbon feeds denitrifying bacteria that consume nitrate. Use a biopellet reactor OR dose vinegar/vodka (start at 0.1 mL per 10 gallons per day, increase slowly over weeks).',
      product: { name: 'NP Biopellets', brand: 'Two Little Fishies', why: 'Sustained-release carbon for denitrifying bacteria', buyUrl: null, placeholder: true },
    });
  }
  actions.push({
    type: 'routine', icon: 'restaurant', color: '#FF7F50', urgent: false,
    title: 'Reduce Feeding',
    description: 'Less food in = less nitrogen waste out. Feed every other day if nitrate is above 20 ppm.',
  });

  return actions;
}

function getSalinityActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 1.026) {
    // HIGH — evaporation
    actions.push({
      type: 'routine', icon: 'water_drop', color: '#4cd6fb', urgent: value > 1.028,
      title: 'Add Fresh RO/DI Water',
      description: 'Water evaporates but salt stays behind. Top off with FRESH reverse osmosis water only — NEVER add saltwater. Add slowly over several hours to avoid shocking livestock.',
    });
    actions.push({
      type: 'mechanical', icon: 'sensors', color: '#2ff801', urgent: false,
      title: 'Check ATO System',
      description: 'Your Auto Top-Off may have failed. Check the sensor in sump Chamber 3, verify the reservoir has water, and test that the pump activates when water drops.',
      product: { name: 'Smart ATO Micro', brand: 'AutoAqua', why: 'Reliable optical ATO sensor with failsafe backup', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'routine', icon: 'straighten', color: '#F1C40F', urgent: false,
      title: 'Calibrate Refractometer',
      description: 'Use calibration fluid (1.026) — not RO/DI water — to verify your refractometer is reading correctly. A miscalibrated instrument gives false readings.',
    });
  }

  if (value > 0 && value < 1.024) {
    // LOW — ATO malfunction or over-dilution
    actions.push({
      type: 'mechanical', icon: 'sensors', color: '#ff4444', urgent: true,
      title: 'Check ATO — Possible Malfunction',
      description: 'Your ATO may be adding too much fresh water. Check the float switch or optical sensor. A stuck sensor will continuously pump RO/DI water and crash salinity.',
    });
    actions.push({
      type: 'routine', icon: 'water_drop', color: '#FF7F50', urgent: false,
      title: 'Raise Salinity Gradually',
      description: 'Add small amounts of salt mix dissolved in tank water. Raise no more than 0.001 per hour. Sudden salinity changes shock corals and inverts.',
    });
    actions.push({
      type: 'routine', icon: 'straighten', color: '#F1C40F', urgent: false,
      title: 'Calibrate Refractometer',
      description: 'Verify your reading is accurate with calibration fluid before making changes.',
    });
  }

  return actions;
}

function getTemperatureActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 80) {
    // HIGH
    actions.push({
      type: 'mechanical', icon: 'air', color: '#4cd6fb', urgent: value > 82,
      title: 'Increase Surface Agitation',
      description: 'Hot water holds less oxygen. Point powerheads at the surface to maximize gas exchange. Open the tank lid.',
    });
    actions.push({
      type: 'mechanical', icon: 'ac_unit', color: '#4cd6fb', urgent: value > 82,
      title: 'Cool the Water',
      description: 'Point a fan across the water surface (evaporative cooling). Turn on room AC. For chronic heat issues, install a chiller.',
      product: { name: 'Aquarium Chiller', brand: 'JBJ / Teco', why: 'Active cooling for tanks in warm climates', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'routine', icon: 'lightbulb', color: '#F1C40F', urgent: false,
      title: 'Reduce Light Period',
      description: 'Metal halide and powerful LED fixtures generate heat. Shorten the photoperiod by 1-2 hours until temperature stabilizes.',
    });
  }

  if (value > 0 && value < 76) {
    // LOW
    actions.push({
      type: 'mechanical', icon: 'thermostat', color: '#FF7F50', urgent: value < 72,
      title: 'Check Heater',
      description: 'Verify your heater is on and set to 78°F. Rule of thumb: 3-5 watts per gallon. If the heater is old or undersized, replace it.',
      product: { name: 'Titanium Heater', brand: 'Finnex / Eheim', why: 'Saltwater-safe titanium with precise thermostat', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'mechanical', icon: 'settings', color: '#ff4444', urgent: true,
      title: 'Use a Heater Controller',
      description: 'An external controller (Inkbird, Neptune) provides a failsafe — if the heater sticks on, the controller cuts power before it cooks the tank.',
      product: { name: 'ITC-306T', brand: 'Inkbird', why: 'Dual-relay heater controller with overheat protection', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'routine', icon: 'dry_cleaning', color: '#F1C40F', urgent: false,
      title: 'Insulate the Tank',
      description: 'In cold rooms, wrap the sides and back with insulation or styrofoam. Keep away from windows and drafts.',
    });
  }

  return actions;
}

function getPhActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 0 && value < 8.0) {
    actions.push({
      type: 'routine', icon: 'air', color: '#4cd6fb', urgent: value < 7.8,
      title: 'Improve Ventilation',
      description: 'CO₂ buildup in the room lowers pH. Open a window, run an air scrubber, or pipe the skimmer air intake from outside.',
    });
    actions.push({
      type: 'biological', icon: 'park', color: '#2ff801', urgent: false,
      title: 'Reverse-Cycle Refugium Light',
      description: 'Run your refugium light ON when display lights are OFF. Chaetomorpha consumes CO₂ at night, preventing the overnight pH drop.',
    });
    actions.push({
      type: 'chemical', icon: 'science', color: '#d7ffc5', urgent: false,
      title: 'Kalkwasser in ATO',
      description: 'Kalkwasser (calcium hydroxide) raises pH naturally as it tops off evaporated water. Excellent for chronic low-pH tanks.',
      product: { name: 'Kalkwasser Powder', brand: 'Two Little Fishies', why: 'Raises pH + maintains Ca/Alk + precipitates PO₄', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'chemical', icon: 'shield', color: '#4cd6fb', urgent: false,
      title: 'Check Alkalinity',
      description: 'Alkalinity IS the pH buffer. If Alk is low (<7 dKH), pH will be unstable. Raise alkalinity first — pH will follow.',
    });
  }

  if (value > 8.4) {
    actions.push({
      type: 'chemical', icon: 'warning', color: '#ff4444', urgent: value > 8.6,
      title: 'Stop Kalkwasser / Check Dosing',
      description: 'pH above 8.5 is dangerous. If using Kalkwasser, reduce concentration or switch to Balling/2-Part which is pH-neutral.',
    });
    actions.push({
      type: 'routine', icon: 'schedule', color: '#F1C40F', urgent: false,
      title: 'Test at Night',
      description: 'pH naturally peaks in the afternoon (photosynthesis). Test at night to see the true low point. If night pH is 8.0-8.2, the daytime peak of 8.4 is fine.',
    });
  }

  return actions;
}

function getAlkActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 0 && value < 8) {
    actions.push({
      type: 'chemical', icon: 'science', color: '#4cd6fb', urgent: value < 7,
      title: 'Dose Alkalinity Supplement',
      description: 'Raise with BRS Soda Ash, Brightwell Alkalin8.3, or 2-Part solution. Dose at NIGHT when pH naturally dips. Max 1 dKH increase per day.',
      product: { name: 'Soda Ash (Part B)', brand: 'BRS', why: '2-Part Balling method — cheapest and most precise', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'routine', icon: 'schedule', color: '#F1C40F', urgent: false,
      title: 'Increase Dosing Frequency',
      description: 'If Alk keeps dropping, your corals are consuming more than you\'re dosing. Increase daily dose or switch to a dosing pump for automated delivery.',
      product: { name: 'Doser 2.1', brand: 'Kamoer', why: 'Affordable WiFi dosing pump for automated Alk/Ca delivery', buyUrl: null, placeholder: true },
    });
  }

  if (value > 10) {
    actions.push({
      type: 'routine', icon: 'water_drop', color: '#FF7F50', urgent: value > 12,
      title: 'Water Change to Dilute',
      description: 'High Alk (>11 dKH) can cause coral tissue burn (RTN). Do a 15-20% water change with properly mixed saltwater at 8-9 dKH.',
    });
    actions.push({
      type: 'chemical', icon: 'pause_circle', color: '#F1C40F', urgent: true,
      title: 'Pause Alk Dosing',
      description: 'Stop all alkalinity supplementation until levels drop below 10 dKH. Resume at a lower dose.',
    });
  }

  return actions;
}

function getCalciumActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 0 && value < 400) {
    actions.push({
      type: 'chemical', icon: 'labs', color: '#2ff801', urgent: value < 350,
      title: 'Dose Calcium Supplement',
      description: 'Raise with BRS Calcium Chloride, Brightwell Calcion, or 2-Part. Max 20 ppm increase per day. Always dose Ca and Alk in equal proportions.',
      product: { name: 'Calcium Chloride (Part A)', brand: 'BRS', why: '2-Part Balling method — cheapest and most precise', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'chemical', icon: 'experiment', color: '#d7ffc5', urgent: false,
      title: 'Check Magnesium First',
      description: 'If Mg is below 1200 ppm, calcium WON\'T HOLD no matter how much you dose. Fix Mg first, then Ca will stabilize.',
    });
  }

  if (value > 460) {
    actions.push({
      type: 'chemical', icon: 'pause_circle', color: '#F1C40F', urgent: true,
      title: 'Pause Ca Dosing',
      description: 'Stop calcium supplementation. High Ca (>480) combined with high Alk causes precipitation (snow) which crashes both parameters rapidly.',
    });
    actions.push({
      type: 'routine', icon: 'water_drop', color: '#4cd6fb', urgent: false,
      title: 'Water Change to Dilute',
      description: 'A 15% water change will bring Ca down towards normal range.',
    });
  }

  return actions;
}

function getMagnesiumActions(value: number): ActionItem[] {
  const actions: ActionItem[] = [];

  if (value > 0 && value < 1280) {
    actions.push({
      type: 'chemical', icon: 'experiment', color: '#d7ffc5', urgent: value < 1200,
      title: 'Dose Magnesium FIRST',
      description: 'Mg is the foundation — Ca and Alk cannot hold stable levels without proper Mg (1280-1380 ppm). Use magnesium chloride + magnesium sulfate (BRS recipe) or Brightwell Magnesion.',
      product: { name: 'Magnesion', brand: 'Brightwell Aquatics', why: 'Concentrated Mg supplement — fewer doses needed', buyUrl: null, placeholder: true },
    });
    actions.push({
      type: 'routine', icon: 'priority_high', color: '#ff4444', urgent: true,
      title: 'Fix Before Dosing Ca/Alk',
      description: 'Stop dosing calcium and alkalinity until magnesium is above 1250 ppm. Dosing Ca/Alk with low Mg wastes product and causes instability.',
    });
  }

  if (value > 1450) {
    actions.push({
      type: 'routine', icon: 'water_drop', color: '#FF7F50', urgent: false,
      title: 'Water Change to Reduce',
      description: 'High Mg (>1450) is less dangerous than low, but wastes supplements. Do a 15% water change and reduce Mg dosing.',
    });
    actions.push({
      type: 'chemical', icon: 'pause_circle', color: '#F1C40F', urgent: false,
      title: 'Reduce Mg Dosing',
      description: 'Magnesium is consumed slowly in most tanks. Monthly testing is usually sufficient — you may be overdosing.',
    });
  }

  return actions;
}

/* ─── Main Assessment Function ─── */

export function assessAllParameters(test: WaterTest | null): ParamAssessment[] {
  return PARAM_DEFS.map(def => {
    const value = test ? (test[def.key] as number | null) : null;
    const { status, label, color } = getStatus(value, def);

    let actions: ActionItem[] = [];
    let summary = '';
    let science = '';

    if (value === null || value === undefined) {
      summary = 'No data — log a water test to get your action plan.';
      science = '';
    } else {
      switch (def.key) {
        case 'ammonia':
          actions = getAmmoniaActions(value);
          summary = value === 0 ? 'Ammonia is undetectable — your biological filter is working.' : `Ammonia at ${value} ppm. ANY detectable ammonia is a sign of biological filter stress. Act immediately.`;
          science = 'Ammonia (NH₃/NH₄⁺) is produced by fish waste, uneaten food, and decomposing organisms. Nitrosomonas bacteria convert it to nitrite. Even 0.2 ppm can be lethal.';
          break;
        case 'nitrite':
          actions = getNitriteActions(value);
          summary = value === 0 ? 'Nitrite is zero — Nitrobacter colony is healthy.' : `Nitrite at ${value} ppm. Nitrite is MORE toxic than ammonia — even 0.5 ppm is dangerous.`;
          science = 'Nitrite (NO₂) is produced by Nitrosomonas from ammonia. Nitrobacter bacteria convert it to the less-toxic nitrate. Nitrite binds to hemoglobin, suffocating fish from the inside.';
          break;
        case 'phosphate':
          actions = getPhosphateActions(value);
          summary = value <= 0.03 ? `PO₄ at ${value} ppm — optimal range.` : `PO₄ at ${value} ppm (target: <0.03). High phosphate inhibits coral calcification and fuels nuisance algae.`;
          science = 'Phosphate enters primarily through fish food. It fuels algae growth and at high levels blocks coral skeleton formation. GFO, macroalgae, and Kalkwasser all help remove it.';
          break;
        case 'nitrate':
          actions = getNitrateActions(value);
          summary = value <= 10 ? `NO₃ at ${value} ppm — healthy range.` : `NO₃ at ${value} ppm (target: 1-10). Above 20 ppm damages corals and promotes plague algae.`;
          science = 'Nitrate is the end product of the nitrogen cycle. It accumulates unless exported via water changes, macroalgae harvest, or denitrification (deep sand beds, carbon dosing).';
          break;
        case 'alkalinity':
          actions = getAlkActions(value);
          summary = value >= 8 && value <= 9 ? `Alk at ${value} dKH — perfect.` : value < 8 ? `Alk at ${value} dKH — too low. Buffer capacity is weakening, corals will slow growth.` : `Alk at ${value} dKH — running high. Risk of coral tissue burn above 11 dKH.`;
          science = 'Alkalinity is the water\'s pH buffer capacity. Corals consume it to build calcium carbonate skeletons. Without adequate Alk, pH swings wildly and corals stop calcifying.';
          break;
        case 'calcium':
          actions = getCalciumActions(value);
          summary = value >= 400 && value <= 440 ? `Ca at ${value} ppm — optimal.` : value < 400 ? `Ca at ${value} ppm — low. Corals need calcium to build skeletons.` : `Ca at ${value} ppm — high. Risk of precipitation if combined with high Alk.`;
          science = 'Calcium is consumed by corals, coralline algae, and clams to build CaCO₃ skeletons. It must be replenished daily in coral-heavy tanks. Ca and Alk are chemically linked — always dose together.';
          break;
        case 'magnesium':
          actions = getMagnesiumActions(value);
          summary = value >= 1280 && value <= 1380 ? `Mg at ${value} ppm — optimal.` : value < 1280 ? `Mg at ${value} ppm — low. Ca and Alk CANNOT hold stable without proper Mg. Fix this FIRST.` : `Mg at ${value} ppm — above target, reduce dosing.`;
          science = 'Magnesium prevents spontaneous calcium carbonate precipitation. Without enough Mg, Ca and Alk crash together. Mg is the foundation that holds the Ca/Alk balance stable.';
          break;
        case 'salinity':
          actions = getSalinityActions(value);
          summary = value >= 1.024 && value <= 1.026 ? `Salinity at ${value} — perfect.` : value > 1.026 ? `Salinity at ${value} — rising. Water is evaporating and concentrating salt. Top off with RO/DI water (NOT saltwater).` : `Salinity at ${value} — low. ATO may be adding too much fresh water.`;
          science = 'Saltwater evaporates but salt stays behind, concentrating salinity. ATO (Auto Top-Off) adds fresh water to compensate. Without ATO, salinity can spike 0.002+ per day.';
          break;
        case 'ph':
          actions = getPhActions(value);
          summary = value >= 8.0 && value <= 8.3 ? `pH at ${value} — healthy.` : value < 8.0 ? `pH at ${value} — low. Poor CO₂ exchange or low alkalinity.` : `pH at ${value} — high. Check Kalkwasser dosing or test at night for true baseline.`;
          science = 'pH measures acidity/alkalinity. Reef organisms evolved at pH 8.1-8.3. CO₂ from respiration (fish, bacteria, corals at night) lowers pH. Photosynthesis (corals, algae by day) raises it.';
          break;
        case 'temperature':
          actions = getTemperatureActions(value);
          summary = value >= 76 && value <= 80 ? `Temp at ${value}°F — stable.` : value > 80 ? `Temp at ${value}°F — too warm. Hot water holds less oxygen. Corals bleach above 82°F.` : `Temp at ${value}°F — too cold. Metabolism and immune function slow below 74°F.`;
          science = 'Temperature directly affects dissolved oxygen, metabolic rate, and immune function. Stability matters more than the exact number — a stable 77°F is better than swinging between 75-80°F.';
          break;
      }
    }

    return {
      key: def.key,
      label: def.label,
      unit: def.unit,
      icon: def.icon,
      color: def.color,
      current: value,
      target: def.targetDisplay,
      targetMin: def.targetMin,
      targetMax: def.targetMax,
      status,
      statusLabel: label,
      statusColor: color,
      summary,
      actions,
      science,
    };
  });
}
