/**
 * Smart Dosing Engine — Expert-level dosing intelligence.
 *
 * Provides method recommendations based on tank size, current levels,
 * and coral load. Implements Balling Method, Kalkwasser, and Reactor
 * logic with safety warnings from marine chemistry experts.
 *
 * KEY EXPERT RULES:
 * - Balling (2-Part) is the default recommendation for adjustments
 * - Kalkwasser: ONLY for maintenance via ATO, NOT for raising levels
 * - Calcium Reactor: ONLY for tanks >150gal with heavy SPS load
 * - Alk dosing at NIGHT helps stabilize pH (pH drops naturally at night)
 * - NEVER raise Alk more than 1 dKH per day
 * - NEVER raise Ca more than 20 ppm per day
 * - Fix Mg FIRST if low — Ca/Alk won't hold without proper Mg
 */

export type DosingMethod = 'balling' | 'kalkwasser' | 'reactor' | 'water_change';

export interface SmartDosingAdvice {
  method: DosingMethod;
  methodName: string;
  methodIcon: string;
  methodColor: string;
  recommended: boolean;
  reason: string;
  warnings: string[];
  schedule: string;
}

export interface SmartDosingResult {
  parameter: string;
  current: number;
  target: number;
  deficit: number;
  unit: string;
  severity: 'none' | 'minor' | 'moderate' | 'major' | 'critical';
  severityColor: string;

  // Primary recommendation
  primaryMethod: SmartDosingAdvice;

  // All method options
  allMethods: SmartDosingAdvice[];

  // Specific dosing instructions
  doseAmount: number;
  doseUnit: string;
  product: string;
  brand: string;
  frequency: string;
  splitDoses: boolean;
  daysToComplete: number;

  // Expert tips
  tips: string[];

  // Cross-parameter warnings
  crossWarnings: string[];
}

export interface AutoDosingInfo {
  parameter: string;     // 'alkalinity' | 'calcium' | 'magnesium'
  product: string;       // e.g. "BRS Alkalinity"
  ml_per_day: number;
  doses_per_day: number;
}

export interface TankContext {
  gallons: number;
  hasSPS: boolean;
  hasLPS: boolean;
  hasATO: boolean;
  hasDosingPump: boolean;
  currentAlk: number | null;
  currentCa: number | null;
  currentMg: number | null;
  autoDosing?: AutoDosingInfo[]; // active auto-dosing channels
}

/**
 * Get dosing method recommendations for a parameter
 */
function getMethodAdvice(
  param: string,
  deficit: number,
  ctx: TankContext,
): SmartDosingAdvice[] {
  const methods: SmartDosingAdvice[] = [];
  const isSmallAdjustment = (param === 'Alkalinity' && Math.abs(deficit) <= 1)
    || (param === 'Calcium' && Math.abs(deficit) <= 20)
    || (param === 'Magnesium' && Math.abs(deficit) <= 50);

  // ── Balling Method (2-Part) ──
  const ballingWarnings: string[] = [];
  if (param === 'Alkalinity' && deficit > 2) {
    ballingWarnings.push('Large Alk deficit: dose maximum 1 dKH per day. Split over multiple days.');
  }
  if (param === 'Calcium' && deficit > 40) {
    ballingWarnings.push('Large Ca deficit: raise maximum 20 ppm per day.');
  }

  methods.push({
    method: 'balling',
    methodName: 'Balling Method (2-Part)',
    methodIcon: 'science',
    methodColor: '#4cd6fb',
    recommended: true, // Always recommended for adjustments
    reason: param === 'Alkalinity'
      ? 'Concentrated, precise, and safe. Dose the Alk part (Sodium Carbonate) at NIGHT when pH naturally drops — this helps stabilize pH.'
      : param === 'Calcium'
        ? 'Calcium Chloride solution is the safest way to raise Ca. Pair with equal Alk dosing to maintain balance.'
        : 'MgCl2/MgSO4 mix raises Mg safely. Mg can be dosed more aggressively than Ca/Alk.',
    warnings: ballingWarnings,
    schedule: ctx.hasDosingPump
      ? 'Dosing pump: split daily dose into 4-6 micro-doses throughout the day'
      : param === 'Alkalinity'
        ? 'Manual: dose once daily at night (before lights out)'
        : 'Manual: dose once daily in the morning',
  });

  // ── Kalkwasser ──
  if (param === 'Alkalinity' || param === 'Calcium') {
    const kalkWarnings: string[] = [
      'Kalkwasser is for MAINTENANCE only — NOT for raising depleted levels.',
      'If dosed too fast, pH will spike above 8.6 which can be LETHAL.',
      'Must be dosed through ATO (auto top-off) as evaporation replacement.',
    ];

    if (!ctx.hasATO) {
      kalkWarnings.push('You don\'t have an ATO system — Kalkwasser requires automatic top-off for safe, slow dosing.');
    }
    if (deficit > 1.5 && param === 'Alkalinity') {
      kalkWarnings.push('Your Alk deficit is too large for Kalkwasser alone. Use 2-Part to raise, then Kalkwasser to maintain.');
    }

    methods.push({
      method: 'kalkwasser',
      methodName: 'Kalkwasser (Lime Water)',
      methodIcon: 'water_drop',
      methodColor: '#d7ffc5',
      recommended: isSmallAdjustment && ctx.hasATO,
      reason: 'Calcium hydroxide dissolved in ATO water. Raises both Ca AND Alk simultaneously while boosting pH. Ideal for daily maintenance once levels are stable.',
      warnings: kalkWarnings,
      schedule: 'Continuous: mixed into ATO reservoir, dosed automatically as water evaporates',
    });
  }

  // ── Calcium Reactor ──
  if (param === 'Alkalinity' || param === 'Calcium') {
    const reactorWarnings: string[] = [];

    if (ctx.gallons < 150) {
      reactorWarnings.push(`Your tank (${ctx.gallons}gal) is too small for a calcium reactor. Reactors are only cost-effective and safe for tanks >150 gallons with heavy SPS loads.`);
    }
    if (!ctx.hasSPS) {
      reactorWarnings.push('Without SPS corals, a calcium reactor is overkill. 2-Part dosing is more appropriate for your coral load.');
    }
    reactorWarnings.push('Calcium reactors use CO2 which LOWERS pH. Requires a pH controller to prevent pH crash.');
    reactorWarnings.push('Complex setup: CO2 tank, regulator, pH controller, media chamber, effluent tuning.');

    methods.push({
      method: 'reactor',
      methodName: 'Calcium Reactor',
      methodIcon: 'settings',
      methodColor: '#8f9097',
      recommended: ctx.gallons >= 150 && ctx.hasSPS,
      reason: 'Dissolves aragonite media with CO2 to produce calcium and alkalinity. Best for large tanks with very high coral consumption.',
      warnings: reactorWarnings,
      schedule: '24/7 operation with periodic media replacement and CO2 refills',
    });
  }

  // ── Water Change (Ionic Reset) ──
  methods.push({
    method: 'water_change',
    methodName: 'Water Change (Ionic Reset)',
    methodIcon: 'sync',
    methodColor: '#FF7F50',
    recommended: isSmallAdjustment,
    reason: `A ${isSmallAdjustment ? '10-15%' : '20%'} water change with quality salt mix naturally adjusts parameters AND performs an "Ionic Reset" — flushing accumulated NaCl byproducts from 2-Part dosing and restoring trace elements (Sr, B, I, Fe) to natural seawater proportions.`,
    warnings: isSmallAdjustment
      ? ['Even if parameters look fine, regular water changes are critical for ionic balance when using 2-Part dosing long-term.']
      : ['For large deficits, water changes alone won\'t be enough. Use in combination with 2-Part dosing.'],
    schedule: isSmallAdjustment ? 'Single water change may resolve it' : 'Weekly 10-15% water changes as supplemental support',
  });

  return methods;
}

/**
 * Calculate smart dosing recommendation with expert-level intelligence
 */
export function calculateSmartDosing(
  param: string,
  current: number,
  target: number,
  ctx: TankContext,
): SmartDosingResult {
  // Guard against NaN/null slipping through at runtime
  if (isNaN(current) || isNaN(target)) {
    current = current || 0;
    target = target || 0;
  }
  const deficit = target - current;
  const lowerParam = param.toLowerCase();

  // ── Severity ──
  let severity: SmartDosingResult['severity'];
  let severityColor: string;

  if (deficit <= 0) {
    severity = 'none';
    severityColor = '#2ff801';
  } else if (
    (lowerParam === 'alkalinity' && deficit <= 0.5) ||
    (lowerParam === 'calcium' && deficit <= 10) ||
    (lowerParam === 'magnesium' && deficit <= 30)
  ) {
    severity = 'minor';
    severityColor = '#2ff801';
  } else if (
    (lowerParam === 'alkalinity' && deficit <= 1.5) ||
    (lowerParam === 'calcium' && deficit <= 30) ||
    (lowerParam === 'magnesium' && deficit <= 80)
  ) {
    severity = 'moderate';
    severityColor = '#F1C40F';
  } else if (
    (lowerParam === 'alkalinity' && deficit <= 3) ||
    (lowerParam === 'calcium' && deficit <= 60) ||
    (lowerParam === 'magnesium' && deficit <= 150)
  ) {
    severity = 'major';
    severityColor = '#FF7F50';
  } else {
    severity = 'critical';
    severityColor = '#ff4444';
  }

  // ── Dose calculation (BRS 2-Part) ──
  let product = '';
  let brand = 'BRS 2-Part';
  let doseAmount = 0;
  let doseUnit = 'mL';
  let frequency = '';
  let splitDoses = false;
  let daysToComplete = 1;

  // Skip dose calculation when at or above target
  if (deficit <= 0) {
    frequency = 'No dosing needed — levels are at or above target.';
  } else if (lowerParam === 'alkalinity') {
    product = 'Soda Ash Solution (Sodium Carbonate)';
    // BRS 2-Part concentrated liquid: 1 mL per gallon raises ~1 dKH in 4 gallons
    doseAmount = (deficit * ctx.gallons) / 4;
    if (deficit > 1) {
      splitDoses = true;
      daysToComplete = Math.ceil(deficit); // max 1 dKH per day
      frequency = `Split over ${daysToComplete} days (max 1 dKH/day). Dose ${Math.round(doseAmount / daysToComplete)} mL per day.`;
    } else {
      frequency = 'Single dose at night (before lights out). Retest after 24 hours.';
    }
  } else if (lowerParam === 'calcium') {
    product = 'Calcium Chloride Solution';
    // BRS concentrated CaCl2 solution (standard recipe ~473g/gal): ~1 mL per gallon raises Ca by ~1 ppm in 20 gallons
    doseAmount = (deficit * ctx.gallons) / 20;
    if (deficit > 20) {
      splitDoses = true;
      daysToComplete = Math.ceil(deficit / 20); // max 20 ppm per day
      frequency = `Split over ${daysToComplete} days (max 20 ppm/day). Dose ${Math.round(doseAmount / daysToComplete)} mL per day.`;
    } else {
      frequency = 'Single dose in the morning. Retest after 24 hours.';
    }
  } else if (lowerParam === 'magnesium') {
    product = 'Magnesium Chloride/Sulfate Mix';
    brand = 'BRS Magnesium';
    doseAmount = (deficit * ctx.gallons) / 10;
    if (deficit > 50) {
      splitDoses = true;
      daysToComplete = Math.ceil(deficit / 50); // max 50 ppm per day
      frequency = `Split over ${daysToComplete} days (max 50 ppm/day). Dose ${Math.round(doseAmount / daysToComplete)} mL per day.`;
    } else {
      frequency = 'Single dose. Retest after 24 hours.';
    }
  }

  doseAmount = Math.max(0, Math.round(doseAmount * 10) / 10);

  // ── Method recommendations ──
  const allMethods = getMethodAdvice(param, deficit, ctx);
  const primaryMethod = allMethods.find(m => m.recommended) || allMethods[0];

  // ── Auto-dosing awareness ──
  const currentAutoDose = ctx.autoDosing?.find(d => d.parameter === lowerParam);
  let autoDosingNote = '';

  if (currentAutoDose && currentAutoDose.ml_per_day > 0) {
    if (deficit > 0) {
      // Already dosing but levels are STILL dropping → consumption exceeds dose
      const currentDailyMl = currentAutoDose.ml_per_day;
      // Calculate what daily dose SHOULD be to cover deficit + maintenance
      const correctionMlPerDay = doseAmount / Math.max(daysToComplete, 1);
      const suggestedTotal = Math.round(currentDailyMl + correctionMlPerDay);
      autoDosingNote = `⚡ You're auto-dosing ${currentDailyMl} mL/day of ${currentAutoDose.product} but ${param} is still low. Your corals are consuming more than the pump delivers. Increase to ~${suggestedTotal} mL/day (+${Math.round(correctionMlPerDay)} mL).`;
      // Adjust the frequency to reflect pump adjustment instead of manual dosing
      frequency = `Increase dosing pump from ${currentDailyMl} → ${suggestedTotal} mL/day (${currentAutoDose.doses_per_day} doses). Retest in 3-5 days.`;
    } else {
      // Levels are good AND auto-dosing → pump is dialed in correctly
      autoDosingNote = `✅ Auto-dosing ${currentAutoDose.ml_per_day} mL/day of ${currentAutoDose.product} — levels look good. Pump is dialed in.`;
    }
  } else if (deficit > 0 && ctx.hasDosingPump) {
    // Has a pump but NOT dosing this parameter → suggest setting it up
    autoDosingNote = `💡 You have a dosing pump but ${param} isn't configured for auto-dosing. Set up a channel with ~${Math.round(doseAmount / Math.max(daysToComplete, 1))} mL/day to maintain stable levels.`;
  }

  // ── Expert tips ──
  const tips: string[] = [];

  // Auto-dosing insight goes first — most actionable
  if (autoDosingNote) {
    tips.unshift(autoDosingNote);
  }

  if (lowerParam === 'alkalinity') {
    tips.push('Dose Alk at NIGHT — pH naturally drops after lights-out, and the alkalinity buffer counteracts this.');
    if (ctx.hasSPS) {
      tips.push('SPS corals consume Alk fastest. Test 2-3x per week and adjust dosing as colony grows.');
      tips.push('⚠️ OTS: As coral colonies grow, consumption rises EXPONENTIALLY — not linearly. A thriving tank at 2 years may need 3-4x the dose it started with. Re-evaluate dosing every 3 months.');
    }
    tips.push('Alk stability is more important than the exact number. A stable 8.0 is better than swinging between 8 and 10.');
    tips.push('📏 Calibrate your Hanna/KH checker every 4 weeks. A drifting probe will make your reactor or dosing pump deliver wrong amounts — cascading error.');
  }
  if (lowerParam === 'calcium') {
    tips.push('Always dose Ca and Alk in equal proportions to maintain ionic balance.');
    tips.push('If Ca won\'t rise despite dosing, check Magnesium first — low Mg prevents Ca from holding.');
    tips.push('⚠️ OTS: Check dosing tubes every 6-12 months — calcium chloride crystallizes inside tubing, reducing flow. Your dosing pump may be delivering LESS than you think.');
    if (currentAutoDose && deficit > 0) {
      tips.push('🔍 Verify tube flow: run a calibration test. Collect output for 1 minute and measure with a syringe. Crystallization may have reduced actual delivery by 20-40%.');
    }
  }
  if (lowerParam === 'magnesium') {
    tips.push('Fix Mg FIRST before adjusting Ca or Alk. Low Magnesium makes it impossible to maintain Ca/Alk stability.');
    tips.push('Mg is consumed much slower than Ca/Alk. Monthly testing and dosing is usually sufficient.');
    tips.push('🔬 OTS: Magnesium is the ANTI-PRECIPITATION shield. Without adequate Mg (>1280 ppm), calcium carbonate precipitates spontaneously on hot surfaces — pump rotors, heater elements, reactor media. This is "abiotic precipitation" and it drains Ca/Alk faster than your corals do.');
  }

  // ── OTS: Ionic Drift Warning (applies to all 2-Part dosing) ──
  tips.push('🧪 Ionic Drift: Every dose of 2-Part (Balling) produces NaCl as a byproduct. Over months, sodium and chloride accumulate, displacing trace elements (Sr, B, I, Fe). Water changes are NOT just for nutrient export — they are an "ionic reset" that restores natural seawater proportions.');
  if (ctx.hasDosingPump) {
    tips.push('💡 With automated dosing, it\'s easy to forget water changes. But with 2-Part, regular 10-15% weekly water changes are ESSENTIAL to flush accumulated NaCl. No water change = ionic drift → mysterious coral decline.');
  }

  // ── Cross-parameter warnings ──
  const crossWarnings: string[] = [];

  if (ctx.currentMg !== null && ctx.currentMg < 1200) {
    crossWarnings.push(`⚠️ Magnesium is low (${ctx.currentMg} ppm). Raise Mg to 1300+ ppm BEFORE adjusting ${param}. Ca and Alk cannot be maintained with low Mg. Low Mg also causes abiotic CaCO₃ precipitation on pump rotors and heater elements.`);
  }
  if (lowerParam === 'calcium' && ctx.currentAlk !== null && ctx.currentAlk < 7) {
    crossWarnings.push(`Alkalinity is critically low (${ctx.currentAlk} dKH). Address Alk first — it affects coral health more immediately than Calcium.`);
  }
  if (lowerParam === 'alkalinity' && ctx.currentCa !== null && ctx.currentCa < 380) {
    crossWarnings.push(`Calcium is also low (${ctx.currentCa} ppm). Dose both Ca and Alk proportionally to maintain balance.`);
  }
  // OTS: Mg too HIGH — possible overdosing or salt mix issue
  if (ctx.currentMg !== null && ctx.currentMg > 1500) {
    crossWarnings.push(`Mg is elevated (${ctx.currentMg} ppm). While high Mg is less dangerous than low, check your salt mix brand — some run high on Mg. A water change with a balanced salt mix will normalize it.`);
  }
  // HIGH Alk warning — dangerous for SPS (burnt tips, tissue necrosis)
  if (ctx.currentAlk !== null && ctx.currentAlk > 11) {
    crossWarnings.push(`⚠️ Alkalinity is high (${ctx.currentAlk} dKH). High Alk (>11) causes burnt tips and tissue necrosis in SPS. Reduce or pause Alk dosing and let consumption bring it down naturally. Do NOT try to lower it with water changes — rapid drops are worse.`);
  }
  // HIGH Ca warning
  if (ctx.currentCa !== null && ctx.currentCa > 500) {
    crossWarnings.push(`Calcium is elevated (${ctx.currentCa} ppm). High Ca (>500) increases risk of abiotic precipitation, especially with high Alk. Reduce Ca dosing.`);
  }

  return {
    parameter: param,
    current,
    target,
    deficit,
    unit: lowerParam === 'alkalinity' ? 'dKH' : 'ppm',
    severity,
    severityColor,
    primaryMethod,
    allMethods,
    doseAmount,
    doseUnit,
    product,
    brand,
    frequency,
    splitDoses,
    daysToComplete,
    tips,
    crossWarnings,
  };
}
