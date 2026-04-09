'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnimals } from '@/lib/queries';
import type { Animal } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import {
  generateFeedingPlans,
  generateDailySchedule,
  OVERFEEDING_TIPS,
  type FeedingPlan,
  type DailyFeedingTask,
} from '@/lib/feeding-engine';
import Link from 'next/link';

const TIME_META: Record<string, { label: string; range: string }> = {
  morning: { label: 'Morning', range: '8:00 — 10:00 AM' },
  afternoon: { label: 'Afternoon', range: '1:00 — 3:00 PM' },
  evening: { label: 'Evening', range: '8:00 — 10:00 PM' },
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-500/10 text-green-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high: 'bg-red-500/10 text-red-400',
};

export default function FeedingPage() {
  const { user, tank } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>(getCached<Animal[]>('animals') || []);
  const [loading, setLoading] = useState(!getCached('animals'));
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 6000);
    getAnimals()
      .then((a) => {
        setCache('animals', a);
        setAnimals(a);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, [user]);

  const plans = useMemo<FeedingPlan[]>(() => {
    if (animals.length === 0) return [];
    return generateFeedingPlans(
      animals.map((a) => ({ name: a.name, type: a.type, subtype: a.subtype })),
    );
  }, [animals]);

  const schedule = useMemo<DailyFeedingTask[]>(() => {
    return generateDailySchedule(plans);
  }, [plans]);

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#010e24] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[#FF7F50] text-4xl animate-spin">
            progress_activity
          </span>
          <p className="text-[#8f9097]">Loading feeding schedule...</p>
        </div>
      </div>
    );
  }

  // ── Empty state — no animals ───────────────────────────────────────────
  if (animals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <span className="material-symbols-outlined text-[#FF7F50] text-6xl">set_meal</span>
        <h1 className="text-xl font-[family-name:var(--font-headline)] text-white">
          No Livestock Yet
        </h1>
        <p className="text-[#c5c6cd] max-w-sm">
          Add your fish, corals, and invertebrates first. The feeding schedule is generated
          automatically based on what lives in your tank.
        </p>
        <Link
          href="/livestock"
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF7F50] text-white font-medium text-sm"
        >
          Add Livestock
        </Link>
      </div>
    );
  }

  // ── No matching plans (edge case) ──────────────────────────────────────
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <span className="material-symbols-outlined text-[#FF7F50] text-6xl">help</span>
        <h1 className="text-xl font-[family-name:var(--font-headline)] text-white">
          No Feeding Plans Matched
        </h1>
        <p className="text-[#c5c6cd] max-w-sm">
          We couldn&apos;t auto-detect feeding categories for your livestock. Try updating your
          animal names or species info.
        </p>
        <Link
          href="/livestock"
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#FF7F50] text-white font-medium text-sm"
        >
          Review Livestock
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#F1C40F] text-xs font-medium uppercase">Daily Care</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Feeding Schedule</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">
          {plans.length} plan{plans.length !== 1 && 's'} &middot; {animals.length} animal
          {animals.length !== 1 && 's'}
        </p>
      </div>

      {/* ── Overfeeding Warning ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-red-400 text-2xl mt-0.5">warning</span>
          <div>
            <p className="text-white font-semibold text-sm">
              Rule #1: Remove uneaten food after 3 minutes
            </p>
            <p className="text-red-300/80 text-xs mt-1 leading-relaxed">
              Overfeeding is the #1 cause of ammonia spikes and algae blooms. Feed only what your
              fish consume in 2-3 minutes. If food reaches the sand bed, you fed too much.
            </p>
          </div>
        </div>
      </div>

      {/* ── Daily Schedule Timeline ────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-[family-name:var(--font-headline)] text-[#c5c6cd] uppercase tracking-wider mb-3">
          Today&apos;s Schedule
        </h2>

        <div className="space-y-3">
          {schedule.map((task) => {
            const meta = TIME_META[task.time];
            return (
              <div
                key={task.time}
                className="rounded-2xl bg-[#0d1c32] border border-[#1c2a41] p-4"
              >
                {/* Time header */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${task.color}15` }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: task.color }}>
                      {task.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{task.label}</p>
                    <p className="text-[#8f9097] text-xs">{meta.range}</p>
                  </div>
                  <span className="text-[#8f9097] text-xs bg-[#1c2a41] px-2 py-1 rounded-lg">
                    {meta.label}
                  </span>
                </div>

                {/* Food checklist */}
                <ul className="space-y-2 ml-1">
                  {task.foods.map((food, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#FF7F50] text-base mt-0.5">
                        check_circle
                      </span>
                      <span className="text-[#c5c6cd] text-sm">{food}</span>
                    </li>
                  ))}
                </ul>

                {/* Duration & tip */}
                <div className="mt-3 pt-3 border-t border-[#1c2a41] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#8f9097] text-base mt-0.5">
                    timer
                  </span>
                  <div>
                    <p className="text-[#8f9097] text-xs">{task.duration}</p>
                    <p className="text-[#8f9097] text-xs mt-0.5 italic">{task.tip}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Species Feeding Plans (expandable) ─────────────────────────── */}
      <section>
        <h2 className="text-sm font-[family-name:var(--font-headline)] text-[#c5c6cd] uppercase tracking-wider mb-3">
          Species Plans
        </h2>

        <div className="space-y-3">
          {plans.map((plan) => {
            const isOpen = expandedPlan === plan.category;
            return (
              <div
                key={plan.category}
                className="rounded-2xl bg-[#0d1c32] border border-[#1c2a41] overflow-hidden"
              >
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedPlan(isOpen ? null : plan.category)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${plan.color}15` }}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ color: plan.color }}>
                      {plan.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{plan.category}</p>
                    <p className="text-[#8f9097] text-xs">{plan.frequency}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[plan.overfeedingRisk]}`}>
                      {plan.overfeedingRisk} risk
                    </span>
                    <span
                      className="material-symbols-outlined text-[#8f9097] text-xl transition-transform"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* Auto-feeder badge */}
                    {plan.autoFeederSuggested && (
                      <div className="flex items-center gap-2 bg-[#FF7F50]/10 rounded-xl px-3 py-2">
                        <span className="material-symbols-outlined text-[#FF7F50] text-base">
                          smart_toy
                        </span>
                        <span className="text-[#FF7F50] text-xs font-medium">
                          Auto-feeder recommended for this category
                        </span>
                      </div>
                    )}

                    {/* Food recommendations */}
                    <div>
                      <p className="text-[#c5c6cd] text-xs font-semibold uppercase tracking-wider mb-2">
                        Recommended Foods
                      </p>
                      <div className="space-y-2">
                        {plan.foodTypes.map((food, i) => (
                          <div
                            key={i}
                            className="bg-[#010e24] rounded-xl p-3 border border-[#1c2a41]"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-sm font-medium">{food.name}</span>
                              <span className="text-[#8f9097] text-xs px-1.5 py-0.5 bg-[#1c2a41] rounded">
                                {food.type}
                              </span>
                            </div>
                            <p className="text-[#8f9097] text-xs">{food.brand}</p>
                            <p className="text-[#c5c6cd] text-xs mt-1">{food.portion}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    <div>
                      <p className="text-[#c5c6cd] text-xs font-semibold uppercase tracking-wider mb-2">
                        Tips
                      </p>
                      <ul className="space-y-1.5">
                        {plan.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[#FF7F50] text-sm mt-0.5">
                              lightbulb
                            </span>
                            <span className="text-[#c5c6cd] text-xs leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Anti-Overfeeding Tips ──────────────────────────────────────── */}
      <section className="px-4 mt-6 mb-8">
        <h2 className="text-sm font-[family-name:var(--font-headline)] text-[#c5c6cd] uppercase tracking-wider mb-3">
          Anti-Overfeeding Guide
        </h2>

        <div className="rounded-2xl bg-[#0d1c32] border border-[#1c2a41] p-4 space-y-3">
          {OVERFEEDING_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-400 text-base mt-0.5">
                {i === 0 ? 'priority_high' : 'info'}
              </span>
              <p className="text-[#c5c6cd] text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
