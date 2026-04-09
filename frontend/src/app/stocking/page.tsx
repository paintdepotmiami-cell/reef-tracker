'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnimals, getAllTests } from '@/lib/queries';
import type { Animal, WaterTest } from '@/lib/queries';
import { getStockingTimeline } from '@/lib/bioload-calculator';
import type { StockingPhase } from '@/lib/bioload-calculator';
import { analyzeCycle } from '@/lib/cycle-engine';
import type { CycleStatus } from '@/lib/cycle-engine';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

export default function StockingPage() {
  const { user, tank, loading: authLoading } = useAuth();
  const [timeline, setTimeline] = useState<StockingPhase[]>([]);
  const [cycleStatus, setCycleStatus] = useState<CycleStatus | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tankAgeDays, setTankAgeDays] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Try cache first
    const cachedAnimals = getCached<Animal[]>('animals');
    const cachedTests = getCached<WaterTest[]>('allTests');
    if (cachedAnimals && cachedTests) {
      processData(cachedAnimals, cachedTests);
    }

    async function load() {
      const [animals, tests] = await Promise.all([getAnimals(), getAllTests()]);
      setCache('animals', animals);
      setCache('allTests', tests);
      processData(animals, tests);
    }

    function processData(animals: Animal[], tests: WaterTest[]) {
      const ageDays = tank?.created_at
        ? Math.floor((Date.now() - new Date(tank.created_at).getTime()) / 86400000)
        : tests.length > 0
          ? Math.floor((Date.now() - new Date(tests[tests.length - 1].test_date).getTime()) / 86400000)
          : 0;
      setTankAgeDays(ageDays);

      const cycle = analyzeCycle({
        tests,
        tankCreatedAt: tank?.created_at ?? null,
        tankAgeInDays: ageDays,
      });
      setCycleStatus(cycle);

      const phases = getStockingTimeline(cycle, ageDays, animals);
      setTimeline(phases);

      // Find current phase: last unlocked one
      let current = 0;
      for (let i = phases.length - 1; i >= 0; i--) {
        if (phases[i].unlocked) {
          current = i;
          break;
        }
      }
      setCurrentPhaseIndex(current);

      // Auto-expand current phase
      setExpandedPhase(current);
      setLoading(false);
    }

    load();
  }, [user, tank]);

  // Loading state
  if (authLoading || (loading && timeline.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50] animate-pulse">timeline</span>
          <p className="text-[#c5c6cd] text-sm">Building your stocking timeline...</p>
        </div>
      </div>
    );
  }

  // No tank — suggest onboarding
  if (!tank && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-[#FF7F50]/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50]">aquarium</span>
        </div>
        <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-white mb-2">No Tank Setup</h2>
        <p className="text-[#c5c6cd] text-sm mb-6 max-w-xs">
          Set up your tank first so we can build a personalized stocking timeline for your reef.
        </p>
        <Link
          href="/onboarding"
          className="bg-[#FF7F50] text-white font-bold text-sm px-6 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Start Setup
        </Link>
      </div>
    );
  }

  const currentPhase = timeline[currentPhaseIndex];
  const nextLockedPhase = timeline.find(p => !p.unlocked);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Reef Building</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Stocking Schedule</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Your reef building timeline</p>
      </div>

      {/* Current Phase Indicator */}
      {currentPhase && (
        <div
          className="bg-[#0d1c32] rounded-3xl p-6 relative overflow-hidden border"
          style={{ borderColor: `${currentPhase.color}40` }}
        >
          {/* Background glow */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${currentPhase.color}, transparent)` }}
          />
          <div
            className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-5"
            style={{ background: `radial-gradient(circle, ${currentPhase.color}, transparent)` }}
          />

          <p className="text-[10px] font-bold uppercase tracking-widest text-[#c5c6cd]/60 mb-3">Current Phase</p>

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{ backgroundColor: `${currentPhase.color}15` }}
            >
              <span
                className="material-symbols-outlined text-3xl"
                style={{ color: currentPhase.color, fontVariationSettings: "'FILL' 1" }}
              >
                {currentPhase.icon}
              </span>
              {/* Pulse ring */}
              <div
                className="absolute inset-0 rounded-2xl animate-ping opacity-20"
                style={{ backgroundColor: currentPhase.color }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase"
                  style={{ backgroundColor: `${currentPhase.color}20`, color: currentPhase.color }}
                >
                  Phase {currentPhase.phase}
                </span>
              </div>
              <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg mt-1">
                {currentPhase.title}
              </p>
            </div>
          </div>

          <p className="text-[#c5c6cd] text-sm leading-relaxed">{currentPhase.description}</p>

          {/* Tank age info */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1c2a41]">
            <span className="material-symbols-outlined text-sm text-[#8f9097]">calendar_today</span>
            <p className="text-[#8f9097] text-xs">
              Tank age: {tankAgeDays} days
              {cycleStatus && !cycleStatus.safeToAddLife && (
                <span className="text-[#F1C40F] ml-2">
                  — Cycle in progress ({cycleStatus.phase})
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Countdown to Next Phase */}
      {nextLockedPhase && nextLockedPhase.daysUntilUnlock !== null && nextLockedPhase.daysUntilUnlock > 0 && (
        <div className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 border border-[#1c2a41]">
          <div className="w-14 h-14 rounded-xl bg-[#F1C40F]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#F1C40F]">hourglass_top</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm">
              Next: {nextLockedPhase.title}
            </p>
            <p className="text-[#c5c6cd] text-xs mt-0.5">{nextLockedPhase.unlockCondition}</p>
          </div>
          <div className="text-right">
            <p className="text-[#F1C40F] font-[family-name:var(--font-headline)] font-bold text-2xl">
              {nextLockedPhase.daysUntilUnlock}
            </p>
            <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-wider">days</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#FF7F50]">timeline</span>
          Stocking Phases
        </p>

        <div className="space-y-0">
          {timeline.map((phase, idx) => {
            const isExpanded = expandedPhase === phase.phase;
            const isCurrent = idx === currentPhaseIndex && phase.unlocked;
            const isCompleted = phase.unlocked && idx < currentPhaseIndex;
            const isLocked = !phase.unlocked;

            return (
              <div key={phase.phase} className="relative">
                {/* Vertical connector line */}
                {idx < timeline.length - 1 && (
                  <div
                    className="absolute left-[23px] top-[56px] h-[calc(100%-32px)] w-0.5"
                    style={{
                      borderLeft: isLocked
                        ? `2px dashed ${phase.color}25`
                        : `2px solid ${phase.color}40`,
                    }}
                  />
                )}

                {/* Phase Card */}
                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                  className={`w-full rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all mb-2 ${
                    isCurrent
                      ? 'bg-[#0d1c32] border-2'
                      : isLocked
                        ? 'bg-[#0d1c32]/50 border border-dashed'
                        : 'bg-[#0d1c32] border'
                  }`}
                  style={{
                    borderColor: isCurrent
                      ? `${phase.color}60`
                      : isLocked
                        ? '#1c2a41'
                        : `${phase.color}25`,
                  }}
                >
                  {/* Phase number badge / status icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative ${
                      isLocked ? 'opacity-40' : ''
                    }`}
                    style={{ backgroundColor: `${phase.color}${isLocked ? '08' : '15'}` }}
                  >
                    {isLocked ? (
                      <span className="material-symbols-outlined text-xl text-[#8f9097]">lock</span>
                    ) : isCompleted ? (
                      <span className="material-symbols-outlined text-xl text-[#2ff801]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    ) : (
                      <span
                        className="material-symbols-outlined text-xl"
                        style={{ color: phase.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {phase.icon}
                      </span>
                    )}
                    {/* Phase number */}
                    <span
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: isLocked ? '#1c2a41' : phase.color,
                        color: isLocked ? '#8f9097' : '#010e24',
                      }}
                    >
                      {phase.phase}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-[family-name:var(--font-headline)] font-bold text-sm ${
                        isLocked ? 'text-[#8f9097]' : 'text-white'
                      }`}
                    >
                      {phase.title}
                    </p>
                    <p className={`text-xs mt-0.5 line-clamp-1 ${isLocked ? 'text-[#8f9097]/50' : 'text-[#c5c6cd]/60'}`}>
                      {phase.unlockCondition}
                    </p>
                  </div>

                  {/* Status badge */}
                  {isCurrent ? (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${phase.color}20`, color: phase.color }}>
                      Current
                    </span>
                  ) : isCompleted ? (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#2ff801]/15 text-[#2ff801] uppercase tracking-wider">
                      Done
                    </span>
                  ) : phase.daysUntilUnlock !== null && phase.daysUntilUnlock > 0 ? (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#F1C40F]/15 text-[#F1C40F] uppercase tracking-wider whitespace-nowrap">
                      ~{phase.daysUntilUnlock}d
                    </span>
                  ) : isLocked ? (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#1c2a41] text-[#8f9097] uppercase tracking-wider">
                      Locked
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-[#2ff801]/15 text-[#2ff801] uppercase tracking-wider">
                      Open
                    </span>
                  )}

                  <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-5 mb-3 ml-4 mr-1 space-y-4 border border-[#1c2a41]">
                    <p className="text-[#c5c6cd] text-sm leading-relaxed">{phase.description}</p>

                    {/* Suggested Animals */}
                    {phase.animals.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs" style={{ color: phase.color }}>pets</span>
                          Suggested Species
                        </p>
                        <div className="space-y-2">
                          {phase.animals.map((animal, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span
                                className="material-symbols-outlined text-sm mt-0.5"
                                style={{ color: phase.color, fontVariationSettings: "'FILL' 1" }}
                              >
                                check_circle
                              </span>
                              <p className={`text-xs ${isLocked ? 'text-[#8f9097]' : 'text-[#c5c6cd]'}`}>{animal}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {phase.tips.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs text-[#F1C40F]">lightbulb</span>
                          Pro Tips
                        </p>
                        <div className="space-y-2">
                          {phase.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-sm text-[#F1C40F] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                                lightbulb
                              </span>
                              <p className="text-[#c5c6cd] text-xs">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/bioload"
          className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 border border-[#1c2a41] active:scale-[0.97] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-[#4cd6fb]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-[#4cd6fb]">balance</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold">Bioload</p>
            <p className="text-[#8f9097] text-[10px] uppercase tracking-wider">Capacity Check</p>
          </div>
        </Link>
        <Link
          href="/cycle"
          className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 border border-[#1c2a41] active:scale-[0.97] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2ff801]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-[#2ff801]">cycle</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold">Cycle</p>
            <p className="text-[#8f9097] text-[10px] uppercase tracking-wider">Track Progress</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
