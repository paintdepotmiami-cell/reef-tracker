'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnimals, getEquipment } from '@/lib/queries';
import type { Animal, Equipment } from '@/lib/queries';
import { generateFlowReport, type FlowReport, type PumpRecommendation, type ZoneAnalysis } from '@/lib/flow-optimizer';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

export default function FlowPage() {
  const { user, tank } = useAuth();
  const [report, setReport] = useState<FlowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPump, setExpandedPump] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 6000);

    Promise.allSettled([
      getCached<Animal[]>('animals') ? Promise.resolve(getCached<Animal[]>('animals')!) : getAnimals().then(a => { setCache('animals', a); return a; }),
      getCached<Equipment[]>('equipment') ? Promise.resolve(getCached<Equipment[]>('equipment')!) : getEquipment().then(e => { setCache('equipment', e); return e; }),
    ]).then(results => {
      const animals = results[0].status === 'fulfilled' ? results[0].value : [];
      const equipment = results[1].status === 'fulfilled' ? results[1].value : [];
      if (animals.length > 0) {
        const r = generateFlowReport(
          animals as Animal[],
          equipment as Equipment[],
          tank?.name || 'My Tank',
          tank?.size_gallons || 40,
        );
        setReport(r);
      }
    }).finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user, tank]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-[#4cd6fb] animate-pulse">water</span>
        <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Analyzing flow...</p>
      </div>
    </div>
  );

  if (!report) return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">water</span>
      <p className="text-[#c5c6cd] text-sm">No data available for flow analysis.</p>
    </div>
  );

  const scoreColor = report.overallScore >= 80 ? 'text-[#2ff801]' : report.overallScore >= 60 ? 'text-[#F1C40F]' : 'text-[#ffb4ab]';
  const scoreBg = report.overallScore >= 80 ? 'bg-[#2ff801]/10' : report.overallScore >= 60 ? 'bg-[#F1C40F]/10' : 'bg-[#ffb4ab]/10';

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/gear" className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#c5c6cd] text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#4cd6fb] text-xs font-medium uppercase">AI Analysis</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Flow Optimizer</h1>
        </div>
        <div className={`${scoreBg} px-3 py-2 rounded-xl text-center`}>
          <span className={`text-2xl font-[family-name:var(--font-headline)] font-bold ${scoreColor}`}>{report.overallScore}</span>
          <p className="text-[8px] text-[#c5c6cd] uppercase tracking-wider">Score</p>
        </div>
      </div>

      {/* Tank Summary */}
      <div className="glass-card rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#4cd6fb]/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#4cd6fb]">water</span>
        </div>
        <div>
          <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{report.tankName}</p>
          <p className="text-[10px] text-[#c5c6cd]">{report.tankGallons} gal &middot; {report.totalCorals} corals &middot; {report.pumps.length} pumps</p>
        </div>
      </div>

      {/* Visual Tank Diagram */}
      <section className="space-y-3">
        <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold text-[#ffb59c] uppercase tracking-widest">Tank Cross-Section</h2>
        <div className="bg-[#0d1c32] rounded-2xl p-4 relative overflow-hidden" style={{ minHeight: '240px' }}>
          {/* Tank outline */}
          <div className="relative w-full border-2 border-[#27354c] rounded-lg" style={{ height: '220px' }}>
            {/* Water gradient */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#4cd6fb]/5 via-[#4cd6fb]/3 to-[#0d1c32]" />

            {/* Zone labels */}
            {report.zones.map(zone => (
              <div
                key={zone.zone}
                className="absolute left-0 right-0 border-t border-dashed border-[#27354c]/50 flex items-start"
                style={{
                  bottom: `${zone.yRange[0]}%`,
                  height: `${zone.yRange[1] - zone.yRange[0]}%`,
                }}
              >
                <span className="text-[8px] text-[#c5c6cd]/50 uppercase tracking-wider ml-1 mt-0.5">{zone.zone}</span>
                {zone.corals.length > 0 && (
                  <span className="text-[8px] text-[#4cd6fb]/40 ml-auto mr-1 mt-0.5">{zone.corals.length}</span>
                )}
              </div>
            ))}

            {/* Pump indicators */}
            {report.pumps.map((pump, i) => {
              const isLeft = pump.currentSide === 'left';
              const isRight = pump.currentSide === 'right';
              const isBack = pump.currentSide === 'back';
              const color = pump.movable ? '#4cd6fb' : '#c5c6cd';

              return (
                <div
                  key={i}
                  className="absolute flex items-center gap-1 z-10"
                  style={{
                    bottom: `${pump.recommendedY}%`,
                    left: isLeft ? '4px' : isBack ? '45%' : undefined,
                    right: isRight ? '4px' : undefined,
                    transform: 'translateY(50%)',
                  }}
                >
                  {/* Pump icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${pump.movable ? 'border-[#4cd6fb] bg-[#4cd6fb]/20' : 'border-[#c5c6cd]/40 bg-[#c5c6cd]/10'}`}
                  >
                    <span className="material-symbols-outlined text-xs" style={{ color }}>
                      {pump.movable ? 'waves' : 'lock'}
                    </span>
                  </div>

                  {/* Flow arrows */}
                  {pump.movable && (
                    <div className="flex items-center">
                      {isLeft && (
                        <div className="flex items-center gap-px">
                          <div className="w-6 h-[2px] rounded-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
                          <span className="material-symbols-outlined text-[10px]" style={{ color }}>arrow_forward</span>
                        </div>
                      )}
                      {isRight && (
                        <div className="flex items-center gap-px flex-row-reverse">
                          <div className="w-6 h-[2px] rounded-full" style={{ background: `linear-gradient(to left, ${color}, transparent)` }} />
                          <span className="material-symbols-outlined text-[10px]" style={{ color }}>arrow_back</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Label */}
                  <span className="text-[7px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color }}>
                    {pump.name.includes('izquierda') || pump.name.includes('left') ? 'L' :
                     pump.name.includes('derecha') || pump.name.includes('right') ? 'R' : 'RET'}
                  </span>
                </div>
              );
            })}

            {/* Coral dots in zones */}
            {report.zones.map(zone =>
              zone.corals.slice(0, 8).map((c, ci) => {
                const flowColor = c.flowNeed === 'Low' ? '#2ff801' :
                  c.flowNeed === 'Low-Medium' ? '#2ff801' :
                  c.flowNeed === 'Medium' ? '#F1C40F' :
                  c.flowNeed === 'Medium-High' ? '#FF7F50' : '#ffb4ab';

                return (
                  <div
                    key={`${zone.zone}-${ci}`}
                    className="absolute w-2 h-2 rounded-full opacity-60"
                    style={{
                      backgroundColor: flowColor,
                      bottom: `${zone.yRange[0] + (zone.yRange[1] - zone.yRange[0]) * (0.3 + Math.random() * 0.4)}%`,
                      left: `${15 + ci * 10 + Math.random() * 5}%`,
                      boxShadow: `0 0 4px ${flowColor}`,
                    }}
                    title={c.name}
                  />
                );
              })
            )}

            {/* Sand bed */}
            <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-gradient-to-t from-[#c4a46c]/15 to-transparent rounded-b-lg" />
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 justify-center flex-wrap">
            {[
              { color: '#2ff801', label: 'Low flow' },
              { color: '#F1C40F', label: 'Medium' },
              { color: '#FF7F50', label: 'Med-High' },
              { color: '#4cd6fb', label: 'Pump (movable)' },
              { color: '#c5c6cd', label: 'Return (fixed)' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[8px] text-[#c5c6cd]/60">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pump Recommendations */}
      <section className="space-y-3">
        <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold text-[#ffb59c] uppercase tracking-widest">Pump Placement</h2>
        <div className="space-y-3">
          {report.pumps.map((pump, i) => (
            <div
              key={i}
              className={`bg-[#0d1c32] rounded-xl overflow-hidden border-l-4 ${pump.movable ? 'border-[#4cd6fb]' : 'border-[#c5c6cd]/30'}`}
            >
              <button
                onClick={() => setExpandedPump(expandedPump === i ? null : i)}
                className="w-full p-4 flex items-start gap-3 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pump.movable ? 'bg-[#4cd6fb]/10' : 'bg-[#c5c6cd]/10'}`}>
                  <span className={`material-symbols-outlined ${pump.movable ? 'text-[#4cd6fb]' : 'text-[#c5c6cd]'}`}>
                    {pump.movable ? 'waves' : 'lock'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm">{pump.name}</p>
                  <p className="text-[10px] text-[#FF7F50]/60">{pump.brand}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#4cd6fb]/10 text-[#4cd6fb]">
                      {pump.recommendedMode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-[#c5c6cd]">
                      {pump.recommendedIntensity}
                    </span>
                    {!pump.movable && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#c5c6cd]/10 text-[#c5c6cd]">
                        Fixed
                      </span>
                    )}
                  </div>
                </div>
                <span className={`material-symbols-outlined text-[#c5c6cd] text-sm transition-transform ${expandedPump === i ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {expandedPump === i && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Position */}
                  <div className="bg-[#041329] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4cd6fb] text-sm">pin_drop</span>
                      <span className="text-[9px] font-bold text-[#c5c6cd] uppercase tracking-widest">Position</span>
                    </div>
                    <p className="text-xs text-white">{pump.currentSide.charAt(0).toUpperCase() + pump.currentSide.slice(1)} wall — {Math.round(pump.recommendedY)}% from bottom</p>
                    <p className="text-xs text-[#c5c6cd]">{pump.angle}</p>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-[#041329] rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#FF7F50] text-sm">psychology</span>
                      <span className="text-[9px] font-bold text-[#c5c6cd] uppercase tracking-widest">AI Analysis</span>
                    </div>
                    <p className="text-xs text-[#c5c6cd] leading-relaxed">{pump.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Zone Breakdown */}
      <section className="space-y-3">
        <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold text-[#ffb59c] uppercase tracking-widest">Zone Analysis</h2>
        <div className="space-y-2">
          {report.zones.map(zone => {
            const statusColor = zone.status === 'optimal' ? '#2ff801' :
              zone.status === 'needs-more' ? '#F1C40F' :
              zone.status === 'empty' ? '#c5c6cd' : '#ffb4ab';

            return (
              <div key={zone.zone} className="bg-[#0d1c32] rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${statusColor}15` }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: statusColor }}>
                    {zone.status === 'optimal' ? 'check_circle' : zone.status === 'empty' ? 'remove_circle_outline' : 'tune'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm">{zone.zone}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                      {zone.dominantFlow}
                    </span>
                    <span className="text-[9px] text-[#8f9097]">{zone.corals.length} coral{zone.corals.length !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-[10px] text-[#c5c6cd] mt-1 leading-relaxed">{zone.note}</p>
                  {zone.corals.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {zone.corals.slice(0, 5).map(c => (
                        <span key={c.name} className="text-[8px] text-[#8f9097] bg-[#041329] px-1.5 py-0.5 rounded">
                          {c.name.split(':')[0].split('(')[0].trim()}
                        </span>
                      ))}
                      {zone.corals.length > 5 && (
                        <span className="text-[8px] text-[#8f9097] bg-[#041329] px-1.5 py-0.5 rounded">
                          +{zone.corals.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold text-[#ffb4ab] uppercase tracking-widest">Warnings</h2>
          <div className="space-y-2">
            {report.warnings.map((w, i) => (
              <div key={i} className="bg-[#93000a]/10 rounded-xl p-3 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#ffb4ab] text-sm shrink-0 mt-0.5">warning</span>
                <p className="text-xs text-[#ffb4ab] leading-relaxed">{w}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pro Tips */}
      <section className="space-y-3">
        <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold text-[#2ff801] uppercase tracking-widest">Pro Tips</h2>
        <div className="space-y-2">
          {report.tips.map((tip, i) => (
            <div key={i} className="bg-[#2ff801]/5 rounded-xl p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#2ff801] text-sm shrink-0 mt-0.5">lightbulb</span>
              <p className="text-xs text-[#2ff801]/80 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
