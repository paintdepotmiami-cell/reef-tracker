'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllTests } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

/* ─── Safe Zones (from Antigravity expert rules) ─── */
interface ParamConfig {
  key: keyof WaterTest;
  label: string;
  unit: string;
  icon: string;
  color: string;
  safeMin: number;
  safeMax: number;
  dangerLow: number | null;
  dangerHigh: number | null;
  decimals: number;
  description: string;
}

const PARAMS: ParamConfig[] = [
  {
    key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', icon: 'science',
    color: '#4cd6fb', safeMin: 8, safeMax: 12, dangerLow: 6, dangerHigh: 14,
    decimals: 1, description: 'Primary parameter for coral growth. Must be STABLE — swings >0.5 dKH/day stress SPS.',
  },
  {
    key: 'calcium', label: 'Calcium', unit: 'ppm', icon: 'diamond',
    color: '#2ff801', safeMin: 380, safeMax: 450, dangerLow: 340, dangerHigh: 500,
    decimals: 0, description: 'Corals and coralline algae consume calcium to build skeletons. Dose if consumption drops below 380.',
  },
  {
    key: 'magnesium', label: 'Magnesium', unit: 'ppm', icon: 'water_drop',
    color: '#FF7F50', safeMin: 1200, safeMax: 1400, dangerLow: 1100, dangerHigh: 1500,
    decimals: 0, description: 'Stabilizes Alk and Ca levels. If Mg is low, Alk/Ca won\'t hold. Often overlooked but critical.',
  },
  {
    key: 'nitrate', label: 'Nitrate', unit: 'ppm', icon: 'eco',
    color: '#F1C40F', safeMin: 1, safeMax: 10, dangerLow: null, dangerHigh: 20,
    decimals: 1, description: 'Coral food source at low levels. Too high = algae blooms. Too low = coral starvation (ULNS).',
  },
  {
    key: 'phosphate', label: 'Phosphate', unit: 'ppm', icon: 'blur_on',
    color: '#d7ffc5', safeMin: 0.01, safeMax: 0.03, dangerLow: null, dangerHigh: 0.1,
    decimals: 3, description: 'Must stay in balance with nitrate (Redfield ratio). High PO4 = brown corals and algae.',
  },
  {
    key: 'salinity', label: 'Salinity', unit: 'SG', icon: 'opacity',
    color: '#ffb59c', safeMin: 1.024, safeMax: 1.026, dangerLow: 1.020, dangerHigh: 1.028,
    decimals: 3, description: 'Must be rock stable. ATO system prevents evaporation-related swings. Target 35 ppt / 1.025 SG.',
  },
  {
    key: 'ph', label: 'pH', unit: '', icon: 'equalizer',
    color: '#c5a3ff', safeMin: 7.8, safeMax: 8.4, dangerLow: 7.5, dangerHigh: 8.6,
    decimals: 2, description: 'Natural range 7.8-8.4. Low pH usually means poor ventilation or high CO2. Refugium with reverse light helps.',
  },
  {
    key: 'temperature', label: 'Temperature', unit: '°F', icon: 'thermostat',
    color: '#ff6b6b', safeMin: 76, safeMax: 80, dangerLow: 74, dangerHigh: 84,
    decimals: 1, description: 'Marine life is extremely sensitive to temperature. Heater + chiller (or fan) keeps it stable.',
  },
];

/* ─── Trend Analysis ─── */
type TrendDirection = 'rising' | 'falling' | 'stable' | 'insufficient';

function analyzeTrend(values: (number | null)[]): { direction: TrendDirection; rate: number } {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 3) return { direction: 'insufficient', rate: 0 };

  const recent = valid.slice(0, 5); // most recent 5 readings
  let upCount = 0;
  let downCount = 0;
  for (let i = 0; i < recent.length - 1; i++) {
    if (recent[i] > recent[i + 1]) upCount++;
    else if (recent[i] < recent[i + 1]) downCount++;
  }

  const rate = recent.length >= 2 ? recent[0] - recent[recent.length - 1] : 0;

  if (upCount >= Math.ceil((recent.length - 1) * 0.6)) return { direction: 'rising', rate };
  if (downCount >= Math.ceil((recent.length - 1) * 0.6)) return { direction: 'falling', rate };
  return { direction: 'stable', rate };
}

function getTrendIcon(dir: TrendDirection) {
  switch (dir) {
    case 'rising': return 'trending_up';
    case 'falling': return 'trending_down';
    case 'stable': return 'trending_flat';
    default: return 'remove';
  }
}

function getParamStatus(value: number | null, cfg: ParamConfig): 'safe' | 'warning' | 'danger' | 'unknown' {
  if (value === null) return 'unknown';
  if (cfg.dangerLow !== null && value < cfg.dangerLow) return 'danger';
  if (cfg.dangerHigh !== null && value > cfg.dangerHigh) return 'danger';
  if (value < cfg.safeMin || value > cfg.safeMax) return 'warning';
  return 'safe';
}

const STATUS_COLORS = {
  safe: '#2ff801',
  warning: '#F1C40F',
  danger: '#ff4444',
  unknown: '#8f9097',
};

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label, cfg }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; cfg: ParamConfig }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1c32] border border-[#1c2a41] rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[#c5c6cd] text-[10px]">{label}</p>
      <p className="text-white font-bold text-sm">
        {payload[0].value?.toFixed(cfg.decimals)} {cfg.unit}
      </p>
    </div>
  );
}

export default function TrendsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<WaterTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParam, setSelectedParam] = useState<string>('alkalinity');

  useEffect(() => {
    if (!user) return;

    const cached = getCached<WaterTest[]>('all-tests');
    if (cached) {
      setTests(cached);
      setLoading(false);
    }

    async function load() {
      const data = await getAllTests();
      setCache('all-tests', data);
      setTests(data);
      setLoading(false);
    }
    load();
  }, [user]);

  const cfg = PARAMS.find(p => p.key === selectedParam)!;

  // Chart data — chronological order (oldest first for chart)
  const chartData = useMemo(() => {
    return [...tests]
      .reverse()
      .map(t => ({
        date: new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: t[cfg.key] as number | null,
      }))
      .filter(d => d.value !== null);
  }, [tests, cfg.key]);

  // Latest value and trend for each param
  const paramSummaries = useMemo(() => {
    return PARAMS.map(p => {
      const values = tests.map(t => t[p.key] as number | null);
      const latest = values.find(v => v !== null) ?? null;
      const trend = analyzeTrend(values);
      const status = getParamStatus(latest, p);
      return { ...p, latest, trend, status };
    });
  }, [tests]);

  const currentSummary = paramSummaries.find(p => p.key === selectedParam)!;

  // Alerts: params in danger or warning
  const alerts = paramSummaries.filter(p => p.status === 'danger' || p.status === 'warning');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#4cd6fb] animate-pulse">monitoring</span>
          <p className="text-[#c5c6cd] text-sm">Loading trends…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Analytics</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Trend Graphs</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">{tests.length} water tests recorded</p>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#ff4444] text-lg">notification_important</span>
            <p className="text-[#ff9999] text-xs font-bold uppercase tracking-wider">Attention Needed</p>
          </div>
          {alerts.map(a => (
            <div key={a.key as string} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[a.status] }} />
              <p className="text-[#c5c6cd] text-sm">
                <span className="text-white font-medium">{a.label}</span>: {a.latest?.toFixed(a.decimals)} {a.unit}
                {a.status === 'danger' ? ' — outside safe range!' : ' — approaching limit'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Parameter Selector (horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {paramSummaries.map(p => (
          <button
            key={p.key as string}
            onClick={() => setSelectedParam(p.key as string)}
            className={`shrink-0 px-3 py-2 rounded-xl transition-all flex flex-col items-center min-w-[72px] ${
              selectedParam === p.key
                ? 'bg-[#FF7F50]/15 ring-1 ring-[#FF7F50]/30'
                : 'bg-[#0d1c32]'
            }`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
              <span className="material-symbols-outlined text-xs" style={{ color: p.color }}>{p.icon}</span>
            </div>
            <p className={`text-[10px] font-bold ${selectedParam === p.key ? 'text-white' : 'text-[#c5c6cd]/60'}`}>
              {p.label.slice(0, 5)}
            </p>
            <p className={`text-[10px] ${selectedParam === p.key ? 'text-[#c5c6cd]' : 'text-[#c5c6cd]/40'}`}>
              {p.latest !== null ? p.latest.toFixed(p.decimals) : '—'}
            </p>
          </button>
        ))}
      </div>

      {/* Current Parameter Card */}
      <div className="bg-[#0d1c32] rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${cfg.color}, transparent)` }} />

        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: cfg.color }}>{cfg.icon}</span>
            <p className="text-white font-[family-name:var(--font-headline)] font-bold">{cfg.label}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm" style={{ color: STATUS_COLORS[currentSummary.status] }}>
              {getTrendIcon(currentSummary.trend.direction)}
            </span>
            <span className="text-[10px] uppercase font-bold" style={{ color: STATUS_COLORS[currentSummary.status] }}>
              {currentSummary.trend.direction}
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <p className="text-3xl font-[family-name:var(--font-headline)] font-bold" style={{ color: STATUS_COLORS[currentSummary.status] }}>
            {currentSummary.latest !== null ? currentSummary.latest.toFixed(cfg.decimals) : '—'}
          </p>
          <p className="text-[#c5c6cd]/60 text-sm mb-1">{cfg.unit}</p>
        </div>

        <p className="text-[#c5c6cd] text-xs mb-1">
          Safe range: {cfg.safeMin}–{cfg.safeMax} {cfg.unit}
        </p>

        {/* Safe range bar */}
        <div className="w-full h-1.5 bg-[#1c2a41] rounded-full relative mb-4 mt-2">
          {/* Calculate bar positions based on full range */}
          {(() => {
            const fullMin = cfg.dangerLow ?? cfg.safeMin * 0.8;
            const fullMax = cfg.dangerHigh ?? cfg.safeMax * 1.2;
            const range = fullMax - fullMin;
            const safeStart = ((cfg.safeMin - fullMin) / range) * 100;
            const safeWidth = ((cfg.safeMax - cfg.safeMin) / range) * 100;
            const currentPos = currentSummary.latest !== null
              ? Math.max(0, Math.min(100, ((currentSummary.latest - fullMin) / range) * 100))
              : null;

            return (
              <>
                <div
                  className="absolute h-full rounded-full bg-[#2ff801]/30"
                  style={{ left: `${safeStart}%`, width: `${safeWidth}%` }}
                />
                {currentPos !== null && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                    style={{
                      left: `${currentPos}%`,
                      backgroundColor: STATUS_COLORS[currentSummary.status],
                      transform: `translateX(-50%) translateY(-50%)`,
                    }}
                  />
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="bg-[#0d1c32] rounded-3xl p-4 pt-6">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cfg.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={cfg.color} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1c2a41" vertical={false} />

              {/* Safe zone background */}
              <ReferenceArea
                y1={cfg.safeMin}
                y2={cfg.safeMax}
                fill="#2ff801"
                fillOpacity={0.05}
                strokeOpacity={0}
              />

              {/* Danger zone lines */}
              <ReferenceLine y={cfg.safeMin} stroke="#2ff801" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={cfg.safeMax} stroke="#2ff801" strokeDasharray="4 4" strokeOpacity={0.4} />
              {cfg.dangerHigh && (
                <ReferenceLine y={cfg.dangerHigh} stroke="#ff4444" strokeDasharray="4 4" strokeOpacity={0.6} />
              )}
              {cfg.dangerLow && (
                <ReferenceLine y={cfg.dangerLow} stroke="#ff4444" strokeDasharray="4 4" strokeOpacity={0.6} />
              )}

              <XAxis
                dataKey="date"
                tick={{ fill: '#8f9097', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8f9097', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<ChartTooltip cfg={cfg} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={cfg.color}
                strokeWidth={2}
                fill={`url(#grad-${cfg.key})`}
                dot={{ r: 3, fill: cfg.color, stroke: '#0d1c32', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: cfg.color, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-[#2ff801] opacity-40" style={{ borderTop: '1px dashed' }} />
              <span className="text-[10px] text-[#c5c6cd]/50">Safe zone</span>
            </div>
            {cfg.dangerHigh && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-[#ff4444] opacity-60" style={{ borderTop: '1px dashed' }} />
                <span className="text-[10px] text-[#c5c6cd]/50">Danger limit</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#0d1c32] rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[#c5c6cd]/30 mb-3 block">show_chart</span>
          <p className="text-[#c5c6cd] text-sm mb-1">Not enough data for charts</p>
          <p className="text-[#c5c6cd]/50 text-xs">Log at least 2 water tests to see trends</p>
          <Link href="/logs" className="mt-4 inline-flex items-center gap-1 text-[#FF7F50] text-xs font-medium">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Log Water Test
          </Link>
        </div>
      )}

      {/* Parameter Description */}
      <div className="bg-[#0d1c32] rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-[#F1C40F] text-lg mt-0.5">info</span>
          <div>
            <p className="text-white text-sm font-medium mb-1">About {cfg.label}</p>
            <p className="text-[#c5c6cd] text-xs leading-relaxed">{cfg.description}</p>
          </div>
        </div>
      </div>

      {/* All Parameters Summary Grid */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">All Parameters</p>
        <div className="grid grid-cols-2 gap-2">
          {paramSummaries.map(p => (
            <button
              key={p.key as string}
              onClick={() => setSelectedParam(p.key as string)}
              className={`bg-[#0d1c32] rounded-2xl p-3 text-left transition-all active:scale-[0.97] ${
                selectedParam === p.key ? 'ring-1 ring-[#FF7F50]/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="material-symbols-outlined text-sm" style={{ color: p.color }}>{p.icon}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[p.status] }} />
                  <span className="material-symbols-outlined text-xs" style={{ color: STATUS_COLORS[p.status] }}>
                    {getTrendIcon(p.trend.direction)}
                  </span>
                </div>
              </div>
              <p className="text-white font-bold text-sm">
                {p.latest !== null ? p.latest.toFixed(p.decimals) : '—'}
                <span className="text-[#c5c6cd]/50 text-[10px] ml-1">{p.unit}</span>
              </p>
              <p className="text-[#c5c6cd]/50 text-[10px] mt-0.5">{p.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Log Button */}
      <Link
        href="/logs"
        className="flex items-center justify-center gap-2 bg-[#FF7F50]/15 text-[#FF7F50] py-3 rounded-2xl font-medium text-sm active:scale-[0.98] transition-transform"
      >
        <span className="material-symbols-outlined text-lg">add_circle</span>
        Log New Water Test
      </Link>
    </div>
  );
}
