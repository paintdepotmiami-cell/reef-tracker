/**
 * Volume, Weight & Viability Calculator Engine (A7)
 *
 * Calculates tank volume from dimensions, estimates total weight,
 * and evaluates viability/resilience for reef keeping.
 */

/* ─── Types ─── */

export type MeasureUnit = 'cm' | 'in';
export type VolumeUnit = 'liters' | 'gallons';

export type ViabilityTier =
  | 'nano_extreme'   // < 20L
  | 'nano'           // 20-40L
  | 'beginner_ideal' // 75-150L (20-40 gal)
  | 'standard'       // 150-400L
  | 'large'          // 400L+
  | 'intermediate';  // 40-75L gap

export interface TankDimensions {
  length: number;
  width: number;
  height: number;
  unit: MeasureUnit;
}

export interface VolumeResult {
  liters: number;
  gallons: number;
  cubicInches: number;
}

export interface WeightResult {
  waterOnlyKg: number;
  waterOnlyLbs: number;
  totalMinKg: number;     // × 1.2
  totalMaxKg: number;     // × 1.5
  totalMinLbs: number;
  totalMaxLbs: number;
  surfacePressureKgM2: number;  // weight per m² of footprint
  surfacePressureLbsFt2: number;
  standWarning: string | null;
}

export interface ViabilityResult {
  tier: ViabilityTier;
  label: string;
  color: string;
  icon: string;
  rating: number;           // 1-5 stars
  summary: string;
  thermalStability: string;
  chemicalStability: string;
  maxFishSmall: number;     // ~1" fish
  maxFishMedium: number;    // ~3" fish
  maxFishLarge: number;     // ~6" fish
  maxCorals: string;
  evaporationRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  warnings: string[];
}

export interface CalculatorResult {
  dimensions: TankDimensions;
  volume: VolumeResult;
  weight: WeightResult;
  viability: ViabilityResult;
}

/* ─── Constants ─── */

const CM_PER_INCH = 2.54;
const LITERS_PER_GALLON = 3.78541;
const KG_PER_LB = 0.453592;
const SQFT_PER_SQM = 10.7639;

/* ─── Core Calculations ─── */

/**
 * Calculate volume from dimensions.
 * Formula: L × W × H (cm) / 1000 = liters
 */
export function calculateVolume(dims: TankDimensions): VolumeResult {
  let lengthCm = dims.length;
  let widthCm = dims.width;
  let heightCm = dims.height;

  if (dims.unit === 'in') {
    lengthCm = dims.length * CM_PER_INCH;
    widthCm = dims.width * CM_PER_INCH;
    heightCm = dims.height * CM_PER_INCH;
  }

  const cubicCm = lengthCm * widthCm * heightCm;
  const liters = cubicCm / 1000;
  const gallons = liters / LITERS_PER_GALLON;
  const cubicInches = (dims.unit === 'in')
    ? dims.length * dims.width * dims.height
    : cubicCm / Math.pow(CM_PER_INCH, 3);

  return {
    liters: Math.round(liters * 10) / 10,
    gallons: Math.round(gallons * 10) / 10,
    cubicInches: Math.round(cubicInches),
  };
}

/**
 * Calculate weight estimates.
 * Rule: Each liter = 1.2-1.5 kg total (water + rock + sand + equipment)
 * A 100L tank decorated weighs ~150 kg, surface pressure up to 300 kg/m²
 */
export function calculateWeight(volume: VolumeResult, dims: TankDimensions): WeightResult {
  const { liters } = volume;

  // Water only: 1 liter = 1.025 kg (saltwater)
  const waterOnlyKg = Math.round(liters * 1.025);
  const waterOnlyLbs = Math.round(waterOnlyKg / KG_PER_LB);

  // Total with substrate, rock, equipment: 1.2-1.5× liters in kg
  const totalMinKg = Math.round(liters * 1.2);
  const totalMaxKg = Math.round(liters * 1.5);
  const totalMinLbs = Math.round(totalMinKg / KG_PER_LB);
  const totalMaxLbs = Math.round(totalMaxKg / KG_PER_LB);

  // Surface pressure: weight / footprint area
  let lengthM: number, widthM: number;
  if (dims.unit === 'cm') {
    lengthM = dims.length / 100;
    widthM = dims.width / 100;
  } else {
    lengthM = (dims.length * CM_PER_INCH) / 100;
    widthM = (dims.width * CM_PER_INCH) / 100;
  }
  const areaM2 = lengthM * widthM;
  const surfacePressureKgM2 = areaM2 > 0 ? Math.round(totalMaxKg / areaM2) : 0;
  const surfacePressureLbsFt2 = areaM2 > 0 ? Math.round((totalMaxLbs) / (areaM2 * SQFT_PER_SQM)) : 0;

  // Stand warning
  let standWarning: string | null = null;
  if (totalMaxKg > 500) {
    standWarning = 'This tank requires a reinforced steel stand and you should verify your floor can support this weight. Consult a structural engineer for upper floors.';
  } else if (totalMaxKg > 200) {
    standWarning = 'Ensure your stand is rated for this weight. Particle board furniture is NOT safe — use a proper aquarium stand.';
  } else if (totalMaxKg > 100) {
    standWarning = 'A sturdy stand is recommended. Avoid placing on glass tables or thin shelving.';
  }

  return {
    waterOnlyKg,
    waterOnlyLbs,
    totalMinKg,
    totalMaxKg,
    totalMinLbs,
    totalMaxLbs,
    surfacePressureKgM2,
    surfacePressureLbsFt2,
    standWarning,
  };
}

/**
 * Evaluate viability and resilience based on volume.
 */
export function evaluateViability(volume: VolumeResult): ViabilityResult {
  const { liters, gallons } = volume;

  // Extreme nano: < 20L
  if (liters < 20) {
    return {
      tier: 'nano_extreme',
      label: 'Extreme Nano',
      color: '#ff4444',
      icon: 'dangerous',
      rating: 1,
      summary: 'Extremely challenging. Not recommended for beginners. Parameters fluctuate in minutes, not hours.',
      thermalStability: 'Very Low — temperature can swing 3-5°F in an hour from room temp changes or sunlight.',
      chemicalStability: 'Critical — a single dead snail can crash the tank. Zero margin for error.',
      maxFishSmall: 1,
      maxFishMedium: 0,
      maxFishLarge: 0,
      maxCorals: '3-5 small frags',
      evaporationRisk: 'critical',
      recommendations: [
        'Only for experienced reefers who want a desktop display',
        'Auto top-off (ATO) is MANDATORY — evaporation changes salinity in hours',
        'Test parameters daily',
        'Heater with precise thermostat is essential',
        'Consider a single goby or clownfish maximum',
      ],
      warnings: [
        'NOT recommended for beginners — parameter instability kills livestock quickly',
        'Evaporation is extreme: salinity can spike from 1.025 to 1.030+ in a single day',
        'One overfeeding can cause a total ammonia crash',
        'Equipment options are very limited at this size',
      ],
    };
  }

  // Nano: 20-40L (~5-10 gal)
  if (liters < 40) {
    return {
      tier: 'nano',
      label: 'Nano Reef',
      color: '#FF7F50',
      icon: 'warning',
      rating: 2,
      summary: 'Doable but challenging. Thermal resilience is low and evaporation is a constant battle.',
      thermalStability: 'Low — temperature fluctuates noticeably with room temperature changes.',
      chemicalStability: 'Low — small water volume means contaminants concentrate quickly.',
      maxFishSmall: 2,
      maxFishMedium: 1,
      maxFishLarge: 0,
      maxCorals: '5-10 small frags',
      evaporationRisk: 'critical',
      recommendations: [
        'ATO (Auto Top-Off) is essentially mandatory',
        'Limit bioload to 1-2 small fish (clown goby, small clownfish)',
        'Weekly 20% water changes to maintain stability',
        'Use a quality heater with 0.5°F precision',
        'Good for soft corals and some LPS',
      ],
      warnings: [
        'Thermal resilience is very low — temperature swings are dangerous',
        'Evaporation is critical: salinity can fluctuate significantly in hours',
        'Bioload must be severely limited: 1-2 small fish maximum',
        'Not ideal for beginners due to narrow margin for error',
      ],
    };
  }

  // Intermediate: 40-75L (~10-20 gal)
  if (liters < 75) {
    return {
      tier: 'intermediate',
      label: 'Small Reef',
      color: '#F1C40F',
      icon: 'info',
      rating: 3,
      summary: 'Workable for beginners with research. More forgiving than nano but still requires attention.',
      thermalStability: 'Moderate — temperature is more stable but still sensitive to room changes.',
      chemicalStability: 'Moderate — some buffer for mistakes, but regular testing is important.',
      maxFishSmall: 4,
      maxFishMedium: 2,
      maxFishLarge: 0,
      maxCorals: '10-20 frags',
      evaporationRisk: 'high',
      recommendations: [
        'ATO strongly recommended',
        'Good starter size for a pair of clownfish + a few tank mates',
        'Weekly 15-20% water changes',
        'Can support soft corals, LPS, and beginner SPS',
        'Protein skimmer recommended but not mandatory',
      ],
      warnings: [
        'Still requires consistent maintenance schedule',
        'Evaporation can shift salinity noticeably over a day',
      ],
    };
  }

  // Beginner Ideal: 75-150L (20-40 gal) — THE SWEET SPOT
  if (liters <= 150) {
    return {
      tier: 'beginner_ideal',
      label: 'Ideal for Beginners',
      color: '#2ff801',
      icon: 'check_circle',
      rating: 5,
      summary: 'The optimal zone! Best balance between cost, stability, and livestock options. Contaminants dilute well and temperature/salinity fluctuate slowly.',
      thermalStability: 'Good — larger water volume provides significant thermal buffer. Temperature changes are slow and manageable.',
      chemicalStability: 'Good — contaminants dilute effectively. More forgiving of beginner mistakes.',
      maxFishSmall: Math.round(gallons * 0.5),
      maxFishMedium: Math.round(gallons * 0.2),
      maxFishLarge: Math.floor(gallons / 30),
      maxCorals: '20-40+ frags',
      evaporationRisk: 'moderate',
      recommendations: [
        'This is the recommended size range for your first reef tank',
        'Water volume dilutes contaminants well — more forgiving of mistakes',
        'Temperature and salinity fluctuations are slow and manageable',
        'Can support a diverse community: clownfish, tangs (small species), wrasses, gobies',
        'Excellent for mixed reef: soft corals, LPS, and beginner SPS',
        'Protein skimmer recommended',
        'ATO recommended but not as critical as smaller tanks',
      ],
      warnings: [],
    };
  }

  // Standard: 150-400L (40-105 gal)
  if (liters <= 400) {
    return {
      tier: 'standard',
      label: 'Standard Reef',
      color: '#4cd6fb',
      icon: 'verified',
      rating: 5,
      summary: 'Moderate thermal inertia with excellent flexibility. Supports diverse communities of fish and invertebrates with comfortable margins.',
      thermalStability: 'Very Good — significant thermal mass means slow, predictable temperature changes.',
      chemicalStability: 'Very Good — large water volume provides excellent dilution of waste and contaminants.',
      maxFishSmall: Math.round(gallons * 0.5),
      maxFishMedium: Math.round(gallons * 0.25),
      maxFishLarge: Math.floor(gallons / 25),
      maxCorals: 'Extensive reef possible',
      evaporationRisk: 'moderate',
      recommendations: [
        'Excellent for diverse fish communities and full reef setups',
        'Moderate thermal inertia — very stable system',
        'Can house tangs, angels, wrasses, and other medium-large species',
        'Full SPS reef is achievable at this volume',
        'Sump/refugium highly recommended for nutrient export',
        'Calcium reactor becomes cost-effective at this size',
      ],
      warnings: [
        'Verify floor/stand can support the weight (200-600 kg / 440-1,320 lbs)',
        'Higher water change volumes — consider a mixing station',
      ],
    };
  }

  // Large: 400L+ (105+ gal)
  return {
    tier: 'large',
    label: 'Large System',
    color: '#c5a3ff',
    icon: 'diamond',
    rating: 5,
    summary: 'Maximum stability and livestock options. The ocean is big for a reason — larger volumes are inherently more stable.',
    thermalStability: 'Excellent — massive thermal mass. Power outages give you much more time before temperature becomes critical.',
    chemicalStability: 'Excellent — huge dilution factor. The system is very forgiving.',
    maxFishSmall: Math.round(gallons * 0.4),
    maxFishMedium: Math.round(gallons * 0.2),
    maxFishLarge: Math.floor(gallons / 20),
    maxCorals: 'Full reef — limited only by lighting and flow',
    evaporationRisk: 'low',
    recommendations: [
      'Can house large species: tangs, angels, groupers',
      'Full SPS-dominant reef with calcium reactor is ideal',
      'Sump and refugium are standard at this size',
      'Consider a dedicated fish room for equipment',
      'Automated dosing and monitoring systems become very valuable',
    ],
    warnings: [
      'CRITICAL: Verify structural support — a 500L tank weighs 600-750 kg (1,300-1,650 lbs)',
      'Upper floors may require structural engineer assessment',
      'Water changes require planning — consider automated water change system',
      'Electricity cost increases significantly with larger systems',
      'Insurance: check if your homeowner policy covers aquarium water damage',
    ],
  };
}

/**
 * Full calculation pipeline.
 */
export function calculateAll(dims: TankDimensions): CalculatorResult {
  const volume = calculateVolume(dims);
  const weight = calculateWeight(volume, dims);
  const viability = evaluateViability(volume);

  return { dimensions: dims, volume, weight, viability };
}

/* ─── Common Tank Presets ─── */

export interface TankPreset {
  name: string;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  gallons: number;
}

export const TANK_PRESETS: TankPreset[] = [
  { name: '10 Gallon', lengthIn: 20, widthIn: 10, heightIn: 12, gallons: 10 },
  { name: '20 Long', lengthIn: 30, widthIn: 12, heightIn: 12, gallons: 20 },
  { name: '29 Gallon', lengthIn: 30, widthIn: 12, heightIn: 18, gallons: 29 },
  { name: '40 Breeder', lengthIn: 36, widthIn: 18, heightIn: 16, gallons: 40 },
  { name: '55 Gallon', lengthIn: 48, widthIn: 13, heightIn: 21, gallons: 55 },
  { name: '75 Gallon', lengthIn: 48, widthIn: 18, heightIn: 21, gallons: 75 },
  { name: '90 Gallon', lengthIn: 48, widthIn: 18, heightIn: 24, gallons: 90 },
  { name: '120 Gallon', lengthIn: 48, widthIn: 24, heightIn: 24, gallons: 120 },
  { name: '180 Gallon', lengthIn: 72, widthIn: 24, heightIn: 24, gallons: 180 },
  { name: '220 Gallon', lengthIn: 72, widthIn: 24, heightIn: 30, gallons: 220 },
];
