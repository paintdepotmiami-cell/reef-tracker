'use client';

import { useEffect, useState } from 'react';
import { getAnimals, getLatestTest, getStats, generateRecommendations } from '@/lib/queries';
import type { WaterTest, Recommendation } from '@/lib/queries';

export default function Dashboard() {
  const [test, setTest] = useState<WaterTest | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState({ fish: 0, corals: 0, inverts: 0, equipment: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLatestTest().then(t => { setTest(t); if (t) setRecs(generateRecommendations(t)); }),
      getStats().then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">waves</span>
        <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Loading ReefOS...</p>
      </div>
    </div>
  );

  const params = test ? [
    { label: 'Calcium', value: test.calcium, unit: 'ppm', ok: test.calcium != null && test.calcium >= 380 && test.calcium <= 450, icon: 'science' },
    { label: 'Alk', value: test.alkalinity, unit: 'dKH', ok: test.alkalinity != null && test.alkalinity >= 7 && test.alkalinity <= 11, icon: 'water_drop' },
    { label: 'Magnesium', value: test.magnesium, unit: 'ppm', ok: test.magnesium != null && test.magnesium >= 1250 && test.magnesium <= 1400, icon: 'lab_profile' },
    { label: 'pH', value: test.ph, unit: '', ok: test.ph != null && test.ph >= 8.0 && test.ph <= 8.4, icon: 'water_ph' },
    { label: 'PO4', value: test.phosphate, unit: 'ppm', ok: test.phosphate != null && test.phosphate <= 0.1, icon: 'opacity' },
    { label: 'NO3', value: test.nitrate, unit: 'ppm', ok: test.nitrate != null && test.nitrate >= 2 && test.nitrate <= 15, icon: 'eco' },
    { label: 'NH3', value: test.ammonia, unit: 'ppm', ok: test.ammonia === 0, icon: 'warning' },
    { label: 'NO2', value: test.nitrite, unit: 'ppm', ok: test.nitrite === 0, icon: 'check_circle' },
  ] : [];

  const actionRecs = recs.filter(r => r.level === 'action' || r.level === 'warning');
  const okRecs = recs.filter(r => r.level === 'ok');

  return (
    <div className="space-y-8">
      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'set_meal', label: 'Fish', value: stats.fish, color: 'text-[#4cd6fb]' },
          { icon: 'waves', label: 'Corals', value: stats.corals, color: 'text-[#FF7F50]' },
          { icon: 'water_drop', label: 'Inverts', value: stats.inverts, color: 'text-[#2ff801]' },
          { icon: 'settings_input_component', label: 'Equipment', value: stats.equipment, color: 'text-[#ffb59c]' },
        ].map(s => (
          <div key={s.label} className="glass-card p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group">
            <span className={`material-symbols-outlined ${s.color} absolute -right-2 -top-2 opacity-10 text-6xl group-hover:scale-110 transition-transform`}>{s.icon}</span>
            <span className="text-[#c5c6cd] text-xs uppercase tracking-widest">{s.label}</span>
            <span className="text-3xl font-[family-name:var(--font-headline)] font-bold text-white">{s.value}</span>
          </div>
        ))}
      </section>

      {/* Water Test */}
      {test && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-[#ffb59c]">Last Water Test</h2>
              <p className="text-[#c5c6cd] text-sm uppercase tracking-tight">
                {new Date(test.test_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <button className="text-[#4cd6fb] text-sm font-semibold flex items-center gap-1 hover:underline">
              History <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {params.map(p => (
              <div key={p.label} className={`bg-[#0d1c32] p-4 rounded-xl border-l-4 ${p.ok ? 'border-[#2ff801]' : 'border-[#F1C40F]'} flex flex-col gap-1`}>
                <span className="text-[10px] text-[#c5c6cd] font-bold uppercase tracking-widest">{p.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-[family-name:var(--font-headline)] font-bold text-white">{p.value ?? '—'}</span>
                  <span className={`text-[10px] ${p.ok ? 'text-[#2ff801]/70' : 'text-[#F1C40F]/70'}`}>{p.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {actionRecs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-[#ffb59c]">Recommendations</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {actionRecs.map(r => (
              <div key={r.param} className="min-w-[280px] glass-card p-5 rounded-2xl space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    r.level === 'action' ? 'bg-[#93000a]/30 text-[#ffb4ab]' : 'bg-[#F1C40F]/10 text-[#F1C40F]'
                  }`}>
                    {r.level === 'action' ? 'ACTION' : 'CAUTION'}
                  </span>
                  <span className={`material-symbols-outlined ${r.level === 'action' ? 'text-[#ffb4ab]' : 'text-[#F1C40F]'}`}>
                    {r.level === 'action' ? 'priority_high' : 'warning'}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-headline)] font-bold text-lg text-white">{r.title}</h3>
                <p className="text-[#c5c6cd] text-sm leading-relaxed">{r.text}</p>
                {r.product && <p className="text-[10px] text-[#4cd6fb] font-semibold">{r.product}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Maintenance Plan */}
      <section className="space-y-4">
        <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-[#ffb59c]">Maintenance Plan</h2>
        <div className="bg-[#0d1c32] rounded-2xl p-6 space-y-6">
          {[
            { freq: 'Daily', color: 'text-[#2ff801]', icon: 'today', bg: 'bg-[#2ff801]/10', desc: 'Auto water change 2L/day (ReefDose), ATO + Kalkwasser, Klir filter running.' },
            { freq: 'Weekly', color: 'text-[#4cd6fb]', icon: 'calendar_view_week', bg: 'bg-[#4cd6fb]/10', desc: 'Full water test, clean glass, empty skimmer cup, feed Reef-Roids, dose Koralle-VM + Replenish + Restor.' },
            { freq: 'Monthly', color: 'text-[#ffb59c]', icon: 'calendar_month', bg: 'bg-[#ffb59c]/10', desc: 'Replace carbon & RowaPhos, calibrate Hanna checkers, add copepods, frag overgrown corals.' },
          ].map(m => (
            <div key={m.freq} className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${m.color}`}>{m.icon}</span>
              </div>
              <div className="space-y-1">
                <p className={`text-xs ${m.color} font-bold uppercase tracking-widest`}>{m.freq}</p>
                <p className="text-[#d6e3ff] font-medium text-sm">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Status */}
      {okRecs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-[family-name:var(--font-headline)] font-bold tracking-widest uppercase text-[#c5c6cd]">Healthy Parameters</h2>
          <div className="flex gap-2 flex-wrap">
            {okRecs.map(r => (
              <div key={r.param} className="flex items-center gap-1.5 bg-[#2ff801]/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ff801] shadow-[0_0_6px_#2ff801]"></span>
                <span className="text-[10px] font-bold text-[#2ff801] uppercase tracking-wider">{r.param}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
