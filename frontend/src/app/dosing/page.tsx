'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { DOSING_PROFILES, calculateDosing } from '@/lib/dosing-calculator';
import type { DosingResult } from '@/lib/dosing-calculator';

export default function DosingPage() {
  const { tank } = useAuth();
  const tankGallons = tank?.size_gallons || 40;

  const [values, setValues] = useState<Record<string, { current: string; target: string }>>(() => {
    const init: Record<string, { current: string; target: string }> = {};
    DOSING_PROFILES.forEach((p) => {
      init[p.parameter] = { current: '', target: String(p.target) };
    });
    return init;
  });

  const [results, setResults] = useState<Record<string, DosingResult>>({});
  const [animating, setAnimating] = useState<Record<string, boolean>>({});

  const handleCalculate = (param: string) => {
    const v = values[param];
    const profile = DOSING_PROFILES.find((p) => p.parameter === param);
    if (!v || !profile) return;

    const current = parseFloat(v.current);
    const target = parseFloat(v.target);
    if (isNaN(current) || isNaN(target)) return;

    const result = calculateDosing(param, current, target, tankGallons);
    setResults((prev) => ({ ...prev, [param]: result }));
    setAnimating((prev) => ({ ...prev, [param]: true }));
    setTimeout(() => setAnimating((prev) => ({ ...prev, [param]: false })), 400);
  };

  const getDeficitStatus = (param: string): 'in-range' | 'needs-adjustment' | 'none' => {
    const r = results[param];
    if (!r) return 'none';
    if (r.deficit === 0) return 'in-range';
    const profile = DOSING_PROFILES.find((p) => p.parameter === param);
    if (!profile) return 'needs-adjustment';
    return r.current >= profile.min && r.current <= profile.max ? 'in-range' : 'needs-adjustment';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">
          Chemistry
        </p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">
          Dosing Calculator
        </h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Calculate exact doses for your tank</p>
      </div>

      {/* Tank Badge */}
      <div className="flex items-center gap-2">
        <div className="bg-[#0d1c32] rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd6fb] text-lg">water</span>
          <span className="text-white text-sm font-bold font-[family-name:var(--font-headline)]">
            {tank?.name || 'My Tank'}
          </span>
          <span className="text-[#8f9097] text-xs">
            {tankGallons} gal
          </span>
        </div>
      </div>

      {/* Parameter Cards */}
      {DOSING_PROFILES.map((profile) => {
        const v = values[profile.parameter];
        const result = results[profile.parameter];
        const status = getDeficitStatus(profile.parameter);
        const isAnimating = animating[profile.parameter];

        return (
          <div key={profile.parameter} className="bg-[#0d1c32] rounded-2xl p-5 space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${profile.color}15` }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: profile.color }}
                  >
                    {profile.icon}
                  </span>
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">
                    {profile.parameter}
                  </h3>
                  <p className="text-[#8f9097] text-xs">
                    Range: {profile.min} - {profile.max} {profile.unit}
                  </p>
                </div>
              </div>
              <div
                className="rounded-lg px-2.5 py-1"
                style={{ backgroundColor: `${profile.color}15` }}
              >
                <span className="text-xs font-bold" style={{ color: profile.color }}>
                  {profile.unit}
                </span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">
                  Current
                </label>
                <input
                  type="number"
                  step={profile.parameter === 'Alkalinity' ? '0.1' : '1'}
                  placeholder={String(profile.target)}
                  value={v?.current || ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [profile.parameter]: { ...prev[profile.parameter], current: e.target.value },
                    }))
                  }
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm font-[family-name:var(--font-headline)] placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">
                  Target
                </label>
                <input
                  type="number"
                  step={profile.parameter === 'Alkalinity' ? '0.1' : '1'}
                  value={v?.target || ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [profile.parameter]: { ...prev[profile.parameter], target: e.target.value },
                    }))
                  }
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm font-[family-name:var(--font-headline)] placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50] transition-colors"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={() => handleCalculate(profile.parameter)}
              disabled={!v?.current || !v?.target}
              className="w-full bg-gradient-to-r from-[#FF7F50] to-[#d35e32] text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-headline)] tracking-wide"
            >
              Calculate Dose
            </button>

            {/* Results */}
            {result && (
              <div
                className={`rounded-xl border p-4 space-y-3 transition-all duration-300 ${
                  isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                } ${
                  status === 'in-range'
                    ? 'border-[#2ff801]/30 bg-[#2ff801]/5'
                    : 'border-[#F1C40F]/30 bg-[#F1C40F]/5'
                }`}
              >
                {result.deficit <= 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
                    <span className="text-[#2ff801] text-sm font-bold">
                      {result.deficit === 0 ? 'Already at target!' : 'Above target - no dosing needed.'}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Product Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-bold">{result.product}</p>
                        <p className="text-[#8f9097] text-xs">{result.brand}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-3xl font-[family-name:var(--font-headline)] font-bold"
                          style={{ color: profile.color }}
                        >
                          {result.doseAmount}
                        </p>
                        <p className="text-[#8f9097] text-xs">{result.doseUnit}</p>
                      </div>
                    </div>

                    {/* Deficit Info */}
                    <div className="bg-[#010e24] rounded-lg p-3 flex items-center justify-between">
                      <div className="text-xs text-[#8f9097]">
                        Deficit: <span className="text-white font-bold">{result.deficit.toFixed(1)} {DOSING_PROFILES.find(p => p.parameter === result.parameter)?.unit}</span>
                      </div>
                      <div className="text-xs text-[#8f9097]">
                        <span className="material-symbols-outlined text-xs align-middle mr-0.5">schedule</span>
                        {result.frequency}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="flex gap-2">
                      <span className="material-symbols-outlined text-[#F1C40F] text-sm mt-0.5 shrink-0">info</span>
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">{result.notes}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pro Tips */}
      <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF7F50] text-xl">tips_and_updates</span>
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">
            Pro Tips
          </h3>
        </div>
        <div className="space-y-2.5">
          {[
            {
              icon: 'science',
              tip: 'Dose in small increments, test after 24h',
            },
            {
              icon: 'speed',
              tip: 'Never adjust more than 1 dKH alkalinity per day',
            },
            {
              icon: 'balance',
              tip: 'Dose Alk and Ca in equal proportions',
            },
            {
              icon: 'priority_high',
              tip: 'If Mg is low, raise it first before adjusting Ca/Alk',
            },
          ].map((item) => (
            <div key={item.tip} className="flex items-start gap-3 bg-[#010e24] rounded-xl p-3">
              <span className="material-symbols-outlined text-[#FF7F50] text-base mt-0.5 shrink-0">
                {item.icon}
              </span>
              <p className="text-[#c5c6cd] text-sm leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
