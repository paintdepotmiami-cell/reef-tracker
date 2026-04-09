'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAllTests } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { analyzeCycle } from '@/lib/cycle-engine';
import type { CyclePhase } from '@/lib/cycle-engine';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Phase Knowledge Base ─── */
interface PhaseGuide {
  phase: CyclePhase;
  title: string;
  duration: string;
  icon: string;
  color: string;
  what: string;
  biology: string;
  doList: string[];
  dontList: string[];
  products: { name: string; why: string }[];
  targetReadings: { param: string; value: string }[];
}

const PHASE_GUIDES: PhaseGuide[] = [
  {
    phase: 'starting',
    title: 'Getting Started',
    duration: 'Day 1-3',
    icon: 'hourglass_top',
    color: '#4cd6fb',
    what: 'Your tank is brand new. The water is sterile — no beneficial bacteria exist yet. You need to introduce an ammonia source to feed the bacteria that will colonize your rock and sand.',
    biology: 'Nitrifying bacteria (Nitrosomonas and Nitrobacter) need ammonia as food to establish colonies on porous surfaces like live rock and sand. Without an ammonia source, the cycle cannot begin.',
    doList: [
      'Add live rock or dry rock (1-1.5 lbs per gallon)',
      'Add an ammonia source: raw shrimp, fish food, or pure ammonia (Dr. Tim\'s)',
      'Ensure temperature is 76-80\u00b0F and salinity is 35 ppt',
      'Run all equipment: skimmer, heater, circulation pumps',
      'Keep lights OFF to prevent algae during cycling (dark mode)',
      'Test every 2-3 days for ammonia, nitrite, and nitrate',
    ],
    dontList: [
      'Do NOT add any fish, corals, or invertebrates',
      'Do NOT do water changes (ammonia needs to stay for bacteria)',
      'Do NOT add carbon or GFO (let the cycle happen naturally)',
      'Do NOT panic if water gets cloudy (bacterial bloom is normal)',
    ],
    products: [
      { name: 'Dr. Tim\'s Ammonium Chloride', why: 'Precise ammonia dosing without the mess of a dead shrimp' },
      { name: 'Fritz TurboStart 900', why: 'Live bacteria to dramatically speed up the cycle (days vs weeks)' },
      { name: 'Dr. Tim\'s One & Only', why: 'Live nitrifying bacteria to seed your rock and sand' },
    ],
    targetReadings: [
      { param: 'Ammonia (NH\u2083)', value: '1.0 - 2.0 ppm' },
      { param: 'Nitrite (NO\u2082)', value: '0 ppm (not started yet)' },
      { param: 'Nitrate (NO\u2083)', value: '0 ppm (not started yet)' },
    ],
  },
  {
    phase: 'ammonia',
    title: 'Ammonia Spike',
    duration: 'Day 3-10',
    icon: 'science',
    color: '#FF7F50',
    what: 'Ammonia is detectable! This means your source is working. Nitrosomonas bacteria are beginning to colonize and will start converting ammonia to nitrite. This phase typically lasts 1-2 weeks.',
    biology: 'Nitrosomonas bacteria oxidize ammonia (NH\u2083) into nitrite (NO\u2082). As their colony grows, ammonia will start dropping. You may see a bacterial bloom (cloudy water) — this is a GOOD sign.',
    doList: [
      'Continue testing every 2-3 days',
      'Maintain temperature at 76-80\u00b0F (bacteria work faster in warmth)',
      'Keep ammonia source active if levels drop below 1 ppm',
      'Run powerheads for oxygenation (bacteria need O\u2082)',
      'Be patient — this is the hardest part of the wait',
    ],
    dontList: [
      'Do NOT add any livestock — ammonia is lethal to fish',
      'Do NOT do water changes unless ammonia exceeds 5+ ppm',
      'Do NOT turn on lights yet',
      'Do NOT clean the glass or disturb the rock',
    ],
    products: [
      { name: 'Fritz TurboStart 900', why: 'If cycle is slow, add a booster dose of live bacteria' },
      { name: 'Seachem Stability', why: 'Daily dose of bacterial blend to accelerate colonization' },
    ],
    targetReadings: [
      { param: 'Ammonia (NH\u2083)', value: '1.0 - 4.0 ppm (will spike then drop)' },
      { param: 'Nitrite (NO\u2082)', value: 'Should start appearing (>0.25 ppm)' },
      { param: 'Nitrate (NO\u2083)', value: '0 ppm or trace' },
    ],
  },
  {
    phase: 'nitrite',
    title: 'Nitrite Conversion',
    duration: 'Week 2-4',
    icon: 'biotech',
    color: '#F1C40F',
    what: 'Nitrite is rising — this means Nitrosomonas are working! Now Nitrobacter bacteria need to establish to convert the toxic nitrite into relatively harmless nitrate. This is the LONGEST phase.',
    biology: 'Nitrobacter bacteria oxidize nitrite (NO\u2082) into nitrate (NO\u2083). They grow slower than Nitrosomonas, which is why this phase takes longer. Nitrite is actually MORE toxic than ammonia to marine life.',
    doList: [
      'Test every 2-3 days — watch for nitrite peak and decline',
      'You should see nitrate (NO\u2083) starting to appear',
      'Keep ammonia source active but reduced',
      'Maintain water temperature and circulation',
      'Watch for ammonia dropping to near-zero (Phase 1 success!)',
    ],
    dontList: [
      'Do NOT add livestock — nitrite is extremely toxic',
      'Do NOT get discouraged — nitrite can stay high for 2-4 weeks',
      'Do NOT do large water changes (let bacteria establish)',
    ],
    products: [
      { name: 'Seachem Prime', why: 'Detoxifies nitrite temporarily if levels get dangerously high (>5 ppm)' },
    ],
    targetReadings: [
      { param: 'Ammonia (NH\u2083)', value: 'Dropping toward 0' },
      { param: 'Nitrite (NO\u2082)', value: '1.0 - 5.0+ ppm (will peak then crash)' },
      { param: 'Nitrate (NO\u2083)', value: 'Rising (5-40+ ppm) — this is GOOD' },
    ],
  },
  {
    phase: 'clearing',
    title: 'Almost There!',
    duration: 'Week 3-5',
    icon: 'trending_down',
    color: '#2ff801',
    what: 'Both ammonia and nitrite are declining! Your bacterial colonies are maturing and can handle the bioload. You are very close to completion.',
    biology: 'Both Nitrosomonas and Nitrobacter colonies are now large enough to process ammonia and nitrite as fast as they\'re produced. The nitrogen cycle is establishing equilibrium.',
    doList: [
      'Test every 2 days — looking for NH\u2083=0 and NO\u2082=0',
      'Need 2-3 consecutive tests with both at zero to confirm',
      'Start planning your first livestock (cleanup crew)',
      'Research compatible species on the Species Library',
      'Prepare for a 25% water change before adding life',
    ],
    dontList: [
      'Do NOT add livestock yet — wait for confirmed zero readings',
      'Do NOT rush — one more week of patience saves lives',
    ],
    products: [],
    targetReadings: [
      { param: 'Ammonia (NH\u2083)', value: 'Approaching 0 ppm' },
      { param: 'Nitrite (NO\u2082)', value: 'Approaching 0 ppm' },
      { param: 'Nitrate (NO\u2083)', value: '10-40 ppm (will reduce with water change)' },
    ],
  },
  {
    phase: 'complete',
    title: 'Cycle Complete!',
    duration: 'Week 4-6',
    icon: 'check_circle',
    color: '#2ff801',
    what: 'Congratulations! Your nitrogen cycle is complete. Ammonia and nitrite are consistently zero across multiple tests. Your biological filter is established and ready for life!',
    biology: 'Your live rock and sand now host thriving colonies of nitrifying bacteria. They can convert ammonia \u2192 nitrite \u2192 nitrate continuously. Nitrate will be managed through water changes and natural filtration.',
    doList: [
      'Do a 25% water change to reduce accumulated nitrate',
      'Turn on your lights (start at 50% intensity, ramp up over 2 weeks)',
      'Add your first cleanup crew: 5-10 snails + 3-5 hermit crabs',
      'Wait 1-2 weeks, then add first hardy corals (zoanthids, mushrooms)',
      'Continue weekly water testing',
      'Start your maintenance routine (see Maintenance tab)',
    ],
    dontList: [
      'Do NOT add too many animals at once (1-2 per week max)',
      'Do NOT add aggressive fish first (peaceful species first)',
      'Do NOT add SPS corals yet (wait 3-6 months for stability)',
      'Do NOT stop testing — the first 3 months are critical',
    ],
    products: [
      { name: 'Reef-Roids', why: 'Start feeding corals once they\'re in the tank' },
      { name: 'Brightwell Restor', why: 'Amino acids help new corals acclimate and color up' },
    ],
    targetReadings: [
      { param: 'Ammonia (NH\u2083)', value: '0 ppm (must stay zero!)' },
      { param: 'Nitrite (NO\u2082)', value: '0 ppm (must stay zero!)' },
      { param: 'Nitrate (NO\u2083)', value: '<20 ppm after water change' },
    ],
  },
  {
    phase: 'stalled',
    title: 'Cycle Stalled',
    duration: 'Intervention needed',
    icon: 'pause_circle',
    color: '#ff6b6b',
    what: 'Your readings haven\'t changed in several tests. The cycle may have stalled due to temperature, pH issues, or insufficient bacteria. Don\'t worry — this is fixable!',
    biology: 'Nitrifying bacteria are sensitive to temperature (<72\u00b0F slows them), pH (<7.5 inhibits them), and oxygen levels. A stall means conditions are suboptimal for bacterial growth.',
    doList: [
      'Check temperature: must be 76-82\u00b0F (bacteria need warmth)',
      'Check pH: should be 7.8-8.4',
      'Ensure good circulation and oxygenation',
      'Add bottled bacteria (Dr. Tim\'s or Fritz TurboStart)',
      'Verify ammonia source is still active (>1 ppm)',
      'Consider adding a piece of cured live rock from an established tank',
    ],
    dontList: [
      'Do NOT give up — every cycle completes eventually',
      'Do NOT add livestock to "speed things up" (it will kill them)',
    ],
    products: [
      { name: 'Fritz TurboStart 900', why: 'Fresh dose of live bacteria to restart the process' },
      { name: 'Dr. Tim\'s One & Only', why: 'Alternative live bacteria source' },
      { name: 'Seachem Stability', why: 'Daily bacterial supplement' },
    ],
    targetReadings: [
      { param: 'Temperature', value: '76-82\u00b0F (critical for bacteria)' },
      { param: 'pH', value: '7.8-8.4' },
      { param: 'Ammonia', value: 'Should be >1 ppm (add source if needed)' },
    ],
  },
];

/* ─── Simple inline chart ─── */
function MiniChart({ tests, param, color, label }: { tests: WaterTest[]; param: 'ammonia' | 'nitrite' | 'nitrate'; color: string; label: string }) {
  const sorted = [...tests].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
  const values = sorted.map(t => (t[param] as number) ?? 0);
  if (values.length === 0) return null;

  const max = Math.max(...values, 0.5);
  const w = 100 / Math.max(values.length - 1, 1);

  const points = values.map((v, i) => `${i * w},${100 - (v / max) * 85}`).join(' ');
  const latestVal = values[values.length - 1];

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
        <span className="text-xs font-extrabold" style={{ color }}>{latestVal.toFixed(latestVal < 1 ? 2 : 1)}</span>
      </div>
      <div className="h-16 bg-[#041329] rounded-lg overflow-hidden relative">
        {values.length > 1 ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Area fill */}
            <polygon
              points={`0,100 ${points} 100,100`}
              fill={`${color}15`}
            />
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Latest point dot */}
            {values.length > 0 && (
              <circle
                cx={(values.length - 1) * w}
                cy={100 - (latestVal / max) * 85}
                r="3"
                fill={color}
              />
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-lg font-extrabold" style={{ color }}>{latestVal.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="text-[8px] text-[#8f9097] mt-1 text-center">ppm</p>
    </div>
  );
}

/* ─── Main Page ─── */
export default function CyclePage() {
  const { user, tank } = useAuth();
  const [tests, setTests] = useState<WaterTest[]>(getCached<WaterTest[]>('allTests') || []);
  const [loading, setLoading] = useState(!getCached('allTests'));
  const [expandedPhase, setExpandedPhase] = useState<CyclePhase>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getAllTests().then(t => {
      setTests(t);
      setCache('allTests', t);
      setLoading(false);
    });
  }, [user]);

  const now = new Date();
  const tankAge = tank?.created_at
    ? Math.floor((now.getTime() - new Date(tank.created_at).getTime()) / 86400000)
    : 999;

  const cycleStatus = analyzeCycle({
    tests,
    tankCreatedAt: tank?.created_at || null,
    tankAgeInDays: tankAge,
  });

  // Get the current phase guide
  const currentGuide = PHASE_GUIDES.find(g => g.phase === cycleStatus.phase);

  // Cycle-relevant tests (ammonia, nitrite, nitrate not null)
  const cycleTests = tests.filter(t =>
    t.ammonia != null || t.nitrite != null || t.nitrate != null
  );

  // Phase steps for timeline
  const phases = [
    { key: 'starting', label: 'Start', icon: 'hourglass_top' },
    { key: 'ammonia', label: 'NH\u2083 Spike', icon: 'science' },
    { key: 'nitrite', label: 'NO\u2082 Peak', icon: 'biotech' },
    { key: 'clearing', label: 'Clearing', icon: 'trending_down' },
    { key: 'complete', label: 'Complete', icon: 'check_circle' },
  ];
  const currentIdx = phases.findIndex(p => p.key === cycleStatus.phase);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#4cd6fb] animate-pulse">cycle</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tools" className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#c5c6cd] text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Nitrogen Cycle</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Cycle Tracker</h1>
        </div>
        {tankAge < 999 && (
          <div className="bg-[#0d1c32] rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-[family-name:var(--font-headline)] font-extrabold text-white">{tankAge}</p>
            <p className="text-[8px] text-[#8f9097] uppercase tracking-widest">Days</p>
          </div>
        )}
      </div>

      {/* ═══ Status Card ═══ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${cycleStatus.color}10, ${cycleStatus.color}05)` }}
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${cycleStatus.color}20` }}>
            <span className="material-symbols-outlined text-3xl" style={{ color: cycleStatus.color, fontVariationSettings: cycleStatus.phase === 'complete' ? "'FILL' 1" : undefined }}>
              {cycleStatus.icon}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-[family-name:var(--font-headline)] font-extrabold text-white text-xl">{cycleStatus.title}</h2>
            <p className="text-xs text-[#c5c6cd] mt-0.5">{cycleStatus.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#8f9097] uppercase tracking-widest">Progress</span>
            <span className="text-sm font-extrabold" style={{ color: cycleStatus.color }}>{cycleStatus.progress}%</span>
          </div>
          <div className="h-3 w-full bg-[#1c2a41] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${cycleStatus.progress}%`,
                background: `linear-gradient(90deg, ${cycleStatus.color}80, ${cycleStatus.color})`,
              }}
            />
          </div>
        </div>

        {/* Phase timeline */}
        <div className="px-5 py-4 flex justify-between">
          {phases.map((p, i) => {
            const isActive = i <= currentIdx;
            const isCurrent = p.key === cycleStatus.phase;
            return (
              <div key={p.key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrent ? 'scale-110 shadow-lg' : ''}`}
                  style={{
                    backgroundColor: isActive ? `${cycleStatus.color}30` : '#1c2a41',
                    boxShadow: isCurrent ? `0 0 12px ${cycleStatus.color}40` : 'none',
                  }}
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{
                      color: isActive ? cycleStatus.color : '#3a4557',
                      fontVariationSettings: isCurrent ? "'FILL' 1" : undefined,
                    }}
                  >
                    {p.icon}
                  </span>
                </div>
                <span
                  className="text-[7px] font-bold uppercase tracking-wider text-center leading-tight"
                  style={{ color: isActive ? cycleStatus.color : '#3a4557' }}
                >
                  {p.label}
                </span>
                {/* Connector line */}
                {i < phases.length - 1 && (
                  <div
                    className="absolute h-0.5 top-4"
                    style={{
                      backgroundColor: i < currentIdx ? cycleStatus.color : '#1c2a41',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Safe to stock badge */}
        {cycleStatus.safeToAddLife && cycleStatus.phase === 'complete' && (
          <div className="px-5 pb-5">
            <div className="bg-[#2ff801]/15 border border-[#2ff801]/25 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#2ff801] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <div>
                <p className="text-sm font-bold text-[#2ff801]">Safe to Add Life!</p>
                <p className="text-[10px] text-[#2ff801]/70 mt-0.5">Start with cleanup crew, then add livestock slowly</p>
              </div>
            </div>
          </div>
        )}

        {/* NOT safe warning */}
        {!cycleStatus.safeToAddLife && cycleStatus.active && (
          <div className="px-5 pb-5">
            <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ff4444]">lock</span>
              <div>
                <p className="text-sm font-bold text-[#ffb4ab]">Do NOT Add Livestock</p>
                <p className="text-[10px] text-[#ffb4ab]/70 mt-0.5">Ammonia and/or nitrite are still lethal. Be patient!</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Parameter Charts ═══ */}
      {cycleTests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-[family-name:var(--font-headline)] font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4cd6fb] text-base">show_chart</span>
            Cycle Parameters
          </h3>
          <div className="flex gap-3">
            <MiniChart tests={cycleTests} param="ammonia" color="#FF7F50" label="NH\u2083" />
            <MiniChart tests={cycleTests} param="nitrite" color="#F1C40F" label="NO\u2082" />
            <MiniChart tests={cycleTests} param="nitrate" color="#2ff801" label="NO\u2083" />
          </div>
          <p className="text-[9px] text-[#8f9097] text-center">
            {cycleTests.length} test{cycleTests.length !== 1 ? 's' : ''} recorded
            {cycleTests.length < 3 && ' \u2014 log more tests for better trend data'}
          </p>
        </div>
      )}

      {/* Quick action: Log test */}
      <Link
        href="/logs"
        className="block bg-gradient-to-r from-[#004b66] to-[#0d1c32] rounded-2xl p-4 border border-[#4cd6fb]/15 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#4cd6fb]">add_circle</span>
          </div>
          <div className="flex-1">
            <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Log Water Test</p>
            <p className="text-[10px] text-[#c5c6cd] mt-0.5">
              {cycleStatus.nextTest || 'Record NH\u2083, NO\u2082, NO\u2083 to track cycle progress'}
            </p>
          </div>
          <span className="material-symbols-outlined text-[#4cd6fb]">arrow_forward</span>
        </div>
      </Link>

      {/* ═══ Current Phase Guide ═══ */}
      {currentGuide && (
        <div className="space-y-4">
          <h3 className="text-sm font-[family-name:var(--font-headline)] font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-base" style={{ color: currentGuide.color }}>menu_book</span>
            Current Phase Guide
          </h3>

          {/* Biology */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd6fb] text-sm">biotech</span>
              <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest">What's Happening</p>
            </div>
            <p className="text-[#c5c6cd] text-sm leading-relaxed">{currentGuide.what}</p>
            <p className="text-[#8f9097] text-xs leading-relaxed italic">{currentGuide.biology}</p>
          </div>

          {/* Target readings */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#F1C40F] text-sm">target</span>
              <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest">Target Readings</p>
            </div>
            {currentGuide.targetReadings.map(r => (
              <div key={r.param} className="flex items-center justify-between py-1.5 border-b border-[#1c2a41] last:border-0">
                <span className="text-xs text-[#c5c6cd]">{r.param}</span>
                <span className="text-xs font-bold text-white">{r.value}</span>
              </div>
            ))}
          </div>

          {/* Do / Don't columns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#2ff801]/5 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2ff801] text-sm">check_circle</span>
                <p className="text-[9px] font-bold text-[#2ff801] uppercase tracking-widest">Do</p>
              </div>
              {currentGuide.doList.map((item, i) => (
                <p key={i} className="text-[#c5c6cd] text-[10px] flex gap-1.5 leading-relaxed">
                  <span className="text-[#2ff801] shrink-0 mt-0.5">+</span>
                  {item}
                </p>
              ))}
            </div>
            <div className="bg-[#ff4444]/5 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#ff4444] text-sm">cancel</span>
                <p className="text-[9px] font-bold text-[#ff4444] uppercase tracking-widest">Don't</p>
              </div>
              {currentGuide.dontList.map((item, i) => (
                <p key={i} className="text-[#c5c6cd] text-[10px] flex gap-1.5 leading-relaxed">
                  <span className="text-[#ff4444] shrink-0 mt-0.5">\u2212</span>
                  {item}
                </p>
              ))}
            </div>
          </div>

          {/* Recommended products */}
          {currentGuide.products.length > 0 && (
            <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF7F50] text-sm">inventory_2</span>
                <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest">Helpful Products</p>
              </div>
              {currentGuide.products.map(p => (
                <div key={p.name} className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-[#FF7F50]/40 text-sm mt-0.5 shrink-0">package_2</span>
                  <div>
                    <p className="text-white text-xs font-bold">{p.name}</p>
                    <p className="text-[#8f9097] text-[10px] mt-0.5">{p.why}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ All Phases Reference ═══ */}
      <div className="space-y-3">
        <h3 className="text-sm font-[family-name:var(--font-headline)] font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#c5c6cd] text-base">timeline</span>
          All Phases Reference
        </h3>

        {PHASE_GUIDES.map(g => {
          const isCurrent = g.phase === cycleStatus.phase;
          const isExpanded = expandedPhase === g.phase;
          const phaseIdx = phases.findIndex(p => p.key === g.phase);
          const isPast = phaseIdx >= 0 && phaseIdx < currentIdx;

          return (
            <button
              key={g.phase}
              onClick={() => setExpandedPhase(isExpanded ? null : g.phase)}
              className={`w-full rounded-xl p-4 text-left transition-all active:scale-[0.98] ${
                isCurrent ? 'bg-[#0d1c32] border-2' : isPast ? 'bg-[#0d1c32]/50' : 'bg-[#0d1c32]/30'
              }`}
              style={{ borderColor: isCurrent ? `${g.color}40` : 'transparent' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${g.color}15` }}>
                  <span className="material-symbols-outlined text-base" style={{ color: isPast ? `${g.color}60` : g.color }}>
                    {isPast ? 'check_circle' : g.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-[family-name:var(--font-headline)] font-bold text-sm ${isPast ? 'text-[#8f9097]' : 'text-white'}`}>{g.title}</p>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider" style={{ color: g.color, backgroundColor: `${g.color}15` }}>
                        CURRENT
                      </span>
                    )}
                    {isPast && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider bg-[#2ff801]/10 text-[#2ff801]/60">
                        DONE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8f9097] mt-0.5">{g.duration}</p>
                </div>
                <span className="material-symbols-outlined text-[#8f9097]/40 text-sm">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-[#1c2a41] space-y-2" onClick={e => e.stopPropagation()}>
                  <p className="text-[#c5c6cd] text-xs leading-relaxed">{g.what}</p>
                  <div className="mt-2 space-y-1">
                    {g.targetReadings.map(r => (
                      <div key={r.param} className="flex justify-between">
                        <span className="text-[10px] text-[#8f9097]">{r.param}</span>
                        <span className="text-[10px] font-bold text-[#c5c6cd]">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
