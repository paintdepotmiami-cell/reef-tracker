export interface DosingResult {
  parameter: string;
  current: number;
  target: number;
  deficit: number;
  product: string;
  brand: string;
  doseAmount: number; // mL
  doseUnit: string;
  frequency: string;
  notes: string;
}

export interface DosingProfile {
  parameter: string;
  unit: string;
  min: number;
  max: number;
  target: number;
  icon: string;
  color: string;
}

export const DOSING_PROFILES: DosingProfile[] = [
  {
    parameter: 'Alkalinity',
    unit: 'dKH',
    min: 7,
    max: 11,
    target: 8.5,
    icon: 'science',
    color: '#4cd6fb',
  },
  {
    parameter: 'Calcium',
    unit: 'ppm',
    min: 380,
    max: 450,
    target: 420,
    icon: 'labs',
    color: '#2ff801',
  },
  {
    parameter: 'Magnesium',
    unit: 'ppm',
    min: 1250,
    max: 1400,
    target: 1350,
    icon: 'experiment',
    color: '#F1C40F',
  },
];

export function calculateDosing(
  param: string,
  current: number,
  target: number,
  tankGallons: number
): DosingResult {
  const deficit = target - current;

  let product = '';
  let brand = '';
  let doseAmount = 0;
  let frequency = '';
  let notes = '';

  const lowerParam = param.toLowerCase();

  if (lowerParam === 'alkalinity') {
    // mL of Soda Ash solution (1 cup/gallon concentrate) = deficit_dKH x tank_gallons / 4
    product = 'Soda Ash Solution';
    brand = 'BRS 2-Part';
    doseAmount = (deficit * tankGallons) / 4;
    frequency = deficit > 2 ? 'Split into 2 doses over 24h' : 'Single dose, retest in 24h';
    notes =
      deficit > 1
        ? 'Large deficit detected. Never raise more than 1 dKH per day. Split dosing over multiple days.'
        : 'Small adjustment. Dose and retest after 24 hours to confirm stability.';
  } else if (lowerParam === 'calcium') {
    // mL of CaCl2 solution (1 cup/gallon concentrate) = deficit_ppm x tank_gallons / 20
    product = 'Calcium Chloride Solution';
    brand = 'BRS 2-Part';
    doseAmount = (deficit * tankGallons) / 20;
    frequency = deficit > 30 ? 'Split into 2-3 doses over 48h' : 'Single dose, retest in 24h';
    notes =
      deficit > 20
        ? 'Significant calcium deficit. Raise gradually over several days to avoid shocking corals.'
        : 'Minor adjustment. Dose and monitor. Keep calcium and alkalinity balanced.';
  } else if (lowerParam === 'magnesium') {
    // mL of MgCl2/MgSO4 solution = deficit_ppm x tank_gallons / 10
    product = 'Magnesium Chloride/Sulfate Solution';
    brand = 'BRS Magnesium';
    doseAmount = (deficit * tankGallons) / 10;
    frequency = deficit > 50 ? 'Split into 2-3 doses over 48h' : 'Single dose, retest in 24h';
    notes =
      deficit > 50
        ? 'Magnesium can be raised more aggressively than Ca/Alk. Still, split large doses. Correct Mg before adjusting Ca/Alk.'
        : 'Small adjustment. Magnesium is consumed slower than Ca/Alk and needs less frequent dosing.';
  }

  return {
    parameter: param,
    current,
    target,
    deficit,
    product,
    brand,
    doseAmount: Math.max(0, Math.round(doseAmount * 10) / 10),
    doseUnit: 'mL',
    frequency,
    notes,
  };
}
