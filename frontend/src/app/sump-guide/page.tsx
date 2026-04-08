'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Types ─── */

interface Equipment {
  name: string;
  icon: string;
  color: string;
  description: string;
  placement: string;
  tips: string[];
  warnings: string[];
}

interface Chamber {
  id: number;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  flowDirection: string;
  description: string;
  biology: string;
  equipment: Equipment[];
  rules: string[];
  mistakes: string[];
}

/* ─── Chamber Data ─── */

const CHAMBERS: Chamber[] = [
  {
    id: 1,
    name: 'Reception & Mechanical Filtration',
    subtitle: 'Where dirty water enters',
    icon: 'filter_alt',
    color: '#FF7F50',
    flowDirection: 'Water IN from display tank',
    description: 'The first chamber receives water directly from the display tank via the overflow. This is where you remove physical waste and dissolved organics before water moves to the refugium.',
    biology: 'Water arriving here carries the highest concentration of dissolved proteins, fish waste, uneaten food, and detritus. Processing it here prevents these organics from breaking down into ammonia and nitrate in later stages.',
    equipment: [
      {
        name: 'Filter Socks / Pads',
        icon: 'filter_list',
        color: '#ffb59c',
        description: 'Catch large particles (detritus, uneaten food, fish waste) before they decompose.',
        placement: 'At the drain entry point — water flows through the sock first.',
        tips: [
          'Replace or clean every 3-5 days — dirty socks become nitrate factories',
          '200 micron is the standard mesh size',
          'Keep spares on hand — rotate while washing',
        ],
        warnings: [
          'A clogged sock can cause overflow flooding — check regularly',
        ],
      },
      {
        name: 'Protein Skimmer',
        icon: 'bubble_chart',
        color: '#4cd6fb',
        description: 'The most important piece of filtration equipment. Creates fine bubbles that attract and remove dissolved organic compounds (DOCs) before they become nitrate.',
        placement: 'MUST go in Chamber 1 — processes water at peak organic load before it reaches the refugium.',
        tips: [
          'Size your skimmer for 1.5-2× your total water volume',
          'Break-in period: 1-2 weeks before it produces consistent skimmate',
          'Adjust neck height: wetter = more skimmate but diluted, drier = less but concentrated',
          'Clean the collection cup weekly for optimal performance',
        ],
        warnings: [
          'Skimmer MUST be in the first chamber to process the dirtiest water first',
          'New skimmers may overflow initially — break them in before adding livestock',
        ],
      },
      {
        name: 'Carbon / GFO Reactor',
        icon: 'science',
        color: '#d7ffc5',
        description: 'Activated carbon removes yellowing compounds, medications, and toxins. GFO (Granular Ferric Oxide) binds phosphates.',
        placement: 'In Chamber 1, after the skimmer, or as a hang-on reactor fed from this chamber.',
        tips: [
          'Replace carbon every 4-6 weeks — it becomes saturated',
          'GFO: start with half dose and test PO4 — dropping phosphate too fast kills corals',
          'Run carbon reactors at slow flow for maximum contact time',
        ],
        warnings: [
          'Never run carbon during coral medication (it removes the meds)',
          'Excessive GFO use can strip phosphate too low — test weekly',
        ],
      },
    ],
    rules: [
      'Skimmer goes HERE — first chamber processes water with the highest organic load',
      'Mechanical filtration (socks/pads) catches particles before they decompose',
      'Carbon and chemical media go in this chamber for maximum effectiveness',
      'Water level in this chamber fluctuates with evaporation — this is normal',
    ],
    mistakes: [
      'Putting the skimmer in Chamber 3 — it processes already-clean water and wastes its potential',
      'Not cleaning filter socks — they become nitrate factories within a week',
      'Running carbon during medication — it removes the treatment from the water',
    ],
  },
  {
    id: 2,
    name: 'Biological Refugium',
    subtitle: 'The living filter',
    icon: 'park',
    color: '#2ff801',
    flowDirection: 'Water flows from Chamber 1 →',
    description: 'A protected area with no predators, designed for natural nutrient export through macroalgae and microfauna cultivation. This is where biology does the heavy lifting.',
    biology: 'Macroalgae consume nitrate and phosphate as they grow — harvesting the algae physically removes these nutrients from the system. The deep sand bed (DSB) creates anaerobic zones where denitrifying bacteria convert nitrate to nitrogen gas. Copepods and amphipods breed here and flow into the display as live food.',
    equipment: [
      {
        name: 'Chaetomorpha (Macroalgae)',
        icon: 'grass',
        color: '#2ff801',
        description: 'The recommended macroalgae for refugiums. A spaghetti-like green algae that aggressively consumes nitrate and phosphate.',
        placement: 'Free-floating ball or loosely tumbling in the water column with moderate flow.',
        tips: [
          'Use Chaetomorpha over Caulerpa — Chaeto is safer and easier to manage',
          'Harvest (remove) 30-50% every 2-4 weeks — this exports nutrients',
          'Light on a reverse cycle (refugium lights ON when display lights OFF) to stabilize pH',
          'A cheap grow light or 5000K-6500K bulb works fine',
        ],
        warnings: [
          'AVOID Caulerpa — it can go "sexual" (release all nutrients back) and crash the tank',
          'Don\'t let Chaeto block the flow between chambers',
        ],
      },
      {
        name: 'Deep Sand Bed (DSB)',
        icon: 'layers',
        color: '#F1C40F',
        description: 'A 4-6 inch bed of fine aragonite sand creates anaerobic zones for denitrification — the only natural way to reduce nitrate to zero.',
        placement: 'Bottom of Chamber 2. Use fine oolitic sand (sugar-sized grain).',
        tips: [
          '4-6 inches minimum — thinner beds don\'t create anaerobic zones',
          'Fine oolitic sand is best — larger grains don\'t pack tightly enough',
          'Don\'t disturb once established — the bacterial layers take weeks to form',
          'Optional: add live sand or pod cultures to seed the bed',
        ],
        warnings: [
          'A disturbed DSB can release hydrogen sulfide (toxic) — never stir the deep layers',
          'Too shallow (1-3 inches) is a "dead zone" — either go deep (4-6") or bare bottom',
        ],
      },
      {
        name: 'Live Rock Rubble',
        icon: 'landscape',
        color: '#FF7F50',
        description: 'Small pieces of live rock provide enormous surface area for beneficial bacteria and shelter for microfauna.',
        placement: 'Scattered across the sand bed in Chamber 2.',
        tips: [
          'Use rubble-sized pieces (1-3 inches) — maximum surface area',
          'Copepods, amphipods, and bristle worms will colonize naturally',
          'This is where pod populations explode to feed mandarins and wrasses in the display',
        ],
        warnings: [],
      },
      {
        name: 'Refugium Light',
        icon: 'lightbulb',
        color: '#F1C40F',
        description: 'Light drives macroalgae growth for nutrient export. Running it on a reverse schedule stabilizes pH overnight.',
        placement: 'Above or beside Chamber 2, aimed at the Chaetomorpha.',
        tips: [
          'Run on REVERSE photo-period: refugium ON when display OFF',
          'This prevents overnight pH drops (algae consumes CO2 at night)',
          '5000K-6500K spectrum — inexpensive grow lights work perfectly',
          '8-12 hours on, matched opposite to display schedule',
        ],
        warnings: [],
      },
    ],
    rules: [
      'Chaetomorpha is recommended over Caulerpa — safer and more predictable',
      'Water flow through this chamber should be MODERATE — not blasting',
      'Reverse lighting schedule stabilizes pH 24/7',
      'Harvest algae regularly — this is how nutrients are physically EXPORTED',
      'Don\'t clean this chamber aggressively — the biology IS the filter',
    ],
    mistakes: [
      'Using Caulerpa instead of Chaetomorpha — Caulerpa can go sexual and crash parameters',
      'Too much flow — blows sediment and disrupts the sand bed',
      'Never harvesting Chaeto — once it fills the chamber, it stops growing and stops exporting',
      'Disturbing the deep sand bed — releases hydrogen sulfide pockets',
    ],
  },
  {
    id: 3,
    name: 'Return & Evaporation',
    subtitle: 'Clean water goes home',
    icon: 'water_pump',
    color: '#4cd6fb',
    flowDirection: 'Water OUT → back to display tank',
    description: 'The final chamber sends clean, processed water back to the display tank via the return pump. This is also where system evaporation is visible and must be managed.',
    biology: 'By this point, water has been mechanically filtered (Chamber 1), protein skimmed, and biologically processed (Chamber 2). It returns to the display clean and nutrient-reduced.',
    equipment: [
      {
        name: 'Return Pump',
        icon: 'water_pump',
        color: '#4cd6fb',
        description: 'The heart of the system. Pushes clean water from the sump back up to the display tank.',
        placement: 'Submerged in Chamber 3.',
        tips: [
          'Size for 5-10× your display volume in turnover per hour',
          'Account for head pressure — every foot of height reduces flow',
          'DC pumps are quieter and adjustable; AC pumps are cheaper and reliable',
          'A check valve or siphon break on the return line prevents back-siphon during power outages',
        ],
        warnings: [
          'If water level drops below the pump intake, it runs dry and BURNS OUT',
          'Always have a siphon break or check valve to prevent back-siphon flooding',
        ],
      },
      {
        name: 'ATO Sensor (Auto Top-Off)',
        icon: 'sensors',
        color: '#2ff801',
        description: 'Detects water level drops from evaporation and automatically adds fresh RODI water to maintain salinity.',
        placement: 'MUST be installed in Chamber 3 — this is the ONLY chamber where evaporation is visible.',
        tips: [
          'Use optical or float sensors — more reliable than mechanical',
          'ATO reservoir should hold at least 3-5 days of evaporation',
          'Always top off with RODI (fresh) water, NEVER saltwater — salt doesn\'t evaporate',
          'Set a backup sensor higher than the main — prevents overflow if primary fails',
        ],
        warnings: [
          'ATO sensor MUST be in Chamber 3 — evaporation from the entire system shows here',
          'If the ATO fails and water drops too low, the return pump runs dry and burns out',
          'Without ATO, salinity can spike from 1.025 to 1.028+ in 24 hours',
        ],
      },
      {
        name: 'Heater',
        icon: 'thermostat',
        color: '#FF7F50',
        description: 'Many reefers place the heater in the sump to hide it from the display. Chamber 3 provides consistent water flow over the heater.',
        placement: 'Submerged horizontally in Chamber 3, near the return pump.',
        tips: [
          '3-5 watts per gallon of total system volume',
          'Two smaller heaters > one large heater (redundancy if one fails)',
          'Titanium heaters are the most durable for saltwater',
          'Use a heater controller (Inkbird, Neptune) for failsafe temperature management',
        ],
        warnings: [
          'A stuck-on heater can cook your tank — ALWAYS use an external controller',
          'Never run a heater out of water — it will crack or start a fire',
        ],
      },
    ],
    rules: [
      'ATO sensor MUST be in this chamber — evaporation only shows here',
      'Return pump sized for 5-10× display volume turnover per hour',
      'This chamber\'s water level drops as evaporation occurs — the other chambers stay constant',
      'Heater placement here keeps it hidden from display and ensures flow across the element',
    ],
    mistakes: [
      'Putting ATO sensor in Chamber 1 or 2 — water level only changes in Chamber 3',
      'No siphon break on the return line — power outage = back-siphon floods sump',
      'Oversized return pump — too much flow overwhelms the overflow and floods the tank',
      'No heater controller — a stuck heater will cook everything alive',
    ],
  },
];

/* ─── Overflow Data ─── */

interface OverflowType {
  name: string;
  icon: string;
  color: string;
  type: 'drilled' | 'hangon';
  recommended: boolean;
  description: string;
  pros: string[];
  cons: string[];
  warning: string | null;
}

const OVERFLOW_TYPES: OverflowType[] = [
  {
    name: 'Drilled Tank (Internal Overflow)',
    icon: 'plumbing',
    color: '#2ff801',
    type: 'drilled',
    recommended: true,
    description: 'Holes drilled in the tank glass with bulkheads — water drains by gravity through pipes built into the tank. The gold standard.',
    pros: [
      'Failsafe — gravity always works, no siphon to lose',
      'Silent when properly plumbed (Herbie or Bean Animal method)',
      'Clean look — no external boxes hanging on the tank',
      'Handles power outages gracefully — water just stops flowing',
    ],
    cons: [
      'Requires a reef-ready (pre-drilled) tank or professional drilling',
      'Cannot drill tempered glass (most tank bottoms are tempered)',
      'Permanent — can\'t move the holes once drilled',
    ],
    warning: null,
  },
  {
    name: 'Hang-on Overflow (Siphon Box)',
    icon: 'warning',
    color: '#ff4444',
    type: 'hangon',
    recommended: false,
    description: 'An external box that hangs on the tank rim and uses a siphon tube to drain water down to the sump. Used when drilling is not possible.',
    pros: [
      'Works on any tank — no drilling required',
      'Can be removed if you want to stop using a sump',
      'Relatively inexpensive',
    ],
    cons: [
      'Siphon can break — air bubble accumulation causes loss of vacuum',
      'Requires a powerhead or Aqualifter pump to maintain siphon',
      'Noisy — the siphon tubes create gurgling',
      'FLOOD RISK — if siphon breaks, pump keeps running',
    ],
    warning: 'CRITICAL FLOOD RISK: If the siphon loses vacuum, water stops draining to the sump — but the return pump keeps pumping water UP to the display tank. The display overflows and floods your room. This can dump 20-50+ gallons onto your floor. If you must use a hang-on overflow, install an Aqualifter pump to continuously reprime the siphon, and ALWAYS have a siphon break on the return line.',
  },
];

/* ─── Component ─── */

export default function SumpGuidePage() {
  const [expandedChamber, setExpandedChamber] = useState<number | null>(1);
  const [expandedEquip, setExpandedEquip] = useState<string | null>(null);
  const [tab, setTab] = useState<'chambers' | 'overflow' | 'flow'>('chambers');

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#FF7F50]/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#FF7F50] text-2xl">plumbing</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Visual Guide</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Sump Setup</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">Interactive 3-chamber sump diagram for beginners</p>
      </div>

      {/* Flow Diagram — Always visible */}
      <div className="bg-[#0d1c32] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest mb-3 text-center">Water Flow Path</p>
        <div className="flex items-center justify-center gap-1">
          {/* Display Tank */}
          <div className="bg-[#041329] rounded-xl px-2 py-3 text-center min-w-[52px]">
            <span className="material-symbols-outlined text-[#4cd6fb] text-lg block">water</span>
            <p className="text-[8px] text-[#c5c6cd]/60 mt-0.5">Display</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">arrow_forward</span>
          {/* Overflow */}
          <div className="bg-[#041329] rounded-xl px-2 py-3 text-center min-w-[52px]">
            <span className="material-symbols-outlined text-[#F1C40F] text-lg block">south</span>
            <p className="text-[8px] text-[#c5c6cd]/60 mt-0.5">Overflow</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">arrow_forward</span>
          {/* Chamber 1 */}
          <div className="rounded-xl px-2 py-3 text-center min-w-[44px]" style={{ backgroundColor: `${CHAMBERS[0].color}15` }}>
            <span className="material-symbols-outlined text-lg block" style={{ color: CHAMBERS[0].color }}>{CHAMBERS[0].icon}</span>
            <p className="text-[8px] font-bold mt-0.5" style={{ color: CHAMBERS[0].color }}>C1</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">arrow_forward</span>
          {/* Chamber 2 */}
          <div className="rounded-xl px-2 py-3 text-center min-w-[44px]" style={{ backgroundColor: `${CHAMBERS[1].color}15` }}>
            <span className="material-symbols-outlined text-lg block" style={{ color: CHAMBERS[1].color }}>{CHAMBERS[1].icon}</span>
            <p className="text-[8px] font-bold mt-0.5" style={{ color: CHAMBERS[1].color }}>C2</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">arrow_forward</span>
          {/* Chamber 3 */}
          <div className="rounded-xl px-2 py-3 text-center min-w-[44px]" style={{ backgroundColor: `${CHAMBERS[2].color}15` }}>
            <span className="material-symbols-outlined text-lg block" style={{ color: CHAMBERS[2].color }}>{CHAMBERS[2].icon}</span>
            <p className="text-[8px] font-bold mt-0.5" style={{ color: CHAMBERS[2].color }}>C3</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">arrow_forward</span>
          {/* Back to display */}
          <div className="bg-[#041329] rounded-xl px-2 py-3 text-center min-w-[52px]">
            <span className="material-symbols-outlined text-[#2ff801] text-lg block">north</span>
            <p className="text-[8px] text-[#c5c6cd]/60 mt-0.5">Return</p>
          </div>
        </div>
        <p className="text-[9px] text-[#c5c6cd]/30 text-center mt-2">Dirty water → Clean water (continuous loop)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['chambers', '🔧 Chambers'], ['overflow', '🚨 Overflow'], ['flow', '💡 Tips']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Chambers Tab ═══ */}
      {tab === 'chambers' && (
        <div className="space-y-2">
          {CHAMBERS.map(chamber => {
            const isExpanded = expandedChamber === chamber.id;
            return (
              <div key={chamber.id}>
                <button
                  onClick={() => setExpandedChamber(isExpanded ? null : chamber.id)}
                  className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${chamber.color}15` }}>
                    <span className="text-lg font-bold" style={{ color: chamber.color }}>{chamber.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{chamber.name}</p>
                    <p className="text-[10px] text-[#c5c6cd]/40">{chamber.subtitle}</p>
                  </div>
                  <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                </button>

                {isExpanded && (
                  <div className="bg-[#0d1c32]/60 rounded-2xl p-4 mt-1 ml-2 mr-1 space-y-4">
                    {/* Flow direction */}
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm" style={{ color: chamber.color }}>water_drop</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: chamber.color }}>{chamber.flowDirection}</p>
                    </div>

                    {/* Description */}
                    <p className="text-[#c5c6cd] text-xs leading-relaxed">{chamber.description}</p>

                    {/* Biology */}
                    <div className="bg-[#041329] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-wider mb-1">Biology</p>
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">{chamber.biology}</p>
                    </div>

                    {/* Equipment List */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Equipment</p>
                      {chamber.equipment.map(equip => {
                        const eqExpanded = expandedEquip === `${chamber.id}-${equip.name}`;
                        return (
                          <div key={equip.name}>
                            <button
                              onClick={() => setExpandedEquip(eqExpanded ? null : `${chamber.id}-${equip.name}`)}
                              className="w-full bg-[#041329] rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.97] transition-transform"
                            >
                              <span className="material-symbols-outlined text-lg" style={{ color: equip.color }}>{equip.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium">{equip.name}</p>
                                <p className="text-[10px] text-[#c5c6cd]/40 truncate">{equip.description.slice(0, 60)}…</p>
                              </div>
                              <span className="material-symbols-outlined text-[#c5c6cd]/30 text-xs">{eqExpanded ? 'expand_less' : 'expand_more'}</span>
                            </button>

                            {eqExpanded && (
                              <div className="bg-[#041329]/60 rounded-xl p-3 mt-1 ml-4 space-y-2">
                                <p className="text-[#c5c6cd] text-xs leading-relaxed">{equip.description}</p>

                                <div className="flex items-start gap-2">
                                  <span className="material-symbols-outlined text-xs text-[#F1C40F] mt-0.5">pin_drop</span>
                                  <div>
                                    <p className="text-[10px] font-bold text-[#F1C40F] uppercase">Placement</p>
                                    <p className="text-[#c5c6cd] text-xs">{equip.placement}</p>
                                  </div>
                                </div>

                                {equip.tips.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-[#2ff801] uppercase mb-1">Tips</p>
                                    {equip.tips.map((t, i) => (
                                      <div key={i} className="flex items-start gap-1.5 mb-1">
                                        <span className="text-[#2ff801] text-[10px] mt-0.5">✓</span>
                                        <p className="text-[#c5c6cd] text-[11px] leading-relaxed">{t}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {equip.warnings.length > 0 && (
                                  <div>
                                    {equip.warnings.map((w, i) => (
                                      <div key={i} className="flex items-start gap-1.5 mb-1">
                                        <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                                        <p className="text-[#ffb4ab] text-[11px]">{w}</p>
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

                    {/* Rules */}
                    <div>
                      <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest mb-1">Rules</p>
                      {chamber.rules.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1">
                          <span className="text-xs font-bold w-4 shrink-0" style={{ color: chamber.color }}>{i + 1}.</span>
                          <p className="text-[#c5c6cd] text-xs">{r}</p>
                        </div>
                      ))}
                    </div>

                    {/* Common Mistakes */}
                    <div className="bg-[#ff4444]/8 rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-widest">Common Mistakes</p>
                      {chamber.mistakes.map((m, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[#ff4444] text-[10px] mt-0.5">✗</span>
                          <p className="text-[#ffb4ab] text-[11px] leading-relaxed">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Overflow Tab ═══ */}
      {tab === 'overflow' && (
        <div className="space-y-4">
          <p className="text-[#c5c6cd] text-xs">How water gets from your display tank down to the sump:</p>

          {OVERFLOW_TYPES.map(ov => (
            <div key={ov.type} className={`rounded-2xl p-4 border ${ov.recommended ? 'bg-[#2ff801]/5 border-[#2ff801]/20' : 'bg-[#ff4444]/5 border-[#ff4444]/20'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${ov.color}15` }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: ov.color }}>{ov.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{ov.name}</p>
                  {ov.recommended ? (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2ff801]/15 text-[#2ff801]">Recommended</span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#ff4444]/15 text-[#ff4444]">Use with caution</span>
                  )}
                </div>
              </div>

              <p className="text-[#c5c6cd] text-xs leading-relaxed mb-3">{ov.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-[#2ff801] uppercase mb-1">Pros</p>
                  {ov.pros.map((p, i) => (
                    <div key={i} className="flex items-start gap-1 mb-1">
                      <span className="text-[#2ff801] text-[10px]">✓</span>
                      <p className="text-[#c5c6cd] text-[10px]">{p}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#ff4444] uppercase mb-1">Cons</p>
                  {ov.cons.map((c, i) => (
                    <div key={i} className="flex items-start gap-1 mb-1">
                      <span className="text-[#ff4444] text-[10px]">✗</span>
                      <p className="text-[#c5c6cd] text-[10px]">{c}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              {ov.warning && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#ff4444] text-lg">flood</span>
                    <p className="text-[#ff4444] font-bold text-sm">FLOOD WARNING</p>
                  </div>
                  <p className="text-[#ffb4ab] text-xs leading-relaxed">{ov.warning}</p>
                </div>
              )}
            </div>
          ))}

          {/* Drilled Tank Recommendation */}
          <div className="bg-[#2ff801]/8 border border-[#2ff801]/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#2ff801]">tips_and_updates</span>
              <p className="text-[#2ff801] font-bold text-sm">Our Recommendation</p>
            </div>
            <p className="text-[#c5c6cd] text-xs leading-relaxed">
              If you are planning a new tank, <span className="text-white font-bold">strongly consider a drilled (reef-ready) tank</span>. The extra cost upfront eliminates the flood risk entirely. Many local fish stores sell reef-ready tanks, or a glass shop can drill a standard tank for $30-60.
            </p>
          </div>
        </div>
      )}

      {/* ═══ Tips Tab ═══ */}
      {tab === 'flow' && (
        <div className="space-y-3">
          {/* DIY Glass */}
          <div className="bg-[#FF7F50]/8 border border-[#FF7F50]/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#FF7F50]">construction</span>
              <p className="text-white text-sm font-medium">DIY Sump Glass Thickness</p>
            </div>
            <Tip text="If building your own sump, use glass at least 4.5-5 mm thick for the internal baffles (dividers). Thinner glass can crack under water pressure." />
            <Tip text="External walls should be even thicker (6-8 mm) depending on total volume." />
            <Tip text="Use aquarium-safe silicone (100% silicone, no anti-mold additives)." />
          </div>

          {/* Refugium Light Trick */}
          <div className="bg-[#2ff801]/8 border border-[#2ff801]/15 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#2ff801]">lightbulb</span>
              <p className="text-white text-sm font-medium">Refugium Light Hack</p>
            </div>
            <Tip text="Paint the back glass of the refugium section WHITE. This reflects light internally, maximizing photosynthesis so Chaetomorpha consumes more nitrates and grows faster." />
            <Tip text="Run the refugium light on a REVERSE schedule (ON when display lights are OFF). This absorbs CO2 at night and prevents the pH from dropping, keeping chemistry stable 24/7." />
          </div>

          {/* Sizing */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#4cd6fb]">straighten</span>
              <p className="text-white text-sm font-medium">Sump Sizing</p>
            </div>
            <Tip text="Sump should be 20-40% of your display tank volume." />
            <Tip text="Bigger is always better — more water volume = more stability." />
            <Tip text="Account for drain-back: when power goes off, water siphons back from display. Your sump must hold this extra volume without overflowing." />
            <Tip text="Mark a 'max fill' line on Chamber 3 — when power is ON, the level should be below this line to leave room for drain-back." />
          </div>

          {/* Plumbing */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#FF7F50]">plumbing</span>
              <p className="text-white text-sm font-medium">Plumbing Tips</p>
            </div>
            <Tip text="Use unions on every pipe connection — you WILL need to take things apart for maintenance." />
            <Tip text="Gate valves on drain lines let you fine-tune flow and noise." />
            <Tip text="Herbie method: 2 drains (1 full siphon + 1 emergency) = silent operation." />
            <Tip text="Bean Animal method: 3 drains = virtually silent. The gold standard." />
            <Tip text="Always install a siphon break (small hole drilled in return pipe above water line) to prevent back-siphon." />
          </div>

          {/* Power Outage */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#F1C40F]">power_off</span>
              <p className="text-white text-sm font-medium">Power Outage Safety</p>
            </div>
            <Tip text="When power goes out, water from the display drains back into the sump via siphon." />
            <Tip text="Your sump MUST have enough empty space to hold this drain-back water." />
            <Tip text="Test this before adding livestock: turn off the return pump and see how much the sump level rises." />
            <Tip text="When power returns, the return pump pushes this water back up — all automatic." />
          </div>

          {/* Noise Reduction */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#c5a3ff]">volume_off</span>
              <p className="text-white text-sm font-medium">Noise Reduction</p>
            </div>
            <Tip text="Durso standpipe or Herbie method on the drain eliminates gurgling." />
            <Tip text="Filter socks dampen splashing sounds in Chamber 1." />
            <Tip text="A sump mat (rubber pad) under the sump absorbs vibration." />
            <Tip text="DC return pumps are significantly quieter than AC pumps." />
          </div>

          {/* First-Time Checklist */}
          <div className="bg-[#041329] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest mb-1">First-Time Sump Checklist</p>
            <Check text="Sump fits in your stand (measure BEFORE buying!)" />
            <Check text="Overflow type chosen (drilled preferred)" />
            <Check text="Return pump sized correctly (5-10× turnover)" />
            <Check text="Siphon break installed on return line" />
            <Check text="Drain-back tested (turn off pump, check sump capacity)" />
            <Check text="ATO sensor placed in Chamber 3" />
            <Check text="Heater controller installed (prevent cook-out)" />
            <Check text="Filter socks stocked (need 5-7 for rotation)" />
            <Check text="Unions on all pipe connections (for maintenance)" />
            <Check text="Sump mat under the sump (vibration dampening)" />
          </div>

          {/* Link to Power Outage */}
          <Link href="/power-outage" className="block bg-[#ff4444]/8 border border-[#ff4444]/15 rounded-2xl p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ff4444] text-xl">power_off</span>
              <div className="flex-1">
                <p className="text-[#ff4444] font-bold text-sm">Power Outage Protocol</p>
                <p className="text-[#c5c6cd]/50 text-xs">What to do when the power goes out with a sump running</p>
              </div>
              <span className="material-symbols-outlined text-[#c5c6cd]/30">chevron_right</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[#F1C40F] text-xs mt-0.5">💡</span>
      <p className="text-[#c5c6cd] text-xs leading-relaxed">{text}</p>
    </div>
  );
}

function Check({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded border border-[#1c2a41] flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[#c5c6cd]/20 text-xs">check_box_outline_blank</span>
      </div>
      <p className="text-[#c5c6cd] text-xs">{text}</p>
    </div>
  );
}
