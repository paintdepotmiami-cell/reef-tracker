'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Emergency Protocol Steps ─── */
interface Step {
  title: string;
  icon: string;
  color: string;
  urgency: 'immediate' | 'within_1h' | 'within_4h' | 'ongoing';
  actions: string[];
  why: string;
}

const PROTOCOL: Step[] = [
  {
    title: 'Maintain Oxygen (PRIORITY #1)',
    icon: 'air',
    color: '#ff4444',
    urgency: 'immediate',
    actions: [
      'Battery-powered air pump → drop airstone into display tank AND sump',
      'If no air pump: manually agitate water surface every 15-20 minutes',
      'Open the tank lid to maximize gas exchange',
      'Remove any tight-fitting covers that restrict airflow',
      'If you have a UPS/battery backup, power the return pump FIRST (it moves water and adds oxygen)',
    ],
    why: 'Fish and corals consume oxygen and produce CO2. Without circulation, oxygen depletes in 2-4 hours. Oxygen deprivation kills faster than any other parameter shift.',
  },
  {
    title: 'Maintain Temperature',
    icon: 'thermostat',
    color: '#FF7F50',
    urgency: 'within_1h',
    actions: [
      'Wrap tank with blankets or towels to insulate (slows heat loss)',
      'DO NOT open the lid unnecessarily (heat escapes from the top)',
      'If it\'s WINTER: seal bags of hot water (not boiling) and float in sump',
      'If it\'s SUMMER: float sealed ice bags in sump, point a fan at the surface',
      'Monitor temp with a battery thermometer — target is 74-80°F survivable range',
      'A well-insulated tank loses ~1-2°F per hour without a heater',
    ],
    why: 'Marine life tolerates slow temperature changes better than rapid ones. A stable 74°F is safer than swinging between 72-80°F. Insulation buys you hours.',
  },
  {
    title: 'Stop Feeding',
    icon: 'block',
    color: '#F1C40F',
    urgency: 'immediate',
    actions: [
      'Do NOT feed fish or corals during a power outage',
      'Uneaten food will decompose and spike ammonia without filtration',
      'Healthy fish can survive 3-5 days without food — they\'ll be fine',
      'Corals can go weeks without targeted feeding',
    ],
    why: 'Without your skimmer and biological filter running at full capacity, any food waste becomes toxic ammonia. Fish in good health have reserves to handle days without eating.',
  },
  {
    title: 'Preserve Biological Filter',
    icon: 'biotech',
    color: '#4cd6fb',
    urgency: 'within_4h',
    actions: [
      'Beneficial bacteria on rock and media need oxygen to survive',
      'If sump flow is stopped, pour tank water through filter media every 2 hours',
      'Keep filter socks and bio-media submerged — don\'t let them dry out',
      'If power is out >4 hours, periodically agitate water in the sump manually',
      'After power returns, add beneficial bacteria (Fritz TurboStart) as insurance',
    ],
    why: 'Nitrifying bacteria die within 4-8 hours without oxygenated water flow. Losing your bio-filter means an ammonia spike when power returns. This is the silent killer.',
  },
  {
    title: 'Minimize Evaporation',
    icon: 'water_drop',
    color: '#2ff801',
    urgency: 'ongoing',
    actions: [
      'ATO won\'t work without power — monitor water level manually',
      'Top off with fresh RODI water (NOT saltwater) if level drops visibly',
      'Cover open areas of the sump to reduce evaporation',
      'Evaporation = salinity increase, which stresses everything',
    ],
    why: 'Without ATO, evaporation concentrates salt. Salinity can spike from 1.025 to 1.028+ in 24 hours, stressing fish and shocking corals.',
  },
  {
    title: 'When Power Returns',
    icon: 'power',
    color: '#d7ffc5',
    urgency: 'ongoing',
    actions: [
      'Check all equipment: return pump, skimmer, heater, powerheads, ATO',
      'Verify heater is working and set to correct temperature',
      'Add dose of beneficial bacteria (Fritz TurboStart or Microbacter7)',
      'Do a 10-15% water change within 24 hours',
      'Test ammonia and nitrite — watch for mini-cycle',
      'Resume feeding SLOWLY — small portions for the first 2-3 days',
      'Monitor closely for 48 hours — delayed die-off can happen',
      'Dose Seachem Prime if ammonia is detected (detoxifies temporarily)',
    ],
    why: 'Even after power returns, your biological filter may be compromised. The bacteria colony needs time to recover. Mini-cycles (ammonia/nitrite spikes) are common after extended outages.',
  },
];

const URGENCY_META = {
  immediate: { label: 'DO NOW', color: '#ff4444', bg: '#ff4444' },
  within_1h: { label: 'Within 1 Hour', color: '#FF7F50', bg: '#FF7F50' },
  within_4h: { label: 'Within 4 Hours', color: '#F1C40F', bg: '#F1C40F' },
  ongoing: { label: 'Ongoing', color: '#4cd6fb', bg: '#4cd6fb' },
};

/* ─── Survival Times ─── */
const SURVIVAL = [
  { label: 'Oxygen depletion', time: '2-4 hours', icon: 'air', color: '#ff4444', critical: true },
  { label: 'Bacteria die-off', time: '4-8 hours', icon: 'biotech', color: '#FF7F50', critical: true },
  { label: 'Temperature drop (winter)', time: '4-8 hours', icon: 'thermostat', color: '#F1C40F', critical: false },
  { label: 'Fish starvation risk', time: '3-5 days', icon: 'set_meal', color: '#2ff801', critical: false },
  { label: 'Coral starvation risk', time: '2+ weeks', icon: 'diamond', color: '#4cd6fb', critical: false },
];

/* ─── Emergency Kit ─── */
const KIT = [
  { name: 'Battery air pump + airstone', priority: 'essential', icon: 'air' },
  { name: 'UPS / Battery backup (for return pump)', priority: 'essential', icon: 'battery_charging_full' },
  { name: 'Battery thermometer', priority: 'essential', icon: 'thermostat' },
  { name: 'Insulation blankets/towels', priority: 'essential', icon: 'dry_cleaning' },
  { name: 'Fritz TurboStart 900 (bottled bacteria)', priority: 'recommended', icon: 'biotech' },
  { name: 'Seachem Prime (ammonia detox)', priority: 'recommended', icon: 'science' },
  { name: 'Flashlight / Headlamp', priority: 'recommended', icon: 'flashlight_on' },
  { name: 'Pre-mixed saltwater (5 gallons)', priority: 'recommended', icon: 'water_drop' },
  { name: 'Generator (for extended outages)', priority: 'ideal', icon: 'power' },
  { name: 'D-cell batteries (spare)', priority: 'ideal', icon: 'battery_full' },
];

const PRIORITY_COLORS = {
  essential: '#ff4444',
  recommended: '#F1C40F',
  ideal: '#4cd6fb',
};

export default function PowerOutagePage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [tab, setTab] = useState<'protocol' | 'survival' | 'kit'>('protocol');

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4444]/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ff4444] text-2xl">power_off</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ff4444] text-xs font-medium uppercase">Emergency</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Power Outage</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">Step-by-step protocol to save your reef</p>
      </div>

      {/* Priority Banner */}
      <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[#ff4444]">priority_high</span>
          <p className="text-[#ff9999] font-bold text-sm">Priority Order</p>
        </div>
        <p className="text-[#c5c6cd] text-xs leading-relaxed">
          <span className="text-[#ff4444] font-bold">1. OXYGEN</span> →
          <span className="text-[#FF7F50] font-bold"> 2. TEMPERATURE</span> →
          <span className="text-[#F1C40F] font-bold"> 3. STOP FEEDING</span> →
          <span className="text-[#4cd6fb] font-bold"> 4. BIO-FILTER</span>
        </p>
        <p className="text-[#c5c6cd]/50 text-[10px] mt-1">Oxygen kills fastest. Everything else is secondary.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['protocol', '🚨 Protocol'], ['survival', '⏱️ Survival Times'], ['kit', '🎒 Emergency Kit']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Protocol Tab ═══ */}
      {tab === 'protocol' && (
        <div className="space-y-2">
          {PROTOCOL.map((step, i) => {
            const isExpanded = expandedStep === i;
            const urgency = URGENCY_META[step.urgency];
            return (
              <div key={i}>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}15` }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: step.color }}>{step.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{step.title}</p>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: `${urgency.bg}15`, color: urgency.color }}>
                      {urgency.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                </button>

                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-3 mr-1 space-y-3">
                    {step.actions.map((a, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="text-xs font-bold mt-0.5 w-4 shrink-0" style={{ color: step.color }}>{j + 1}.</span>
                        <p className="text-[#c5c6cd] text-xs">{a}</p>
                      </div>
                    ))}
                    <div className="bg-[#041329] rounded-xl p-3 mt-2">
                      <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-wider mb-1">Why This Matters</p>
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">{step.why}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Survival Times Tab ═══ */}
      {tab === 'survival' && (
        <div className="space-y-3">
          <p className="text-[#c5c6cd] text-xs">How long your reef can survive without power:</p>
          {SURVIVAL.map((item, i) => (
            <div key={i} className={`bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 ${item.critical ? 'border border-[#ff4444]/15' : ''}`}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <span className="material-symbols-outlined text-xl" style={{ color: item.color }}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{item.label}</p>
                {item.critical && <p className="text-[#ff4444] text-[10px] font-bold uppercase">Critical</p>}
              </div>
              <p className="text-xl font-[family-name:var(--font-headline)] font-bold" style={{ color: item.color }}>{item.time}</p>
            </div>
          ))}

          <div className="bg-[#F1C40F]/8 border border-[#F1C40F]/15 rounded-2xl p-4">
            <p className="text-[#c5c6cd] text-xs leading-relaxed">
              <span className="text-[#F1C40F] font-bold">Key insight:</span> A well-maintained tank with live rock has more oxygen reserve than a bare tank. Porous rock provides surface area for gas exchange. Heavily stocked tanks deplete oxygen faster.
            </p>
          </div>
        </div>
      )}

      {/* ═══ Emergency Kit Tab ═══ */}
      {tab === 'kit' && (
        <div className="space-y-2">
          <p className="text-[#c5c6cd] text-xs mb-2">Keep these items ready BEFORE an outage happens:</p>
          {(['essential', 'recommended', 'ideal'] as const).map(priority => (
            <div key={priority}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 mt-3" style={{ color: PRIORITY_COLORS[priority] }}>
                {priority === 'essential' ? '🔴 Essential' : priority === 'recommended' ? '🟡 Recommended' : '🔵 Nice to Have'}
              </p>
              {KIT.filter(k => k.priority === priority).map((item, i) => (
                <div key={i} className="bg-[#0d1c32] rounded-2xl p-3 flex items-center gap-3 mb-1.5">
                  <span className="material-symbols-outlined text-lg" style={{ color: PRIORITY_COLORS[priority] }}>{item.icon}</span>
                  <p className="text-white text-sm">{item.name}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
