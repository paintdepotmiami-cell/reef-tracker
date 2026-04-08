/**
 * Alert Engine (A4) — Smart Push Notification System
 *
 * Generates alerts based on water test data, trends, and maintenance schedules.
 * Integrates with: Drift Engine, Cycle Tracker, Maintenance, Sump/Refugium.
 */

import type { WaterTest } from './queries';

/* ─── Types ─── */

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'reminder';
export type AlertCategory = 'chemistry' | 'salinity' | 'maintenance' | 'hardware' | 'refugium' | 'cycle';

export interface ReefAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  action: string;
  icon: string;
  color: string;
  param?: string;
  value?: number;
  threshold?: number;
  linkTo: string | null;
  timestamp: number;
  dismissible: boolean;
}

/* ─── Severity Meta ─── */

export const SEVERITY_META: Record<AlertSeverity, { label: string; color: string; bg: string; icon: string }> = {
  critical: { label: 'CRITICAL', color: '#ff4444', bg: '#ff4444', icon: 'error' },
  warning: { label: 'WARNING', color: '#FF7F50', bg: '#FF7F50', icon: 'warning' },
  info: { label: 'INFO', color: '#F1C40F', bg: '#F1C40F', icon: 'info' },
  reminder: { label: 'REMINDER', color: '#4cd6fb', bg: '#4cd6fb', icon: 'notifications' },
};

export const CATEGORY_META: Record<AlertCategory, { label: string; icon: string; color: string }> = {
  chemistry: { label: 'Chemistry', icon: 'science', color: '#FF7F50' },
  salinity: { label: 'Salinity', icon: 'water_drop', color: '#4cd6fb' },
  maintenance: { label: 'Maintenance', icon: 'build', color: '#F1C40F' },
  hardware: { label: 'Hardware', icon: 'settings', color: '#c5a3ff' },
  refugium: { label: 'Refugium', icon: 'park', color: '#2ff801' },
  cycle: { label: 'Cycle', icon: 'cycle', color: '#4cd6fb' },
};

/* ─── Alert Generation ─── */

/**
 * Analyze water tests and generate chemistry alerts.
 * Scenario 1: Emergency chemistry (NH3, NO2, dKH)
 * Scenario 2: Salinity drift (ATO failure)
 */
export function generateChemistryAlerts(tests: WaterTest[]): ReefAlert[] {
  if (tests.length === 0) return [];

  const alerts: ReefAlert[] = [];
  const latest = tests[0];
  const now = Date.now();

  // ── Scenario 1: Ammonia > 0.2 mg/L ──
  const nh3 = latest.ammonia ?? 0;
  if (nh3 > 0.2) {
    alerts.push({
      id: `nh3-${now}`,
      severity: 'critical',
      category: 'chemistry',
      title: 'Ammonia Spike Detected',
      message: `NH₃ at ${nh3} ppm (danger threshold: 0.2). Your biological filter is failing or overloaded.`,
      action: 'Do an immediate partial water change and dose biological bacteria (Fritz TurboStart or Seachem Stability). Dose Seachem Prime to detoxify ammonia for 48 hours.',
      icon: 'science',
      color: '#ff4444',
      param: 'ammonia',
      value: nh3,
      threshold: 0.2,
      linkTo: '/bio-accelerator',
      timestamp: now,
      dismissible: false,
    });
  }

  // ── Scenario 1: Nitrite > 0.3 mg/L ──
  const no2 = latest.nitrite ?? 0;
  if (no2 > 0.3) {
    alerts.push({
      id: `no2-${now}`,
      severity: 'critical',
      category: 'chemistry',
      title: 'Toxic Nitrite Detected',
      message: `NO₂ at ${no2} ppm (danger threshold: 0.3). Nitrite is extremely toxic to fish even at low levels.`,
      action: 'Perform an immediate water change to protect your fish. Dose Seachem Prime to temporarily detoxify nitrite. Add biological bacteria to boost your filter.',
      icon: 'warning',
      color: '#ff4444',
      param: 'nitrite',
      value: no2,
      threshold: 0.3,
      linkTo: '/bio-accelerator',
      timestamp: now,
      dismissible: false,
    });
  }

  // ── Scenario 1: Alkalinity < 8 dKH (trending down) ──
  const alk = latest.alkalinity ?? 0;
  if (alk > 0 && alk < 8) {
    // Check if trending down
    const alkValues = tests.slice(0, 5).map(t => t.alkalinity ?? 0).filter(v => v > 0);
    const isTrendingDown = alkValues.length >= 2 && alkValues[0] < alkValues[1];

    alerts.push({
      id: `alk-${now}`,
      severity: isTrendingDown ? 'warning' : 'info',
      category: 'chemistry',
      title: 'Low Alkalinity',
      message: `Alkalinity at ${alk} dKH${isTrendingDown ? ' and dropping' : ''}. The buffer system is weakening — corals will stop growing below 7 dKH.`,
      action: 'Adjust your dosing schedule. Increase alkalinity supplement (BRS Soda Ash, Brightwell Alkalin8.3, or Kalkwasser). Target 8-9 dKH for mixed reef.',
      icon: 'trending_down',
      color: '#FF7F50',
      param: 'alkalinity',
      value: alk,
      threshold: 8,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Scenario 2: Salinity > 1.026 (ATO failure) ──
  const salinity = latest.salinity ?? 0;
  if (salinity > 1.026) {
    // Check trend
    const salValues = tests.slice(0, 5).map(t => t.salinity ?? 0).filter(v => v > 0);
    const isRising = salValues.length >= 2 && salValues[0] > salValues[1];

    alerts.push({
      id: `sal-${now}`,
      severity: salinity > 1.028 ? 'critical' : 'warning',
      category: 'salinity',
      title: 'Salinity Rising',
      message: `Salinity at ${salinity}${isRising ? ' and climbing' : ''} (target: 1.024-1.026). Water is evaporating faster than it is being replaced.`,
      action: 'Check your Auto Top-Off (ATO) sensor and reservoir. Add fresh RODI water (never saltwater) to bring salinity back to 1.025. If you don\'t have an ATO, top off manually today.',
      icon: 'water_drop',
      color: salinity > 1.028 ? '#ff4444' : '#FF7F50',
      param: 'salinity',
      value: salinity,
      threshold: 1.026,
      linkTo: '/trends',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Phosphate > 0.1 ──
  const po4 = latest.phosphate ?? 0;
  if (po4 > 0.1) {
    alerts.push({
      id: `po4-${now}`,
      severity: po4 > 0.3 ? 'warning' : 'info',
      category: 'chemistry',
      title: 'Elevated Phosphate',
      message: `PO₄ at ${po4} ppm (target: <0.1). High phosphate inhibits coral calcification and promotes algae growth.`,
      action: 'Reduce feeding, clean filter socks, and consider GFO or Phosphat-E. If you have a refugium, check that Chaetomorpha is actively growing.',
      icon: 'science',
      color: '#F1C40F',
      param: 'phosphate',
      value: po4,
      threshold: 0.1,
      linkTo: '/trends',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── pH < 7.8 ──
  const ph = latest.ph ?? 0;
  if (ph > 0 && ph < 7.8) {
    alerts.push({
      id: `ph-${now}`,
      severity: ph < 7.6 ? 'critical' : 'warning',
      category: 'chemistry',
      title: 'Low pH',
      message: `pH at ${ph} (target: 8.0-8.3). Low pH stresses corals and slows calcification.`,
      action: 'Improve ventilation (open a window), check alkalinity, and consider running Kalkwasser in your ATO or a refugium with reverse-cycle lighting to stabilize pH overnight.',
      icon: 'thermostat',
      color: ph < 7.6 ? '#ff4444' : '#FF7F50',
      param: 'ph',
      value: ph,
      threshold: 7.8,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  return alerts;
}

/**
 * Generate time-based maintenance reminders.
 * Scenario 3: Refugium pruning (monthly)
 * Scenario 4: Hardware cleaning (quarterly)
 */
export function generateMaintenanceAlerts(config: {
  hasRefugium: boolean;
  lastRefugiumPrune: Date | null;
  lastPumpClean: Date | null;
  lastFilterChange: Date | null;
}): ReefAlert[] {
  const alerts: ReefAlert[] = [];
  const now = Date.now();
  const dayMs = 86400000;

  // ── Scenario 3: Monthly refugium prune ──
  if (config.hasRefugium) {
    const daysSincePrune = config.lastRefugiumPrune
      ? Math.floor((now - config.lastRefugiumPrune.getTime()) / dayMs)
      : 999;

    if (daysSincePrune >= 30) {
      alerts.push({
        id: `refugium-prune-${now}`,
        severity: 'reminder',
        category: 'refugium',
        title: 'Time to Prune Macroalgae',
        message: daysSincePrune > 999
          ? 'Monthly reminder: harvest your refugium macroalgae.'
          : `Last pruned ${daysSincePrune} days ago.`,
        action: 'Remove 30-50% of the Chaetomorpha from your sump refugium. This physically exports nitrates and phosphates from your system. Don\'t remove it all — leave enough to keep growing.',
        icon: 'content_cut',
        color: '#2ff801',
        linkTo: '/sump-guide',
        timestamp: now,
        dismissible: true,
      });
    }
  }

  // ── Scenario 4: Quarterly pump/powerhead clean ──
  const daysSincePumpClean = config.lastPumpClean
    ? Math.floor((now - config.lastPumpClean.getTime()) / dayMs)
    : 999;

  if (daysSincePumpClean >= 90) {
    alerts.push({
      id: `pump-clean-${now}`,
      severity: 'reminder',
      category: 'hardware',
      title: 'Quarterly Hardware Cleaning',
      message: daysSincePumpClean > 999
        ? 'Quarterly reminder: clean your pumps and powerheads.'
        : `Last cleaned ${daysSincePumpClean} days ago.`,
      action: 'Soak your return pump and wave makers in citric acid or white vinegar for 2-4 hours to dissolve calcium deposits. This prevents burnout and maintains flow. Rinse thoroughly in RODI water before reinstalling.',
      icon: 'cleaning_services',
      color: '#c5a3ff',
      linkTo: '/maintenance',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Filter sock/pad change ──
  const daysSinceFilter = config.lastFilterChange
    ? Math.floor((now - config.lastFilterChange.getTime()) / dayMs)
    : 999;

  if (daysSinceFilter >= 5) {
    alerts.push({
      id: `filter-change-${now}`,
      severity: 'info',
      category: 'maintenance',
      title: 'Filter Sock Check',
      message: daysSinceFilter > 999
        ? 'Regular reminder: check and replace your filter socks.'
        : `Last changed ${daysSinceFilter} days ago.`,
      action: 'Dirty filter socks become nitrate factories. Replace or wash every 3-5 days for optimal water quality.',
      icon: 'filter_list',
      color: '#F1C40F',
      linkTo: '/maintenance',
      timestamp: now,
      dismissible: true,
    });
  }

  return alerts;
}

/**
 * Combine all alert sources and sort by severity.
 */
export function generateAllAlerts(
  tests: WaterTest[],
  maintenanceConfig: {
    hasRefugium: boolean;
    lastRefugiumPrune: Date | null;
    lastPumpClean: Date | null;
    lastFilterChange: Date | null;
  }
): ReefAlert[] {
  const chemAlerts = generateChemistryAlerts(tests);
  const maintAlerts = generateMaintenanceAlerts(maintenanceConfig);

  const all = [...chemAlerts, ...maintAlerts];

  // Sort: critical first, then warning, info, reminder
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, reminder: 3 };
  all.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return all;
}
