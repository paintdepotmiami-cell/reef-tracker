'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Disease Protocols ─── */
interface DiseaseProtocol {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  color: string;
  urgency: 'critical' | 'high' | 'medium';
  identification: string[];
  medication: {
    drug: string;
    brand: string;
    dose: string;
    duration: string;
    monitoring: string;
  };
  qtSetup: string[];
  procedure: string[];
  warnings: string[];
  afterCare: string[];
}

const PROTOCOLS: DiseaseProtocol[] = [
  {
    id: 'ich',
    name: 'Marine Ich (Cryptocaryon)',
    nameEs: 'Punto Blanco Marino',
    icon: 'coronavirus',
    color: '#ff4444',
    urgency: 'critical',
    identification: [
      'White dots (like salt grains) on body and fins',
      'Fish scratching against rocks (flashing)',
      'Rapid breathing, clamped fins',
      'Dots may disappear and reappear in 3-day cycles',
    ],
    medication: {
      drug: 'Copper Sulfate (ionic copper)',
      brand: 'Copper Power or Seachem Cupramine',
      dose: 'Therapeutic level: 2.0 ppm (Copper Power) or 0.5 ppm (Cupramine)',
      duration: '30 days minimum at therapeutic level',
      monitoring: 'Test copper daily with Hanna Copper Checker. Too low = ineffective. Too high = toxic to fish.',
    },
    qtSetup: [
      '10-20 gallon tank (bare bottom — no sand, no rock)',
      'Sponge filter or HOB filter (NO carbon — it removes copper)',
      'Heater set to 78-80°F',
      'PVC pipe fittings for fish to hide in',
      'Ammonia alert badge (copper kills beneficial bacteria)',
      'Daily 25% water changes if ammonia detected (re-dose copper after)',
    ],
    procedure: [
      'Move ALL fish from display to QT (even fish showing no symptoms)',
      'Acclimate fish to QT water slowly (drip method, 30-45 min)',
      'Begin copper treatment — raise to therapeutic level over 24 hours',
      'Test copper level DAILY and adjust to maintain therapeutic range',
      'Keep display tank FALLOW (fish-free) for minimum 76 days at 76°F',
      'Monitor ammonia in QT daily — do water changes as needed (re-dose copper)',
      'Feed lightly with garlic-soaked food to boost immunity',
      'After 30 days copper treatment, do 2 large water changes to remove copper',
      'Observe fish for 2 more weeks without copper before returning to display',
    ],
    warnings: [
      'NEVER add copper to the display tank — kills ALL invertebrates and corals',
      'Copper permanently absorbs into rock — display tank will never be safe for inverts again',
      'Cupramine and Copper Power are different concentrations — do NOT mix or swap mid-treatment',
      'Carbon, Purigen, and GFO remove copper — do NOT run these in QT during treatment',
      'Scaleless fish (mandarins, blennies) are more sensitive — use lower therapeutic level',
    ],
    afterCare: [
      'Return fish to display ONLY after 76 days fallow period',
      'All future fish MUST be quarantined 30 days before entering display',
      'Run UV sterilizer on display as secondary defense',
      'Consider prophylactic copper treatment for all new QT fish',
    ],
  },
  {
    id: 'velvet',
    name: 'Marine Velvet (Amyloodinium)',
    nameEs: 'Terciopelo Marino',
    icon: 'emergency',
    color: '#ff4444',
    urgency: 'critical',
    identification: [
      'Fine gold/rust dust on body (finer than Ich — looks like velvet)',
      'Extremely rapid breathing — gills heavily affected',
      'Fish may "flash" violently against surfaces',
      'Lethargy, refusal to eat, clamped fins',
      'KILLS FAST — can go from healthy to dead in 24-48 hours',
    ],
    medication: {
      drug: 'Chloroquine Phosphate (CP)',
      brand: 'Fish Pharmacy or National Fish Pharmaceuticals',
      dose: '40 mg per gallon (10 mg per liter)',
      duration: '30 days minimum',
      monitoring: 'CP degrades in light — dose in a dark or covered QT. Re-dose every 7 days or after water changes.',
    },
    qtSetup: [
      'Same as Ich QT: 10-20 gal bare bottom, heater, sponge filter',
      'COVER the tank or keep in darkness (CP degrades with light)',
      'PVC hiding spots',
      'Air stone for extra oxygenation (velvet attacks gills)',
    ],
    procedure: [
      'EMERGENCY: move fish to QT immediately — velvet kills within 24-48 hours',
      'Dose Chloroquine Phosphate: 40 mg per gallon, dissolved in tank water first',
      'Provide heavy aeration — velvet damages gills, fish need extra O2',
      'Keep QT dark or covered (CP breaks down in light)',
      'Re-dose CP every 7 days for 30 days',
      'Display tank fallow for 6 weeks minimum (velvet lifecycle shorter than Ich)',
      'If fish are too far gone for CP, freshwater dip (5 min, pH/temp matched) as emergency measure',
    ],
    warnings: [
      'Velvet is MORE lethal than Ich — act within HOURS, not days',
      'CP is light-sensitive — always cover the QT tank',
      'Do NOT use copper AND CP together — toxic combination',
      'Some fish (wrasses, anthias) are more sensitive to CP',
      'If multiple fish die rapidly (overnight), assume velvet until proven otherwise',
    ],
    afterCare: [
      'Same fallow period as Ich but 6 weeks minimum',
      'Quarantine ALL new fish — velvet is even more reason to never skip QT',
      'UV sterilizer helps kill free-swimming stage in display',
    ],
  },
  {
    id: 'brooklynella',
    name: 'Brooklynella (Clownfish Disease)',
    nameEs: 'Brooklynella (Enfermedad del Payaso)',
    icon: 'healing',
    color: '#FF7F50',
    urgency: 'critical',
    identification: [
      'Excessive slime coat — fish looks like it\'s covered in mucus',
      'Skin peeling or sloughing off',
      'Rapid breathing, lethargy, loss of color',
      'Most common in clownfish but can affect other species',
      'Progresses VERY fast — can kill within 24 hours of first symptoms',
    ],
    medication: {
      drug: 'Formalin (37% formaldehyde)',
      brand: 'Kordon Formalin or Quick Cure',
      dose: 'Bath: 1 mL per gallon for 45-60 minutes. In-tank: 0.5 mL per gallon.',
      duration: 'Daily formalin baths until symptoms resolve (usually 5-7 days)',
      monitoring: 'Formalin depletes oxygen — always add an airstone during treatment. Watch for fish distress.',
    },
    qtSetup: [
      'Small QT tank (5-10 gal is enough for formalin baths)',
      'Separate container for baths (bucket or small tank)',
      'Air stone (essential — formalin consumes oxygen)',
      'Fresh saltwater for post-bath recovery',
    ],
    procedure: [
      'Move affected fish to QT immediately',
      'Prepare formalin bath: 1 mL of 37% formalin per gallon of tank water',
      'Place fish in bath for 45-60 minutes with heavy aeration',
      'Watch carefully — remove fish if extreme distress (rolling, gasping at surface)',
      'After bath, move fish to clean QT water (no formalin)',
      'Repeat bath daily until slime coat normalizes (5-7 days typically)',
      'Methylene blue can be added to the bath as secondary treatment',
    ],
    warnings: [
      'Formalin is a CARCINOGEN — wear gloves and work in ventilated area',
      'Formalin consumes oxygen — airstone is mandatory during baths',
      'Do NOT overdose formalin — it\'s extremely toxic at higher concentrations',
      'Never use formalin in the display tank',
      'Brooklynella kills FAST — start treatment within hours of detection',
    ],
    afterCare: [
      'Keep fish in QT for 2 weeks after symptoms resolve',
      'Feed vitamin-enriched food to rebuild immune system',
      'Observe for secondary bacterial infections',
    ],
  },
  {
    id: 'flukes',
    name: 'Gill & Body Flukes',
    nameEs: 'Trematodos Branquiales',
    icon: 'bug_report',
    color: '#F1C40F',
    urgency: 'high',
    identification: [
      'Heavy or labored breathing (gill flukes)',
      'Fish flashing/scratching against surfaces',
      'Redness around gills',
      'Thin or wasting body despite eating',
      'Cloudy eyes in severe cases',
      'Often invisible to naked eye — microscopic parasites',
    ],
    medication: {
      drug: 'Praziquantel (PraziPro)',
      brand: 'Hikari PraziPro',
      dose: '2.5 mL per 10 gallons',
      duration: '5-7 days. Repeat after 5 day break for second round.',
      monitoring: 'PraziPro is very safe — wide margin between therapeutic and toxic dose. Can be used with most other medications.',
    },
    qtSetup: [
      'Standard QT setup: 10-20 gal, bare bottom, filter, heater',
      'PraziPro can be used in display if fish-only (NOT reef safe for all inverts)',
      'Normal lighting is fine',
    ],
    procedure: [
      'Move fish to QT or treat in QT during standard quarantine',
      'Dose PraziPro: 2.5 mL per 10 gallons',
      'Leave medication in water for 5-7 days',
      'Do 25% water change',
      'Wait 5 days (break period)',
      'Dose second round of PraziPro for another 5-7 days',
      'Two rounds are needed to catch flukes that hatch from eggs',
    ],
    warnings: [
      'PraziPro depletes oxygen slightly — add an airstone',
      'Some invertebrates (especially flatworms) are killed by Prazi — reef caution',
      'Flukes often hitchhike on new fish — another reason to QT everything',
      'Can be combined with copper treatment during prophylactic QT',
    ],
    afterCare: [
      'Include PraziPro as part of standard quarantine protocol for all new fish',
      'Typical QT protocol: Copper (30 days) + PraziPro (2 rounds) = comprehensive',
    ],
  },
];

/* ─── Standard QT Protocol ─── */
const QT_PROTOCOL = [
  { day: '1', action: 'Acclimate fish to QT. Begin observation period. Feed lightly.', color: '#4cd6fb' },
  { day: '2-3', action: 'Observe for symptoms. Begin copper treatment (raise to therapeutic over 24h).', color: '#4cd6fb' },
  { day: '4-14', action: 'Maintain therapeutic copper level. Test copper daily. Feed garlic-soaked food.', color: '#FF7F50' },
  { day: '14', action: 'First round PraziPro (2.5 mL/10 gal). Leave in water 5-7 days.', color: '#F1C40F' },
  { day: '21', action: 'Water change. 5-day break from PraziPro.', color: '#F1C40F' },
  { day: '26', action: 'Second round PraziPro (5-7 days).', color: '#F1C40F' },
  { day: '30+', action: 'Remove copper (carbon + water changes). Observe 2 more weeks.', color: '#2ff801' },
  { day: '42-45', action: 'Fish is cleared. Transfer to display tank. 🎉', color: '#2ff801' },
];

export default function QuarantinePage() {
  const [selectedProtocol, setSelectedProtocol] = useState<DiseaseProtocol | null>(null);
  const [tab, setTab] = useState<'diseases' | 'qt-setup' | 'timeline'>('diseases');

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
            <span className="material-symbols-outlined text-[#FF7F50] text-2xl">local_hospital</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Fish Health</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Hospital & QT</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">Disease protocols & quarantine procedures</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['diseases', '💊 Diseases'], ['qt-setup', '🏥 QT Setup'], ['timeline', '📅 QT Timeline']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelectedProtocol(null); }}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Diseases Tab ═══ */}
      {tab === 'diseases' && !selectedProtocol && (
        <div className="space-y-2">
          {PROTOCOLS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProtocol(p)}
              className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${p.color}15` }}>
                <span className="material-symbols-outlined text-lg" style={{ color: p.color }}>{p.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{p.name}</p>
                <p className="text-[#c5c6cd]/50 text-xs">{p.nameEs}</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase" style={{ backgroundColor: `${p.color}15`, color: p.color }}>
                {p.urgency}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ Disease Detail ═══ */}
      {tab === 'diseases' && selectedProtocol && (
        <div className="space-y-4">
          <button onClick={() => setSelectedProtocol(null)} className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs active:opacity-60">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            All Diseases
          </button>

          {/* Header */}
          <div className="bg-[#0d1c32] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-2xl" style={{ color: selectedProtocol.color }}>{selectedProtocol.icon}</span>
              <div>
                <p className="text-white font-bold text-lg">{selectedProtocol.name}</p>
                <p className="text-[#c5c6cd]/50 text-sm">{selectedProtocol.nameEs}</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest mb-2">Identification</p>
            {selectedProtocol.identification.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="material-symbols-outlined text-xs mt-0.5" style={{ color: selectedProtocol.color }}>visibility</span>
                <p className="text-[#c5c6cd] text-xs">{s}</p>
              </div>
            ))}
          </div>

          {/* Medication */}
          <div className="bg-[#4cd6fb]/5 border border-[#4cd6fb]/15 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest mb-2">Medication</p>
            <p className="text-white font-medium text-sm">{selectedProtocol.medication.drug}</p>
            <p className="text-[#c5c6cd]/60 text-xs">{selectedProtocol.medication.brand}</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-[#041329] rounded-xl p-2">
                <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Dose</p>
                <p className="text-white text-xs">{selectedProtocol.medication.dose}</p>
              </div>
              <div className="bg-[#041329] rounded-xl p-2">
                <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Duration</p>
                <p className="text-white text-xs">{selectedProtocol.medication.duration}</p>
              </div>
            </div>
            <p className="text-[#c5c6cd] text-xs mt-2">{selectedProtocol.medication.monitoring}</p>
          </div>

          {/* Procedure */}
          <div className="bg-[#0d1c32] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest mb-2">Step-by-Step Procedure</p>
            {selectedProtocol.procedure.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <span className="text-[#FF7F50] text-xs font-bold mt-0.5 w-4 shrink-0">{i + 1}.</span>
                <p className="text-[#c5c6cd] text-xs">{s}</p>
              </div>
            ))}
          </div>

          {/* Warnings */}
          <div className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#ff9999] uppercase tracking-widest mb-2">Warnings</p>
            {selectedProtocol.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                <p className="text-[#ff9999] text-xs">{w}</p>
              </div>
            ))}
          </div>

          {/* After Care */}
          <div className="bg-[#0d1c32] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest mb-2">After Recovery</p>
            {selectedProtocol.afterCare.map((a, i) => (
              <div key={i} className="flex items-start gap-2 mb-1">
                <span className="material-symbols-outlined text-xs text-[#2ff801] mt-0.5">check_circle</span>
                <p className="text-[#c5c6cd] text-xs">{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ QT Setup Tab ═══ */}
      {tab === 'qt-setup' && (
        <div className="space-y-4">
          <div className="bg-[#0d1c32] rounded-2xl p-5">
            <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg mb-3">Quarantine Tank Setup</p>
            <p className="text-[#c5c6cd] text-xs mb-4">Every reef keeper needs a QT. It prevents introducing diseases to your display tank.</p>

            {[
              { icon: 'water', color: '#4cd6fb', item: '10-20 gallon tank', note: 'Bare bottom — no sand, no rock (medications need bare surfaces)' },
              { icon: 'filter_alt', color: '#2ff801', item: 'Sponge filter or small HOB', note: 'Pre-seed in display sump. DO NOT run carbon during copper treatment.' },
              { icon: 'thermostat', color: '#FF7F50', item: 'Heater (50-100W)', note: 'Set to 78°F. Stable temperature is critical during treatment.' },
              { icon: 'air', color: '#d7ffc5', item: 'Air pump + airstone', note: 'Essential for formalin baths. Good for all treatments (oxygen).' },
              { icon: 'plumbing', color: '#F1C40F', item: 'PVC pipe fittings', note: 'Cheap hiding spots. Fish need cover to reduce stress during treatment.' },
              { icon: 'science', color: '#c5a3ff', item: 'Copper test kit', note: 'Hanna Copper Checker is the gold standard. Test DAILY during copper treatment.' },
              { icon: 'sensors', color: '#ffb59c', item: 'Ammonia alert badge', note: 'Stick-on sensor. Copper kills bacteria so ammonia spikes are common in QT.' },
              { icon: 'lightbulb', color: '#8f9097', item: 'Basic light (optional)', note: 'Low-wattage clip-on light. Cover tank during CP treatment.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: item.color }}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.item}</p>
                  <p className="text-[#c5c6cd]/50 text-xs">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#2ff801]/5 border border-[#2ff801]/15 rounded-2xl p-4">
            <p className="text-[#2ff801] font-bold text-sm mb-1">Total Cost: ~$50-80</p>
            <p className="text-[#c5c6cd] text-xs">A QT tank costs less than a single dead fish. It's the best investment in your reef.</p>
          </div>
        </div>
      )}

      {/* ═══ Timeline Tab ═══ */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          <p className="text-[#c5c6cd] text-xs mb-1">Standard prophylactic quarantine protocol for ALL new fish:</p>

          {QT_PROTOCOL.map((step, i) => (
            <div key={i} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}15` }}>
                  <span className="text-[10px] font-bold" style={{ color: step.color }}>{step.day.includes('-') ? '' : 'D'}{step.day}</span>
                </div>
                {i < QT_PROTOCOL.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ backgroundColor: `${step.color}30` }} />}
              </div>

              <div className="bg-[#0d1c32] rounded-xl p-3 flex-1 mb-1">
                <p className="text-[10px] font-bold uppercase" style={{ color: step.color }}>Day {step.day}</p>
                <p className="text-[#c5c6cd] text-xs mt-0.5">{step.action}</p>
              </div>
            </div>
          ))}

          <div className="bg-[#FF7F50]/10 border border-[#FF7F50]/15 rounded-2xl p-4 mt-2">
            <p className="text-[#FF7F50] font-bold text-sm mb-1">The Golden Rule</p>
            <p className="text-[#c5c6cd] text-xs">EVERY new fish goes through QT. No exceptions. Not even from trusted stores. Ich and velvet are invisible in the store tank and can devastate your reef.</p>
          </div>
        </div>
      )}
    </div>
  );
}
