'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllTests } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { analyzeCycle } from '@/lib/cycle-engine';
import {
  calculateAcceleratorPlan,
  BACTERIA_PRODUCTS,
  CYCLING_METHODS,
  type CyclingMethod,
  type AcceleratorDose,
  type MethodComparison,
  type BacteriaProduct,
} from '@/lib/bio-accelerator';
import type { CyclePhase } from '@/lib/cycle-engine';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Scenario Alerts ─── */
interface ScenarioAlert {
  id: string;
  title: string;
  icon: string;
  color: string;
  message: string;
  action: string;
  linkTo: string | null;
}

function detectScenarios(tests: WaterTest[], phase: CyclePhase): ScenarioAlert[] {
  const alerts: ScenarioAlert[] = [];
  const latest = tests[0];

  // Scenario 1: Initial cycling
  if (phase === 'starting' || phase === 'ammonia' || phase === 'nitrite' || phase === 'stalled') {
    alerts.push({
      id: 'cycling',
      title: 'Active Cycle Detected',
      icon: 'cycle',
      color: '#4cd6fb',
      message: 'Your tank is cycling. A biological accelerator can reduce cycle time from 36 days to as little as 7 days.',
      action: 'Apply bacteria directly onto bio-media (ceramic rings, Siporax) or live rock for best colonization.',
      linkTo: '/cycle',
    });
  }

  // Scenario 2: Chemical emergency — NH3 > 0.2 or NO2 spike
  if (latest) {
    const nh3 = latest.ammonia ?? 0;
    const no2 = latest.nitrite ?? 0;
    if (nh3 > 0.2) {
      alerts.push({
        id: 'ammonia-spike',
        title: 'Ammonia Spike Detected!',
        icon: 'warning',
        color: '#ff4444',
        message: `NH₃ at ${nh3} ppm (safe: <0.2). Your biological filter is failing or overloaded.`,
        action: 'Do an immediate 25% water change and add a biological accelerator NOW. Dose Seachem Prime to detoxify.',
        linkTo: '/trends',
      });
    }
    if (no2 > 0.2 && phase !== 'nitrite' && phase !== 'ammonia' && phase !== 'starting') {
      alerts.push({
        id: 'nitrite-spike',
        title: 'Nitrite Spike Detected!',
        icon: 'emergency',
        color: '#FF7F50',
        message: `NO₂ at ${no2} ppm (safe: 0). Nitrite is extremely toxic — even 0.5 ppm is dangerous.`,
        action: 'Water change + biological accelerator immediately. Dose Seachem Prime if fish are present.',
        linkTo: '/trends',
      });
    }
  }

  return alerts;
}

/* ─── Constants ─── */
const PHASE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  starting: { label: 'Starting', color: '#4cd6fb', icon: 'hourglass_top' },
  ammonia: { label: 'Ammonia Phase', color: '#FF7F50', icon: 'science' },
  nitrite: { label: 'Nitrite Phase', color: '#F1C40F', icon: 'biotech' },
  clearing: { label: 'Clearing', color: '#2ff801', icon: 'trending_down' },
  complete: { label: 'Complete', color: '#2ff801', icon: 'check_circle' },
  mature: { label: 'Mature', color: '#2ff801', icon: 'verified' },
  stalled: { label: 'Stalled', color: '#ff4444', icon: 'pause_circle' },
};

const TIER_META = {
  essential: { label: 'Essential', color: '#ff4444', icon: 'priority_high' },
  recommended: { label: 'Recommended', color: '#F1C40F', icon: 'thumb_up' },
  optional: { label: 'Optional', color: '#4cd6fb', icon: 'add_circle' },
};

export default function BioAcceleratorPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState<WaterTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'plan' | 'methods' | 'products'>('plan');
  const [selectedMethod, setSelectedMethod] = useState<CyclingMethod>('bottled_bacteria');
  const [expandedMethod, setExpandedMethod] = useState<CyclingMethod | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [manualPhase, setManualPhase] = useState<CyclePhase | null>(null);
  const [tankGallons, setTankGallons] = useState(40);
  const [postTreatment, setPostTreatment] = useState(false);
  const [postWaterChange, setPostWaterChange] = useState(false);

  // Load water tests
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const cached = getCached<WaterTest[]>('water-tests');
    if (cached) { setTests(cached); setLoading(false); }

    getAllTests().then((data: WaterTest[]) => {
      setCache('water-tests', data);
      setTests(data);
      setLoading(false);
    });
  }, [user]);

  // Detect cycle phase from tests
  const cycleStatus = useMemo(() => {
    if (tests.length === 0) return null;
    const sorted = [...tests].sort(
      (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
    );
    return analyzeCycle({
      tests: sorted,
      tankCreatedAt: null,
      tankAgeInDays: 180, // default — mature tank
    });
  }, [tests]);

  const activePhase = manualPhase || cycleStatus?.phase || 'mature';
  const phaseInfo = PHASE_LABELS[activePhase || 'mature'] || PHASE_LABELS.mature;

  // Scenarios
  const scenarios = useMemo(() => {
    const alerts = detectScenarios(tests, activePhase);

    // Scenario 3: Post-treatment
    if (postTreatment) {
      alerts.push({
        id: 'post-treatment',
        title: 'Post-Treatment Recovery',
        icon: 'medication',
        color: '#c5a3ff',
        message: 'Medications destroy nitrifying bacteria. Your biological filter needs to be re-seeded.',
        action: 'Add a full dose of bottled bacteria (Fritz TurboStart or Dr. Tim\'s) immediately. Re-dose in 48 hours. Monitor NH3/NO2 daily for 2 weeks.',
        linkTo: '/quarantine',
      });
    }

    // Scenario 4: Post water change / filter maintenance
    if (postWaterChange) {
      alerts.push({
        id: 'post-maintenance',
        title: 'Post-Maintenance Boost',
        icon: 'mop',
        color: '#F1C40F',
        message: 'Cleaning bio-media or large water changes reduce beneficial bacteria.',
        action: 'Add a maintenance dose (50% of normal) of Seachem Stability or MicroBacter7 to stabilize the colony.',
        linkTo: '/maintenance',
      });
    }

    return alerts;
  }, [tests, activePhase, postTreatment, postWaterChange]);

  // Calculate plan
  const plan = useMemo(() => {
    return calculateAcceleratorPlan(activePhase, tankGallons, selectedMethod);
  }, [activePhase, tankGallons, selectedMethod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#2ff801] animate-pulse">biotech</span>
          <p className="text-[#c5c6cd] text-sm">Loading accelerator…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#2ff801]/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#2ff801] text-2xl">biotech</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#2ff801] text-xs font-medium uppercase">Biological</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Accelerator</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">Bacteria dosing, cycling methods & emergency recovery</p>
      </div>

      {/* Cloudy Water Tooltip */}
      <div className="bg-[#4cd6fb]/8 border border-[#4cd6fb]/15 rounded-2xl p-3 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#4cd6fb] text-lg mt-0.5">info</span>
        <p className="text-[#c5c6cd] text-xs leading-relaxed">
          <span className="text-[#4cd6fb] font-bold">Tip:</span> It&apos;s normal for the water to become briefly cloudy after adding bacteria. This bacterial bloom will clear in a few hours, leaving the water even more crystal clear than before.
        </p>
      </div>

      {/* Scenario Alerts */}
      {scenarios.length > 0 && (
        <div className="space-y-2">
          {scenarios.map(alert => (
            <div key={alert.id} className="rounded-2xl p-4 border" style={{ backgroundColor: `${alert.color}08`, borderColor: `${alert.color}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg" style={{ color: alert.color }}>{alert.icon}</span>
                <p className="font-bold text-sm" style={{ color: alert.color }}>{alert.title}</p>
              </div>
              <p className="text-[#c5c6cd] text-xs mb-2">{alert.message}</p>
              <div className="bg-[#041329] rounded-xl p-3">
                <p className="text-xs text-white leading-relaxed">💊 {alert.action}</p>
              </div>
              {alert.linkTo && (
                <Link href={alert.linkTo} className="flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: alert.color }}>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                  View details
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phase & Settings */}
      <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ color: phaseInfo.color }}>{phaseInfo.icon}</span>
            <div>
              <p className="text-white text-sm font-medium">Current Phase</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: phaseInfo.color }}>{phaseInfo.label}</p>
            </div>
          </div>
          {cycleStatus && (
            <div className="text-right">
              <p className="text-[10px] text-[#c5c6cd]/40">Auto-detected</p>
              <p className="text-xs text-[#c5c6cd]/60">from water tests</p>
            </div>
          )}
        </div>

        {/* Manual Phase Override */}
        <div>
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider mb-2">Override Phase</p>
          <div className="flex gap-1.5 flex-wrap">
            {(['starting', 'ammonia', 'nitrite', 'clearing', 'complete', 'stalled', 'mature'] as CyclePhase[]).map(p => {
              const meta = PHASE_LABELS[p || ''] || PHASE_LABELS.mature;
              const isActive = activePhase === p;
              return (
                <button
                  key={p}
                  onClick={() => setManualPhase(p === manualPhase ? null : p)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    backgroundColor: isActive ? `${meta.color}20` : '#041329',
                    color: isActive ? meta.color : '#c5c6cd50',
                    border: `1px solid ${isActive ? `${meta.color}40` : 'transparent'}`,
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tank Gallons */}
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider">Tank Size</p>
          <div className="flex items-center gap-2 bg-[#041329] rounded-xl px-3 py-1.5">
            <button onClick={() => setTankGallons(Math.max(5, tankGallons - 5))} className="text-[#c5c6cd]/50 active:text-white">
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <span className="text-white font-bold text-sm min-w-[3rem] text-center">{tankGallons} gal</span>
            <button onClick={() => setTankGallons(Math.min(500, tankGallons + 5))} className="text-[#c5c6cd]/50 active:text-white">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        {/* Scenario Toggles */}
        <div className="space-y-2">
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider">Situation</p>
          <button
            onClick={() => setPostTreatment(!postTreatment)}
            className="w-full flex items-center gap-3 bg-[#041329] rounded-xl p-3 text-left"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${postTreatment ? 'bg-[#c5a3ff] border-[#c5a3ff]' : 'border-[#1c2a41]'}`}>
              {postTreatment && <span className="material-symbols-outlined text-white text-xs">check</span>}
            </div>
            <div>
              <p className="text-white text-xs font-medium">Just finished medication/treatment</p>
              <p className="text-[10px] text-[#c5c6cd]/40">Meds destroy nitrifying bacteria — needs re-seeding</p>
            </div>
          </button>
          <button
            onClick={() => setPostWaterChange(!postWaterChange)}
            className="w-full flex items-center gap-3 bg-[#041329] rounded-xl p-3 text-left"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${postWaterChange ? 'bg-[#F1C40F] border-[#F1C40F]' : 'border-[#1c2a41]'}`}>
              {postWaterChange && <span className="material-symbols-outlined text-[#041329] text-xs">check</span>}
            </div>
            <div>
              <p className="text-white text-xs font-medium">Just cleaned filters or big water change</p>
              <p className="text-[10px] text-[#c5c6cd]/40">Maintenance dose to stabilize colonies</p>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['plan', '💊 Dosing Plan'], ['methods', '🔬 Methods'], ['products', '🛒 Products']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-[#2ff801]/15 text-[#2ff801]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Dosing Plan Tab ═══ */}
      {tab === 'plan' && (
        <div className="space-y-4">
          {/* Application Instruction */}
          <div className="bg-[#2ff801]/8 border border-[#2ff801]/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#2ff801]">tips_and_updates</span>
              <p className="text-[#2ff801] font-bold text-sm">Application Method</p>
            </div>
            <p className="text-[#c5c6cd] text-xs leading-relaxed">
              Pour bacteria <span className="text-white font-bold">directly onto biological filter media</span> (ceramic rings, Siporax, Matrix) or onto live rock — NOT into open water. This gives bacteria a surface to colonize immediately.
            </p>
          </div>

          {/* Essential Products */}
          {plan.essentialDoses.length > 0 && (
            <DoseSection
              title="Essential"
              tier="essential"
              doses={plan.essentialDoses}
              expandedProduct={expandedProduct}
              setExpandedProduct={setExpandedProduct}
            />
          )}

          {/* Recommended */}
          {plan.recommendedDoses.length > 0 && (
            <DoseSection
              title="Recommended"
              tier="recommended"
              doses={plan.recommendedDoses}
              expandedProduct={expandedProduct}
              setExpandedProduct={setExpandedProduct}
            />
          )}

          {/* Optional */}
          {plan.optionalDoses.length > 0 && (
            <DoseSection
              title="Nice to Have"
              tier="optional"
              doses={plan.optionalDoses}
              expandedProduct={expandedProduct}
              setExpandedProduct={setExpandedProduct}
            />
          )}

          {/* No products for this phase */}
          {plan.essentialDoses.length === 0 && plan.recommendedDoses.length === 0 && (
            <div className="bg-[#0d1c32] rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-[#2ff801] mb-2 block">check_circle</span>
              <p className="text-white font-medium">No accelerator needed</p>
              <p className="text-[#c5c6cd]/50 text-xs mt-1">Your tank phase doesn&apos;t require bacterial supplementation right now.</p>
            </div>
          )}

          {/* Tips */}
          {plan.tips.length > 0 && (
            <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest">Phase Tips</p>
              {plan.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#F1C40F] text-xs mt-0.5">•</span>
                  <p className="text-[#c5c6cd] text-xs leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div className="bg-[#ff4444]/8 border border-[#ff4444]/15 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-widest">Warnings</p>
              {plan.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                  <p className="text-[#ffb4ab] text-xs leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ Methods Tab ═══ */}
      {tab === 'methods' && (
        <div className="space-y-3">
          <p className="text-[#c5c6cd] text-xs mb-1">Compare cycling methods — tap to see full details:</p>
          {CYCLING_METHODS.map(m => {
            const isExpanded = expandedMethod === m.method;
            const isSelected = selectedMethod === m.method;
            return (
              <div key={m.method}>
                <button
                  onClick={() => setExpandedMethod(isExpanded ? null : m.method)}
                  className={`w-full bg-[#0d1c32] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform ${isSelected ? 'ring-1' : ''}`}
                  style={isSelected ? { boxShadow: `inset 0 0 0 1px ${m.color}40` } : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${m.color}15` }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: m.color }}>{m.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{m.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px]" style={{ color: m.color }}>⏱ {m.speed}</span>
                        <span className="text-[10px] text-[#c5c6cd]/40">{m.difficulty}</span>
                        <span className="text-[10px] text-[#c5c6cd]/40">{m.cost}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <MethodDetail method={m} isSelected={isSelected} onSelect={() => setSelectedMethod(m.method)} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Products Tab ═══ */}
      {tab === 'products' && (
        <div className="space-y-3">
          <p className="text-[#c5c6cd] text-xs mb-1">Complete bacteria product catalog:</p>
          {BACTERIA_PRODUCTS.map(product => {
            const isExpanded = expandedProduct === product.id;
            const tier = TIER_META[product.tier];
            return (
              <div key={product.id}>
                <button
                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  className="w-full bg-[#0d1c32] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${product.color}15` }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: product.color }}>{product.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{product.brand} {product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tier.color}15`, color: tier.color }}>
                          {tier.label}
                        </span>
                        <span className="text-[10px] text-[#c5c6cd]/40">{product.priceRange}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-3 mr-1 space-y-3">
                    <p className="text-[#c5c6cd] text-xs leading-relaxed">{product.description}</p>

                    {/* Dose calc */}
                    <div className="bg-[#041329] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-wider mb-1">Your Dose ({tankGallons} gal)</p>
                      <p className="text-white text-lg font-bold">
                        {Math.round(product.dosePerGallon * tankGallons * 10) / 10} {product.doseUnit}
                      </p>
                      <p className="text-[#c5c6cd]/50 text-[10px] mt-0.5">{product.frequencyLabel}</p>
                    </div>

                    {/* Strains */}
                    {product.strains.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase mb-1">Bacteria Strains</p>
                        <div className="flex gap-1 flex-wrap">
                          {product.strains.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-lg bg-[#041329] text-[10px] text-[#4cd6fb]">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phase relevance */}
                    <div>
                      <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase mb-1">Useful During</p>
                      <div className="flex gap-1 flex-wrap">
                        {product.phaseRelevance.map(p => {
                          const meta = PHASE_LABELS[p || ''];
                          return meta ? (
                            <span key={p} className="px-2 py-0.5 rounded-lg text-[10px] font-medium" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                              {meta.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <p className="text-[#c5c6cd] text-xs"><span className="text-[#F1C40F]">💡</span> {product.notes}</p>

                    {/* Warnings */}
                    {product.warnings.length > 0 && (
                      <div className="space-y-1">
                        {product.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                            <p className="text-[#ffb4ab] text-[10px]">{w}</p>
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

/* ─── Sub-components ─── */

function DoseSection({
  title,
  tier,
  doses,
  expandedProduct,
  setExpandedProduct,
}: {
  title: string;
  tier: 'essential' | 'recommended' | 'optional';
  doses: AcceleratorDose[];
  expandedProduct: string | null;
  setExpandedProduct: (id: string | null) => void;
}) {
  const meta = TIER_META[tier];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-sm" style={{ color: meta.color }}>{meta.icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>{title}</p>
      </div>
      <div className="space-y-2">
        {doses.map(dose => {
          const isExpanded = expandedProduct === dose.product.id;
          return (
            <div key={dose.product.id}>
              <button
                onClick={() => setExpandedProduct(isExpanded ? null : dose.product.id)}
                className="w-full bg-[#0d1c32] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${dose.product.color}15` }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: dose.product.color }}>{dose.product.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{dose.product.brand} {dose.product.name}</p>
                    <p className="text-[10px] text-[#c5c6cd]/50">{dose.schedule}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color: dose.product.color }}>{dose.totalDose}</p>
                    <p className="text-[10px] text-[#c5c6cd]/40">{dose.doseUnit}</p>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-3 mr-1 space-y-3">
                  <p className="text-[#c5c6cd] text-xs leading-relaxed">{dose.phaseAdvice}</p>
                  <p className="text-[#c5c6cd] text-xs opacity-60">{dose.product.description}</p>
                  {dose.product.warnings.length > 0 && (
                    <div className="space-y-1">
                      {dose.product.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                          <p className="text-[#ffb4ab] text-[10px]">{w}</p>
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
    </div>
  );
}

function MethodDetail({ method: m, isSelected, onSelect }: { method: MethodComparison; isSelected: boolean; onSelect: () => void }) {
  return (
    <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-3 mr-1 space-y-3">
      <p className="text-[#c5c6cd] text-xs italic">{m.bestFor}</p>

      {/* Pros */}
      <div>
        <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-wider mb-1">Pros</p>
        {m.pros.map((p, i) => (
          <div key={i} className="flex items-start gap-2 mb-1">
            <span className="text-[#2ff801] text-xs">✓</span>
            <p className="text-[#c5c6cd] text-xs">{p}</p>
          </div>
        ))}
      </div>

      {/* Cons */}
      <div>
        <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-wider mb-1">Cons</p>
        {m.cons.map((c, i) => (
          <div key={i} className="flex items-start gap-2 mb-1">
            <span className="text-[#ff4444] text-xs">✗</span>
            <p className="text-[#c5c6cd] text-xs">{c}</p>
          </div>
        ))}
      </div>

      {/* Steps */}
      <div>
        <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-wider mb-1">Step by Step</p>
        {m.steps.map((s, i) => (
          <div key={i} className="flex items-start gap-2 mb-1.5">
            <span className="text-xs font-bold w-4 shrink-0" style={{ color: m.color }}>{i + 1}.</span>
            <p className="text-[#c5c6cd] text-xs">{s}</p>
          </div>
        ))}
      </div>

      {/* Select Method Button */}
      {!isSelected && (
        <button
          onClick={onSelect}
          className="w-full py-2 rounded-xl text-xs font-bold transition-all"
          style={{ backgroundColor: `${m.color}15`, color: m.color }}
        >
          Use This Method
        </button>
      )}
      {isSelected && (
        <div className="flex items-center justify-center gap-1 py-2 text-xs" style={{ color: m.color }}>
          <span className="material-symbols-outlined text-sm">check_circle</span>
          Selected Method
        </div>
      )}
    </div>
  );
}
