'use client';

import { ResponsiveContainer, AreaChart, Area, ReferenceLine, YAxis } from 'recharts';

interface Props {
  data: { date: string; value: number | null }[];
  color: string;
  min: number;
  max: number;
  unit: string;
  label: string;
}

export default function ParamSparkline({ data, color, min, max, unit, label }: Props) {
  const valid = data.filter(d => d.value != null) as { date: string; value: number }[];
  if (valid.length === 0) return null;

  const latest = valid[0];
  const prev = valid.length > 1 ? valid[1] : null;
  const inRange = latest.value >= min && latest.value <= max;
  const trend = prev ? latest.value - prev.value : 0;
  const trendIcon = Math.abs(trend) < 0.01 ? '→' : trend > 0 ? '↑' : '↓';

  // Reverse so chart reads left-to-right (oldest → newest)
  const chartData = [...valid].reverse();

  // Calculate Y domain with padding
  const allValues = valid.map(v => v.value);
  const dataMin = Math.min(...allValues, min);
  const dataMax = Math.max(...allValues, max);
  const pad = (dataMax - dataMin) * 0.15 || 1;

  return (
    <div className="bg-[#0d1c32] rounded-xl p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] text-[#c5c6cd] font-bold uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-[family-name:var(--font-headline)] font-bold text-white">
              {latest.value}
            </span>
            <span className="text-[10px] text-[#c5c6cd]">{unit}</span>
            {prev && (
              <span className={`text-xs font-bold ${Math.abs(trend) < 0.01 ? 'text-[#c5c6cd]' : trend > 0 ? 'text-[#ffb59c]' : 'text-[#4cd6fb]'}`}>
                {trendIcon} {Math.abs(trend).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          inRange ? 'text-[#2ff801] bg-[#2ff801]/10' : 'text-[#ffb59c] bg-[#ffb59c]/10'
        }`}>
          {inRange ? 'Stable' : latest.value < min ? 'Low' : 'High'}
        </span>
      </div>

      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[dataMin - pad, dataMax + pad]} hide />
            <ReferenceLine y={min} stroke="#2ff801" strokeDasharray="2 4" strokeOpacity={0.2} />
            <ReferenceLine y={max} stroke="#2ff801" strokeDasharray="2 4" strokeOpacity={0.2} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${label})`}
              dot={valid.length <= 5 ? { r: 3, fill: color, strokeWidth: 0 } : false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between text-[9px] text-[#c5c6cd]/50">
        <span>Range: {min}–{max} {unit}</span>
        <span>{valid.length} test{valid.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
