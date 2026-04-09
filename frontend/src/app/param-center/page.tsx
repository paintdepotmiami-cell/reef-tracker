'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getLatestTest } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { assessAllParameters, type ParamAssessment, type ActionItem } from '@/lib/param-manager';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Action type meta ─── */
const ACTION_TYPE_META = {
  mechanical: { label: 'Equipment', icon: 'build', color: '#FF7F50' },
  biological: { label: 'Biological', icon: 'biotech', color: '#2ff801' },
  chemical: { label: 'Chemical / Product', icon: 'science', color: '#4cd6fb' },
  routine: { label: 'Routine', icon: 'checklist', color: '#F1C40F' },
};

const STATUS_ORDER = { emergency: 0, critical_high: 1, critical_low: 2, high: 3, low: 4, optimal: 5 };

export default function ParamCenterPage() {
  const { user } = useAuth();
  const [test, setTest] = useState<WaterTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedParam, setExpandedParam] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'issues'>('issues');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const cached = getCached<WaterTest>('latest-test');
    if (cached) { setTest(cached); setLoading(false); }

    getLatestTest().then(data => {
      if (data) setCache('latest-test', data);
      setTest(data);
      setLoading(false);
    });
  }, [user]);

  const assessments = useMemo(() => assessAllParameters(test), [test]);

  // Sort: problems first
  const sorted = useMemo(() => {
    const list = [...assessments];
    list.sort((a, b) => (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5));
    if (filterMode === 'issues') {
      return list.filter(a => a.status !== 'optimal' && a.current !== null);
    }
    return list;
  }, [assessments, filterMode]);

  const issueCount = assessments.filter(a => a.status !== 'optimal' && a.current !== null).length;
  const optimalCount = assessments.filter(a => a.status === 'optimal' && a.current !== null).length;
  const noDataCount = assessments.filter(a => a.current === null).length;

  // Test age
  const testAge = test
    ? Math.floor((Date.now() - new Date(test.test_date).getTime()) / 86400000)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50] animate-pulse">monitoring</span>
          <p className="text-[#c5c6cd] text-sm">Analyzing parameters…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">360° Analysis</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Params</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Action plans for every parameter</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <Link href="/logs" className="bg-[#0d1c32] p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl text-[#FF7F50]">science</span>
          <span className="text-[9px] text-[#c5c6cd] font-bold uppercase tracking-wider">Log Test</span>
        </Link>
        <Link href="/trends" className="bg-[#0d1c32] p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl text-[#4cd6fb]">monitoring</span>
          <span className="text-[9px] text-[#c5c6cd] font-bold uppercase tracking-wider">Trends</span>
        </Link>
        <Link href="/dosing-config" className="bg-[#0d1c32] p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl text-[#2ff801]">precision_manufacturing</span>
          <span className="text-[9px] text-[#c5c6cd] font-bold uppercase tracking-wider">My Pump</span>
        </Link>
        <Link href="/alerts" className="bg-[#0d1c32] p-3 rounded-xl flex flex-col items-center gap-1.5 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl text-[#F1C40F]">notifications</span>
          <span className="text-[9px] text-[#c5c6cd] font-bold uppercase tracking-wider">Alerts</span>
        </Link>
      </div>

      {/* Test Banner */}
      {test ? (
        <div className={`rounded-2xl p-3 flex items-center gap-3 ${testAge != null && testAge > 7 ? 'bg-[#F1C40F]/8 border border-[#F1C40F]/15' : 'bg-[#2ff801]/5 border border-[#2ff801]/15'}`}>
          <span className="material-symbols-outlined text-sm" style={{ color: testAge != null && testAge > 7 ? '#F1C40F' : '#2ff801' }}>
            {testAge != null && testAge > 7 ? 'schedule' : 'check_circle'}
          </span>
          <p className="text-[#c5c6cd] text-xs flex-1">
            Test from {new Date(test.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {testAge != null && testAge > 7 ? ` (${testAge}d ago — retest soon)` : ''}
          </p>
          <Link href="/logs" className="text-[#FF7F50] text-[10px] font-bold">New Test</Link>
        </div>
      ) : (
        <div className="bg-[#F1C40F]/10 border border-[#F1C40F]/20 rounded-2xl p-4 text-center">
          <span className="material-symbols-outlined text-[#F1C40F] text-2xl block mb-1">science</span>
          <p className="text-white text-sm font-medium">No water test data</p>
          <p className="text-[#c5c6cd]/50 text-xs mt-0.5 mb-2">Log a test to get personalized action plans</p>
          <Link href="/logs" className="bg-[#FF7F50] text-white text-xs font-bold px-4 py-2 rounded-xl inline-block">Log Water Test</Link>
        </div>
      )}

      {/* Stats Row */}
      {test && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0d1c32] rounded-2xl p-3 text-center">
            <p className="text-xl font-bold" style={{ color: issueCount > 0 ? '#ff4444' : '#2ff801' }}>{issueCount}</p>
            <p className="text-[11px] text-[#c5c6cd]/50 uppercase font-medium">Issues</p>
          </div>
          <div className="bg-[#0d1c32] rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-[#2ff801]">{optimalCount}</p>
            <p className="text-[11px] text-[#c5c6cd]/50 uppercase font-medium">Optimal</p>
          </div>
          <div className="bg-[#0d1c32] rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-[#8f9097]">{noDataCount}</p>
            <p className="text-[11px] text-[#c5c6cd]/50 uppercase font-medium">No Data</p>
          </div>
        </div>
      )}

      {/* Filter Toggle */}
      {test && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode('issues')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterMode === 'issues' ? 'bg-[#ff4444]/15 text-[#ff4444]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >🚨 Issues ({issueCount})</button>

          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterMode === 'all' ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >📊 All Parameters</button>
        </div>
      )}

      {/* All Clear */}
      {test && issueCount === 0 && filterMode === 'issues' && (
        <div className="bg-[#0d1c32] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[#2ff801] mb-2 block">check_circle</span>
          <p className="text-white font-medium text-lg">All Parameters Optimal!</p>
          <p className="text-[#c5c6cd]/50 text-xs mt-1">No action needed right now. Keep up the good work.</p>
          <button onClick={() => setFilterMode('all')} className="mt-3 text-[#4cd6fb] text-xs font-bold">View all parameters →</button>
        </div>
      )}

      {/* Parameter Cards */}
      {sorted.map(param => {
        const isExpanded = expandedParam === param.key;
        const hasIssues = param.status !== 'optimal' && param.current !== null;

        return (
          <div key={param.key}>
            <button
              onClick={() => setExpandedParam(isExpanded ? null : param.key)}
              className={`w-full rounded-2xl p-4 text-left active:scale-[0.98] transition-transform border ${
                param.status === 'emergency' ? 'bg-[#ff4444]/10 border-[#ff4444]/25' :
                hasIssues ? 'bg-[#0d1c32] border-[#1c2a41]/50' : 'bg-[#0d1c32] border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${param.color}15` }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: param.color }}>{param.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-base font-medium">{param.label}</p>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${param.statusColor}15`, color: param.statusColor }}>
                      {param.statusLabel}
                    </span>
                  </div>
                  <p className="text-[#c5c6cd]/50 text-xs mt-0.5">Target: {param.target}</p>
                </div>
                <div className="text-right shrink-0">
                  {param.current !== null ? (
                    <p className="text-xl font-[family-name:var(--font-headline)] font-bold" style={{ color: param.statusColor }}>
                      {param.current}
                    </p>
                  ) : (
                    <p className="text-sm text-[#8f9097]">—</p>
                  )}
                  <p className="text-[11px] text-[#c5c6cd]/30">{param.unit}</p>
                </div>
              </div>

              {/* Urgency indicator for emergencies */}
              {param.status === 'emergency' && (
                <div className="mt-2 flex items-center gap-2 bg-[#ff4444]/10 rounded-lg px-3 py-1.5">
                  <span className="material-symbols-outlined text-[#ff4444] text-sm animate-pulse">emergency</span>
                  <p className="text-[#ff4444] text-[10px] font-bold uppercase">Immediate action required</p>
                </div>
              )}
            </button>

            {/* Expanded: Full Action Plan */}
            {isExpanded && (
              <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-2 mr-1 space-y-4">
                {/* Summary */}
                <p className="text-[#c5c6cd] text-sm leading-relaxed">{param.summary}</p>

                {/* Value Bar */}
                {param.current !== null && (
                  <div className="bg-[#041329] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#c5c6cd]/50">Current</span>
                      <span className="text-xs text-[#c5c6cd]/50">Target: {param.target}</span>
                    </div>
                    <div className="h-2 bg-[#1c2a41] rounded-full overflow-hidden relative">
                      {/* Target zone */}
                      <div
                        className="absolute h-full bg-[#2ff801]/20 rounded-full"
                        style={{
                          left: `${getBarPosition(param.targetMin, param)}%`,
                          width: `${getBarPosition(param.targetMax, param) - getBarPosition(param.targetMin, param)}%`,
                        }}
                      />
                      {/* Current value marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                        style={{
                          left: `${Math.min(97, Math.max(3, getBarPosition(param.current, param)))}%`,
                          backgroundColor: param.statusColor,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Plan */}
                {param.actions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#FF7F50] uppercase tracking-widest">360° Action Plan</p>
                    {param.actions.map((action, i) => (
                      <ActionCard key={i} action={action} index={i} />
                    ))}
                  </div>
                )}

                {/* No actions needed */}
                {param.actions.length === 0 && param.current !== null && (
                  <div className="flex items-center gap-2 py-2">
                    <span className="material-symbols-outlined text-[#2ff801] text-sm">check_circle</span>
                    <p className="text-[#2ff801] text-xs font-medium">No action needed — this parameter is in range.</p>
                  </div>
                )}

                {/* Science */}
                {param.science && (
                  <div className="bg-[#041329] rounded-xl p-3">
                    <p className="text-xs font-bold text-[#4cd6fb] uppercase tracking-wider mb-1">Science</p>
                    <p className="text-[#c5c6cd] text-xs leading-relaxed">{param.science}</p>
                  </div>
                )}

                {/* Quick Links */}
                <div className="flex gap-2">
                  <Link href="/trends" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#041329] text-[#4cd6fb]">
                    <span className="material-symbols-outlined text-sm">monitoring</span>
                    Trends
                  </Link>
                  <Link href="/dosing" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#041329] text-[#2ff801]">
                    <span className="material-symbols-outlined text-sm">science</span>
                    Dosing
                  </Link>
                  <Link href="/alerts" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#041329] text-[#FF7F50]">
                    <span className="material-symbols-outlined text-sm">notifications</span>
                    Alerts
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="bg-[#041329] rounded-2xl p-4 space-y-2.5">
        <p className="text-xs font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Action Types</p>
        {Object.entries(ACTION_TYPE_META).map(([, meta]) => (
          <div key={meta.label} className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base" style={{ color: meta.color }}>{meta.icon}</span>
            <p className="text-[#c5c6cd] text-xs"><span className="font-bold" style={{ color: meta.color }}>{meta.label}</span> — {
              meta.label === 'Equipment' ? 'Physical/mechanical actions and equipment adjustments' :
              meta.label === 'Biological' ? 'Living solutions: bacteria, macroalgae, refugium' :
              meta.label === 'Chemical / Product' ? 'Supplements, additives, and commercial products' :
              'Water changes, feeding, testing routines'
            }</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ActionCard({ action, index }: { action: ActionItem; index: number }) {
  const meta = ACTION_TYPE_META[action.type];

  return (
    <div className={`rounded-xl p-3.5 space-y-2.5 ${action.urgent ? 'bg-[#ff4444]/5 border border-[#ff4444]/15' : 'bg-[#041329]'}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${action.color}15` }}>
          <span className="material-symbols-outlined text-base" style={{ color: action.color }}>{action.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
              {meta.label}
            </span>
            {action.urgent && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#ff4444]/15 text-[#ff4444]">
                Urgent
              </span>
            )}
          </div>
          <p className="text-white text-sm font-medium">{action.title}</p>
          <p className="text-[#c5c6cd]/60 text-xs leading-relaxed mt-0.5">{action.description}</p>
        </div>
      </div>

      {/* Product Recommendation → Add to Wishlist */}
      {action.product && (
        <Link
          href={`/wishlist?add=${encodeURIComponent(action.product.brand + ' ' + action.product.name)}`}
          className="ml-11 bg-[#0d1c32] rounded-lg p-3 flex items-center gap-3 border border-[#1c2a41]/50 active:scale-[0.98] transition-transform block"
        >
          <div className="w-9 h-9 rounded-lg bg-[#4cd6fb]/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#4cd6fb] text-base">science</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium">{action.product.brand} {action.product.name}</p>
            <p className="text-[#c5c6cd]/40 text-[11px]">{action.product.why}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg bg-[#4cd6fb]/15 text-[#4cd6fb] text-xs font-bold">
            <span className="material-symbols-outlined text-sm">add</span>
            Wishlist
          </div>
        </Link>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function getBarPosition(value: number, param: ParamAssessment): number {
  // Map value to 0-100% based on param range
  const ranges: Record<string, [number, number]> = {
    ammonia: [0, 1],
    nitrite: [0, 1],
    phosphate: [0, 0.5],
    nitrate: [0, 50],
    alkalinity: [5, 13],
    calcium: [300, 520],
    magnesium: [1000, 1600],
    salinity: [1.018, 1.032],
    ph: [7.4, 8.8],
    temperature: [68, 88],
  };
  const [min, max] = ranges[param.key] || [0, 100];
  return ((value - min) / (max - min)) * 100;
}
