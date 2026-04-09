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

  // ── High Alkalinity > 11 dKH (dangerous for SPS) ──
  if (alk > 11) {
    alerts.push({
      id: `alk-high-${now}`,
      severity: alk > 12 ? 'warning' : 'info',
      category: 'chemistry',
      title: 'High Alkalinity',
      message: `Alkalinity at ${alk} dKH (target: 8-10). High Alk causes burnt tips and tissue necrosis in SPS corals.`,
      action: 'Reduce or pause alkalinity dosing. Let coral consumption bring it down naturally over 2-3 days. Do NOT try to crash it with water changes — rapid drops are worse than high levels.',
      icon: 'trending_up',
      color: '#FF7F50',
      param: 'alkalinity',
      value: alk,
      threshold: 11,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Low Calcium < 380 ppm ──
  const ca = latest.calcium ?? 0;
  if (ca > 0 && ca < 380) {
    alerts.push({
      id: `ca-low-${now}`,
      severity: ca < 350 ? 'warning' : 'info',
      category: 'chemistry',
      title: 'Low Calcium',
      message: `Calcium at ${ca} ppm (target: 420-450). Corals need calcium to build skeletons — growth stalls below 380 ppm.`,
      action: 'Dose BRS Calcium Chloride or equivalent. Check Magnesium first — low Mg prevents Ca from holding. Dose Ca and Alk in balance.',
      icon: 'trending_down',
      color: ca < 350 ? '#FF7F50' : '#F1C40F',
      param: 'calcium',
      value: ca,
      threshold: 380,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Low Magnesium < 1200 ppm ──
  const mg = latest.magnesium ?? 0;
  if (mg > 0 && mg < 1200) {
    alerts.push({
      id: `mg-low-${now}`,
      severity: mg < 1100 ? 'warning' : 'info',
      category: 'chemistry',
      title: 'Low Magnesium',
      message: `Magnesium at ${mg} ppm (target: 1300-1400). Low Mg causes spontaneous calcium carbonate precipitation — Ca and Alk won't hold.`,
      action: 'Dose Magnesium FIRST before adjusting Ca or Alk. BRS Magnesium is the standard. Mg can be raised more aggressively (50 ppm/day) than Ca or Alk.',
      icon: 'trending_down',
      color: mg < 1100 ? '#FF7F50' : '#F1C40F',
      param: 'magnesium',
      value: mg,
      threshold: 1200,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── High pH > 8.5 (Kalkwasser overdose risk) ──
  if (ph > 8.5) {
    alerts.push({
      id: `ph-high-${now}`,
      severity: ph > 8.6 ? 'critical' : 'warning',
      category: 'chemistry',
      title: 'High pH',
      message: `pH at ${ph} (target: 8.0-8.3). pH above 8.5 stresses livestock. Above 8.6 can be lethal.`,
      action: 'If using Kalkwasser, reduce concentration or slow ATO drip rate. Check if CO₂ scrubber is removing too much CO₂. Verify pH probe calibration.',
      icon: 'thermostat',
      color: ph > 8.6 ? '#ff4444' : '#FF7F50',
      param: 'ph',
      value: ph,
      threshold: 8.5,
      linkTo: '/dosing',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── Low Salinity < 1.022 (ATO malfunction flooding) ──
  if (salinity > 0 && salinity < 1.022) {
    alerts.push({
      id: `sal-low-${now}`,
      severity: salinity < 1.020 ? 'critical' : 'warning',
      category: 'salinity',
      title: 'Low Salinity',
      message: `Salinity at ${salinity} (target: 1.024-1.026). Low salinity can indicate ATO stuck ON, flooding the tank with fresh water.`,
      action: 'Check ATO immediately — a stuck float switch can flood your tank with RODI. If salinity dropped suddenly, raise it slowly (no more than 0.002 per hour) by adding saltwater.',
      icon: 'water_drop',
      color: salinity < 1.020 ? '#ff4444' : '#FF7F50',
      param: 'salinity',
      value: salinity,
      threshold: 1.022,
      linkTo: '/trends',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── OTS: Dinoflagellate Trap (NO₃ = 0 AND PO₄ = 0) ──
  // Both values must be explicitly tested (not null) to avoid false positives
  const no3 = latest.nitrate;
  if (no3 !== null && no3 !== undefined && no3 === 0 && latest.phosphate !== null && latest.phosphate !== undefined && latest.phosphate === 0) {
    alerts.push({
      id: `dino-trap-${now}`,
      severity: 'critical',
      category: 'chemistry',
      title: '⚠️ Dinoflagellate Trap — Ultra-Low Nutrients!',
      message: 'NO₃ = 0 AND PO₄ = 0. Your tank is TOO CLEAN. Zero nutrients kill beneficial bacteria, creating a biological vacuum that dinoflagellates exploit.',
      action: 'STOP reducing nutrients! Do NOT do large water changes. Dose KNO₃ to raise nitrate to 2-5 ppm and NaH₂PO₄ to raise phosphate to 0.03 ppm. Add live copepods (biological control). Dinoflagellates are brown snotty film that appear during lights-on and retract at night.',
      icon: 'warning',
      color: '#ff4444',
      param: 'nitrate',
      value: 0,
      threshold: 0,
      linkTo: '/pest-id',
      timestamp: now,
      dismissible: false,
    });
  }

  // ── OTS: Ionic Drift Warning (high-range NO₃ with low Alk pattern) ──
  if (alk > 0 && alk < 7.5 && salinity > 1.026) {
    const alkTrend = tests.slice(0, 5).map(t => t.alkalinity ?? 0).filter(v => v > 0);
    const isChronic = alkTrend.length >= 3 && alkTrend.every(v => v < 8);
    if (isChronic) {
      alerts.push({
        id: `ionic-drift-${now}`,
        severity: 'warning',
        category: 'chemistry',
        title: 'Possible Ionic Drift (OTS)',
        message: 'Chronically low Alk + elevated salinity may indicate NaCl accumulation from 2-Part dosing. Over months, ionic drift displaces trace elements and destabilizes the Ca/Alk/Mg triad.',
        action: 'Perform a substantial water change (20-25%) as an "Ionic Reset". This restores natural seawater mineral ratios that 2-Part dosing gradually displaces with NaCl byproducts. Resume with adjusted dosing.',
        icon: 'swap_horiz',
        color: '#FF7F50',
        linkTo: '/dosing',
        timestamp: now,
        dismissible: true,
      });
    }
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
  lastProbeCal: Date | null;
  lastTubeInspect: Date | null;
  lastHeaterCheck: Date | null;
  lastCoralAudit: Date | null;
  tankAgeMonths?: number;
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
        message: daysSincePrune >= 999
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
      message: daysSincePumpClean >= 999
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
      message: daysSinceFilter >= 999
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

  // ── OTS: Probe Calibration (monthly — 30 days) ──
  const daysSinceProbeCal = config.lastProbeCal
    ? Math.floor((now - config.lastProbeCal.getTime()) / dayMs)
    : 999;

  if (daysSinceProbeCal >= 30) {
    alerts.push({
      id: `probe-cal-${now}`,
      severity: 'reminder',
      category: 'hardware',
      title: 'Monthly Probe Calibration',
      message: daysSinceProbeCal >= 999
        ? 'Monthly reminder: calibrate your probes and testers.'
        : `Last calibrated ${daysSinceProbeCal} days ago.`,
      action: 'Calibrate pH probe with 7.0 and 10.0 buffer solutions. Clean the probe tip with soft brush. For Hanna checkers, verify with reference solution. Calibrate refractometer with 35ppt calibration fluid (NOT RO/DI water).',
      icon: 'tune',
      color: '#c5a3ff',
      linkTo: '/maintenance',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── OTS: Dosing Tube Inspection (every 180 days) ──
  const daysSinceTubeInspect = config.lastTubeInspect
    ? Math.floor((now - config.lastTubeInspect.getTime()) / dayMs)
    : 999;

  if (daysSinceTubeInspect >= 180) {
    alerts.push({
      id: `dosing-tube-${now}`,
      severity: 'reminder',
      category: 'hardware',
      title: 'Inspect Dosing Tubes',
      message: daysSinceTubeInspect >= 999
        ? 'Reminder: inspect dosing tubes for crystallization.'
        : `Last inspected ${daysSinceTubeInspect} days ago.`,
      action: 'Remove dosing tubes and inspect for white calcium deposits. Replace tubes if clogged. Soak in vinegar to dissolve buildup. Check tube connections for leaks.',
      icon: 'plumbing',
      color: '#F1C40F',
      linkTo: '/maintenance',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── OTS: Heater Controller Check (every 90 days) ──
  const daysSinceHeaterCheck = config.lastHeaterCheck
    ? Math.floor((now - config.lastHeaterCheck.getTime()) / dayMs)
    : 999;

  if (daysSinceHeaterCheck >= 90) {
    alerts.push({
      id: `heater-warn-${now}`,
      severity: 'reminder',
      category: 'hardware',
      title: 'Heater Safety Check',
      message: daysSinceHeaterCheck >= 999
        ? 'Quarterly reminder: test your heater controller.'
        : `Last checked ${daysSinceHeaterCheck} days ago.`,
      action: 'Verify your heater controller (Inkbird/Neptune) is working. Test by lowering the setpoint — the relay should click OFF. If you don\'t have a controller, this is the single most important purchase you can make.',
      icon: 'local_fire_department',
      color: '#ff4444',
      linkTo: '/gear',
      timestamp: now,
      dismissible: true,
    });
  }

  // ── OTS: Coral Pruning / Shadow Check (annual, only for tanks > 12 months old) ──
  const tankAge = config.tankAgeMonths ?? 0;
  if (tankAge >= 12) {
    const daysSinceCoralAudit = config.lastCoralAudit
      ? Math.floor((now - config.lastCoralAudit.getTime()) / dayMs)
      : 999;

    if (daysSinceCoralAudit >= 365) {
      alerts.push({
        id: `coral-prune-${now}`,
        severity: 'info',
        category: 'maintenance',
        title: 'Annual Coral Shadow Audit',
        message: daysSinceCoralAudit >= 999
          ? 'Annual reminder: check for shadow zones in your aquascape.'
          : `Last audited ${daysSinceCoralAudit} days ago.`,
        action: 'Inspect your aquascape from below with a flashlight. Frag (prune) any colony whose shadow covers other corals. Consider adding a supplemental side-mount LED bar to wrap light around the structure.',
        icon: 'content_cut',
        color: '#2ff801',
        linkTo: '/maintenance',
        timestamp: now,
        dismissible: true,
      });
    }
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
    lastProbeCal: Date | null;
    lastTubeInspect: Date | null;
    lastHeaterCheck: Date | null;
    lastCoralAudit: Date | null;
    tankAgeMonths?: number;
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
