'use client';

/**
 * ParamGauge — SVG circle gauge for water parameters.
 * Inspired by Submerged mockup: clean SVG rings with range indicators.
 * Adapted for dark theme.
 */

interface ParamGaugeProps {
  label: string;
  value: number | null;
  unit: string;
  min: number;
  max: number;
  safeMin: number;
  safeMax: number;
  compact?: boolean;
}

export default function ParamGauge({ label, value, unit, min, max, safeMin, safeMax, compact }: ParamGaugeProps) {
  const range = max - min || 1;
  const valuePos = value != null ? Math.max(0, Math.min(1, (value - min) / range)) : 0;

  // Status
  const isOk = value != null && value >= safeMin && value <= safeMax;
  const safeRange = safeMax - safeMin || 1;
  const isWarning = value != null && !isOk && (
    (value >= safeMin - safeRange * 0.25 && value < safeMin) ||
    (value > safeMax && value <= safeMax + safeRange * 0.25)
  );

  const color = value == null ? '#3a4557' : isOk ? '#2ff801' : isWarning ? '#F1C40F' : '#ff6b6b';
  const statusLabel = isOk ? 'Stable' : isWarning ? 'Watch' : value != null ? 'Alert' : '';
  const statusBg = isOk ? 'bg-[#2ff801]/10 text-[#2ff801]' : isWarning ? 'bg-[#F1C40F]/10 text-[#F1C40F]' : 'bg-[#ff6b6b]/10 text-[#ff6b6b]';

  // Safe range text
  const safeText = safeMin === safeMax
    ? `${safeMin} ${unit}`
    : safeMin === 0 ? `< ${safeMax} ${unit}` : `${safeMin} – ${safeMax} ${unit}`;

  // SVG circle math
  const size = compact ? 64 : 120;
  const strokeWidth = compact ? 5 : 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (valuePos * circumference);

  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-0.5' : 'gap-2'} ${compact ? '' : 'bg-[#0d1c32] p-5 rounded-2xl shadow-[0_8px_24px_rgba(1,14,36,0.3)]'}`}>
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1c2a41"
            strokeWidth={strokeWidth}
          />
          {/* Value arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-[family-name:var(--font-headline)] font-extrabold leading-none ${compact ? 'text-[14px]' : 'text-2xl'}`}
            style={{ color: value != null ? '#d6e3ff' : '#3a4557' }}
          >
            {value != null ? value : '\u2014'}
          </span>
          {!compact && (
            <span className="text-[#8f9097] font-bold uppercase tracking-widest text-[9px] mt-1">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Label + Status */}
      <div className={`text-center ${compact ? '' : 'space-y-1.5 w-full'}`}>
        <div className={`flex items-center justify-center ${compact ? '' : 'justify-between'}`}>
          <h4
            className={`font-[family-name:var(--font-headline)] font-bold tracking-tight ${compact ? 'text-[10px]' : 'text-sm'}`}
            style={{ color }}
          >
            {label}
          </h4>
          {!compact && statusLabel && (
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusBg}`}>
              {statusLabel}
            </span>
          )}
        </div>
        {!compact && (
          <div className="flex justify-between text-[10px] font-bold text-[#8f9097]/50 mt-1">
            <span>{min}</span>
            <span className="text-[9px]" style={{ color: `${color}60` }}>{safeText}</span>
            <span>{max}</span>
          </div>
        )}
        {compact && (
          <p className="text-[7px] text-[#2ff801]/40 leading-none">
            {safeMin === safeMax ? `${safeMin}` : safeMin === 0 ? `<${safeMax}` : `${safeMin}\u2013${safeMax}`}
          </p>
        )}
      </div>
    </div>
  );
}
