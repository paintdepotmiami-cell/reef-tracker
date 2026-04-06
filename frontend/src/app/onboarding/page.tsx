'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

const STEPS = [
  { title: 'Your Tank', subtitle: 'Tell us about your reef', icon: 'water' },
  { title: 'Experience', subtitle: 'How long have you been reefing?', icon: 'school' },
  { title: 'Location', subtitle: 'Find stores near you', icon: 'location_on' },
  { title: 'Preferences', subtitle: 'Customize your experience', icon: 'tune' },
];

const TANK_TYPES = [
  { key: 'reef', label: 'Reef Tank', desc: 'SPS, LPS, softies', icon: 'waves' },
  { key: 'mixed', label: 'Mixed Reef', desc: 'Fish + corals', icon: 'pets' },
  { key: 'fish_only', label: 'Fish Only', desc: 'FOWLR or FO', icon: 'set_meal' },
  { key: 'nano', label: 'Nano Reef', desc: 'Under 30 gallons', icon: 'science' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Less than 1 year', icon: 'eco' },
  { key: 'intermediate', label: 'Intermediate', desc: '1-3 years', icon: 'trending_up' },
  { key: 'advanced', label: 'Advanced', desc: '3+ years', icon: 'military_tech' },
];

export default function OnboardingPage() {
  const { user, refreshProfile, refreshTank } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form data
  const [tankName, setTankName] = useState('');
  const [tankSize, setTankSize] = useState('');
  const [tankType, setTankType] = useState('mixed');
  const [experience, setExperience] = useState('intermediate');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [units, setUnits] = useState('imperial');
  const [language, setLanguage] = useState('en');

  const canAdvance = () => {
    if (step === 0) return tankName.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return true;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const supabase = getSupabase();

    // Update profile
    await supabase.from('reef_profiles').upsert({
      id: user.id,
      experience_level: experience,
      location_city: city || null,
      location_state: state || null,
      units,
      language,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });

    // Create tank
    await supabase.from('reef_tanks').insert({
      user_id: user.id,
      name: tankName || 'My Reef',
      size_gallons: tankSize ? parseInt(tankSize) : null,
      tank_type: tankType,
      is_primary: true,
    });

    await refreshProfile();
    await refreshTank();
    setSaving(false);
    router.push('/');
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };
  const back = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-md mx-auto">
      {/* Progress */}
      <div className="space-y-6">
        <div className="flex gap-2 mt-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-[#FF7F50]' : 'bg-[#1c2a41]'}`} />
          ))}
        </div>

        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#FF7F50]">{STEPS[step].icon}</span>
          </div>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">{STEPS[step].title}</h1>
          <p className="text-[#c5c6cd] text-sm">{STEPS[step].subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="space-y-4 mt-6">
          {step === 0 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Tank Name</label>
                <input
                  type="text"
                  value={tankName}
                  onChange={e => setTankName(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., Living Room Reef"
                  autoFocus
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Tank Size (gallons)</label>
                <input
                  type="number"
                  value={tankSize}
                  onChange={e => setTankSize(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., 40"
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Tank Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TANK_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTankType(t.key)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        tankType === t.key
                          ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] shadow-lg shadow-[#FF7F50]/10'
                          : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-xl mb-2 ${tankType === t.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{t.icon}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${tankType === t.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{t.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map(lvl => (
                <button
                  key={lvl.key}
                  onClick={() => setExperience(lvl.key)}
                  className={`w-full p-5 rounded-xl flex items-center gap-4 transition-all ${
                    experience === lvl.key
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                      : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${experience === lvl.key ? 'bg-[#FF7F50]/20' : 'bg-[#1c2a41]'}`}>
                    <span className={`material-symbols-outlined ${experience === lvl.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{lvl.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-[family-name:var(--font-headline)] font-semibold ${experience === lvl.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{lvl.label}</p>
                    <p className="text-xs text-[#8f9097]">{lvl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., Miami"
                />
              </div>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., FL"
                />
              </div>
              <p className="text-[#8f9097] text-xs text-center mt-2">
                <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                We use this to find local fish stores near you. Optional.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Units</label>
                <div className="flex gap-3">
                  {[
                    { key: 'imperial', label: 'Imperial', desc: 'Gallons, °F, inches' },
                    { key: 'metric', label: 'Metric', desc: 'Liters, °C, cm' },
                  ].map(u => (
                    <button
                      key={u.key}
                      onClick={() => setUnits(u.key)}
                      className={`flex-1 p-4 rounded-xl text-center transition-all ${
                        units === u.key
                          ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                          : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'
                      }`}
                    >
                      <p className={`font-[family-name:var(--font-headline)] font-semibold text-sm ${units === u.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{u.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-1">{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Language</label>
                <div className="flex gap-3">
                  {[
                    { key: 'en', label: 'English', flag: '🇺🇸' },
                    { key: 'es', label: 'Espanol', flag: '🇪🇸' },
                    { key: 'pt', label: 'Portugues', flag: '🇧🇷' },
                  ].map(l => (
                    <button
                      key={l.key}
                      onClick={() => setLanguage(l.key)}
                      className={`flex-1 p-4 rounded-xl text-center transition-all ${
                        language === l.key
                          ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                          : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'
                      }`}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-xs font-semibold mt-1 ${language === l.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{l.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-8 pb-4">
        {step > 0 && (
          <button
            onClick={back}
            className="flex-1 py-4 bg-[#1c2a41] text-[#c5c6cd] rounded-xl font-[family-name:var(--font-headline)] font-semibold text-sm hover:bg-[#27354c] transition-colors"
          >
            Back
          </button>
        )}
        <button
          onClick={next}
          disabled={!canAdvance() || saving}
          className="flex-[2] bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Setting up...
            </>
          ) : step === STEPS.length - 1 ? (
            <>
              Launch ReefOS
              <span className="material-symbols-outlined text-sm">rocket_launch</span>
            </>
          ) : (
            <>
              Continue
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
