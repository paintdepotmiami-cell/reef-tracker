'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllTests, getEquipment } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import {
  generateAllAlerts,
  SEVERITY_META,
  CATEGORY_META,
  type ReefAlert,
  type AlertSeverity,
  type AlertCategory,
} from '@/lib/alert-engine';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

export default function AlertsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<WaterTest[]>([]);
  const [hasRefugium, setHasRefugium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const cached = getCached<WaterTest[]>('water-tests');
    if (cached) { setTests(cached); setLoading(false); }

    getAllTests().then((data: WaterTest[]) => {
      setCache('water-tests', data);
      setTests(data);
      setLoading(false);
    });
    // Check user's actual equipment for refugium/sump
    getEquipment().then(eq => {
      const hasFuge = eq.some(e =>
        e.category === 'sump' || e.name?.toLowerCase().includes('refugium') || e.name?.toLowerCase().includes('fuge')
      );
      setHasRefugium(hasFuge);
    }).catch(() => {});
  }, [user]);

  // Generate alerts
  const alerts = useMemo(() => {
    const sorted = [...tests].sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
    );
    return generateAllAlerts(sorted, {
      hasRefugium,              // Read from user's actual equipment
      lastRefugiumPrune: null,  // No data yet — will trigger reminder
      lastPumpClean: null,
      lastFilterChange: null,
      lastProbeCal: null,
      lastTubeInspect: null,
      lastHeaterCheck: null,
      lastCoralAudit: null,
    });
  }, [tests, hasRefugium]);

  // Filtered alerts
  const filtered = useMemo(() => {
    let list = alerts.filter(a => !dismissed.has(a.id));
    if (filterSeverity !== 'all') {
      list = list.filter(a => a.severity === filterSeverity);
    }
    return list;
  }, [alerts, dismissed, filterSeverity]);

  // Counts by severity
  const counts = useMemo(() => {
    const active = alerts.filter(a => !dismissed.has(a.id));
    return {
      critical: active.filter(a => a.severity === 'critical').length,
      warning: active.filter(a => a.severity === 'warning').length,
      info: active.filter(a => a.severity === 'info').length,
      reminder: active.filter(a => a.severity === 'reminder').length,
      total: active.length,
    };
  }, [alerts, dismissed]);

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50] animate-pulse">notifications</span>
          <p className="text-[#c5c6cd] text-sm">Analyzing your reef…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/param-center" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Params
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7F50]/15 flex items-center justify-center relative">
            <span className="material-symbols-outlined text-[#FF7F50] text-2xl">notifications</span>
            {counts.critical > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4444] rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{counts.critical}</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Smart Alerts</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Notifications</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">{counts.total} active alert{counts.total !== 1 ? 's' : ''} based on your data</p>
      </div>

      {/* Severity Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <FilterPill
          label={`All (${counts.total})`}
          active={filterSeverity === 'all'}
          color="#FF7F50"
          onClick={() => setFilterSeverity('all')}
        />
        {counts.critical > 0 && (
          <FilterPill
            label={`Critical (${counts.critical})`}
            active={filterSeverity === 'critical'}
            color="#ff4444"
            onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}
          />
        )}
        {counts.warning > 0 && (
          <FilterPill
            label={`Warning (${counts.warning})`}
            active={filterSeverity === 'warning'}
            color="#FF7F50"
            onClick={() => setFilterSeverity(filterSeverity === 'warning' ? 'all' : 'warning')}
          />
        )}
        {counts.info > 0 && (
          <FilterPill
            label={`Info (${counts.info})`}
            active={filterSeverity === 'info'}
            color="#F1C40F"
            onClick={() => setFilterSeverity(filterSeverity === 'info' ? 'all' : 'info')}
          />
        )}
        {counts.reminder > 0 && (
          <FilterPill
            label={`Reminders (${counts.reminder})`}
            active={filterSeverity === 'reminder'}
            color="#4cd6fb"
            onClick={() => setFilterSeverity(filterSeverity === 'reminder' ? 'all' : 'reminder')}
          />
        )}
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1c32] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[#2ff801] mb-2 block">check_circle</span>
          <p className="text-white font-medium text-lg">All Clear!</p>
          <p className="text-[#c5c6cd]/50 text-xs mt-1">
            {counts.total === 0
              ? 'No alerts detected — your reef looks healthy.'
              : 'All alerts dismissed. Nice work!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const sev = SEVERITY_META[alert.severity];
            const cat = CATEGORY_META[alert.category];
            const isExpanded = expandedAlert === alert.id;

            return (
              <div key={alert.id}>
                <button
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                  className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform border"
                  style={{
                    backgroundColor: alert.severity === 'critical' ? `${sev.color}10` : '#0d1c32',
                    borderColor: alert.severity === 'critical' ? `${sev.color}25` : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${alert.color}15` }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: alert.color }}>{alert.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${sev.bg}15`, color: sev.color }}>
                          {sev.label}
                        </span>
                        <span className="text-[8px] text-[#c5c6cd]/30 uppercase">{cat.label}</span>
                      </div>
                      <p className="text-white text-sm font-medium">{alert.title}</p>
                      <p className="text-[#c5c6cd]/60 text-[11px] mt-0.5 line-clamp-2">{alert.message}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm mt-1">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  </div>

                  {/* Value indicator */}
                  {alert.value !== undefined && alert.threshold !== undefined && (
                    <div className="mt-2 ml-[52px] flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: alert.color }}>{alert.value}</span>
                      <div className="flex-1 h-1.5 bg-[#041329] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (alert.value / (alert.threshold * 2)) * 100)}%`,
                            backgroundColor: alert.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-[#c5c6cd]/40">threshold: {alert.threshold}</span>
                    </div>
                  )}
                </button>

                {/* Expanded Action */}
                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-3 mr-1 space-y-3">
                    {/* Action */}
                    <div className="bg-[#041329] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-wider mb-1">What To Do</p>
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">{alert.action}</p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      {alert.linkTo && (
                        <Link
                          href={alert.linkTo}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold"
                          style={{ backgroundColor: `${alert.color}15`, color: alert.color }}
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Go to tool
                        </Link>
                      )}
                      {alert.dismissible && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-[#041329] text-[#c5c6cd]/50"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* How Alerts Work */}
      <div className="bg-[#041329] rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">How Alerts Work</p>
        <AlertInfo icon="science" color="#ff4444" text="Chemistry alerts trigger when NH₃ > 0.2, NO₂ > 0.3, Alk < 8, PO₄ > 0.1, or pH < 7.8" />
        <AlertInfo icon="water_drop" color="#4cd6fb" text="Salinity alerts trigger when specific gravity rises above 1.026 (ATO may be failing)" />
        <AlertInfo icon="park" color="#2ff801" text="Refugium pruning reminder every 30 days if you have macroalgae" />
        <AlertInfo icon="settings" color="#c5a3ff" text="Pump & powerhead cleaning reminder every 90 days (citric acid soak)" />
        <AlertInfo icon="filter_list" color="#F1C40F" text="Filter sock replacement reminder every 5 days" />
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function FilterPill({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
      style={{
        backgroundColor: active ? `${color}15` : '#0d1c32',
        color: active ? color : '#c5c6cd50',
      }}
    >
      {label}
    </button>
  );
}

function AlertInfo({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="material-symbols-outlined text-sm mt-0.5" style={{ color }}>{icon}</span>
      <p className="text-[#c5c6cd] text-[11px] leading-relaxed">{text}</p>
    </div>
  );
}
