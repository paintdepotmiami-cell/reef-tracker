/**
 * ReefOS Flow Optimizer
 * Analyzes coral placement + flow needs to recommend optimal pump positions.
 *
 * Tank model: rectangular, viewed from front
 * Zones: Sand bed (bottom 3"), Lower (3-6"), Middle (6-11"), Upper (11-16")
 * Pumps: Left wall (Nero 3), Right wall (Nero 3), Back wall (return, FIXED)
 */

import type { Animal, Equipment } from './queries';

export interface PumpRecommendation {
  name: string;
  brand: string;
  movable: boolean;
  // Position as percentage of tank (0=bottom, 100=top for Y; 0=left, 100=right for X)
  currentSide: 'left' | 'right' | 'back';
  recommendedY: number; // % from bottom
  recommendedMode: string;
  recommendedIntensity: string; // percentage range
  angle: string; // direction description
  reasoning: string;
}

export interface ZoneAnalysis {
  zone: string;
  yRange: [number, number]; // % from bottom
  corals: { name: string; flowNeed: string; subtype: string }[];
  dominantFlow: string;
  flowScore: number; // 1-5 scale
  status: 'optimal' | 'needs-more' | 'too-much' | 'empty';
  note: string;
}

export interface FlowReport {
  tankName: string;
  tankGallons: number;
  totalCorals: number;
  pumps: PumpRecommendation[];
  zones: ZoneAnalysis[];
  warnings: string[];
  tips: string[];
  overallScore: number; // 1-100
}

const FLOW_VALUES: Record<string, number> = {
  'Low': 1,
  'Low-Medium': 2,
  'Medium': 3,
  'Medium-High': 4,
  'High': 5,
};

const ZONE_MAP: Record<string, string> = {
  'Sand bed': 'sand',
  'Lower': 'lower',
  'Middle': 'middle',
  'Upper': 'upper',
  'Top': 'upper',
  'Any': 'any',
  'Isolated rock': 'middle',
};

const ZONE_Y: Record<string, [number, number]> = {
  sand:   [0, 18],
  lower:  [18, 40],
  middle: [40, 70],
  upper:  [70, 100],
};

export function generateFlowReport(
  animals: Animal[],
  equipment: Equipment[],
  tankName: string,
  tankGallons: number,
): FlowReport {
  const corals = animals.filter(a => a.type === 'coral');
  const pumps = equipment.filter(e => e.category === 'circulation');

  // Classify corals into zones
  const zoneCorals: Record<string, typeof corals> = {
    sand: [], lower: [], middle: [], upper: [],
  };

  for (const c of corals) {
    const zone = ZONE_MAP[c.placement_zone || 'Any'] || 'middle';
    if (zone === 'any') {
      // "Any" placement — distribute based on flow need
      const flow = FLOW_VALUES[c.flow_need || 'Medium'] || 3;
      if (flow <= 2) zoneCorals.lower.push(c);
      else if (flow <= 3) zoneCorals.middle.push(c);
      else zoneCorals.upper.push(c);
    } else {
      zoneCorals[zone].push(c);
    }
  }

  // Analyze each zone
  const zones: ZoneAnalysis[] = Object.entries(ZONE_Y).map(([key, yRange]) => {
    const zCorals = zoneCorals[key] || [];
    const flowNeeds = zCorals.map(c => FLOW_VALUES[c.flow_need || 'Medium'] || 3);
    const avgFlow = flowNeeds.length > 0 ? flowNeeds.reduce((a, b) => a + b, 0) / flowNeeds.length : 0;

    const zoneName = key === 'sand' ? 'Sand Bed' : key.charAt(0).toUpperCase() + key.slice(1);

    let status: ZoneAnalysis['status'] = 'optimal';
    let note = '';

    if (zCorals.length === 0) {
      status = 'empty';
      note = 'No corals in this zone.';
    } else if (avgFlow <= 1.5) {
      status = 'optimal';
      note = `${zCorals.length} coral${zCorals.length > 1 ? 's' : ''} prefer gentle flow. Avoid direct pump output here.`;
    } else if (avgFlow <= 3) {
      status = 'optimal';
      note = `${zCorals.length} coral${zCorals.length > 1 ? 's' : ''} with moderate flow needs. Good target for indirect Nero 3 output.`;
    } else {
      status = 'needs-more';
      note = `${zCorals.length} coral${zCorals.length > 1 ? 's' : ''} need strong flow. Point Nero 3 output toward this zone.`;
    }

    return {
      zone: zoneName,
      yRange,
      corals: zCorals.map(c => ({
        name: c.name,
        flowNeed: c.flow_need || 'Medium',
        subtype: c.subtype || c.type,
      })),
      dominantFlow: avgFlow <= 1.5 ? 'Low' : avgFlow <= 2.5 ? 'Low-Medium' : avgFlow <= 3.5 ? 'Medium' : 'High',
      flowScore: Math.round(avgFlow * 10) / 10,
      status,
      note,
    };
  });

  // Generate pump recommendations
  const pumpRecs: PumpRecommendation[] = [];

  // Find which pumps are which
  const leftNero = pumps.find(p => p.name.toLowerCase().includes('izquierda') || p.name.toLowerCase().includes('left'));
  const rightNero = pumps.find(p => p.name.toLowerCase().includes('derecha') || p.name.toLowerCase().includes('right'));
  const returnPump = pumps.find(p => p.notes?.toLowerCase().includes('return') || p.name.toLowerCase().includes('return') || p.name.toLowerCase().includes('jebao'));

  // Analyze coral distribution for pump placement
  const middleCorals = zoneCorals.middle;
  const hasEuphyllia = middleCorals.some(c =>
    c.name.includes('Torch') || c.name.includes('Hammer') || c.name.includes('Euphyllia')
  );
  const hasGorgonia = middleCorals.some(c => c.name.includes('Gorgonia') || c.name.includes('Sea Fan'));
  const hasBTA = corals.some(c => c.name.includes('Bubble Tip') || c.name.includes('BTA'));
  const sandCorals = zoneCorals.sand;
  const lowerCorals = zoneCorals.lower;

  // LEFT NERO 3 — optimize for middle zone Euphyllia + upper flow
  if (leftNero) {
    let recY = 55; // middle of tank default
    let mode = 'Else Random';
    let intensity = '40-70%';
    let angle = 'Angled slightly upward toward center-right';
    let reasoning = '';

    if (hasEuphyllia) {
      recY = 50;
      mode = 'Else Random';
      intensity = '35-60%';
      angle = 'Angled slightly upward, aimed past Euphyllia (not directly at them)';
      reasoning = 'Euphyllia (Torch + Hammer) in the middle zone need gentle, oscillating flow. Position at mid-height to create indirect turbulence. Else Random mode varies intensity to simulate natural reef currents. Avoid direct blast on Euphyllia — causes tissue retraction.';
    } else {
      reasoning = 'Position mid-height to cover the middle and upper zones where most medium-flow corals live.';
    }

    if (sandCorals.length > 0) {
      reasoning += ` Sand bed has ${sandCorals.length} coral${sandCorals.length > 1 ? 's' : ''} (${sandCorals.map(c => c.name.split(':')[0].split('(')[0].trim()).join(', ')}) that need LOW flow — keep pump output above them.`;
      recY = Math.max(recY, 50);
    }

    pumpRecs.push({
      name: leftNero.name,
      brand: leftNero.brand || 'AI',
      movable: true,
      currentSide: 'left',
      recommendedY: recY,
      recommendedMode: mode,
      recommendedIntensity: intensity,
      angle,
      reasoning,
    });
  }

  // RIGHT NERO 3 — complement the left, focus on different zone
  if (rightNero) {
    let recY = 60;
    let mode = 'Else Random';
    let intensity = '40-70%';
    let angle = 'Angled slightly downward toward center-left';
    let reasoning = '';

    if (hasGorgonia) {
      recY = 60;
      mode = 'Constant + Pulse';
      intensity = '50-75%';
      angle = 'Aimed toward Gorgonia / Sea Fan area';
      reasoning = 'Gorgonia needs Medium-High flow to extend polyps and filter-feed. Position the right Nero 3 higher to create strong cross-current. Alternate between constant and pulse to simulate tidal flow.';
    } else if (hasEuphyllia) {
      recY = 65;
      mode = 'Else Random';
      intensity = '30-55%';
      angle = 'Angled upward, creating surface agitation';
      reasoning = 'With Euphyllia present, stagger the right pump higher than the left. This creates cross-flow above the Euphyllia while the left pump handles mid-level indirect flow. Surface agitation improves gas exchange and pH.';
    } else {
      reasoning = 'Position slightly higher than the left pump to create varied flow patterns across different zones.';
    }

    if (lowerCorals.length > 0) {
      reasoning += ` Lower zone has ${lowerCorals.length} coral${lowerCorals.length > 1 ? 's' : ''} (Mushrooms, Rock Flowers) — gentle indirect flow reaches them from above.`;
    }

    pumpRecs.push({
      name: rightNero.name,
      brand: rightNero.brand || 'AI',
      movable: true,
      currentSide: 'right',
      recommendedY: recY,
      recommendedMode: mode,
      recommendedIntensity: intensity,
      angle,
      reasoning,
    });
  }

  // RETURN PUMP — fixed, just describe its contribution
  if (returnPump) {
    pumpRecs.push({
      name: returnPump.name,
      brand: returnPump.brand || 'Jebao',
      movable: false,
      currentSide: 'back',
      recommendedY: 75,
      recommendedMode: 'Constant',
      recommendedIntensity: '60-80%',
      angle: 'Fixed — returns water from sump',
      reasoning: 'Return pump is fixed in the sump. It provides baseline flow from back to front. Contributes gentle circulation to upper zones. Do not modify placement.',
    });
  }

  // Warnings
  const warnings: string[] = [];

  if (hasEuphyllia) {
    const euphCount = corals.filter(c => c.name.includes('Torch') || c.name.includes('Hammer')).length;
    warnings.push(`${euphCount} Euphyllia colonies have 4-6" sweeper tentacles. Pumps should create indirect turbulence, not direct laminar flow at them.`);
  }

  if (hasBTA) {
    warnings.push('Bubble Tip Anemone can walk into pump intakes. Ensure Nero 3 intake guards are installed. If BTA moves toward a pump, reduce that pump\'s intensity temporarily.');
  }

  if (sandCorals.length > 0) {
    warnings.push(`Sand bed corals (${sandCorals.map(c => c.name.split(':')[0].split('(')[0].trim()).join(', ')}) can be buried by too much flow. Keep strong currents above 6" from substrate.`);
  }

  const xenia = corals.find(c => c.name.includes('Xenia'));
  if (xenia) {
    warnings.push('Xenia Pulsing needs consistent medium flow to maintain pulsing rhythm. Dead spots will cause it to stop pulsing.');
  }

  // Tips
  const tips: string[] = [
    'Run both Nero 3 pumps on Else Random mode for the most natural flow pattern.',
    'Stagger the left and right pump heights by 2-3" to avoid creating a single laminar stream.',
    'Alternate which pump runs stronger — e.g., left at 60% and right at 40%, then swap weekly.',
  ];

  if (tankGallons <= 50) {
    tips.push(`For a ${tankGallons}-gallon tank, target total turnover of ${tankGallons * 20}-${tankGallons * 30}x per hour. Two Nero 3s provide more than enough — run them at moderate intensity.`);
  }

  if (hasGorgonia) {
    tips.push('Gorgonias are filter feeders — they need constant flow to catch food particles. Position one pump to create direct but moderate current past the Sea Fan.');
  }

  // Overall score
  const zoneScores = zones.filter(z => z.corals.length > 0);
  const optimalCount = zoneScores.filter(z => z.status === 'optimal').length;
  const overallScore = zoneScores.length > 0
    ? Math.round((optimalCount / zoneScores.length) * 85 + 15) // 15-100 range
    : 50;

  return {
    tankName,
    tankGallons,
    totalCorals: corals.length,
    pumps: pumpRecs,
    zones,
    warnings,
    tips,
    overallScore,
  };
}
