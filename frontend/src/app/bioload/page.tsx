'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnimals, getAllTests } from '@/lib/queries';
import type { Animal } from '@/lib/queries';
import { calculateBioload, getStockingTimeline } from '@/lib/bioload-calculator';
import type { BioloadResult, StockingPhase } from '@/lib/bioload-calculator';
import { analyzeCycle } from '@/lib/cycle-engine';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Tank size (from profile — hardcoded for now, will come from reef_profiles) ─── */
const TANK_GALLONS = 40;

export default function BioloadPage() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [bioload, setBioload] = useState<BioloadResult | null>(null);
  const [timeline, setTimeline] = useState<StockingPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'capacity' | 'timeline'>('capacity');
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const cached = getCached<Animal[]>('animals');
    if (cached) {
      setAnimals(cached);
      processData(cached);
    }

    async function load() {
      const [animalData, tests] = await Promise.all([getAnimals(), getAllTests()]);
      setCache('animals', animalData);
      setAnimals(animalData);

      // Get cycle status for stocking timeline
      const tankAge = tests.length > 0
        ? Math.floor((Date.now() - new Date(tests[tests.length - 1].test_date).getTime()) / 86400000)
        : 0;
      const cycleStatus = analyzeCycle({ tests, tankCreatedAt: null, tankAgeInDays: tankAge });

      const bio = calculateBioload(TANK_GALLONS, animalData);
      setBioload(bio);

      const phases = getStockingTimeline(cycleStatus, tankAge, animalData);
      setTimeline(phases);
      setLoading(false);
    }

    function processData(data: Animal[]) {
      const bio = calculateBioload(TANK_GALLONS, data);
      setBioload(bio);
      setLoading(false);
    }

    load();
  }, [user]);

  if (loading && !bioload) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#4cd6fb] animate-pulse">balance</span>
          <p className="text-[#c5c6cd] text-sm">Calculating bioload…</p>
        </div>
      </div>
    );
  }

  if (!bioload) return null;

  const fish = animals.filter(a => a.type === 'fish');
  const invertebrates = animals.filter(a => a.type === 'invertebrate');
  const corals = animals.filter(a => a.type === 'coral');

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Stocking</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Bioload Calculator</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">{TANK_GALLONS} gallon {bioload.tankCategory} reef</p>
      </div>

      {/* Capacity Gauge */}
      <div className="bg-[#0d1c32] rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${bioload.statusColor}, transparent)` }} />

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${bioload.statusColor}15` }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: bioload.statusColor, fontVariationSettings: "'FILL' 1" }}>
              {bioload.statusIcon}
            </span>
          </div>
          <div>
            <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">{bioload.statusLabel}</p>
            <p className="text-[#c5c6cd] text-sm">{bioload.currentFishInches}" of {bioload.maxFishInches}" capacity</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-3xl font-[family-name:var(--font-headline)] font-bold" style={{ color: bioload.statusColor }}>{bioload.capacityPercent}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#1c2a41] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(bioload.capacityPercent, 100)}%`,
              background: `linear-gradient(90deg, ${bioload.statusColor}80, ${bioload.statusColor})`,
            }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider">
          <span>0"</span>
          <span>{Math.floor(bioload.maxFishInches * 0.5)}" optimal</span>
          <span>{bioload.maxFishInches}" max</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {(['capacity', 'timeline'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t
                ? 'bg-[#FF7F50]/15 text-[#FF7F50]'
                : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >
            {t === 'capacity' ? '🐠 Capacity' : '📅 Stocking Timeline'}
          </button>
        ))}
      </div>

      {tab === 'capacity' ? (
        <>
          {/* Warnings */}
          {bioload.warnings.length > 0 && (
            <div className="space-y-2">
              {bioload.warnings.map((w, i) => (
                <div key={i} className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-2xl p-4 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#ff4444] text-lg mt-0.5">warning</span>
                  <p className="text-[#ff9999] text-sm flex-1">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Pacing Advice */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#4cd6fb] text-lg mt-0.5">tips_and_updates</span>
            <div>
              <p className="text-white text-sm font-medium mb-1">Pacing Advice</p>
              <p className="text-[#c5c6cd] text-sm">{bioload.pacingAdvice}</p>
            </div>
          </div>

          {/* Fish Breakdown */}
          {bioload.fishList.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7F50] text-sm">phishing</span>
                Fish Load Breakdown
              </p>
              {bioload.fishList.map((f, i) => (
                <div key={i} className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF7F50]/10 flex items-center justify-center">
                    <span className="text-lg">🐠</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[#c5c6cd] text-xs">
                      Adult size: {f.adultSize}" {f.quantity > 1 ? `× ${f.quantity}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-sm">{f.totalInches}"</p>
                    <p className="text-[#c5c6cd] text-[10px]">
                      {Math.round((f.totalInches / bioload.maxFishInches) * 100)}% of cap
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Remaining Space */}
          {bioload.remainingInches > 0 && (
            <div className="bg-[#2ff801]/5 border border-[#2ff801]/15 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-[#2ff801]">add_circle</span>
                <p className="text-white font-medium text-sm">Room for More Fish</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#041329] rounded-xl p-3 text-center">
                  <p className="text-[#2ff801] font-bold text-lg">{bioload.remainingInches}"</p>
                  <p className="text-[#c5c6cd] text-[10px] uppercase">Remaining</p>
                </div>
                <div className="bg-[#041329] rounded-xl p-3 text-center">
                  <p className="text-[#4cd6fb] font-bold text-lg">{Math.floor(bioload.remainingInches / 3)}</p>
                  <p className="text-[#c5c6cd] text-[10px] uppercase">Small fish</p>
                </div>
                <div className="bg-[#041329] rounded-xl p-3 text-center">
                  <p className="text-[#FF7F50] font-bold text-lg">{Math.floor(bioload.remainingInches / 5)}</p>
                  <p className="text-[#c5c6cd] text-[10px] uppercase">Medium fish</p>
                </div>
              </div>
            </div>
          )}

          {/* Population Summary */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">Population Summary</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0d1c32] rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">🐠</p>
                <p className="text-white font-bold text-lg">{fish.length}</p>
                <p className="text-[#c5c6cd] text-[10px] uppercase">Fish</p>
              </div>
              <div className="bg-[#0d1c32] rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">🪸</p>
                <p className="text-white font-bold text-lg">{corals.length}</p>
                <p className="text-[#c5c6cd] text-[10px] uppercase">Corals</p>
              </div>
              <div className="bg-[#0d1c32] rounded-2xl p-4 text-center">
                <p className="text-2xl mb-1">🦐</p>
                <p className="text-white font-bold text-lg">{invertebrates.length}</p>
                <p className="text-[#c5c6cd] text-[10px] uppercase">Inverts</p>
              </div>
            </div>
          </div>

          {/* Quick Rules */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F1C40F] text-sm">menu_book</span>
              Stocking Rules
            </p>
            {[
              { icon: '📏', text: `Reef tanks: ~0.5 inch of fish per gallon (${TANK_GALLONS}gal = ${bioload.maxFishInches}" max)` },
              { icon: '🐟', text: 'Nano tanks (<30gal): max 1-2 small fish (gobies, blennies)' },
              { icon: '⏱️', text: 'Add 1-2 fish at a time, wait 2-3 weeks between additions' },
              { icon: '📐', text: 'Always use ADULT size — fish grow! A 1" tang becomes 8"' },
              { icon: '🔬', text: 'More fish = more waste = more water changes needed' },
              { icon: '⚔️', text: 'Add peaceful species BEFORE aggressive ones' },
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm mt-0.5">{rule.icon}</span>
                <p className="text-[#c5c6cd] text-xs">{rule.text}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* ─── Stocking Timeline Tab ─── */
        <div className="space-y-3">
          {timeline.map((phase) => {
            const isExpanded = expandedPhase === phase.phase;
            return (
              <div key={phase.phase} className="relative">
                {/* Timeline connector */}
                {phase.phase < timeline.length - 1 && (
                  <div className="absolute left-[23px] top-[56px] bottom-0 w-0.5" style={{ backgroundColor: `${phase.color}30` }} />
                )}

                <button
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.phase)}
                  className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                >
                  {/* Phase icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${!phase.unlocked ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: `${phase.color}15` }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: phase.color }}>
                      {phase.unlocked ? phase.icon : 'lock'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-[family-name:var(--font-headline)] font-bold text-sm ${phase.unlocked ? 'text-white' : 'text-[#c5c6cd]/50'}`}>
                        Phase {phase.phase}: {phase.title}
                      </p>
                    </div>
                    <p className="text-[#c5c6cd]/60 text-xs mt-0.5 line-clamp-1">{phase.unlockCondition}</p>
                  </div>

                  {/* Status badge */}
                  {phase.unlocked ? (
                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-[#2ff801]/15 text-[#2ff801] uppercase">Open</span>
                  ) : phase.daysUntilUnlock !== null ? (
                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-[#F1C40F]/15 text-[#F1C40F] uppercase whitespace-nowrap">
                      ~{phase.daysUntilUnlock}d
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-[#1c2a41] text-[#8f9097] uppercase">Locked</span>
                  )}

                  <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-4 mr-1 space-y-4">
                    <p className="text-[#c5c6cd] text-sm">{phase.description}</p>

                    {/* Recommended animals */}
                    {phase.animals.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-2">Recommended</p>
                        {phase.animals.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="material-symbols-outlined text-xs mt-0.5" style={{ color: phase.color }}>check_circle</span>
                            <p className="text-[#c5c6cd] text-xs">{a}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tips */}
                    {phase.tips.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-2">Pro Tips</p>
                        {phase.tips.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <span className="material-symbols-outlined text-xs text-[#F1C40F] mt-0.5">lightbulb</span>
                            <p className="text-[#c5c6cd] text-xs">{t}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
