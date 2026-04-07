'use client';

import { useEffect, useState } from 'react';
import { getAllTests, createWaterTest } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { getCached, setCache } from '@/lib/cache';
import dynamic from 'next/dynamic';

const ParamSparkline = dynamic(() => import('@/components/ParamSparkline'), { ssr: false });

const PARAMS = [
  { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', placeholder: '8.3', step: '0.1' },
  { key: 'calcium', label: 'Calcium', unit: 'ppm', placeholder: '420', step: '1' },
  { key: 'magnesium', label: 'Magnesium', unit: 'ppm', placeholder: '1350', step: '1' },
  { key: 'nitrate', label: 'Nitrate', unit: 'ppm', placeholder: '5.0', step: '0.1' },
  { key: 'phosphate', label: 'Phosphate', unit: 'ppm', placeholder: '0.03', step: '0.01' },
];

const EXTRA_PARAMS = [
  { key: 'ph', label: 'pH', unit: 'pH', placeholder: '8.2', step: '0.1' },
  { key: 'ammonia', label: 'Ammonia', unit: 'ppm', placeholder: '0', step: '0.01' },
  { key: 'nitrite', label: 'Nitrite', unit: 'ppm', placeholder: '0', step: '0.01' },
];

export default function LogsPage() {
  const { user, tank } = useAuth();
  const [tests, setTests] = useState<WaterTest[]>(getCached<WaterTest[]>('allTests') || []);
  const [loading, setLoading] = useState(!getCached('allTests'));
  const [saving, setSaving] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 6000);
    getAllTests().then(t => { setCache('allTests', t); setTests(t); }).catch(() => {}).finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const data: Record<string, number | string | null> = {
      test_date: new Date().toISOString().split('T')[0],
      user_id: user?.id || null,
      tank_id: tank?.id || null,
    };
    [...PARAMS, ...EXTRA_PARAMS].forEach(p => {
      if (form[p.key]) data[p.key] = parseFloat(form[p.key]);
    });
    const result = await createWaterTest(data as Partial<WaterTest>);
    if (result) {
      setTests(prev => [result, ...prev]);
      setForm({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const getStatus = (key: string, val: number | null) => {
    if (val == null) return { label: '', color: '' };
    const ranges: Record<string, [number, number]> = {
      alkalinity: [7, 11], calcium: [380, 450], magnesium: [1250, 1400],
      nitrate: [2, 15], phosphate: [0, 0.1], ph: [8.0, 8.4],
    };
    const r = ranges[key];
    if (!r) return val === 0 ? { label: 'OK', color: 'text-[#2ff801]' } : { label: 'Alert', color: 'text-[#ffb4ab]' };
    return val >= r[0] && val <= r[1]
      ? { label: 'Stable', color: 'text-[#2ff801]' }
      : { label: val < r[0] ? 'Low' : 'High', color: 'text-[#ffb59c]' };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">insert_chart</span>
    </div>
  );

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Parameter Tracking</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Log Parameters</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Update your reef&apos;s vitals to maintain peak health.</p>
      </div>

      {/* Success */}
      {saved && (
        <div className="bg-[#2ff801]/10 border border-[#2ff801]/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
          <span className="text-[#2ff801] font-semibold text-sm">Parameters saved successfully!</span>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        {PARAMS.map(p => {
          const val = form[p.key] ? parseFloat(form[p.key]) : null;
          const status = getStatus(p.key, val);
          return (
            <div key={p.key} className="bg-[#0d1c32] p-5 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-[family-name:var(--font-headline)] text-xs tracking-[0.15em] text-[#c5c6cd] uppercase font-medium">{p.label} ({p.unit})</label>
                {status.label && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color} ${status.color.replace('text-', 'bg-')}/10`}>{status.label}</span>}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={p.step}
                  value={form[p.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className="w-full bg-[#010e24] border-none rounded-xl py-4 px-5 text-2xl font-[family-name:var(--font-headline)] font-bold text-white focus:ring-2 focus:ring-[#FF7F50]/40 transition-all placeholder:text-white/10"
                  placeholder={p.placeholder}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-[family-name:var(--font-headline)] text-sm text-[#c5c6cd]/50">{p.unit}</span>
              </div>
            </div>
          );
        })}

        {/* Toggle Extra */}
        <button onClick={() => setShowExtra(!showExtra)} className="text-[#4cd6fb] text-sm font-semibold flex items-center gap-1 w-full justify-center py-2">
          <span className="material-symbols-outlined text-sm">{showExtra ? 'expand_less' : 'expand_more'}</span>
          {showExtra ? 'Hide' : 'Show'} additional parameters
        </button>

        {showExtra && EXTRA_PARAMS.map(p => (
          <div key={p.key} className="bg-[#0d1c32] p-5 rounded-xl space-y-3">
            <label className="font-[family-name:var(--font-headline)] text-xs tracking-[0.15em] text-[#c5c6cd] uppercase font-medium">{p.label} ({p.unit})</label>
            <input
              type="number"
              step={p.step}
              value={form[p.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [p.key]: e.target.value }))}
              className="w-full bg-[#010e24] border-none rounded-xl py-3 px-4 text-xl font-[family-name:var(--font-headline)] font-bold text-white focus:ring-2 focus:ring-[#FF7F50]/40 transition-all placeholder:text-white/10"
              placeholder={p.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || Object.keys(form).length === 0}
        className="w-full bg-gradient-to-br from-[#ffb59c] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-5 rounded-xl text-lg tracking-widest uppercase shadow-xl active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save Log'}
        <span className="material-symbols-outlined text-xl">save</span>
      </button>

      {/* Sparkline Trends */}
      {tests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-headline)] text-sm tracking-[0.2em] text-[#c5c6cd] uppercase font-bold">Trends</h3>
            <span className="text-[10px] text-[#c5c6cd]/50">{tests.length} test{tests.length !== 1 ? 's' : ''} logged</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'alkalinity' as keyof WaterTest, label: 'Alk', unit: 'dKH', min: 7, max: 11, color: '#FF7F50' },
              { key: 'calcium' as keyof WaterTest, label: 'Calcium', unit: 'ppm', min: 380, max: 450, color: '#4cd6fb' },
              { key: 'magnesium' as keyof WaterTest, label: 'Magnesium', unit: 'ppm', min: 1250, max: 1400, color: '#ffb59c' },
              { key: 'phosphate' as keyof WaterTest, label: 'PO4', unit: 'ppm', min: 0, max: 0.1, color: '#2ff801' },
              { key: 'nitrate' as keyof WaterTest, label: 'NO3', unit: 'ppm', min: 2, max: 15, color: '#d7ffc5' },
              { key: 'ph' as keyof WaterTest, label: 'pH', unit: '', min: 8.0, max: 8.4, color: '#c5c6cd' },
            ].map(p => (
              <ParamSparkline
                key={p.key}
                label={p.label}
                unit={p.unit}
                min={p.min}
                max={p.max}
                color={p.color}
                data={tests.map(t => ({
                  date: t.test_date,
                  value: t[p.key] as number | null,
                }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Records */}
      {tests.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-[family-name:var(--font-headline)] text-sm tracking-[0.2em] text-[#c5c6cd] uppercase font-bold">Recent Records</h3>
          <div className="space-y-3">
            {tests.slice(0, 10).map(t => (
              <div key={t.id} className="bg-[#0d1c32]/60 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-xs text-[#c5c6cd] font-medium mb-1">
                    {new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-[family-name:var(--font-headline)] text-white">
                    ALK {t.alkalinity ?? '—'} &middot; CA {t.calcium ?? '—'} &middot; MG {t.magnesium ?? '—'}
                    {t.nitrate != null && ` · NO3 ${t.nitrate}`}
                    {t.phosphate != null && ` · PO4 ${t.phosphate}`}
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
