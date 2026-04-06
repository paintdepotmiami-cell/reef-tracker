'use client';

import { useEffect, useState } from 'react';
import { getAnimals } from '@/lib/queries';
import type { Animal } from '@/lib/queries';

const TABS = [
  { key: 'fish', label: 'Fish', icon: 'set_meal' },
  { key: 'coral', label: 'Corals', icon: 'waves' },
  { key: 'invertebrate', label: 'Inverts', icon: 'water_drop' },
];

const BADGE_COLORS: Record<string, string> = {
  Soft: 'bg-[#2ff801]/10 text-[#2ff801]',
  LPS: 'bg-[#FF7F50]/10 text-[#FF7F50]',
  SPS: 'bg-red-500/10 text-red-400',
  Anemone: 'bg-purple-500/10 text-purple-400',
  fish: 'bg-[#4cd6fb]/10 text-[#4cd6fb]',
  invertebrate: 'bg-[#ffb59c]/10 text-[#ffb59c]',
};

export default function LivestockPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [tab, setTab] = useState('fish');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnimals().then(setAnimals).finally(() => setLoading(false));
  }, []);

  const filtered = animals
    .filter(a => a.type === tab)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.species?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">sailing</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Your collection</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Livestock</h1>
      </div>

      {/* Search */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF7F50] transition-colors">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#010e24] border-none rounded-xl py-3.5 pl-12 pr-4 text-[#d6e3ff] placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 transition-all text-sm"
          placeholder="Search livestock..."
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-3">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-sm tracking-wide transition-all ${
              tab === t.key
                ? 'bg-[#FF7F50] text-white font-bold'
                : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#c5c6cd] uppercase tracking-widest">{filtered.length} specimens</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(a => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            className="relative group overflow-hidden rounded-2xl bg-[#0d1c32] cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          >
            {a.photo_ref && (
              <div className="h-48 overflow-hidden">
                <img
                  src={`/reference/${a.photo_ref}`}
                  alt={a.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#041329] via-transparent to-transparent opacity-80"></div>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <div className={`backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                a.condition === 'healthy'
                  ? 'bg-[#2ff801]/15 border-[#2ff801]/20'
                  : 'bg-[#93000a]/20 border-[#ffb4ab]/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${a.condition === 'healthy' ? 'bg-[#2ff801]' : 'bg-[#ffb4ab]'}`}></span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${a.condition === 'healthy' ? 'text-[#2ff801]' : 'text-[#ffb4ab]'}`}>
                  {a.condition === 'healthy' ? 'Healthy' : 'Monitor'}
                </span>
              </div>
            </div>
            <div className={`${a.photo_ref ? 'absolute bottom-0 left-0 w-full' : ''} p-5`}>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-white mb-1">{a.name}</h3>
                  <p className="text-xs italic text-[#FF7F50]/70">{a.species}</p>
                  {a.quantity > 1 && (
                    <span className="inline-block mt-2 text-[10px] font-bold text-[#c5c6cd] bg-white/10 px-2 py-0.5 rounded-full">x{a.quantity}</span>
                  )}
                </div>
                <div className="p-2 rounded-full bg-[#27354c]/60 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[#ffb59c] text-sm">visibility</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#ffb59c]/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            {selected.photo_ref && (
              <img src={`/reference/${selected.photo_ref}`} alt={selected.name} className="w-full h-64 object-cover rounded-t-3xl" />
            )}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">{selected.name}</h2>
                {selected.species && <p className="text-[#FF7F50]/70 italic text-sm mt-1">{selected.species}</p>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${BADGE_COLORS[selected.subtype || selected.type] || 'bg-white/10 text-[#c5c6cd]'}`}>
                  {selected.subtype || selected.type}
                </span>
                {selected.quantity > 1 && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-[#c5c6cd]">x{selected.quantity}</span>}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selected.condition === 'healthy' ? 'bg-[#2ff801]/10 text-[#2ff801]' : 'bg-[#F1C40F]/10 text-[#F1C40F]'}`}>
                  {selected.condition === 'healthy' ? 'Healthy' : 'Monitor'}
                </span>
              </div>
              {selected.description && <p className="text-sm text-[#c5c6cd] leading-relaxed">{selected.description}</p>}
              {selected.care_notes && <p className="text-sm text-[#c5c6cd] leading-relaxed">{selected.care_notes}</p>}
              <button
                onClick={() => setSelected(null)}
                className="w-full py-3 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl hover:bg-[#FF7F50]/20 transition font-semibold cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
