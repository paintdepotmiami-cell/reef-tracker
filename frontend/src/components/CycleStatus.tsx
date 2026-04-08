'use client';

/**
 * CycleStatus — Visual card showing nitrogen cycle phase.
 *
 * Renders as:
 * - Compact banner (for Dashboard)
 * - Expanded card (for Logs page)
 */

import type { CycleStatus as CycleStatusType } from '@/lib/cycle-engine';

interface CycleStatusProps {
  status: CycleStatusType;
  variant?: 'banner' | 'card';
}

export default function CycleStatusCard({ status, variant = 'card' }: CycleStatusProps) {
  if (!status.active) return null;

  // Phase progress steps
  const phases = [
    { key: 'starting', label: 'Start' },
    { key: 'ammonia', label: 'NH\u2083' },
    { key: 'nitrite', label: 'NO\u2082' },
    { key: 'clearing', label: 'Clear' },
    { key: 'complete', label: 'Done' },
  ];
  const currentIdx = phases.findIndex(p => p.key === status.phase);

  if (variant === 'banner') {
    return (
      <div
        className="p-4 rounded-xl flex items-center gap-4 shadow-[0_4px_16px_rgba(1,14,36,0.2)]"
        style={{ backgroundColor: `${status.color}10`, borderLeft: `4px solid ${status.color}` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${status.color}20` }}
        >
          <span className="material-symbols-outlined" style={{ color: status.color }}>{status.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{status.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: `${status.color}CC` }}>
            {status.phase === 'complete'
              ? 'Safe to add first cleanup crew'
              : status.nextTest
            }
          </p>
        </div>
        {/* Mini progress */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-bold" style={{ color: status.color }}>{status.progress}%</span>
        </div>
      </div>
    );
  }

  // Full card variant
  return (
    <div className="bg-[#0d1c32] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(1,14,36,0.3)]">
      {/* Header */}
      <div
        className="p-5 flex items-center gap-4"
        style={{ backgroundColor: `${status.color}08` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${status.color}20` }}
        >
          <span className="material-symbols-outlined text-2xl" style={{ color: status.color }}>{status.icon}</span>
        </div>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] font-extrabold text-white text-lg">{status.title}</p>
          <p className="text-xs text-[#c5c6cd] mt-0.5">{status.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-[#8f9097] uppercase tracking-widest">Cycle Progress</span>
          <span className="text-sm font-extrabold" style={{ color: status.color }}>{status.progress}%</span>
        </div>
        <div className="h-2.5 w-full bg-[#1c2a41] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${status.progress}%`, backgroundColor: status.color }}
          />
        </div>
        {/* Phase dots */}
        <div className="flex justify-between mt-3">
          {phases.map((p, i) => {
            const isActive = i <= currentIdx;
            const isCurrent = p.key === status.phase;
            return (
              <div key={p.key} className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    isCurrent ? 'scale-125' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? status.color : 'transparent',
                    borderColor: isActive ? status.color : '#1c2a41',
                    boxShadow: isCurrent ? `0 0 8px ${status.color}` : 'none',
                  }}
                />
                <span
                  className="text-[8px] font-bold uppercase tracking-wider"
                  style={{ color: isActive ? status.color : '#3a4557' }}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advice */}
      {status.advice && (
        <div className="px-5 pb-4">
          <div className="bg-[#041329] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ color: status.color }}>lightbulb</span>
              <span className="text-[10px] font-bold text-[#c5c6cd] uppercase tracking-widest">What to do</span>
            </div>
            <p className="text-xs text-[#c5c6cd] leading-relaxed">{status.advice}</p>
          </div>
        </div>
      )}

      {/* Safe to add life badge */}
      {status.safeToAddLife && status.phase === 'complete' && (
        <div className="px-5 pb-5">
          <div className="bg-[#2ff801]/10 border border-[#2ff801]/20 rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2ff801]">verified</span>
            <span className="text-sm font-bold text-[#2ff801]">Safe to add first cleanup crew</span>
          </div>
        </div>
      )}

      {/* Next test */}
      {status.nextTest && !status.safeToAddLife && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 text-[#8f9097]">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="text-xs font-medium">{status.nextTest}</span>
          </div>
        </div>
      )}
    </div>
  );
}
