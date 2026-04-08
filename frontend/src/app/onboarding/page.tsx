'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { createEquipment, createMaintenanceTask } from '@/lib/queries';

/* ── Step Definitions ─────────────────────────────────── */

const STEPS = [
  { title: 'Design Your System', subtitle: 'Tank size, type & configuration', icon: 'water' },
  { title: 'About You', subtitle: 'Experience, goals & preferences', icon: 'school' },
  { title: 'Gear Up', subtitle: 'Equipment checklist', icon: 'build' },
  { title: 'Mix Your Ocean', subtitle: 'Water preparation guide', icon: 'water_drop' },
  { title: 'The Patience Step', subtitle: 'Cycle readiness & nitrogen cycle', icon: 'biotech' },
  { title: 'Welcome to ReefOS', subtitle: 'You\'re ready to begin', icon: 'rocket_launch' },
];

const TANK_TYPES = [
  { key: 'reef', label: 'Reef Tank', desc: 'SPS, LPS, soft corals', icon: 'waves' },
  { key: 'mixed', label: 'Mixed Reef', desc: 'Fish + corals balanced', icon: 'pets' },
  { key: 'fish_only', label: 'Fish Only', desc: 'FOWLR or FO system', icon: 'set_meal' },
  { key: 'nano', label: 'Nano Reef', desc: 'Under 30 gallons', icon: 'science' },
];

const SUMP_TYPES = [
  { key: 'sump', label: 'Sump System', desc: 'Separate chamber below tank — hides equipment, more water volume', icon: 'filter_alt' },
  { key: 'aio', label: 'All-in-One', desc: 'Rear chambers built into tank — compact, beginner-friendly', icon: 'check_box' },
  { key: 'hob', label: 'Hang-on-Back', desc: 'External filters/skimmer hang on rim — budget option', icon: 'dock_to_right' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'First saltwater tank', icon: 'eco' },
  { key: 'intermediate', label: 'Intermediate', desc: '1-3 years experience', icon: 'trending_up' },
  { key: 'advanced', label: 'Advanced', desc: '3+ years, SPS keeper', icon: 'military_tech' },
];

const REEF_GOALS = [
  { key: 'fish_focus', label: 'Fish-Focused', desc: 'Colorful fish, minimal corals', icon: 'set_meal', color: '#F1C40F' },
  { key: 'coral_garden', label: 'Coral Garden', desc: 'Softies & LPS dominated', icon: 'nature', color: '#2ff801' },
  { key: 'sps_reef', label: 'SPS Reef', desc: 'Advanced long-term goal', icon: 'military_tech', color: '#FF7F50' },
  { key: 'mixed', label: 'Mixed Reef', desc: 'Balanced ecosystem', icon: 'waves', color: '#4cd6fb' },
];

/* ── Equipment Checklist ──────────────────────────────── */

interface EquipItem {
  name: string;
  category: string;
  why: string;
  essential: boolean;
  status: 'have' | 'need' | 'skip';
}

const INITIAL_EQUIPMENT: EquipItem[] = [
  // Core
  { name: 'Aquarium / Tank', category: 'Core', why: 'The glass or acrylic enclosure — foundation of everything', essential: true, status: 'need' },
  { name: 'Stand', category: 'Core', why: 'Must support total weight (gallons × 10 lbs + rock + sand)', essential: true, status: 'need' },
  { name: 'Return Pump', category: 'Core', why: 'Moves water from sump back to display tank', essential: true, status: 'need' },
  // Filtration
  { name: 'Protein Skimmer', category: 'Filtration', why: 'Removes organic waste via foam fractionation — the most important piece of filtration', essential: true, status: 'need' },
  { name: 'Filter Socks / Roller', category: 'Filtration', why: 'Catches detritus and particles before they decompose', essential: false, status: 'need' },
  { name: 'Carbon / GFO Media', category: 'Filtration', why: 'Carbon removes toxins, GFO removes phosphate', essential: false, status: 'need' },
  // Circulation
  { name: 'Wavemaker / Powerhead', category: 'Circulation', why: 'Corals need flow for gas exchange and feeding — aim for 40-80× turnover', essential: true, status: 'need' },
  // Lighting
  { name: 'LED Light Fixture', category: 'Lighting', why: 'Provides PAR for photosynthesis — blue/white spectrum for corals', essential: true, status: 'need' },
  // Water
  { name: 'RO/DI Unit', category: 'Water', why: 'Removes 95%+ of tap water impurities — never use raw tap water', essential: true, status: 'need' },
  { name: 'Salt Mix', category: 'Water', why: 'Creates synthetic seawater — brands: Red Sea, Fritz, Instant Ocean', essential: true, status: 'need' },
  { name: 'Refractometer', category: 'Water', why: 'Measures salinity accurately — target 1.025-1.026 SG', essential: true, status: 'need' },
  { name: 'Mixing Container + Pump', category: 'Water', why: 'Mix saltwater 24hrs before use — match temp and salinity', essential: true, status: 'need' },
  // Heating
  { name: 'Heater', category: 'Heating', why: 'Maintains 76-78°F — corals die at <72°F', essential: true, status: 'need' },
  { name: 'Thermometer / Controller', category: 'Heating', why: 'Monitors temp — prevents heater malfunction from cooking livestock', essential: false, status: 'need' },
  // Monitoring
  { name: 'Test Kits (Alk/Ca/Mg/NO3/PO4)', category: 'Monitoring', why: 'Weekly parameter testing is mandatory — Hanna Checkers or Salifert recommended', essential: true, status: 'need' },
];

/* ── Default Maintenance Tasks ────────────────────────── */

function getDefaultTasks(tankSize: number) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + ((6 + 7 - now.getDay()) % 7 || 7));

  return [
    // Daily
    { task_name: 'Top-off / ATO Check', category: 'water_management', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Replenish evaporated water with RODI. Never add saltwater for top-off.' },
    { task_name: 'Feed Fish', category: 'feeding', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Feed only what is consumed in 2-3 minutes. Overfeeding causes nutrient spikes.' },
    { task_name: 'Visual Inspection', category: 'other', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Check coral expansion, fish behavior, equipment function. Look for anything unusual.' },

    // Weekly
    { task_name: 'Test Water Parameters', category: 'testing', interval_days: 7, next_due_at: nextMonday.toISOString(), notes: 'Measure Alk, Ca, Mg, NO3, PO4. Log in ReefOS Logs.' },
    { task_name: `Water Change (${Math.round(tankSize * 0.15)} gal)`, category: 'water_change', interval_days: 7, next_due_at: nextSaturday.toISOString(), notes: `Change ~15% (${Math.round(tankSize * 0.15)} gallons) of tank water. Siphon detritus from substrate.` },
    { task_name: 'Clean Glass', category: 'cleaning', interval_days: 7, next_due_at: nextSaturday.toISOString(), notes: 'Use magnetic cleaner or scraper. Remove coralline and algae buildup.' },

    // Biweekly
    { task_name: 'Replace Filter Socks', category: 'filtration', interval_days: 3, next_due_at: new Date(now.getTime() + 3 * 86400000).toISOString(), notes: 'Swap filter socks to prevent nitrate factory effect. Machine wash used socks in hot water (no detergent).' },

    // Monthly  
    { task_name: 'Clean Skimmer Cup & Neck', category: 'equipment', interval_days: 14, next_due_at: new Date(now.getTime() + 14 * 86400000).toISOString(), notes: 'Clean collection cup and neck. A dirty neck reduces skimming efficiency significantly.' },
    { task_name: 'Inspect Pump & Powerheads', category: 'equipment', interval_days: 30, next_due_at: new Date(now.getTime() + 30 * 86400000).toISOString(), notes: 'Check for calcium deposits on impellers. Soak in citric acid solution if needed.' },

    // Quarterly
    { task_name: 'Replace Carbon Media', category: 'filtration', interval_days: 30, next_due_at: new Date(now.getTime() + 30 * 86400000).toISOString(), notes: 'Activated carbon loses effectiveness after 4-6 weeks. Replace in media reactor or bag.' },
    { task_name: 'Replace GFO (Phosphate Remover)', category: 'filtration', interval_days: 45, next_due_at: new Date(now.getTime() + 45 * 86400000).toISOString(), notes: 'GFO is exhausted after 4-6 weeks. Replace and rinse new media before use.' },
    { task_name: 'Calibrate Refractometer', category: 'equipment', interval_days: 90, next_due_at: new Date(now.getTime() + 90 * 86400000).toISOString(), notes: 'Use calibration fluid (not RODI). Ensure salinity reads 35 ppt accurately.' },
    { task_name: 'Deep Equipment Cleaning', category: 'maintenance', interval_days: 90, next_due_at: new Date(now.getTime() + 90 * 86400000).toISOString(), notes: 'Soak pumps in citric acid, deep clean skimmer venturi, inspect heater for salt creep.' },
  ];
}

/* ── Weight Calculator ────────────────────────────────── */

function calcWeight(gallons: number) {
  const waterLbs = gallons * 8.6; // saltwater is ~8.6 lbs/gal
  const rockLbs = gallons * 1.5;  // ~1.5 lbs rock per gallon
  const sandLbs = gallons * 1;    // ~1 lb sand per gallon
  const glassLbs = gallons * 1.5; // approximate glass weight
  const totalLbs = waterLbs + rockLbs + sandLbs + glassLbs;
  return { waterLbs: Math.round(waterLbs), rockLbs: Math.round(rockLbs), sandLbs: Math.round(sandLbs), glassLbs: Math.round(glassLbs), totalLbs: Math.round(totalLbs), totalKg: Math.round(totalLbs * 0.453) };
}

/* ── Main Component ───────────────────────────────────── */

export default function SetupWizard() {
  const { user, refreshProfile, refreshTank } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Tank
  const [tankName, setTankName] = useState('');
  const [tankSize, setTankSize] = useState('');
  const [tankType, setTankType] = useState('mixed');
  const [sumpType, setSumpType] = useState('sump');

  // Step 2: Profile
  const [experience, setExperience] = useState('beginner');
  const [reefGoal, setReefGoal] = useState('mixed');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [units, setUnits] = useState('imperial');
  const [language, setLanguage] = useState('en');

  // Step 3: Equipment
  const [equipment, setEquipment] = useState<EquipItem[]>(INITIAL_EQUIPMENT.map(e => ({ ...e })));
  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);

  // Step 5: Cycle
  const [startCycle, setStartCycle] = useState(false);

  const gallons = parseInt(tankSize) || 0;
  const weight = calcWeight(gallons);

  const canAdvance = () => {
    if (step === 0) return tankName.trim().length > 0;
    return true;
  };

  const toggleEquipStatus = (idx: number) => {
    setEquipment(prev => {
      const updated = [...prev];
      const states: EquipItem['status'][] = ['have', 'need', 'skip'];
      const currentIdx = states.indexOf(updated[idx].status);
      updated[idx] = { ...updated[idx], status: states[(currentIdx + 1) % 3] };
      return updated;
    });
  };

  /* ── Save & Finish ──────────────────────────────────── */

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    try {
      const supabase = getSupabase();

      // 1. Update profile
      await supabase.from('reef_profiles').update({
        experience_level: experience,
        location_city: city || null,
        location_state: state || null,
        units,
        language,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      // 2. Create tank
      const { data: newTank, error: tankErr } = await supabase.from('reef_tanks').insert({
        user_id: user.id,
        name: tankName || 'My Reef',
        size_gallons: gallons || null,
        tank_type: tankType,
        sump_type: sumpType,
        reef_goal: reefGoal,
        is_primary: true,
        cycle_started_at: startCycle ? new Date().toISOString() : null,
        setup_completed_at: new Date().toISOString(),
      }).select().single();

      if (tankErr) { setError(`Tank: ${tankErr.message}`); setSaving(false); return; }

      // 3. Auto-add equipment that user marked as "have"
      const haveItems = equipment.filter(e => e.status === 'have');
      for (const item of haveItems) {
        await createEquipment({
          name: item.name,
          category: item.category.toLowerCase(),
          notes: `Added via Setup Wizard`,
        });
      }

      // 4. Auto-seed maintenance tasks
      const taskSize = gallons || 40;
      const defaultTasks = getDefaultTasks(taskSize);
      for (const task of defaultTasks) {
        await createMaintenanceTask({
          ...task,
          user_id: user.id,
          tank_id: newTank?.id || null,
        });
      }

      await refreshProfile();
      await refreshTank();
      router.push('/');
    } catch (err: unknown) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };
  const back = () => { if (step > 0) setStep(step - 1); };

  // Equipment stats
  const haveCount = equipment.filter(e => e.status === 'have').length;
  const needCount = equipment.filter(e => e.status === 'need').length;
  const essentialMissing = equipment.filter(e => e.essential && e.status !== 'have').length;

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="space-y-6">
        <div className="flex gap-1.5 mt-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#FF7F50]' : 'bg-[#1c2a41]'}`} />
          ))}
        </div>

        {/* Step Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#FF7F50]">{STEPS[step].icon}</span>
          </div>
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider font-bold">Step {step + 1} of {STEPS.length}</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">{STEPS[step].title}</h1>
          <p className="text-[#c5c6cd] text-sm">{STEPS[step].subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="space-y-4 mt-4">

          {/* ── STEP 1: Tank Setup ──────────────────────── */}
          {step === 0 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Tank Name</label>
                <input type="text" value={tankName} onChange={e => setTankName(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., Living Room Reef" autoFocus />
              </div>

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Tank Size (gallons)</label>
                <input type="number" value={tankSize} onChange={e => setTankSize(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., 40" />
              </div>

              {/* Weight Calculator */}
              {gallons > 0 && (
                <div className="bg-[#0d1c32] rounded-xl p-4 space-y-3 border border-[#1c2a41]">
                  <p className="text-[10px] text-[#FF7F50] uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">scale</span>
                    Estimated Total Weight
                  </p>
                  <p className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-white">
                    {weight.totalLbs} lbs <span className="text-sm text-[#8f9097]">({weight.totalKg} kg)</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Water', val: weight.waterLbs, color: '#4cd6fb' },
                      { label: 'Rock', val: weight.rockLbs, color: '#c5c6cd' },
                      { label: 'Sand', val: weight.sandLbs, color: '#F1C40F' },
                      { label: 'Glass', val: weight.glassLbs, color: '#8f9097' },
                    ].map(w => (
                      <div key={w.label}>
                        <p className="text-sm font-bold" style={{ color: w.color }}>{w.val}</p>
                        <p className="text-[9px] text-[#8f9097]">{w.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#F1C40F] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Ensure your stand is rated for {Math.ceil(weight.totalLbs / 50) * 50}+ lbs
                  </p>
                </div>
              )}

              {/* Beginner Tip */}
              {gallons > 0 && gallons < 30 && (
                <div className="bg-[#FF7F50]/5 border border-[#FF7F50]/20 rounded-xl p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#FF7F50] text-lg mt-0.5">tips_and_updates</span>
                  <div>
                    <p className="text-[#FF7F50] text-xs font-bold">Nano Tank Advisory</p>
                    <p className="text-[#c5c6cd] text-[11px] mt-1 leading-relaxed">Tanks under 30 gallons are <strong className="text-white">harder for beginners</strong> — smaller water volume means faster parameter swings. Consider 40+ gallons for more forgiving chemistry.</p>
                  </div>
                </div>
              )}

              {/* Tank Type */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Tank Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TANK_TYPES.map(t => (
                    <button key={t.key} onClick={() => setTankType(t.key)}
                      className={`p-4 rounded-xl text-left transition-all ${tankType === t.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] shadow-lg shadow-[#FF7F50]/10'
                        : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <span className={`material-symbols-outlined text-xl mb-2 ${tankType === t.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{t.icon}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${tankType === t.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{t.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sump Type */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Filtration Setup</label>
                <div className="space-y-2">
                  {SUMP_TYPES.map(s => (
                    <button key={s.key} onClick={() => setSumpType(s.key)}
                      className={`w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all ${sumpType === s.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                        : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sumpType === s.key ? 'bg-[#FF7F50]/20' : 'bg-[#1c2a41]'}`}>
                        <span className={`material-symbols-outlined ${sumpType === s.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{s.icon}</span>
                      </div>
                      <div>
                        <p className={`font-[family-name:var(--font-headline)] font-semibold text-sm ${sumpType === s.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{s.label}</p>
                        <p className="text-[10px] text-[#8f9097] mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Experience & Goals ──────────────── */}
          {step === 1 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Experience Level</label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <button key={lvl.key} onClick={() => setExperience(lvl.key)}
                      className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${experience === lvl.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]' : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${experience === lvl.key ? 'bg-[#FF7F50]/20' : 'bg-[#1c2a41]'}`}>
                        <span className={`material-symbols-outlined ${experience === lvl.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{lvl.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className={`font-[family-name:var(--font-headline)] font-semibold ${experience === lvl.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{lvl.label}</p>
                        <p className="text-xs text-[#8f9097]">{lvl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">
                  Reef Goal <span className="text-[#8f9097]">• What do you want to build?</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REEF_GOALS.map(g => (
                    <button key={g.key} onClick={() => setReefGoal(g.key)}
                      className={`p-4 rounded-xl text-left transition-all ${reefGoal === g.key
                        ? 'border-2 shadow-lg' : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                      style={reefGoal === g.key ? { borderColor: g.color, backgroundColor: `${g.color}15`, boxShadow: `0 4px 16px ${g.color}20` } : {}}
                    >
                      <span className="material-symbols-outlined text-xl mb-2" style={{ color: reefGoal === g.key ? g.color : '#c5c6cd' }}>{g.icon}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${reefGoal === g.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{g.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (compact) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 text-sm" placeholder="Miami" />
                </div>
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 text-sm" placeholder="FL" />
                </div>
              </div>

              {/* Units & Language */}
              <div className="flex gap-3">
                {[{ key: 'imperial', label: '🇺🇸 Imperial' }, { key: 'metric', label: '🌍 Metric' }].map(u => (
                  <button key={u.key} onClick={() => setUnits(u.key)}
                    className={`flex-1 p-3 rounded-xl text-center text-sm font-[family-name:var(--font-headline)] font-semibold transition-all ${units === u.key
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] text-white' : 'bg-[#0d1c32] border-2 border-transparent text-[#c5c6cd]'}`}
                  >{u.label}</button>
                ))}
              </div>
              <div className="flex gap-3">
                {[{ key: 'en', label: '🇺🇸 English' }, { key: 'es', label: '🇪🇸 Español' }, { key: 'pt', label: '🇧🇷 Português' }].map(l => (
                  <button key={l.key} onClick={() => setLanguage(l.key)}
                    className={`flex-1 p-3 rounded-xl text-center text-xs font-[family-name:var(--font-headline)] font-semibold transition-all ${language === l.key
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] text-white' : 'bg-[#0d1c32] border-2 border-transparent text-[#c5c6cd]'}`}
                  >{l.label}</button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Equipment Checklist ─────────────── */}
          {step === 2 && (
            <>
              {/* Stats Bar */}
              <div className="flex gap-3">
                <div className="flex-1 bg-[#2ff801]/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#2ff801]">{haveCount}</p>
                  <p className="text-[9px] text-[#2ff801]/70 uppercase tracking-wider font-bold">Have</p>
                </div>
                <div className="flex-1 bg-[#FF7F50]/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#FF7F50]">{needCount}</p>
                  <p className="text-[9px] text-[#FF7F50]/70 uppercase tracking-wider font-bold">Need</p>
                </div>
                <div className="flex-1 bg-[#1c2a41] rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#8f9097]">{equipment.length - haveCount - needCount}</p>
                  <p className="text-[9px] text-[#8f9097]/70 uppercase tracking-wider font-bold">Skip</p>
                </div>
              </div>

              {essentialMissing > 0 && (
                <div className="bg-[#FF7F50]/5 border border-[#FF7F50]/20 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF7F50] text-sm">info</span>
                  <p className="text-[11px] text-[#c5c6cd]"><strong className="text-[#FF7F50]">{essentialMissing} essential</strong> items still needed. Tap items to toggle status.</p>
                </div>
              )}

              {/* Equipment List */}
              {['Core', 'Filtration', 'Circulation', 'Lighting', 'Water', 'Heating', 'Monitoring'].map(cat => {
                const items = equipment.filter(e => e.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest mb-2">{cat}</p>
                    <div className="space-y-1.5">
                      {items.map((item, _) => {
                        const globalIdx = equipment.indexOf(item);
                        const statusConfig = {
                          have: { bg: 'bg-[#2ff801]/10', border: 'border-[#2ff801]/30', icon: 'check_circle', iconColor: 'text-[#2ff801]' },
                          need: { bg: 'bg-[#FF7F50]/10', border: 'border-[#FF7F50]/30', icon: 'shopping_cart', iconColor: 'text-[#FF7F50]' },
                          skip: { bg: 'bg-[#1c2a41]', border: 'border-transparent', icon: 'do_not_disturb_on', iconColor: 'text-[#8f9097]' },
                        }[item.status];
                        return (
                          <div key={item.name}>
                            <button
                              onClick={() => toggleEquipStatus(globalIdx)}
                              className={`w-full ${statusConfig.bg} border ${statusConfig.border} rounded-xl p-3 flex items-center gap-3 text-left transition-all active:scale-[0.98]`}
                            >
                              <span className={`material-symbols-outlined ${statusConfig.iconColor}`}>{statusConfig.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${item.status === 'skip' ? 'text-[#8f9097] line-through' : 'text-white'}`}>
                                  {item.name}
                                  {item.essential && <span className="text-[#FF7F50] text-[8px] ml-1">●</span>}
                                </p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setExpandedTooltip(expandedTooltip === item.name ? null : item.name); }}
                                className="w-6 h-6 rounded-full bg-[#1c2a41] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#8f9097] text-xs">help</span>
                              </button>
                            </button>
                            {expandedTooltip === item.name && (
                              <div className="mx-2 mt-1 mb-2 p-3 bg-[#1c2a41] rounded-lg border border-[#27354c]">
                                <p className="text-[11px] text-[#c5c6cd] leading-relaxed">{item.why}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── STEP 4: Water Preparation ───────────────── */}
          {step === 3 && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-5 border border-[#1c2a41]">
                {[
                  { num: 1, icon: 'water_drop', title: 'Fill with RO/DI Water', desc: 'Use purified water only — never tap water. TDS meter should read 0.', color: '#4cd6fb' },
                  { num: 2, icon: 'science', title: 'Add Salt Mix', desc: `For ${gallons || 40} gallons: approximately ${Math.round((gallons || 40) * 0.5)} cups of salt mix. Target: 35 ppt (1.026 SG).`, color: '#FF7F50' },
                  { num: 3, icon: 'autorenew', title: 'Mix for 24 Hours', desc: 'Add a heater (set to 77°F) and a pump. Let it circulate overnight to fully dissolve and aerate.', color: '#F1C40F' },
                  { num: 4, icon: 'straighten', title: 'Verify with Refractometer', desc: 'Measure salinity — should read 1.025-1.026. Adjust salt/water if needed before adding to tank.', color: '#2ff801' },
                ].map(s => (
                  <div key={s.num} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>Step {s.num}</span>
                        {s.title}
                      </p>
                      <p className="text-[#c5c6cd] text-xs mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reference */}
              <div className="bg-[#4cd6fb]/5 border border-[#4cd6fb]/20 rounded-xl p-4 space-y-2">
                <p className="text-[10px] text-[#4cd6fb] uppercase tracking-widest font-bold">Quick Reference</p>
                {[
                  ['Salt per gallon', '~½ cup (varies by brand)'],
                  ['Target salinity', '1.025-1.026 SG / 35 ppt'],
                  ['Water temperature', '76-78°F (24-26°C)'],
                  ['Mixing time', 'Minimum 24 hours'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-[#c5c6cd]">{label}</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-lg">warning</span>
                <p className="text-[11px] text-[#ffb4ab] leading-relaxed"><strong>Never use tap water.</strong> Tap water contains phosphates, silicates, chlorine, and heavy metals that will cause algae blooms and kill invertebrates.</p>
              </div>
            </>
          )}

          {/* ── STEP 5: Cycle Readiness ─────────────────── */}
          {step === 4 && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 border border-[#1c2a41]">
                <p className="text-[10px] text-[#4cd6fb] uppercase tracking-widest font-bold mb-4">The Nitrogen Cycle</p>
                {/* Visual Timeline */}
                <div className="space-y-4">
                  {[
                    { week: 'Week 1-2', title: 'Ammonia Spike', desc: 'Bacteria begin colonizing rock. NH3 rises — this is normal and expected.', color: '#ffb4ab', icon: 'trending_up' },
                    { week: 'Week 2-3', title: 'Nitrite Spike', desc: 'Nitrosomonas bacteria convert NH3 → NO2. Nitrite peaks then slowly falls.', color: '#F1C40F', icon: 'swap_horiz' },
                    { week: 'Week 3-5', title: 'Nitrate Appears', desc: 'Nitrospira bacteria convert NO2 → NO3. Nitrate rises while NH3 and NO2 drop to zero.', color: '#FF7F50', icon: 'trending_down' },
                    { week: 'Week 4-6', title: '🟢 Safe to Stock', desc: 'NH3 = 0, NO2 = 0, NO3 present. Cycle is complete! Start with cleanup crew.', color: '#2ff801', icon: 'check_circle' },
                  ].map((phase, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${phase.color}15` }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: phase.color }}>{phase.icon}</span>
                        </div>
                        {i < 3 && <div className="w-0.5 h-6 bg-[#1c2a41] mt-1" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: phase.color }}>{phase.week}</p>
                        <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm">{phase.title}</p>
                        <p className="text-[#c5c6cd] text-xs mt-0.5 leading-relaxed">{phase.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bacterial Starters */}
              <div className="bg-[#2ff801]/5 border border-[#2ff801]/20 rounded-xl p-4">
                <p className="text-[10px] text-[#2ff801] uppercase tracking-widest font-bold mb-2">
                  <span className="material-symbols-outlined text-xs align-middle mr-1">biotech</span>
                  Speed Up Your Cycle
                </p>
                <p className="text-xs text-[#c5c6cd] leading-relaxed mb-2">Add bottled bacteria on Day 1 to accelerate the cycle from 6 weeks to 2-3 weeks:</p>
                <div className="space-y-1.5">
                  {['Fritz TurboStart 900', 'Dr. Tim\'s One and Only', 'MicroBacter7 (Brightwell)'].map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs text-white">
                      <span className="material-symbols-outlined text-[#2ff801] text-sm">check</span> {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Cycle Toggle */}
              <button
                onClick={() => setStartCycle(!startCycle)}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${startCycle
                  ? 'bg-[#2ff801]/15 border-2 border-[#2ff801]'
                  : 'bg-[#0d1c32] border-2 border-[#1c2a41] hover:border-[#27354c]'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${startCycle ? 'bg-[#2ff801]/20' : 'bg-[#1c2a41]'}`}>
                  <span className={`material-symbols-outlined ${startCycle ? 'text-[#2ff801]' : 'text-[#8f9097]'}`}>
                    {startCycle ? 'check_circle' : 'play_circle'}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <p className={`font-[family-name:var(--font-headline)] font-bold ${startCycle ? 'text-[#2ff801]' : 'text-white'}`}>
                    {startCycle ? 'Cycle Tracking Active!' : 'Start My Cycle Now'}
                  </p>
                  <p className="text-[10px] text-[#8f9097]">{startCycle ? 'ReefOS will track your ammonia, nitrite & nitrate' : 'Tap to begin tracking your nitrogen cycle'}</p>
                </div>
              </button>
            </>
          )}

          {/* ── STEP 6: Launch ──────────────────────────── */}
          {step === 5 && (
            <>
              {/* Celebration */}
              <div className="text-center py-4">
                <div className="text-6xl mb-4">🪸</div>
                <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">Your reef journey begins!</h2>
                <p className="text-[#c5c6cd] text-sm mt-2">ReefOS will monitor, guide, and protect your ecosystem.</p>
              </div>

              {/* Setup Summary */}
              <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3 border border-[#1c2a41]">
                <p className="text-[10px] text-[#FF7F50] uppercase tracking-widest font-bold">Your Setup</p>
                {[
                  { label: 'Tank', value: `${tankName || 'My Reef'} · ${gallons || '—'} gal`, icon: 'water' },
                  { label: 'Type', value: TANK_TYPES.find(t => t.key === tankType)?.label || tankType, icon: 'category' },
                  { label: 'Goal', value: REEF_GOALS.find(g => g.key === reefGoal)?.label || reefGoal, icon: 'flag' },
                  { label: 'Equipment', value: `${haveCount} owned · ${needCount} to buy`, icon: 'build' },
                  { label: 'Cycle', value: startCycle ? 'Tracking active 🟢' : 'Not started yet', icon: 'biotech' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#FF7F50] text-lg">{row.icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#8f9097] uppercase tracking-wider">{row.label}</p>
                      <p className="text-white text-sm font-medium">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* What's Next */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">What&apos;s Next</p>
                {[
                  { icon: 'science', title: 'Log your first water test', desc: 'Start tracking NH3, NO2, NO3 for cycle monitoring', color: '#4cd6fb' },
                  { icon: 'menu_book', title: 'Read beginner guides', desc: '14 articles covering every aspect of reef keeping', color: '#FF7F50' },
                  { icon: 'pets', title: 'Browse the Species Library', desc: '180+ fish, corals & invertebrates with care guides', color: '#2ff801' },
                ].map(card => (
                  <div key={card.title} className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-3 border border-[#1c2a41]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{card.title}</p>
                      <p className="text-[10px] text-[#8f9097]">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-maintenance note */}
              <div className="bg-[#4cd6fb]/5 border border-[#4cd6fb]/20 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#4cd6fb] text-lg">task_alt</span>
                <p className="text-[11px] text-[#c5c6cd] leading-relaxed">
                  <strong className="text-[#4cd6fb]">14 maintenance tasks</strong> have been created for your {gallons || 40}g system — daily, weekly, monthly & quarterly routines are all set.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#93000a]/20 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-center gap-2 mt-4">
          <span className="material-symbols-outlined text-[#ffb4ab] text-sm">error</span>
          <span className="text-[#ffb4ab] text-xs">{error}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-6 pb-4">
        {step > 0 && (
          <button onClick={back}
            className="flex-1 py-4 bg-[#1c2a41] text-[#c5c6cd] rounded-xl font-[family-name:var(--font-headline)] font-semibold text-sm hover:bg-[#27354c] transition-colors">
            Back
          </button>
        )}
        <button onClick={next} disabled={!canAdvance() || saving}
          className="flex-[2] bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {saving ? (
            <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Setting up...</>
          ) : step === STEPS.length - 1 ? (
            <><span className="material-symbols-outlined text-sm">rocket_launch</span> Launch ReefOS</>
          ) : (
            <>Continue <span className="material-symbols-outlined text-sm">arrow_forward</span></>
          )}
        </button>
      </div>
    </div>
  );
}
