/**
 * ReefOS Trend Analysis Engine
 *
 * Analyzes water test history to detect trends, predict future values,
 * and generate actionable advice. This is the core intelligence that
 * transforms ReefOS from a data tracker into a reef copilot.
 */

import type { WaterTest, ActionItem } from './queries';

export interface ParamTrend {
  param: string;
  label: string;
  unit: string;
  current: number;
  previous: number | null;
  slope: number; // change per week
  direction: 'rising' | 'falling' | 'stable';
  daysOfData: number;
  testsAnalyzed: number;
  projectedValue7d: number | null; // projected value in 7 days
  projectedDaysToLeaveRange: number | null; // days until out of safe range (null = safe)
  safeRange: [number, number];
  status: 'ok' | 'warning' | 'critical';
}

export interface TrendReport {
  trends: ParamTrend[];
  actionItems: ActionItem[];
  testFrequencyDays: number | null; // avg days between tests
  testFrequencyAdvice: string | null;
}

// Safe ranges for reef parameters
const PARAM_CONFIG: Record<string, { label: string; unit: string; safe: [number, number]; critical: [number, number]; icon: string }> = {
  alkalinity: { label: 'Alkalinity', unit: 'dKH', safe: [7, 11], critical: [6, 13], icon: 'science' },
  calcium:    { label: 'Calcium', unit: 'ppm', safe: [380, 450], critical: [350, 480], icon: 'lab_profile' },
  magnesium:  { label: 'Magnesium', unit: 'ppm', safe: [1250, 1400], critical: [1150, 1500], icon: 'lab_profile' },
  ph:         { label: 'pH', unit: '', safe: [8.0, 8.4], critical: [7.6, 8.6], icon: 'water_ph' },
  phosphate:  { label: 'Phosphate', unit: 'ppm', safe: [0, 0.1], critical: [0, 0.25], icon: 'priority_high' },
  nitrate:    { label: 'Nitrate', unit: 'ppm', safe: [2, 15], critical: [0, 30], icon: 'eco' },
  ammonia:    { label: 'Ammonia', unit: 'ppm', safe: [0, 0], critical: [0, 0.25], icon: 'dangerous' },
  nitrite:    { label: 'Nitrite', unit: 'ppm', safe: [0, 0], critical: [0, 0.1], icon: 'dangerous' },
  salinity:   { label: 'Salinity', unit: 'ppt', safe: [34, 36], critical: [32, 38], icon: 'water_drop' },
  temperature:{ label: 'Temp', unit: 'F', safe: [76, 80], critical: [74, 82], icon: 'thermostat' },
};

/**
 * Simple linear regression: returns slope (change per day)
 */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

/**
 * Calculate days until a projected value leaves the safe range.
 * Returns null if the trend keeps it safe for 60+ days.
 */
function daysToLeaveRange(current: number, slopePerDay: number, range: [number, number]): number | null {
  if (slopePerDay === 0) return null;

  if (slopePerDay > 0) {
    // Rising — when will it exceed upper bound?
    if (current >= range[1]) return 0;
    const days = (range[1] - current) / slopePerDay;
    return days <= 60 ? Math.round(days) : null;
  } else {
    // Falling — when will it go below lower bound?
    if (current <= range[0]) return 0;
    const days = (range[0] - current) / slopePerDay; // negative / negative = positive
    return days <= 60 ? Math.round(days) : null;
  }
}

export function analyzeTrends(tests: WaterTest[]): TrendReport {
  if (tests.length === 0) {
    return {
      trends: [],
      actionItems: [{
        id: 'no-tests',
        type: 'maintenance',
        priority: 'critical',
        icon: 'science',
        title: 'No water tests recorded',
        description: 'Log your first water test to get personalized trend analysis and predictions.',
        action: 'Log parameters',
      }],
      testFrequencyDays: null,
      testFrequencyAdvice: null,
    };
  }

  // Sort by date ascending for regression
  const sorted = [...tests].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
  const latest = sorted[sorted.length - 1];
  const firstDate = new Date(sorted[0].test_date).getTime();
  const lastDate = new Date(latest.test_date).getTime();
  const totalDays = (lastDate - firstDate) / 86400000;

  // Calculate test frequency
  let testFrequencyDays: number | null = null;
  let testFrequencyAdvice: string | null = null;
  if (sorted.length >= 2) {
    testFrequencyDays = Math.round(totalDays / (sorted.length - 1));
    if (testFrequencyDays > 14) {
      testFrequencyAdvice = `You're testing every ~${testFrequencyDays} days. Weekly testing is recommended for a reef tank — it helps catch problems before they become emergencies.`;
    } else if (testFrequencyDays <= 7) {
      testFrequencyAdvice = `Great testing cadence (~every ${testFrequencyDays} days). This gives ReefOS the best data for trend predictions.`;
    }
  }

  const trends: ParamTrend[] = [];
  const actionItems: ActionItem[] = [];

  // Analyze each parameter
  for (const [key, config] of Object.entries(PARAM_CONFIG)) {
    const values = sorted
      .map(t => ({
        date: new Date(t.test_date).getTime(),
        value: t[key as keyof WaterTest] as number | null,
      }))
      .filter(v => v.value != null && !isNaN(Number(v.value)));

    if (values.length === 0) continue;

    const current = Number(values[values.length - 1].value);
    const previous = values.length >= 2 ? Number(values[values.length - 2].value) : null;

    // Linear regression (x = days from first test)
    const points = values.map(v => ({
      x: (v.date - firstDate) / 86400000,
      y: Number(v.value),
    }));

    const { slope: slopePerDay } = linearRegression(points);
    const slopePerWeek = slopePerDay * 7;

    // Determine direction (threshold: ignore very small changes)
    const changeThreshold = (config.safe[1] - config.safe[0]) * 0.02; // 2% of range
    const direction: ParamTrend['direction'] =
      Math.abs(slopePerWeek) < changeThreshold ? 'stable' :
      slopePerWeek > 0 ? 'rising' : 'falling';

    // Projection
    const projectedValue7d = values.length >= 2 ? current + slopePerDay * 7 : null;
    const projectedDays = values.length >= 2
      ? daysToLeaveRange(current, slopePerDay, config.safe)
      : null;

    // Status
    let status: ParamTrend['status'] = 'ok';
    if (current < config.critical[0] || current > config.critical[1]) {
      status = 'critical';
    } else if (current < config.safe[0] || current > config.safe[1]) {
      status = 'warning';
    } else if (projectedDays !== null && projectedDays <= 14) {
      status = 'warning'; // Will leave safe range within 2 weeks
    }

    trends.push({
      param: key,
      label: config.label,
      unit: config.unit,
      current,
      previous,
      slope: slopePerWeek,
      direction,
      daysOfData: Math.round(totalDays),
      testsAnalyzed: values.length,
      projectedValue7d,
      projectedDaysToLeaveRange: projectedDays,
      safeRange: config.safe,
      status,
    });

    // Generate action items for concerning trends
    if (values.length >= 2 && direction !== 'stable') {
      const absSlope = Math.abs(slopePerWeek);
      const slopeStr = `${slopePerWeek > 0 ? '+' : ''}${slopePerWeek.toFixed(2)}`;

      if (projectedDays !== null && projectedDays <= 14) {
        actionItems.push({
          id: `trend-${key}-leaving`,
          type: 'param_alert',
          priority: projectedDays <= 7 ? 'critical' : 'warning',
          icon: config.icon,
          title: `${config.label} ${direction}: ${current} ${config.unit}`,
          description: getTrendAdvice(key, current, direction, projectedDays, slopePerWeek),
          action: getTrendAction(key, direction),
        });
      } else if (status === 'critical') {
        actionItems.push({
          id: `trend-${key}-critical`,
          type: 'param_alert',
          priority: 'critical',
          icon: config.icon,
          title: `${config.label} critical: ${current} ${config.unit}`,
          description: getCriticalAdvice(key, current, direction),
          action: getTrendAction(key, direction),
        });
      }
    }
  }

  // Prompt for more data if only 1 test
  if (tests.length === 1) {
    actionItems.push({
      id: 'need-more-tests',
      type: 'maintenance',
      priority: 'info',
      icon: 'trending_up',
      title: 'Log more tests to unlock predictions',
      description: 'ReefOS needs at least 2 water tests to analyze trends and predict problems before they happen. Test weekly for best results.',
      action: 'Log parameters',
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  actionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return { trends, actionItems, testFrequencyDays, testFrequencyAdvice };
}

function getTrendAdvice(param: string, current: number, direction: string, daysToLeave: number, slopePerWeek: number): string {
  const rateStr = `${direction === 'rising' ? '+' : ''}${slopePerWeek.toFixed(2)}`;
  const timeStr = daysToLeave <= 7 ? `${daysToLeave} days` : `~${Math.round(daysToLeave / 7)} weeks`;

  const advice: Record<string, string> = {
    alkalinity: direction === 'falling'
      ? `Alk dropping ${rateStr}/week. At this rate, it will be below 7 dKH in ${timeStr}. Increase Balance (Seachem) dosing or check Kalkwasser ATO reservoir. Rapid alk drops can cause coral tissue necrosis (RTN).`
      : `Alk rising ${rateStr}/week. Will exceed 11 dKH in ${timeStr}. Reduce Balance (Seachem) dosing. High alk + high calcium = precipitation risk.`,
    calcium: direction === 'falling'
      ? `Calcium dropping ${rateStr}/week. Corals are consuming it faster than you're dosing. Increase Calcium (Brightwell) or Kalkwasser concentration. SPS corals are heavy calcium consumers.`
      : `Calcium rising ${rateStr}/week. Will exceed 450 ppm in ${timeStr}. Reduce Calcium (Brightwell) dosing. High calcium can precipitate if alkalinity is also high.`,
    magnesium: direction === 'rising'
      ? `Magnesium rising ${rateStr}/week. Will exceed 1400 ppm in ${timeStr}. Pause Magnesium (Brightwell) dosing. Water changes will bring it down. Mg above 1500 can inhibit coral calcification.`
      : `Magnesium dropping ${rateStr}/week. Increase Magnesium (Brightwell). Low Mg makes it hard to maintain calcium and alkalinity stability.`,
    ph: direction === 'falling'
      ? `pH trending down ${rateStr}/week. Below 8.0 stresses corals. Check Kalkwasser in ATO, ensure room ventilation (CO2 buildup drops pH), and verify CO2 scrubber on skimmer.`
      : `pH trending up. Above 8.4 can stress fish and coral. Reduce Kalkwasser concentration. Check if CO2 reactor is still running.`,
    phosphate: direction === 'rising'
      ? `Phosphate rising ${rateStr}/week. High PO4 fuels algae and inhibits coral calcification. Replace RowaPhos media (check when last changed). Increase Phosphat-E (Fauna Marin) temporarily. Reduce feeding if heavy.`
      : `Phosphate dropping to very low levels. Some PO4 (0.01-0.03) is needed for coral health. If it hits 0, corals can bleach. Reduce RowaPhos or Phosphat-E.`,
    nitrate: direction === 'rising'
      ? `Nitrate rising ${rateStr}/week. Above 15 ppm fuels algae. Increase water changes, check carbon reactor, reduce feeding. Consider adding chaetomorpha to refugium.`
      : `Nitrate dropping toward 0. Corals need 5-10 ppm NO3 for growth and color. Feed more Reef-Roids, reduce carbon media, or dim chaeto light to slow nutrient export.`,
    ammonia: `Ammonia detected and ${direction}. This is always an emergency in a reef tank. Check for dead fish, uneaten food, or dying coral. Verify skimmer is running and producing dark skimmate. Do an immediate 10% water change.`,
    nitrite: `Nitrite detected and ${direction}. This indicates a biological filtration problem. Do an immediate water change. Check if any media was changed recently or if there was a power outage that killed bacteria.`,
  };

  return advice[param] || `${PARAM_CONFIG[param]?.label || param} is ${direction} at ${rateStr}/week. Will leave safe range in ${timeStr}.`;
}

function getCriticalAdvice(param: string, current: number, direction: string): string {
  const advice: Record<string, string> = {
    ammonia: `Ammonia at ${current} ppm is toxic to all tank inhabitants. Immediate action: 20% water change NOW, check for dead animals, verify skimmer and filtration are running. Do not feed for 24 hours.`,
    nitrite: `Nitrite at ${current} ppm indicates a cycle crash. Immediate 20% water change. Add Seachem Prime to detoxify. Do not add any new livestock. Check biological media.`,
    ph: current < 7.8
      ? `pH at ${current} is dangerously low. Check ATO — is Kalkwasser mixed? Ensure room ventilation. A pH crash below 7.6 can kill coral tissue rapidly. Consider emergency pH buffer.`
      : `pH at ${current} is dangerously high. Reduce Kalkwasser immediately. Check CO2 injection. High pH causes alkalinity to precipitate.`,
    phosphate: `Phosphate at ${current} ppm is very high. Replace RowaPhos immediately. Consider running GFO in a reactor. Do a 15% water change. Cut back on feeding.`,
  };

  return advice[param] || `${PARAM_CONFIG[param]?.label || param} at ${current} is outside critical range. Take corrective action.`;
}

function getTrendAction(param: string, direction: string): string {
  const actions: Record<string, Record<string, string>> = {
    alkalinity: { falling: 'Increase Alk dosing', rising: 'Reduce Alk dosing' },
    calcium: { falling: 'Increase Ca dosing', rising: 'Reduce Ca dosing' },
    magnesium: { falling: 'Increase Mg dosing', rising: 'Pause Mg dosing' },
    ph: { falling: 'Check Kalkwasser', rising: 'Reduce Kalkwasser' },
    phosphate: { falling: 'Reduce GFO', rising: 'Replace RowaPhos' },
    nitrate: { falling: 'Increase feeding', rising: 'More water changes' },
    ammonia: { falling: 'Monitor closely', rising: 'Emergency water change', stable: 'Inspect tank' },
    nitrite: { falling: 'Monitor closely', rising: 'Emergency water change', stable: 'Check filtration' },
  };

  return actions[param]?.[direction] || 'Review parameters';
}

export { PARAM_CONFIG };
