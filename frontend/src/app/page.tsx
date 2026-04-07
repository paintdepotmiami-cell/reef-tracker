'use client';

import { useEffect, useState } from 'react';
import { getAnimals, getLatestTest, getStats, generateRecommendations, generateTodayFeed } from '@/lib/queries';
import type { Animal, WaterTest, Recommendation, ActionItem } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

/** Wraps a promise with a timeout — resolves with null if it takes too long */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

export default function Dashboard() {
  const { user } = useAuth();

  // Initialize from cache for instant page transitions
  const [test, setTest] = useState<WaterTest | null>(getCached<WaterTest | null>('latestTest'));
  const [recs, setRecs] = useState<Recommendation[]>(() => {
    const t = getCached<WaterTest | null>('latestTest');
    return t ? generateRecommendations(t) : [];
  });
  const [feed, setFeed] = useState<ActionItem[]>(getCached<ActionItem[]>('todayFeed') || []);
  const [stats, setStats] = useState(getCached<{ fish: number; corals: number; inverts: number; equipment: number }>('stats') || { fish: 0, corals: 0, inverts: 0, equipment: 0 });
  // Only show loading spinner if no cached data
  const [loading, setLoading] = useState(!getCached('stats'));

  useEffect(() => {
    if (!user) return; // Wait for auth to be ready

    let animals: Animal[] = getCached<Animal[]>('animals') || [];
    let latestTest: WaterTest | null = getCached<WaterTest | null>('latestTest');

    // Safety timeout — never hang more than 6 seconds
    const forceLoad = setTimeout(() => {
      console.warn('Dashboard timeout — forcing render');
      setLoading(false);
    }, 6000);

    // Each query has its own 5s timeout so one slow query can't block everything
    Promise.allSettled([
      withTimeout(getAnimals(), 5000).then(a => { if (a) { animals = a; setCache('animals', a); } }),
      withTimeout(getLatestTest(), 5000).then(t => {
        if (t !== undefined) {
          latestTest = t;
          setCache('latestTest', t);
          setTest(t);
          if (t) setRecs(generateRecommendations(t));
        }
      }),
      withTimeout(getStats(), 5000).then(s => { if (s) { setCache('stats', s); setStats(s); } }).catch(() => {}),
    ]).then(() => {
      const f = generateTodayFeed(latestTest, animals);
      setCache('todayFeed', f);
      setFeed(f);
    }).finally(() => {
      clearTimeout(forceLoad);
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">waves</span>
        <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Loading ReefOS...</p>
      </div>
    </div>
  );

  const params = test ? [
    { label: 'Calcium', value: test.calcium, unit: 'ppm', ok: test.calcium != null && test.calcium >= 380 && test.calcium <= 450 },
    { label: 'Alk', value: test.alkalinity, unit: 'dKH', ok: test.alkalinity != null && test.alkalinity >= 7 && test.alkalinity <= 11 },
    { label: 'Magnesium', value: test.magnesium, unit: 'ppm', ok: test.magnesium != null && test.magnesium >= 1250 && test.magnesium <= 1400 },
    { label: 'pH', value: test.ph, unit: '', ok: test.ph != null && test.ph >= 8.0 && test.ph <= 8.4 },
    { label: 'PO4', value: test.phosphate, unit: 'ppm', ok: test.phosphate != null && test.phosphate <= 0.1 },
    { label: 'NO3', value: test.nitrate, unit: 'ppm', ok: test.nitrate != null && test.nitrate >= 2 && test.nitrate <= 15 },
    { label: 'NH3', value: test.ammonia, unit: 'ppm', ok: test.ammonia === 0 },
    { label: 'NO2', value: test.nitrite, unit: 'ppm', ok: test.nitrite === 0 },
  ] : [];

  const okRecs = recs.filter(r => r.level === 'ok');
  const criticalCount = feed.filter(f => f.priority === 'critical').length;
  const warningCount = feed.filter(f => f.priority === 'warning').length;

  return (
    <div className="space-y-8">
      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'set_meal', label: 'Fish', value: stats.fish, color: 'text-[#4cd6fb]', href: '/livestock' },
          { icon: 'waves', label: 'Corals', value: stats.corals, color: 'text-[#FF7F50]', href: '/livestock' },
          { icon: 'water_drop', label: 'Inverts', value: stats.inverts, color: 'text-[#2ff801]', href: '/livestock' },
          { icon: 'settings_input_component', label: 'Equipment', value: stats.equipment, color: 'text-[#ffb59c]', href: '/gear' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="glass-card p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden group active:scale-95 transition-transform">
            <span className={`material-symbols-outlined ${s.color} absolute -right-2 -top-2 opacity-10 text-6xl group-hover:scale-110 transition-transform`}>{s.icon}</span>
            <span className="text-[#c5c6cd] text-xs uppercase tracking-widest">{s.label}</span>
            <span className="text-3xl font-[family-name:var(--font-headline)] font-bold text-white">{s.value}</span>
          </Link>
        ))}
      </section>

      {/* TODAY FEED - Action Center */}
      {feed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-white">Today</h2>
              {criticalCount > 0 && (
                <span className="px-2.5 py-0.5 bg-[#93000a]/30 text-[#ffb4ab] rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {criticalCount} action{criticalCount > 1 ? 's' : ''} needed
                </span>
              )}
              {warningCount > 0 && criticalCount === 0 && (
                <span className="px-2.5 py-0.5 bg-[#F1C40F]/10 text-[#F1C40F] rounded-full text-[10px] font-bold">
                  {warningCount} to review
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {feed.map(item => (
              <div
                key={item.id}
                className={`bg-[#0d1c32] rounded-xl p-4 flex items-start gap-4 border-l-4 ${
                  item.priority === 'critical' ? 'border-[#ffb4ab]' :
                  item.priority === 'warning' ? 'border-[#F1C40F]' :
                  'border-[#4cd6fb]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.priority === 'critical' ? 'bg-[#ffb4ab]/10' :
                  item.priority === 'warning' ? 'bg-[#F1C40F]/10' :
                  'bg-[#4cd6fb]/10'
                }`}>
                  <span className={`material-symbols-outlined ${
                    item.priority === 'critical' ? 'text-[#ffb4ab]' :
                    item.priority === 'warning' ? 'text-[#F1C40F]' :
                    'text-[#4cd6fb]'
                  }`}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-headline)] font-medium text-white text-sm">{item.title}</p>
                  <p className="text-xs text-[#c5c6cd] mt-1 leading-relaxed">{item.description}</p>
                  {item.action && (
                    <button className="mt-2 text-[10px] font-bold text-[#FF7F50] uppercase tracking-wider flex items-center gap-1 hover:underline">
                      {item.action} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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

          {/* Healthy params badges */}
          {okRecs.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {okRecs.map(r => (
                <div key={r.param} className="flex items-center gap-1.5 bg-[#2ff801]/10 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2ff801] shadow-[0_0_6px_#2ff801]"></span>
                  <span className="text-[10px] font-bold text-[#2ff801] uppercase tracking-wider">{r.param}</span>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}
