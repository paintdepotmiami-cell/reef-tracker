/**
 * Bioload Calculator — Calculates biological load capacity and stocking timeline.
 *
 * Rules from marine biology experts:
 * - Nano (<40L / 10gal): max 1-2 small fish (gobies, blennies)
 * - Standard (40-100gal): flexible communities
 * - Pacing: introduce 1-2 animals at a time, wait 2-3 weeks between additions
 * - Stocking timeline locked to cycle completion
 */

import type { Animal } from './queries';
import type { CycleStatus } from './cycle-engine';

/* ─── Fish Size Database (adult size in inches) ─── */
const FISH_SIZES: Record<string, number> = {
  // Common reef fish — adult sizes in inches
  'clownfish': 3.5,
  'ocellaris clownfish': 3,
  'percula clownfish': 3,
  'royal gramma': 3,
  'firefish': 3,
  'purple firefish': 3.5,
  'six line wrasse': 3,
  'yellow watchman goby': 4,
  'court jester goby': 2.5,
  'clown goby': 1.5,
  'neon goby': 2,
  'tailspot blenny': 2.5,
  'bicolor blenny': 4,
  'midas blenny': 5,
  'lawnmower blenny': 5,
  'coral beauty angelfish': 4,
  'flame angelfish': 4,
  'yellow tang': 8,
  'kole tang': 7,
  'blue tang': 12,
  'foxface': 9,
  'mandarin dragonet': 3,
  'green chromis': 3.5,
  'blue chromis': 5,
  'bangaii cardinalfish': 3,
  'pajama cardinalfish': 3.5,
  'orchid dottyback': 3,
  'blue damsel': 3,
  'yellowtail damsel': 3,
  'chalk bass': 3,
  'melanurus wrasse': 5,
  'flasher wrasse': 3,
  'fairy wrasse': 4,
  'leopard wrasse': 5,
  'diamond goby': 6,
  'cleaner wrasse': 5.5,
  'engineer goby': 13,
  'hawkfish': 3.5,
  'flame hawkfish': 3.5,
  'default_small': 3,
  'default_medium': 5,
  'default_large': 8,
};

export interface BioloadResult {
  // Capacity
  tankGallons: number;
  tankCategory: 'nano' | 'standard' | 'large';
  maxFishInches: number;
  currentFishInches: number;
  capacityPercent: number;
  remainingInches: number;

  // Status
  status: 'under' | 'optimal' | 'warning' | 'overstocked';
  statusLabel: string;
  statusColor: string;
  statusIcon: string;

  // Fish details
  fishList: { name: string; adultSize: number; quantity: number; totalInches: number }[];

  // Pacing
  canAddMore: boolean;
  pacingAdvice: string;

  // Warnings
  warnings: string[];
}

export interface StockingPhase {
  phase: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockCondition: string;
  unlocked: boolean;
  daysUntilUnlock: number | null;
  animals: string[];
  tips: string[];
}

/**
 * Estimate adult size of a fish by name matching
 */
function estimateFishSize(name: string): number {
  const lower = name.toLowerCase();
  for (const [key, size] of Object.entries(FISH_SIZES)) {
    if (lower.includes(key)) return size;
  }
  // Heuristics
  if (lower.includes('goby') || lower.includes('blenny')) return 3;
  if (lower.includes('tang') || lower.includes('surgeon')) return 8;
  if (lower.includes('angel')) return 4;
  if (lower.includes('wrasse')) return 4;
  if (lower.includes('damsel') || lower.includes('chromis')) return 3;
  if (lower.includes('cardinal')) return 3;
  if (lower.includes('hawk')) return 3.5;
  return 3.5; // conservative default
}

/**
 * Calculate bioload for a given tank
 */
export function calculateBioload(
  tankGallons: number,
  animals: Animal[],
): BioloadResult {
  const fish = animals.filter(a => a.type === 'fish');

  // Tank category
  let tankCategory: 'nano' | 'standard' | 'large';
  if (tankGallons < 30) tankCategory = 'nano';
  else if (tankGallons <= 100) tankCategory = 'standard';
  else tankCategory = 'large';

  // Max capacity: conservative rule of 0.5 inch per gallon for reef
  // (more conservative than FOWLR because corals need cleaner water)
  const maxFishInches = Math.floor(tankGallons * 0.5);

  // Nano override: max 1-2 small fish
  const nanoMaxInches = tankCategory === 'nano' ? Math.min(maxFishInches, 7) : maxFishInches;
  const effectiveMax = nanoMaxInches;

  // Calculate current load
  const fishList = fish.map(f => {
    const adultSize = estimateFishSize(f.name);
    const qty = f.quantity || 1;
    return {
      name: f.name,
      adultSize,
      quantity: qty,
      totalInches: adultSize * qty,
    };
  });

  const currentFishInches = fishList.reduce((sum, f) => sum + f.totalInches, 0);
  const capacityPercent = effectiveMax > 0 ? Math.round((currentFishInches / effectiveMax) * 100) : 0;
  const remainingInches = Math.max(0, effectiveMax - currentFishInches);

  // Status
  let status: BioloadResult['status'];
  let statusLabel: string;
  let statusColor: string;
  let statusIcon: string;

  if (capacityPercent <= 50) {
    status = 'under';
    statusLabel = 'Light Load';
    statusColor = '#2ff801';
    statusIcon = 'check_circle';
  } else if (capacityPercent <= 75) {
    status = 'optimal';
    statusLabel = 'Optimal Load';
    statusColor = '#4cd6fb';
    statusIcon = 'balance';
  } else if (capacityPercent <= 100) {
    status = 'warning';
    statusLabel = 'Near Capacity';
    statusColor = '#F1C40F';
    statusIcon = 'warning';
  } else {
    status = 'overstocked';
    statusLabel = 'Overstocked!';
    statusColor = '#ff4444';
    statusIcon = 'dangerous';
  }

  // Pacing
  const canAddMore = capacityPercent < 90;
  let pacingAdvice = '';
  if (canAddMore) {
    const inchesLeft = remainingInches;
    if (inchesLeft >= 8) {
      pacingAdvice = `Room for ${Math.floor(inchesLeft / 4)} medium fish. Add 1-2 at a time, wait 2-3 weeks between additions.`;
    } else if (inchesLeft >= 3) {
      pacingAdvice = `Room for ${Math.floor(inchesLeft / 3)} small fish. Add one at a time.`;
    } else {
      pacingAdvice = 'Very limited space. Consider only nano-sized fish (gobies, blennies).';
    }
  } else {
    pacingAdvice = 'Tank is at or near full capacity. Adding more fish risks water quality problems.';
  }

  // Warnings
  const warnings: string[] = [];
  if (tankCategory === 'nano' && fish.length > 2) {
    warnings.push('Nano tanks should have maximum 1-2 small fish. Your biofilter may be overwhelmed.');
  }
  if (capacityPercent > 100) {
    warnings.push('Tank is overstocked! Increase filtration, water changes, and consider rehoming fish.');
  }
  if (fishList.some(f => f.adultSize > tankGallons * 0.15)) {
    const bigFish = fishList.find(f => f.adultSize > tankGallons * 0.15);
    if (bigFish) {
      warnings.push(`${bigFish.name} grows to ${bigFish.adultSize}" — may outgrow your ${tankGallons}gal tank.`);
    }
  }
  // Check for aggressive species crowding
  const aggressiveFish = animals.filter(a => a.type === 'fish' && a.aggression === 'High');
  if (aggressiveFish.length > 1) {
    warnings.push('Multiple aggressive fish detected. Monitor for territorial behavior and stress.');
  }

  return {
    tankGallons,
    tankCategory,
    maxFishInches: effectiveMax,
    currentFishInches: Math.round(currentFishInches * 10) / 10,
    capacityPercent: Math.min(capacityPercent, 150),
    remainingInches: Math.round(remainingInches * 10) / 10,
    status,
    statusLabel,
    statusColor,
    statusIcon,
    fishList,
    canAddMore,
    pacingAdvice,
    warnings,
  };
}

/**
 * Generate stocking timeline phases based on cycle status and tank age
 */
export function getStockingTimeline(
  cycleStatus: CycleStatus,
  tankAgeDays: number,
  animals: Animal[],
): StockingPhase[] {
  const cycleComplete = cycleStatus.safeToAddLife;
  const hasCUC = animals.some(a =>
    a.type === 'invertebrate' && (
      a.name.toLowerCase().includes('snail') ||
      a.name.toLowerCase().includes('hermit') ||
      a.name.toLowerCase().includes('crab') ||
      a.name.toLowerCase().includes('shrimp') ||
      a.name.toLowerCase().includes('caracol') ||
      a.name.toLowerCase().includes('cangrejo')
    )
  );
  const hasSoftCoral = animals.some(a =>
    a.type === 'coral' && (
      a.subtype?.toLowerCase().includes('soft') ||
      a.name.toLowerCase().includes('zoa') ||
      a.name.toLowerCase().includes('mushroom') ||
      a.name.toLowerCase().includes('disco') ||
      a.name.toLowerCase().includes('leather') ||
      a.name.toLowerCase().includes('toadstool') ||
      a.name.toLowerCase().includes('xenia') ||
      a.name.toLowerCase().includes('gsp')
    )
  );
  const hasFish = animals.some(a => a.type === 'fish');
  const hasSPS = animals.some(a =>
    a.type === 'coral' && (
      a.subtype?.toLowerCase().includes('sps') ||
      a.name.toLowerCase().includes('acropora') ||
      a.name.toLowerCase().includes('montipora') ||
      a.name.toLowerCase().includes('stylophora') ||
      a.name.toLowerCase().includes('pocillopora') ||
      a.name.toLowerCase().includes('seriatopora') ||
      a.name.toLowerCase().includes('birdsnest')
    )
  );

  // Days since cycle completion (estimate)
  const daysSinceCycle = cycleComplete ? Math.max(0, tankAgeDays - 42) : 0; // assume ~6 weeks to cycle

  return [
    {
      phase: 0,
      title: 'Complete the Nitrogen Cycle',
      description: 'NH\u2083 and NO\u2082 must be 0 ppm across 2-3 consecutive tests before ANY life can be added.',
      icon: 'cycle',
      color: '#4cd6fb',
      unlockCondition: 'Cycle complete (NH\u2083=0, NO\u2082=0)',
      unlocked: cycleComplete,
      daysUntilUnlock: cycleComplete ? null : Math.max(0, 42 - tankAgeDays),
      animals: [],
      tips: [
        'Do a 25% water change before adding anything',
        'Test one more time to confirm zeros',
      ],
    },
    {
      phase: 1,
      title: 'Cleanup Crew (CUC)',
      description: 'Introduce snails, hermit crabs, and cleaner shrimp to combat the first algae bloom that follows every new cycle.',
      icon: 'pest_control',
      color: '#2ff801',
      unlockCondition: 'Immediately after cycle completes',
      unlocked: cycleComplete,
      daysUntilUnlock: cycleComplete ? 0 : null,
      animals: [
        'Turbo/Astrea snails (1 per 2 gallons)',
        'Nassarius snails (1 per 5 gallons)',
        'Blue-leg hermit crabs (1 per 3 gallons)',
        'Peppermint shrimp (controls Aiptasia)',
        'Cleaner shrimp (Skunk or Fire)',
      ],
      tips: [
        'Add all CUC on the same day',
        'Acclimate slowly (drip method, 45-60 min)',
        'Expect diatom/algae bloom — CUC will handle it',
        hasCUC ? 'You already have CUC members' : 'Visit the Acclimation Guide for proper procedure',
      ],
    },
    {
      phase: 2,
      title: 'Soft Corals & First Fish',
      description: 'After 3 weeks with CUC, add easy corals and your first peaceful fish. These species are forgiving of minor parameter swings.',
      icon: 'spa',
      color: '#FF7F50',
      unlockCondition: '3 weeks after CUC introduction',
      unlocked: cycleComplete && (daysSinceCycle >= 21 || hasSoftCoral || hasFish),
      daysUntilUnlock: cycleComplete ? Math.max(0, 21 - daysSinceCycle) : null,
      animals: [
        'Zoanthids / Palythoa (easy, colorful)',
        'Mushroom corals (Discosoma, Rhodactis)',
        'Leather corals (Toadstool, Devil\u2019s Hand)',
        'Kenya Tree, Xenia, GSP (fast growers)',
        'First fish: Clownfish, Royal Gramma, Firefish',
        'Peaceful community fish only — 1-2 at a time',
      ],
      tips: [
        'Dip all new corals (Revive or CoralRx) before adding',
        'Start lights at 50% and ramp up over 2 weeks',
        'Feed fish sparingly — overfeeding spikes nutrients',
        'Add peaceful species BEFORE aggressive ones',
        'Wait 2-3 weeks between fish additions',
      ],
    },
    {
      phase: 3,
      title: 'LPS Corals & More Fish',
      description: 'At 2+ months, your tank chemistry should be stabilizing. LPS corals are more demanding but still relatively forgiving.',
      icon: 'neurology',
      color: '#F1C40F',
      unlockCondition: '2 months after cycle completion',
      unlocked: cycleComplete && daysSinceCycle >= 60,
      daysUntilUnlock: cycleComplete ? Math.max(0, 60 - daysSinceCycle) : null,
      animals: [
        'Euphyllia (Hammer, Torch, Frogspawn)',
        'Brain corals (Goniastrea, Favia)',
        'Bubble coral, Candy Cane coral',
        'Blastomussa, Duncan, Acan Lords',
        'More fish: Wrasses, Blennies, Cardinalfish',
      ],
      tips: [
        'Euphyllia have sweeper tentacles — 6" spacing minimum',
        'LPS need moderate flow and medium-low light',
        'Begin dosing Alk/Ca/Mg if consumption increases',
        'Target feed LPS with Reef-Roids weekly',
      ],
    },
    {
      phase: 4,
      title: 'SPS Corals (Expert)',
      description: 'Only after 3+ months of STABLE parameters. SPS are extremely sensitive to chemistry swings and require pristine water.',
      icon: 'diamond',
      color: '#d7ffc5',
      unlockCondition: '3+ months with stable Alk/Ca/Mg',
      unlocked: cycleComplete && (daysSinceCycle >= 90 || hasSPS),
      daysUntilUnlock: cycleComplete ? Math.max(0, 90 - daysSinceCycle) : null,
      animals: [
        'Montipora (easiest SPS — good starter)',
        'Stylophora, Pocillopora (medium difficulty)',
        'Birdsnest (Seriatopora)',
        'Acropora (hardest — only if params are rock stable)',
      ],
      tips: [
        'Alk MUST be stable (no more than 0.5 dKH swing/day)',
        'Ca 400-450, Mg 1300-1400, Alk 8-10 dKH',
        'High flow and high PAR (200-400+)',
        'Dosing pump is essential for SPS',
        'ICP test recommended before first SPS',
        hasSPS ? 'You already have SPS — ensure parameter stability!' : 'Start with Montipora before attempting Acropora',
      ],
    },
  ];
}
