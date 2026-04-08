/**
 * Biological Accelerator Engine
 *
 * Recommends bacteria products by cycle phase, calculates dosing by gallons,
 * compares cycling methods, and provides phase-specific guidance.
 */

import type { CyclePhase } from './cycle-engine';

/* ─── Types ─── */

export type CyclingMethod = 'bottled_bacteria' | 'pure_ammonia' | 'fish_food' | 'live_rock' | 'fish_in';

export interface BacteriaProduct {
  id: string;
  name: string;
  brand: string;
  type: 'live_nitrifying' | 'blend' | 'ammonia_source' | 'detoxifier' | 'supplement';
  strains: string[];            // e.g. ['Nitrosomonas', 'Nitrobacter']
  description: string;
  dosePerGallon: number;        // mL per gallon
  doseUnit: string;             // 'mL', 'drops', 'cap'
  frequency: string;            // 'once', 'daily_7d', 'daily_14d', 'as_needed'
  frequencyLabel: string;
  phaseRelevance: CyclePhase[]; // which phases this product helps
  tier: 'essential' | 'recommended' | 'optional';
  icon: string;
  color: string;
  priceRange: string;
  buyUrl: string | null;
  notes: string;
  warnings: string[];
}

export interface MethodComparison {
  method: CyclingMethod;
  name: string;
  icon: string;
  color: string;
  speed: string;             // e.g. '2-4 weeks'
  speedDays: [number, number];
  difficulty: 'easy' | 'moderate' | 'advanced';
  cost: '$' | '$$' | '$$$';
  pros: string[];
  cons: string[];
  steps: string[];
  bestFor: string;
}

export interface AcceleratorDose {
  product: BacteriaProduct;
  totalDose: number;
  doseUnit: string;
  schedule: string;
  phaseAdvice: string;
}

export interface AcceleratorPlan {
  phase: CyclePhase;
  tankGallons: number;
  essentialDoses: AcceleratorDose[];
  recommendedDoses: AcceleratorDose[];
  optionalDoses: AcceleratorDose[];
  tips: string[];
  warnings: string[];
  method: MethodComparison | null;
}

/* ─── Bacteria Product Catalog ─── */

export const BACTERIA_PRODUCTS: BacteriaProduct[] = [
  {
    id: 'fritz-turbostart-900',
    name: 'TurboStart 900',
    brand: 'Fritz',
    type: 'live_nitrifying',
    strains: ['Nitrosomonas', 'Nitrobacter'],
    description: 'Live nitrifying bacteria concentrate for saltwater. The gold standard — can cycle a tank in days when used with ammonia source.',
    dosePerGallon: 1,     // 1 mL per gallon
    doseUnit: 'mL',
    frequency: 'once',
    frequencyLabel: 'Single dose (repeat after 48h if NH3 still high)',
    phaseRelevance: ['starting', 'ammonia', 'nitrite', 'stalled'],
    tier: 'essential',
    icon: 'biotech',
    color: '#2ff801',
    priceRange: '$18-25 (8oz)',
    buyUrl: 'https://www.amazon.com/dp/B077QMMF9L',
    notes: 'Must be refrigerated. Check expiration date. Live bacteria — don\'t use with chlorinated water.',
    warnings: ['Keep refrigerated', 'Check expiration date before purchase', 'Don\'t dose with medication in the water'],
  },
  {
    id: 'dr-tims-one-and-only',
    name: 'One & Only',
    brand: 'Dr. Tim\'s',
    type: 'live_nitrifying',
    strains: ['Nitrosomonas', 'Nitrobacter'],
    description: 'Patented live nitrifying bacteria. Designed to work specifically with Dr. Tim\'s ammonium chloride for fastest cycling.',
    dosePerGallon: 1,     // 1 mL per gallon
    doseUnit: 'mL',
    frequency: 'once',
    frequencyLabel: 'Single dose at start (can re-dose after 7 days)',
    phaseRelevance: ['starting', 'ammonia', 'nitrite', 'stalled'],
    tier: 'essential',
    icon: 'biotech',
    color: '#4cd6fb',
    priceRange: '$15-22 (4oz)',
    buyUrl: 'https://www.amazon.com/dp/B006YG04MY',
    notes: 'Best paired with Dr. Tim\'s Ammonium Chloride. Shake well before use.',
    warnings: ['Don\'t overdose — follow directions', 'Best results when added to a running, dechlorinated tank'],
  },
  {
    id: 'seachem-stability',
    name: 'Stability',
    brand: 'Seachem',
    type: 'blend',
    strains: ['Facultative bacteria blend'],
    description: 'Bacterial blend that handles ammonia, nitrite, and nitrate. More forgiving than live cultures — doesn\'t need refrigeration.',
    dosePerGallon: 0.5,   // 5 mL per 10 gallons
    doseUnit: 'mL',
    frequency: 'daily_7d',
    frequencyLabel: 'Daily for 7 days, then weekly',
    phaseRelevance: ['starting', 'ammonia', 'nitrite', 'clearing', 'stalled'],
    tier: 'recommended',
    icon: 'science',
    color: '#FF7F50',
    priceRange: '$8-12 (8.5oz)',
    buyUrl: 'https://www.amazon.com/dp/B0002APIIW',
    notes: 'Room temperature stable. Good insurance product even with Fritz/Dr. Tim\'s.',
    warnings: ['Not a substitute for true nitrifying bacteria — use as supplement'],
  },
  {
    id: 'dr-tims-ammonium-chloride',
    name: 'Ammonium Chloride',
    brand: 'Dr. Tim\'s',
    type: 'ammonia_source',
    strains: [],
    description: 'Pure ammonia source for fishless cycling. Drop-based dosing makes it easy to target 2 ppm ammonia.',
    dosePerGallon: 0.5,   // ~4 drops per gallon ≈ 0.2 mL, but we use mL
    doseUnit: 'drops',
    frequency: 'as_needed',
    frequencyLabel: 'Dose to 2 ppm, re-dose when NH3 drops below 1 ppm',
    phaseRelevance: ['starting', 'ammonia'],
    tier: 'essential',
    icon: 'water_drop',
    color: '#F1C40F',
    priceRange: '$8-12 (2oz)',
    buyUrl: 'https://www.amazon.com/dp/B006MP4QG6',
    notes: '4 drops per gallon = ~2 ppm ammonia. The cleanest method — no organic waste.',
    warnings: ['Never use household ammonia (contains surfactants)', 'Don\'t dose if ammonia is already >4 ppm'],
  },
  {
    id: 'seachem-prime',
    name: 'Prime',
    brand: 'Seachem',
    type: 'detoxifier',
    strains: [],
    description: 'Dechlorinator + emergency ammonia/nitrite detoxifier. Doesn\'t remove them — temporarily binds them to a non-toxic form for 48h.',
    dosePerGallon: 0.1,   // 2 drops per gallon, or 5 mL per 50 gallons
    doseUnit: 'drops',
    frequency: 'as_needed',
    frequencyLabel: 'Emergency use: every 48 hours if fish present',
    phaseRelevance: ['ammonia', 'nitrite', 'stalled'],
    tier: 'recommended',
    icon: 'shield',
    color: '#d7ffc5',
    priceRange: '$6-10 (8.5oz)',
    buyUrl: 'https://www.amazon.com/dp/B00025694O',
    notes: 'Essential for fish-in cycling. Detoxifies NH3/NO2 for 48 hours while bacteria catch up.',
    warnings: ['Does NOT remove ammonia/nitrite — only detoxifies temporarily', 'May cause false positive on some test kits (Nessler-based)'],
  },
  {
    id: 'microbacter7',
    name: 'MicroBacter7',
    brand: 'Brightwell Aquatics',
    type: 'blend',
    strains: ['Nitrifying', 'Denitrifying', 'Heterotrophic'],
    description: 'Multi-strain blend targeting ammonia, nitrite, nitrate, and organics. Good maintenance bacteria for established tanks.',
    dosePerGallon: 0.25,  // 5 mL per 20 gallons
    doseUnit: 'mL',
    frequency: 'daily_14d',
    frequencyLabel: 'Daily for 14 days (new tank), weekly after',
    phaseRelevance: ['starting', 'ammonia', 'nitrite', 'clearing', 'stalled'],
    tier: 'optional',
    icon: 'bug_report',
    color: '#c5a3ff',
    priceRange: '$14-18 (8.5oz)',
    buyUrl: 'https://www.amazon.com/dp/B003C3TQ2Y',
    notes: 'Includes denitrifying bacteria — helps with NO3 reduction in mature tanks too.',
    warnings: [],
  },
];

/* ─── Cycling Methods ─── */

export const CYCLING_METHODS: MethodComparison[] = [
  {
    method: 'bottled_bacteria',
    name: 'Bottled Bacteria + Ammonia',
    icon: 'biotech',
    color: '#2ff801',
    speed: '1-2 weeks',
    speedDays: [7, 14],
    difficulty: 'easy',
    cost: '$$',
    pros: [
      'Fastest method — can cycle in 7 days with Fritz TurboStart',
      'Clean process — no decomposing matter',
      'Precise ammonia control with Dr. Tim\'s drops',
      'Predictable timeline',
    ],
    cons: [
      'Bacteria must be fresh (check expiration)',
      'Requires purchase of 2 products',
      'Live bacteria need refrigeration until use',
    ],
    steps: [
      'Set up tank with heater (78°F), salt (1.025), and circulation running',
      'Add Dr. Tim\'s Ammonium Chloride — 4 drops per gallon to reach 2 ppm',
      'Add Fritz TurboStart 900 — 1 mL per gallon',
      'Test NH3, NO2, NO3 every 2 days',
      'When NH3 drops below 1 ppm, re-dose ammonia to 2 ppm',
      'When NH3 and NO2 both read 0 within 24h of dosing ammonia, cycle is complete',
      'Do 25-50% water change to lower nitrate before adding livestock',
    ],
    bestFor: 'Everyone — this is the recommended method for fastest, cleanest cycling.',
  },
  {
    method: 'pure_ammonia',
    name: 'Pure Ammonia (No Bottled Bacteria)',
    icon: 'science',
    color: '#4cd6fb',
    speed: '4-6 weeks',
    speedDays: [28, 42],
    difficulty: 'moderate',
    cost: '$',
    pros: [
      'Cheapest method',
      'Clean — no decomposition',
      'Precise ammonia dosing',
    ],
    cons: [
      'Slowest fishless method — bacteria must colonize naturally',
      'Requires patience and consistent testing',
      'Can stall without bottled bacteria to seed',
    ],
    steps: [
      'Set up tank with heater, salt, and circulation',
      'Add pure ammonia (Dr. Tim\'s or reagent-grade) to 2-4 ppm',
      'Test every 2-3 days',
      'Bacteria will naturally colonize from live rock and air',
      'Re-dose ammonia when it drops below 1 ppm',
      'Wait for NO2 to spike and then drop to zero',
      'Cycle complete when NH3 and NO2 process to zero within 24h',
    ],
    bestFor: 'Budget-conscious reefers with patience. Consider adding bottled bacteria if it stalls.',
  },
  {
    method: 'fish_food',
    name: 'Dead Shrimp / Fish Food',
    icon: 'restaurant',
    color: '#F1C40F',
    speed: '4-8 weeks',
    speedDays: [28, 56],
    difficulty: 'easy',
    cost: '$',
    pros: [
      'Uses what you already have',
      'No special purchases needed',
      'Simple — just add food and wait',
    ],
    cons: [
      'Messy — decomposing food creates bacterial film, odor',
      'Unpredictable ammonia levels',
      'Can spike ammonia too high or too low',
      'Must clean up decomposed matter after cycling',
    ],
    steps: [
      'Drop a raw table shrimp or pinch of fish food into the tank',
      'As it decomposes, it releases ammonia',
      'Test every 3-4 days',
      'Add more food if ammonia drops below 1 ppm',
      'Remove decomposing matter once cycle shows progress',
      'Wait for NH3 and NO2 to reach zero',
      'Do a large water change (50%) before adding livestock',
    ],
    bestFor: 'Beginners who don\'t want to buy cycling products. Works, just slower and messier.',
  },
  {
    method: 'live_rock',
    name: 'Live Rock Cycling',
    icon: 'landscape',
    color: '#FF7F50',
    speed: '3-6 weeks',
    speedDays: [21, 42],
    difficulty: 'moderate',
    cost: '$$$',
    pros: [
      'Live rock brings its own bacteria colonies',
      'Creates natural biodiversity (pods, sponges, worms)',
      'Tank is aquascaped AND cycling simultaneously',
    ],
    cons: [
      'Die-off from shipping causes ammonia spike',
      'Quality varies hugely — some "live" rock is basically dead',
      'Expensive ($5-12/lb)',
      'Can introduce hitchhiker pests (aiptasia, bristle worms)',
    ],
    steps: [
      'Purchase quality live rock from a reputable source',
      'Rinse in saltwater (never freshwater) to remove loose debris',
      'Aquascape the tank',
      'Die-off from the rock will produce the ammonia source',
      'Test every 2-3 days',
      'Consider adding bottled bacteria to speed things up',
      'Cycle complete when NH3 and NO2 reach zero',
    ],
    bestFor: 'Reefers who want to aquascape during cycling and want natural biodiversity.',
  },
  {
    method: 'fish_in',
    name: 'Fish-in Cycle (NOT Recommended)',
    icon: 'warning',
    color: '#ff4444',
    speed: '4-8 weeks',
    speedDays: [28, 56],
    difficulty: 'advanced',
    cost: '$$',
    pros: [
      'Fish provide continuous ammonia source',
      'You get to enjoy your tank from day one',
    ],
    cons: [
      'STRESSFUL and potentially LETHAL for fish',
      'Requires daily water changes to keep ammonia/nitrite safe',
      'Requires Seachem Prime every 48 hours as detoxifier',
      'Ethical concerns — you\'re knowingly exposing fish to toxins',
      'More expensive long-term (water, Prime, potential fish loss)',
    ],
    steps: [
      'Only use HARDY fish: chromis, clownfish, or damsels',
      'Add only 1-2 small fish',
      'Dose Seachem Prime every 48 hours to detoxify NH3/NO2',
      'Do 25% water changes every 1-2 days if NH3 or NO2 > 0.5 ppm',
      'Add Seachem Stability daily for 7 days',
      'Test DAILY — this is non-negotiable',
      'Feed very sparingly — once every 2 days',
    ],
    bestFor: 'Not recommended. Only if you absolutely must have fish immediately and commit to daily maintenance.',
  },
];

/* ─── Phase-specific tips ─── */

const PHASE_TIPS: Record<string, string[]> = {
  starting: [
    'Temperature is critical — keep 76-82°F for optimal bacterial growth',
    'Ensure strong circulation — bacteria need oxygenated water',
    'pH should be 7.8-8.4 — bacteria slow below 7.5',
    'Lights off during cycling — prevents algae with no cleanup crew',
    'Salinity at 1.025 — match your target before adding bacteria',
  ],
  ammonia: [
    'Ammonia above 4 ppm can actually SLOW bacteria growth — do a water change if >5 ppm',
    'Don\'t clean filters or disturb rockwork — bacteria are colonizing surfaces',
    'If NH3 isn\'t dropping after 7 days, add more bottled bacteria',
    'Ensure heater is at 78-80°F — cold water = slow bacteria',
    'A slight haze in the water is normal — bacterial bloom',
  ],
  nitrite: [
    'This is the LONGEST phase — patience is key',
    'Nitrite can spike very high (5-10+ ppm) — this is normal',
    'Continue providing ammonia source — Nitrobacter need food too',
    'If nitrite has been elevated >3 weeks, add another dose of bacteria',
    'Some test kits max out at 5 ppm — dilute sample 1:1 with RODI for true reading',
  ],
  clearing: [
    'Almost there! Don\'t rush it — wait for 2-3 consecutive zero readings',
    'You\'ll see nitrate rising — this is GOOD, bacteria are working',
    'Start planning your first cleanup crew (snails + hermits)',
    'Do a ghost feed (dose to 2 ppm ammonia) — if it clears in 24h, you\'re cycled',
    'Prepare saltwater for a 25-50% water change before adding livestock',
  ],
  complete: [
    'Do a 25-50% water change to lower nitrate before adding livestock',
    'Add cleanup crew FIRST — 5-10 snails and 5 hermits for a 40 gal',
    'Wait 1 week after CUC before adding first fish',
    'Add fish SLOWLY — 1-2 per week to let bacteria catch up',
    'Continue testing weekly for the first month after cycling',
  ],
  stalled: [
    'Check temperature: below 72°F dramatically slows bacteria',
    'Check pH: below 7.5 inhibits nitrifying bacteria',
    'Ensure you have an ammonia source — bacteria need food',
    'Add a fresh dose of bottled bacteria (Fritz TurboStart)',
    'Increase circulation — more O2 = faster bacterial growth',
    'If stalled >2 weeks, do a 50% water change and re-dose bacteria',
  ],
  mature: [
    'Your bio-filter is established — maintain it with regular feeding',
    'After adding new livestock, monitor NH3/NO2 for 48 hours',
    'Keep bottled bacteria on hand for emergencies (power outages, medication, die-off)',
    'A dose of Seachem Stability after water changes helps maintain colonies',
  ],
};

const PHASE_WARNINGS: Record<string, string[]> = {
  starting: [
    'Never add livestock to an uncycled tank — ammonia and nitrite are lethal',
  ],
  ammonia: [
    'If doing fish-in cycling, dose Seachem Prime every 48h to detoxify ammonia',
    'Don\'t add coral or inverts — they\'re even more sensitive than fish',
  ],
  nitrite: [
    'Nitrite is MORE toxic than ammonia to fish — even 0.5 ppm is dangerous',
    'Do NOT do water changes during fishless cycling — let the bacteria work',
  ],
  stalled: [
    'If you\'ve been stalled >3 weeks, consider restarting with fresh bacteria',
    'Check for copper in your water source — it kills nitrifying bacteria',
  ],
  clearing: [],
  complete: [],
  mature: [],
};

/* ─── Core Functions ─── */

/**
 * Calculate doses for all relevant products based on tank gallons and cycle phase.
 */
export function calculateAcceleratorPlan(
  phase: CyclePhase,
  tankGallons: number,
  selectedMethod: CyclingMethod = 'bottled_bacteria'
): AcceleratorPlan {
  const effectivePhase = phase || 'mature';

  // Filter products relevant to this phase
  const relevant = BACTERIA_PRODUCTS.filter(p =>
    p.phaseRelevance.includes(effectivePhase as CyclePhase)
  );

  const buildDose = (product: BacteriaProduct): AcceleratorDose => {
    let totalDose: number;
    let schedule: string;
    let phaseAdvice: string;

    if (product.doseUnit === 'drops') {
      // Drops-based products (Dr. Tim's Ammonium Chloride, Prime)
      totalDose = Math.round(product.dosePerGallon * tankGallons);
      schedule = product.frequencyLabel;
    } else {
      // mL-based products
      totalDose = Math.round(product.dosePerGallon * tankGallons * 10) / 10;
      schedule = product.frequencyLabel;
    }

    // Phase-specific advice per product
    switch (effectivePhase) {
      case 'starting':
        phaseAdvice = product.type === 'live_nitrifying'
          ? `Add ${totalDose} ${product.doseUnit} on Day 1 after adding your ammonia source.`
          : product.type === 'ammonia_source'
          ? `Dose ${totalDose} drops to reach ~2 ppm ammonia. Test in 24h and adjust.`
          : `Start daily doses of ${totalDose} ${product.doseUnit} from Day 1.`;
        break;
      case 'ammonia':
        phaseAdvice = product.type === 'live_nitrifying'
          ? `Re-dose ${totalDose} ${product.doseUnit} if ammonia hasn't dropped in 5-7 days.`
          : product.type === 'ammonia_source'
          ? `Re-dose to 2 ppm when ammonia drops below 1 ppm.`
          : product.type === 'detoxifier'
          ? `Use ${totalDose} drops if doing fish-in cycling. Detoxifies ammonia for 48h.`
          : `Continue daily dose of ${totalDose} ${product.doseUnit}.`;
        break;
      case 'nitrite':
        phaseAdvice = product.type === 'live_nitrifying'
          ? `If nitrite has been elevated >2 weeks, re-dose ${totalDose} ${product.doseUnit} to boost Nitrobacter.`
          : product.type === 'detoxifier'
          ? `Emergency: ${totalDose} drops if fish are present. Nitrite is highly toxic.`
          : `Continue ${totalDose} ${product.doseUnit} — supports the longer nitrite conversion phase.`;
        break;
      case 'stalled':
        phaseAdvice = product.type === 'live_nitrifying'
          ? `Fresh dose of ${totalDose} ${product.doseUnit} — the existing colony may have died off. Check temp and pH first.`
          : `Dose ${totalDose} ${product.doseUnit} after verifying conditions (temp 76-82°F, pH >7.5, ammonia source present).`;
        break;
      default:
        phaseAdvice = `Standard dose: ${totalDose} ${product.doseUnit}. ${product.frequencyLabel}.`;
    }

    return {
      product,
      totalDose,
      doseUnit: product.doseUnit,
      schedule,
      phaseAdvice,
    };
  };

  const essential = relevant.filter(p => p.tier === 'essential').map(buildDose);
  const recommended = relevant.filter(p => p.tier === 'recommended').map(buildDose);
  const optional = relevant.filter(p => p.tier === 'optional').map(buildDose);

  const method = CYCLING_METHODS.find(m => m.method === selectedMethod) || null;

  return {
    phase: effectivePhase as CyclePhase,
    tankGallons,
    essentialDoses: essential,
    recommendedDoses: recommended,
    optionalDoses: optional,
    tips: PHASE_TIPS[effectivePhase] || [],
    warnings: PHASE_WARNINGS[effectivePhase] || [],
    method,
  };
}

/**
 * Get products a user should buy based on cycle phase.
 */
export function getShoppingList(phase: CyclePhase, method: CyclingMethod = 'bottled_bacteria'): BacteriaProduct[] {
  const effectivePhase = phase || 'starting';

  let products = BACTERIA_PRODUCTS.filter(p =>
    p.phaseRelevance.includes(effectivePhase as CyclePhase)
  );

  // For bottled bacteria method, prioritize Fritz + Dr. Tim's ammonia
  if (method === 'bottled_bacteria') {
    products.sort((a, b) => {
      const tierOrder = { essential: 0, recommended: 1, optional: 2 };
      return tierOrder[a.tier] - tierOrder[b.tier];
    });
  }

  // For fish-in, Prime is essential
  if (method === 'fish_in') {
    products = products.map(p =>
      p.id === 'seachem-prime' ? { ...p, tier: 'essential' as const } : p
    );
  }

  return products;
}
