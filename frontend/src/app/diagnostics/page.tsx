'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FISH_BEHAVIOR_DATABASE,
  CORAL_STRESS_DATABASE,
} from '@/lib/pest-identifier';
import type { BehaviorDiagnosis, CoralStressDiagnosis } from '@/lib/pest-identifier';

const PROB_META = {
  high: { label: 'HIGH', color: '#ff4444', bg: 'rgba(255,68,68,0.15)', border: 'rgba(255,68,68,0.3)' },
  medium: { label: 'MEDIUM', color: '#FF7F50', bg: 'rgba(255,127,80,0.15)', border: 'rgba(255,127,80,0.3)' },
  low: { label: 'LOW', color: '#F1C40F', bg: 'rgba(241,196,15,0.15)', border: 'rgba(241,196,15,0.3)' },
};

const URGENCY_META = {
  critical: { label: 'CRITICAL', color: '#ff4444', bg: 'rgba(255,68,68,0.15)', border: 'rgba(255,68,68,0.3)' },
  high: { label: 'HIGH', color: '#FF7F50', bg: 'rgba(255,127,80,0.15)', border: 'rgba(255,127,80,0.3)' },
  medium: { label: 'MEDIUM', color: '#F1C40F', bg: 'rgba(241,196,15,0.15)', border: 'rgba(241,196,15,0.3)' },
};

type Tab = 'fish' | 'coral';

export default function DiagnosticsPage() {
  const [tab, setTab] = useState<Tab>('fish');
  const [expandedFish, setExpandedFish] = useState<string | null>(null);
  const [expandedCoral, setExpandedCoral] = useState<string | null>(null);

  const toggleFish = (id: string) => {
    setExpandedFish(prev => (prev === id ? null : id));
  };

  const toggleCoral = (id: string) => {
    setExpandedCoral(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#c5a3ff] text-xs font-medium uppercase">Troubleshooting</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Reef Diagnostics</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">What&apos;s happening in your tank?</p>
      </div>

      {/* Tab Toggle */}
      <div>
        <div className="flex gap-2 p-1 bg-[#0d1c32] rounded-xl border border-[#1c2a41]">
          <button
            onClick={() => setTab('fish')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'fish'
                ? 'bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/20'
                : 'text-[#8f9097] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">pets</span>
            Fish Behavior
          </button>
          <button
            onClick={() => setTab('coral')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === 'coral'
                ? 'bg-[#FF7F50] text-white shadow-lg shadow-[#FF7F50]/20'
                : 'text-[#8f9097] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">spa</span>
            Coral Stress
          </button>
        </div>
      </div>

      {/* Fish Behavior Tab */}
      {tab === 'fish' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8f9097] mb-1">
            Select a symptom to diagnose
          </p>
          {FISH_BEHAVIOR_DATABASE.map((item: BehaviorDiagnosis) => {
            const isOpen = expandedFish === item.id;
            return (
              <div key={item.id} className="rounded-xl border border-[#1c2a41] overflow-hidden">
                {/* Symptom Card */}
                <button
                  onClick={() => toggleFish(item.id)}
                  className="w-full flex items-center gap-3 p-4 bg-[#0d1c32] hover:bg-[#12233d] transition-colors duration-200 text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.color}18` }}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight">
                      {item.symptom}
                    </p>
                    <p className="text-[#8f9097] text-xs mt-0.5">{item.symptomEs}</p>
                  </div>
                  <span
                    className="material-symbols-outlined text-[#8f9097] text-[20px] transition-transform duration-300 shrink-0"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Diagnoses (expandable) */}
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: isOpen ? `${item.diagnoses.length * 320}px` : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="border-t border-[#1c2a41] bg-[#081628] p-4 flex flex-col gap-3">
                    {item.diagnoses.map((dx, i) => {
                      const meta = PROB_META[dx.probability];
                      return (
                        <div
                          key={i}
                          className="rounded-lg border p-3"
                          style={{
                            borderColor: meta.border,
                            backgroundColor: meta.bg,
                          }}
                        >
                          {/* Condition header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-white text-sm font-semibold leading-tight flex-1">
                              {dx.condition}
                            </p>
                            <span
                              className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full shrink-0"
                              style={{
                                color: meta.color,
                                backgroundColor: `${meta.color}20`,
                                border: `1px solid ${meta.color}40`,
                              }}
                            >
                              {meta.label}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-[#c5c6cd] text-xs leading-relaxed mb-3">
                            {dx.description}
                          </p>

                          {/* Immediate Action */}
                          <div className="rounded-lg bg-[#010e24] border border-[#1c2a41] p-3 mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="material-symbols-outlined text-[#FF7F50] text-[16px]">
                                emergency
                              </span>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-[#FF7F50]">
                                Immediate Action
                              </p>
                            </div>
                            <p className="text-[#c5c6cd] text-xs leading-relaxed">
                              {dx.immediateAction}
                            </p>
                          </div>

                          {/* Link */}
                          <Link
                            href={dx.linkTo}
                            className="flex items-center gap-1.5 text-[#FF7F50] text-xs font-semibold hover:underline"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              arrow_forward
                            </span>
                            Go to related page
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coral Stress Tab */}
      {tab === 'coral' && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#8f9097] mb-1">
            Select a stress signal
          </p>
          {CORAL_STRESS_DATABASE.map((item: CoralStressDiagnosis) => {
            const isOpen = expandedCoral === item.id;
            const urgency = URGENCY_META[item.urgency];
            return (
              <div key={item.id} className="rounded-xl border border-[#1c2a41] overflow-hidden">
                {/* Signal Card */}
                <button
                  onClick={() => toggleCoral(item.id)}
                  className="w-full flex items-center gap-3 p-4 bg-[#0d1c32] hover:bg-[#12233d] transition-colors duration-200 text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${item.color}18` }}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ color: item.color }}
                    >
                      {item.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-semibold leading-tight">
                        {item.signal}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[#8f9097] text-xs">{item.signalEs}</p>
                      <span
                        className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: urgency.color,
                          backgroundColor: `${urgency.color}20`,
                          border: `1px solid ${urgency.color}40`,
                        }}
                      >
                        {urgency.label}
                      </span>
                    </div>
                  </div>
                  <span
                    className="material-symbols-outlined text-[#8f9097] text-[20px] transition-transform duration-300 shrink-0"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Expanded Details */}
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: isOpen ? '500px' : '0px',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="border-t border-[#1c2a41] bg-[#081628] p-4 flex flex-col gap-3">
                    {/* Causes */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-[#c5c6cd] text-[16px]">
                          help_outline
                        </span>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#c5c6cd]">
                          Possible Causes
                        </p>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {item.causes.map((cause, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#c5c6cd] leading-relaxed">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Immediate Action */}
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: urgency.border,
                        backgroundColor: urgency.bg,
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="material-symbols-outlined text-[16px]" style={{ color: urgency.color }}>
                          emergency
                        </span>
                        <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: urgency.color }}>
                          Immediate Action
                        </p>
                      </div>
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">
                        {item.immediateAction}
                      </p>
                    </div>

                    {/* Link */}
                    <Link
                      href={item.linkTo}
                      className="flex items-center gap-1.5 text-[#FF7F50] text-xs font-semibold hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                      Go to related page
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
