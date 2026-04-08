'use client';

/**
 * ConsumableGauge — Linear progress bar for consumable life.
 * Inspired by Submerged mockup: clean horizontal bars with status.
 * Adapted for dark theme.
 */

interface ConsumableGaugeProps {
  label: string;
  icon: string;
  intervalDays: number;
  lastCompletedAt: string | null;
  nextDueAt: string | null;
  onComplete?: () => void;
  completing?: boolean;
}

export default function ConsumableGauge({
  label,
  icon,
  intervalDays,
  lastCompletedAt,
  nextDueAt,
  onComplete,
  completing,
}: ConsumableGaugeProps) {
  const now = new Date();

  let daysElapsed = 0;
  let daysRemaining = intervalDays;

  if (lastCompletedAt) {
    daysElapsed = Math.floor((now.getTime() - new Date(lastCompletedAt).getTime()) / 86400000);
    daysRemaining = intervalDays - daysElapsed;
  } else if (nextDueAt) {
    daysRemaining = Math.floor((new Date(nextDueAt).getTime() - now.getTime()) / 86400000);
    daysElapsed = intervalDays - daysRemaining;
  }

  const isOverdue = daysRemaining < 0;
  const pctRemaining = Math.max(0, Math.min(100, (daysRemaining / intervalDays) * 100));

  // Color
  const color = isOverdue || pctRemaining <= 5
    ? '#ff6b6b'
    : pctRemaining <= 30
    ? '#F1C40F'
    : '#2ff801';

  const statusText = isOverdue
    ? `${Math.abs(daysRemaining)}d overdue`
    : daysRemaining === 0
    ? 'Due today'
    : `${daysRemaining}d left`;

  const pctText = isOverdue ? '0%' : `${Math.round(pctRemaining)}%`;

  return (
    <button
      onClick={onComplete}
      disabled={completing}
      className="w-full bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(1,14,36,0.2)] text-left"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        {completing ? (
          <span className="material-symbols-outlined text-lg animate-spin" style={{ color }}>progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-end mb-1.5">
          <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm truncate">{label}</p>
          <p className="text-xs font-bold shrink-0 ml-2" style={{ color }}>{pctText}</p>
        </div>
        <div className="h-2 w-full bg-[#1c2a41] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pctRemaining}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: `${color}99` }}>{statusText}</p>
      </div>
    </button>
  );
}
