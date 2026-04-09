/**
 * Feeding Schedule Engine
 *
 * Generates species-appropriate feeding plans.
 * Rules:
 * - Herbivores (Tangs, Blennies): DAILY plant-based food mandatory (spirulina, nori sheets)
 * - Bottom dwellers (Gobies, Blennies): Can go 2-3 days without direct feeding — they forage from live rock
 * - Active swimmers (Wrasses, Anthias, Chromis): Regular feeding 1-2x daily, suggest auto-feeder for granules
 * - Corals (LPS): Target feed weekly with Reef-Roids or mysis
 * - Corals (SPS): Primarily photosynthetic, occasional broadcast feeding
 * - Anti-overfeeding alert: Remove uneaten food after 3 minutes — #1 cause of ammonia/nitrate spikes
 */

export interface FoodType {
  name: string;
  brand: string;
  type: 'pellet' | 'frozen' | 'sheet' | 'liquid' | 'live';
  portion: string;
}

export interface FeedingPlan {
  category: string;
  icon: string;
  color: string;
  frequency: string;
  foodTypes: FoodType[];
  tips: string[];
  autoFeederSuggested: boolean;
  overfeedingRisk: 'low' | 'medium' | 'high';
}

export interface DailyFeedingTask {
  time: 'morning' | 'afternoon' | 'evening';
  label: string;
  icon: string;
  color: string;
  foods: string[];
  duration: string;
  tip: string;
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

const HERBIVORE_PLAN: FeedingPlan = {
  category: 'Herbivorous Fish',
  icon: 'eco',
  color: '#2ff801',
  frequency: 'Daily — 1-2x per day',
  foodTypes: [
    { name: 'Nori Sheets', brand: 'Two Little Fishies SeaVeggies', type: 'sheet', portion: '1 sheet clipped to glass, replace after 4 hrs' },
    { name: 'Spirulina Pellets', brand: 'New Life Spectrum Algae/H20 Stable', type: 'pellet', portion: 'Pinch — what they eat in 2 min' },
    { name: 'Frozen Spirulina Brine', brand: 'Hikari Bio-Pure Spirulina Brine Shrimp', type: 'frozen', portion: '1/4 cube thawed in tank water' },
    { name: 'Algae Wafers', brand: 'Hikari Marine Algae Wafers', type: 'pellet', portion: '1 wafer per 2 tangs, drop at night' },
  ],
  tips: [
    'Tangs MUST have daily greens or they develop HLLE (Head & Lateral Line Erosion).',
    'Clip nori to the glass with a veggie clip so tangs can graze naturally.',
    'Supplement with garlic-soaked nori to boost immune system if fish look stressed.',
  ],
  autoFeederSuggested: false,
  overfeedingRisk: 'low',
};

const CARNIVORE_OMNIVORE_PLAN: FeedingPlan = {
  category: 'Carnivorous / Omnivorous Fish',
  icon: 'set_meal',
  color: '#4cd6fb',
  frequency: 'Daily — 1-2x per day',
  foodTypes: [
    { name: 'Frozen Mysis Shrimp', brand: 'Hikari Bio-Pure Mysis Shrimp', type: 'frozen', portion: '1/4 cube per 4-5 fish, thaw first' },
    { name: 'Reef Pellets', brand: 'TDO Chroma Boost (Reed Mariculture)', type: 'pellet', portion: 'Pinch — what they eat in 2 min' },
    { name: 'Frozen Brine Shrimp', brand: 'San Francisco Bay Brand Brine Shrimp', type: 'frozen', portion: '1/4 cube thawed, great for clowns' },
    { name: 'Marine Flakes', brand: 'Ocean Nutrition Formula One Flakes', type: 'pellet', portion: 'Small pinch at surface, 1x daily max' },
  ],
  tips: [
    'Wrasses are active swimmers — they burn calories fast and benefit from 2x daily feeding.',
    'Anthias need frequent small meals; consider an auto-feeder for midday.',
    'Clownfish are easy eaters — they accept pellets, frozen, and flake readily.',
  ],
  autoFeederSuggested: true,
  overfeedingRisk: 'high',
};

const BOTTOM_DWELLER_PLAN: FeedingPlan = {
  category: 'Bottom Dwellers',
  icon: 'waves',
  color: '#ffb59c',
  frequency: 'Every 2-3 days (they forage naturally)',
  foodTypes: [
    { name: 'Frozen Copepods', brand: 'Reef Nutrition Tigger-Pods', type: 'frozen', portion: 'Squirt near rockwork at dusk' },
    { name: 'Live Copepods', brand: 'AlgaeBarn Tisbe Pods', type: 'live', portion: 'Dose 1 bottle/month into sump or display' },
    { name: 'Sinking Pellets', brand: 'Hikari Marine S Pellets', type: 'pellet', portion: '3-5 pellets near their burrow' },
    { name: 'Frozen Cyclops', brand: 'Hikari Bio-Pure Frozen Cyclops', type: 'frozen', portion: '1/4 cube thawed, target feed with pipette' },
  ],
  tips: [
    'Mandarin dragonets REQUIRE a thriving copepod population. Dose live pods monthly.',
    'Gobies forage from live rock — a mature tank with plenty of rock reduces need for direct feeding.',
    'Shrimp clean up leftover food; they rarely need dedicated feeding if other fish are fed.',
  ],
  autoFeederSuggested: false,
  overfeedingRisk: 'low',
};

const LPS_CORAL_PLAN: FeedingPlan = {
  category: 'LPS Corals',
  icon: 'local_florist',
  color: '#FF7F50',
  frequency: 'Weekly — 1-2x target feeding',
  foodTypes: [
    { name: 'Reef-Roids', brand: 'Polyp Lab Reef-Roids', type: 'liquid', portion: 'Small pinch mixed in tank water, target feed with turkey baster' },
    { name: 'Frozen Mysis (small)', brand: 'Hikari Bio-Pure Mysis Shrimp', type: 'frozen', portion: '1-2 small pieces per coral head, place on tentacles' },
    { name: 'Coral Smoothie', brand: 'Benepets Benereef', type: 'liquid', portion: '1 scoop broadcast after lights out' },
    { name: 'Amino Acids', brand: 'Red Sea Reef Energy A+B', type: 'liquid', portion: 'Dose per label daily for coral nutrition' },
  ],
  tips: [
    'Target feed LPS at night when tentacles are fully extended for best polyp response.',
    'Turn off return pump and powerheads for 10-15 min while target feeding.',
    'Acans and brain corals are aggressive eaters — they can take whole mysis shrimp.',
  ],
  autoFeederSuggested: false,
  overfeedingRisk: 'medium',
};

const FILTER_FEEDER_PLAN: FeedingPlan = {
  category: 'Filter Feeders',
  icon: 'filter_alt',
  color: '#c084fc',
  frequency: 'Every 2-3 days — broadcast feeding',
  foodTypes: [
    { name: 'Phytoplankton', brand: 'Brightwell Aquatics PhytoGreen-M', type: 'liquid', portion: '5 mL per 50 gal, dose near intake' },
    { name: 'Oyster Feast', brand: 'Reef Nutrition Oyster Feast', type: 'liquid', portion: '1 mL per 25 gal, broadcast at night' },
    { name: 'Coral Frenzy', brand: 'Coral Frenzy Ultimate Coral Food', type: 'liquid', portion: '1/4 tsp broadcast with pumps on low' },
    { name: 'Live Rotifers', brand: 'AlgaeBarn Live Rotifers', type: 'live', portion: 'Dose bottle into sump weekly' },
  ],
  tips: [
    'Clams primarily rely on photosynthesis but benefit from phytoplankton dosing.',
    'Feather dusters and sponges are obligate filter feeders — without regular phyto they slowly starve.',
    'Dose phyto at night when corals and filter feeders actively feed.',
  ],
  autoFeederSuggested: false,
  overfeedingRisk: 'medium',
};

// ---------------------------------------------------------------------------
// All plans lookup
// ---------------------------------------------------------------------------

const ALL_PLANS: FeedingPlan[] = [
  HERBIVORE_PLAN,
  CARNIVORE_OMNIVORE_PLAN,
  BOTTOM_DWELLER_PLAN,
  LPS_CORAL_PLAN,
  FILTER_FEEDER_PLAN,
];

// ---------------------------------------------------------------------------
// Animal name → category matching
// ---------------------------------------------------------------------------

const HERBIVORE_NAMES = [
  'tang', 'rabbitfish', 'foxface', 'blenny', 'lawnmower', 'sailfin',
  'naso', 'yellow tang', 'blue tang', 'kole', 'tomini', 'scopas',
  'convict tang', 'powder blue', 'powder brown', 'unicorn',
];

const CARNIVORE_OMNIVORE_NAMES = [
  'clown', 'wrasse', 'anthias', 'chromis', 'damsel', 'dottyback',
  'cardinal', 'firefish', 'gramma', 'royal gramma', 'basslet',
  'hawkfish', 'pygmy angel', 'angelfish', 'flame angel', 'coral beauty',
  'percula', 'ocellaris', 'maroon', 'six line', 'fairy wrasse',
  'flasher wrasse', 'melanurus', 'leopard wrasse',
];

const BOTTOM_DWELLER_NAMES = [
  'goby', 'mandarin', 'dragonet', 'jawfish', 'shrimp', 'cleaner shrimp',
  'fire shrimp', 'pistol shrimp', 'watchman', 'diamond goby', 'sand sifter',
  'engineer goby', 'scooter blenny', 'starry blenny', 'hermit', 'crab',
  'conch', 'nassarius', 'snail', 'sea cucumber', 'star', 'starfish',
];

const LPS_NAMES = [
  'euphyllia', 'torch', 'hammer', 'frogspawn', 'brain', 'acan',
  'acanthastrea', 'blastomussa', 'blasto', 'chalice', 'duncan',
  'plate coral', 'goniopora', 'goni', 'alveopora', 'candy cane',
  'lobophyllia', 'lobo', 'war coral', 'favites', 'favia',
  'micromussa', 'scolymia', 'scoly', 'elegance', 'bubble coral',
  'lps',
];

const FILTER_FEEDER_NAMES = [
  'clam', 'tridacna', 'maxima', 'crocea', 'derasa', 'squamosa',
  'feather duster', 'fan worm', 'sponge', 'tube worm', 'barnacle',
  'sea apple', 'coco worm', 'filter',
];

function matchesCategory(animalName: string, keywords: string[]): boolean {
  const lower = animalName.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Takes animal categories/names from the user's tank and returns relevant feeding plans.
 */
export function generateFeedingPlans(
  animals: { name: string; type: string; subtype?: string | null }[],
): FeedingPlan[] {
  const matched = new Set<string>();

  for (const animal of animals) {
    const combined = `${animal.name} ${animal.subtype || ''}`;

    if (matchesCategory(combined, HERBIVORE_NAMES)) matched.add('Herbivorous Fish');
    if (matchesCategory(combined, CARNIVORE_OMNIVORE_NAMES)) matched.add('Carnivorous / Omnivorous Fish');
    if (matchesCategory(combined, BOTTOM_DWELLER_NAMES)) matched.add('Bottom Dwellers');
    if (matchesCategory(combined, LPS_NAMES)) matched.add('LPS Corals');
    if (matchesCategory(combined, FILTER_FEEDER_NAMES)) matched.add('Filter Feeders');

    // Fallback: if type is 'fish' and no specific match, assume omnivore
    if (animal.type === 'fish' && !matchesCategory(combined, [...HERBIVORE_NAMES, ...CARNIVORE_OMNIVORE_NAMES, ...BOTTOM_DWELLER_NAMES])) {
      matched.add('Carnivorous / Omnivorous Fish');
    }
    // Fallback: if type is 'coral' and subtype is LPS
    if (animal.type === 'coral' && animal.subtype?.toLowerCase().includes('lps')) {
      matched.add('LPS Corals');
    }
    // Invertebrates without specific match — check if filter feeder
    if (animal.type === 'invertebrate' && !matchesCategory(combined, [...BOTTOM_DWELLER_NAMES, ...FILTER_FEEDER_NAMES])) {
      matched.add('Bottom Dwellers');
    }
  }

  return ALL_PLANS.filter((p) => matched.has(p.category));
}

/**
 * Generate a daily schedule based on active feeding plans.
 */
export function generateDailySchedule(plans: FeedingPlan[]): DailyFeedingTask[] {
  const tasks: DailyFeedingTask[] = [];
  const categories = plans.map((p) => p.category);

  const hasFish = categories.some((c) =>
    c === 'Herbivorous Fish' || c === 'Carnivorous / Omnivorous Fish' || c === 'Bottom Dwellers',
  );
  const hasLPS = categories.includes('LPS Corals');
  const hasFilterFeeders = categories.includes('Filter Feeders');
  const hasHerbivores = categories.includes('Herbivorous Fish');

  // Morning — primary fish feeding
  if (hasFish) {
    const foods: string[] = [];
    if (hasHerbivores) foods.push('Clip nori sheet to glass');
    if (categories.includes('Carnivorous / Omnivorous Fish')) foods.push('Pinch of pellets or thawed mysis');
    if (categories.includes('Bottom Dwellers')) foods.push('Drop sinking pellets near burrows');
    if (foods.length === 0) foods.push('Standard pellet or frozen feeding');

    tasks.push({
      time: 'morning',
      label: 'Morning Fish Feeding',
      icon: 'wb_sunny',
      color: '#facc15',
      foods,
      duration: '3 min max — remove uneaten food',
      tip: 'Feed after lights have been on for 1 hour so fish are active.',
    });
  }

  // Afternoon — second feeding for active swimmers + herbivore top-up
  if (categories.includes('Carnivorous / Omnivorous Fish') || hasHerbivores) {
    const foods: string[] = [];
    if (hasHerbivores) foods.push('Check nori clip — replace if eaten');
    if (categories.includes('Carnivorous / Omnivorous Fish')) foods.push('Small pinch of pellets (auto-feeder ideal)');

    tasks.push({
      time: 'afternoon',
      label: 'Afternoon Top-Up',
      icon: 'light_mode',
      color: '#FF7F50',
      foods,
      duration: '2 min — light feeding only',
      tip: 'If using an auto-feeder, skip this manual step.',
    });
  }

  // Evening — coral feeding + filter feeders + bottom dwellers
  {
    const foods: string[] = [];
    if (hasLPS) foods.push('Target feed corals with Reef-Roids or mysis');
    if (hasFilterFeeders) foods.push('Broadcast phytoplankton / Oyster Feast');
    if (categories.includes('Bottom Dwellers')) foods.push('Squirt copepods near rockwork');
    if (foods.length === 0) foods.push('No evening feeding needed today');

    tasks.push({
      time: 'evening',
      label: 'Evening Coral & Invert Feeding',
      icon: 'dark_mode',
      color: '#c084fc',
      foods,
      duration: 'Turn off pumps for 15 min during target feeding',
      tip: 'Feed 30 min after lights dim — corals extend tentacles in low light.',
    });
  }

  return tasks;
}

/**
 * Anti-overfeeding tips — always shown as warnings.
 */
export const OVERFEEDING_TIPS: string[] = [
  'Remove uneaten food after 3 minutes. This is the #1 cause of ammonia and nitrate spikes.',
  'Feed only what fish consume in 2-3 minutes. If food hits the sand bed, you fed too much.',
  'Frozen food should always be thawed and rinsed in RO water before adding to the tank.',
  'Skip feeding 1 day per week. Fish are fine — it mimics natural conditions and reduces nutrient buildup.',
  'If you see brown film on sand/glass within 24 hours of feeding, reduce portion size.',
  'Auto-feeders are great for consistency but calibrate them weekly — humidity can clump pellets.',
  'Never dump frozen cube juice into the tank. It is pure phosphate and will fuel algae.',
];
