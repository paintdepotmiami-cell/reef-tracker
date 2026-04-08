/**
 * Cycle Engine — Intelligent nitrogen cycle interpreter.
 *
 * Analyzes Water Logs to detect cycling phases and provide guidance.
 * NOT a data entry module — it interprets existing water test data.
 *
 * Phases:
 *   1. Starting    — Tank is new, no meaningful data yet
 *   2. Ammonia     — NH3 detected, bacteria colony establishing
 *   3. Nitrite     — NO2 rising as nitrosomonas convert NH3
 *   4. Clearing    — Both NH3 and NO2 declining
 *   5. Complete    — NH3=0, NO2=0, NO3 present across multiple tests
 *   6. Mature      — Tank is established, no cycle concerns
 *   7. Stalled     — Cycle not progressing (same readings for too long)
 */

import type { WaterTest } from './queries';

export type CyclePhase =
  | 'starting'
  | 'ammonia'
  | 'nitrite'
  | 'clearing'
  | 'complete'
  | 'mature'
  | 'stalled'
  | null; // null = not cycling, mature tank

export interface CycleStatus {
  active: boolean;         // Should we show cycle UI?
  phase: CyclePhase;
  progress: number;        // 0-100
  title: string;
  description: string;
  advice: string;
  nextTest: string;        // When to test next
  safeToAddLife: boolean;
  icon: string;
  color: string;
}

interface CycleInput {
  tests: WaterTest[];
  tankCreatedAt: string | null;
  tankAgeInDays: number;
}

/**
 * Analyze water test history and determine cycle status.
 */
export function analyzeCycle(input: CycleInput): CycleStatus {
  const { tests, tankAgeInDays } = input;

  // Sort tests by date (newest first)
  const sorted = [...tests].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
  );

  // Get recent tests (last 30 days)
  const recent = sorted.slice(0, 15);

  // MATURITY SIGNALS — if any of these are true, the tank is NOT cycling:
  // 1. Has livestock (corals, fish, inverts already added = established tank)
  // 2. Has multiple water tests over time (user has been tracking)
  // 3. Has equipment configured
  // These override tank_age since the DB record may be newer than the actual tank.
  const hasHistory = sorted.length >= 3;
  const hasNormalReadings = recent.length > 0 && recent.some(t =>
    (t.calcium ?? 0) > 300 || (t.alkalinity ?? 0) > 5 || (t.magnesium ?? 0) > 1000
  );

  // If tank has history of normal reef parameters, it's mature
  if (hasHistory || hasNormalReadings) {
    const hasHighAmmonia = recent.slice(0, 3).some(t => (t.ammonia ?? 0) > 0.5);
    const hasHighNitrite = recent.slice(0, 3).some(t => (t.nitrite ?? 0) > 0.5);
    // Only show mini-cycle for REAL spikes (>0.5), not borderline readings
    if (hasHighAmmonia || hasHighNitrite) {
      const latestNH3 = recent[0]?.ammonia ?? 0;
      const latestNO2 = recent[0]?.nitrite ?? 0;
      return miniCycle(latestNH3, latestNO2);
    }
    return mature();
  }

  // If tank is old (>120 days), it's mature unless there's a real spike
  if (tankAgeInDays > 120) {
    const hasHighAmmonia = recent.slice(0, 3).some(t => (t.ammonia ?? 0) > 0.5);
    const hasHighNitrite = recent.slice(0, 3).some(t => (t.nitrite ?? 0) > 0.5);
    if (hasHighAmmonia || hasHighNitrite) {
      const latestNH3 = recent[0]?.ammonia ?? 0;
      const latestNO2 = recent[0]?.nitrite ?? 0;
      return miniCycle(latestNH3, latestNO2);
    }
    return mature();
  }

  // Not enough data AND no maturity signals = possibly new tank
  if (recent.length === 0) {
    if (tankAgeInDays <= 60) {
      return starting(tankAgeInDays);
    }
    return mature();
  }

  // Extract values from recent tests
  const latestNH3 = recent[0].ammonia ?? 0;
  const latestNO2 = recent[0].nitrite ?? 0;
  const latestNO3 = recent[0].nitrate ?? 0;

  // Check trends across multiple tests
  const nh3Values = recent.map(t => t.ammonia ?? 0);
  const no2Values = recent.map(t => t.nitrite ?? 0);
  const no3Values = recent.map(t => t.nitrate ?? 0);

  const peakNH3 = Math.max(...nh3Values);
  const peakNO2 = Math.max(...no2Values);

  // Count consecutive zero readings
  let consecutiveCleanTests = 0;
  for (const t of recent) {
    if ((t.ammonia ?? 0) <= 0.05 && (t.nitrite ?? 0) <= 0.05) {
      consecutiveCleanTests++;
    } else {
      break;
    }
  }

  // ---- PHASE DETECTION ----

  // COMPLETE: NH3=0, NO2=0 for 3+ consecutive tests, NO3 present
  if (consecutiveCleanTests >= 3 && latestNO3 > 0) {
    return complete();
  }

  // COMPLETE (softer): NH3=0, NO2=0 for 2 tests AND tank > 30 days
  if (consecutiveCleanTests >= 2 && latestNO3 > 0 && tankAgeInDays > 30) {
    return complete();
  }

  // If tank is mature (>120 days) but has a spike, it's a mini-cycle, not initial
  if (tankAgeInDays > 120) {
    if (latestNH3 > 0.1 || latestNO2 > 0.1) {
      return miniCycle(latestNH3, latestNO2);
    }
    return mature();
  }

  // CLEARING: Both NH3 and NO2 are declining (compare last 2-3 tests)
  if (recent.length >= 3) {
    const nh3Declining = nh3Values[0] < nh3Values[1] && nh3Values[1] <= nh3Values[2];
    const no2Declining = no2Values[0] < no2Values[1];
    if (nh3Declining && no2Declining && (latestNH3 > 0 || latestNO2 > 0)) {
      const progress = 70 + (consecutiveCleanTests * 10);
      return clearing(Math.min(progress, 90));
    }
  }

  // NITRITE PHASE: NH3 dropping/low, NO2 elevated
  if (latestNO2 > 0.1 && latestNH3 <= 0.5) {
    const progress = 40 + Math.min(20, (peakNO2 / 2) * 10);
    return nitritePhase(latestNO2, Math.min(progress, 60));
  }

  // AMMONIA PHASE: NH3 elevated
  if (latestNH3 > 0.1) {
    const progress = 10 + Math.min(25, (peakNH3 / 4) * 10);
    return ammoniaPhase(latestNH3, Math.min(progress, 35));
  }

  // STALLED: Same readings for many tests, not progressing
  if (recent.length >= 4 && tankAgeInDays > 14) {
    const allSame = recent.slice(0, 4).every(t =>
      Math.abs((t.ammonia ?? 0) - latestNH3) < 0.1 &&
      Math.abs((t.nitrite ?? 0) - latestNO2) < 0.1
    );
    if (allSame && (latestNH3 > 0 || latestNO2 > 0)) {
      return stalled();
    }
  }

  // STARTING: New tank, low/no readings yet
  if (tankAgeInDays <= 60 && recent.length < 3) {
    return starting(tankAgeInDays);
  }

  // Default: mature/no cycle concerns
  return mature();
}

// --- Phase builders ---

function starting(tankAge: number): CycleStatus {
  return {
    active: true,
    phase: 'starting',
    progress: 5,
    title: 'Cycle Starting',
    description: `Tank is ${tankAge} days old. The nitrogen cycle hasn't begun producing measurable readings yet.`,
    advice: 'Add an ammonia source (fish food, pure ammonia, or live rock) to kickstart bacterial colonies. Test every 2-3 days.',
    nextTest: 'Test in 2-3 days',
    safeToAddLife: false,
    icon: 'hourglass_top',
    color: '#4cd6fb',
  };
}

function ammoniaPhase(nh3: number, progress: number): CycleStatus {
  return {
    active: true,
    phase: 'ammonia',
    progress,
    title: 'Phase 1: Ammonia',
    description: `NH\u2083 at ${nh3} ppm. Nitrosomonas bacteria are establishing to convert ammonia to nitrite.`,
    advice: 'Do NOT add any livestock. Keep ammonia source active. Nitrite should appear within 1-2 weeks. Test every 2-3 days.',
    nextTest: 'Test in 2 days',
    safeToAddLife: false,
    icon: 'science',
    color: '#FF7F50',
  };
}

function nitritePhase(no2: number, progress: number): CycleStatus {
  return {
    active: true,
    phase: 'nitrite',
    progress,
    title: 'Phase 2: Nitrite',
    description: `NO\u2082 at ${no2} ppm. Nitrobacter bacteria are converting nitrite to nitrate. This is the longest phase.`,
    advice: 'Still no livestock. Nitrite can stay elevated for 2-4 weeks. You should see nitrate (NO\u2083) appearing. Test every 2-3 days.',
    nextTest: 'Test in 2-3 days',
    safeToAddLife: false,
    icon: 'biotech',
    color: '#F1C40F',
  };
}

function clearing(progress: number): CycleStatus {
  return {
    active: true,
    phase: 'clearing',
    progress,
    title: 'Phase 3: Clearing',
    description: 'Both ammonia and nitrite are declining. The bacterial colonies are maturing.',
    advice: 'Almost there! Keep testing every 2 days. When NH\u2083 and NO\u2082 hit zero for 2-3 consecutive tests, the cycle is complete.',
    nextTest: 'Test in 2 days',
    safeToAddLife: false,
    icon: 'trending_down',
    color: '#2ff801',
  };
}

function complete(): CycleStatus {
  return {
    active: true,
    phase: 'complete',
    progress: 100,
    title: 'Cycle Complete!',
    description: 'NH\u2083 = 0, NO\u2082 = 0 across multiple tests. Your biological filter is established.',
    advice: 'Safe to add your first cleanup crew (snails, hermits). Add livestock SLOWLY \u2014 1-2 specimens per week. Do a 25% water change to reduce nitrate before adding life.',
    nextTest: 'Continue weekly testing',
    safeToAddLife: true,
    icon: 'check_circle',
    color: '#2ff801',
  };
}

function stalled(): CycleStatus {
  return {
    active: true,
    phase: 'stalled',
    progress: 30,
    title: 'Cycle Stalled',
    description: 'Readings haven\'t changed in several tests. The cycle may need intervention.',
    advice: 'Check: Is temperature 76-82\u00b0F? Is there an ammonia source? Try adding bottled bacteria (Dr. Tim\'s, Fritz Turbo Start). Ensure good oxygenation.',
    nextTest: 'Test in 2 days after intervention',
    safeToAddLife: false,
    icon: 'pause_circle',
    color: '#ff6b6b',
  };
}

function miniCycle(nh3: number, no2: number): CycleStatus {
  return {
    active: true,
    phase: 'ammonia',
    progress: 50,
    title: 'Mini-Cycle Detected',
    description: `Ammonia (${nh3}) or nitrite (${no2}) detected in a mature tank. This can happen after adding livestock, medication, or equipment changes.`,
    advice: 'Reduce feeding, do a 20% water change, add bottled bacteria. Monitor daily until readings return to zero. Hold off on adding new livestock.',
    nextTest: 'Test daily until clear',
    safeToAddLife: false,
    icon: 'warning',
    color: '#FF7F50',
  };
}

function mature(): CycleStatus {
  return {
    active: false,
    phase: 'mature',
    progress: 100,
    title: 'Tank Mature',
    description: 'No cycling concerns detected.',
    advice: '',
    nextTest: '',
    safeToAddLife: true,
    icon: 'verified',
    color: '#2ff801',
  };
}
