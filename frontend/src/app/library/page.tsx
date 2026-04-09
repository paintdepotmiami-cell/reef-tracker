'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { getSpecies } from '@/lib/queries';
import type { Species } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { getCached, setCache } from '@/lib/cache';

/* ── constants ──────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'all',           label: 'All',    emoji: '' },
  { key: 'fish',          label: 'Fish',   emoji: '\uD83D\uDC1F' },
  { key: 'coral',         label: 'Coral',  emoji: '\uD83E\uDEB8' },
  { key: 'invertebrate',  label: 'Inverts', emoji: '\uD83E\uDD90' },
  { key: 'pest',          label: 'Pests',  emoji: '\uD83E\uDDA0' },
];

const SUBCATEGORIES: Record<string, string[]> = {
  coral: ['SPS', 'LPS', 'Soft', 'Anemone'],
  fish:  ['Clownfish', 'Tang', 'Wrasse', 'Goby', 'Blenny', 'Angel', 'Damsel'],
  invertebrate: ['Shrimp', 'Crab', 'Snail', 'Urchin', 'Starfish'],
  pest: [],
};

const DIFFICULTIES = ['All', 'Easy', 'Moderate', 'Hard', 'Expert'] as const;

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Easy:     { bg: 'bg-[#2ff801]/10', text: 'text-[#2ff801]', dot: 'bg-[#2ff801]' },
  Moderate: { bg: 'bg-[#F1C40F]/10', text: 'text-[#F1C40F]', dot: 'bg-[#F1C40F]' },
  Hard:     { bg: 'bg-[#FF7F50]/10', text: 'text-[#FF7F50]', dot: 'bg-[#FF7F50]' },
  Expert:   { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]', dot: 'bg-[#ffb4ab]' },
};

const SUBCATEGORY_COLORS: Record<string, string> = {
  SPS:     'bg-red-500/10 text-red-400',
  LPS:     'bg-[#FF7F50]/10 text-[#FF7F50]',
  Soft:    'bg-[#2ff801]/10 text-[#2ff801]',
  Anemone: 'bg-purple-500/10 text-purple-400',
};

const REEF_SAFE_COLORS: Record<string, { bg: string; text: string }> = {
  Yes:     { bg: 'bg-[#2ff801]/10', text: 'text-[#2ff801]' },
  Caution: { bg: 'bg-[#F1C40F]/10', text: 'text-[#F1C40F]' },
  No:      { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]' },
};

const CATEGORY_ICON: Record<string, string> = {
  fish: 'set_meal',
  coral: 'waves',
  invertebrate: 'water_drop',
  pest: 'bug_report',
};

/* ── component ──────────────────────────────────────────────── */

export default function LibraryPage() {
  const { user } = useAuth();
  const [allSpecies, setAllSpecies] = useState<Species[]>(getCached<Species[]>('allSpecies') || []);
  const [loading, setLoading] = useState(!getCached('allSpecies'));

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('All');
  const [selected, setSelected] = useState<Species | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  /* ── data loading ─────────────────────────────────────────── */

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 6000);

    getSpecies()
      .then(data => {
        setCache('allSpecies', data);
        setAllSpecies(data);
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, [user]);

  /* ── filtering ────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = allSpecies;

    if (category !== 'all') {
      result = result.filter(s => s.category === category);
    }

    if (subcategory) {
      result = result.filter(s => s.subcategory === subcategory);
    }

    if (difficulty !== 'All') {
      result = result.filter(s => s.difficulty === difficulty);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.common_name.toLowerCase().includes(q) ||
        s.scientific_name?.toLowerCase().includes(q) ||
        s.subcategory?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allSpecies, category, subcategory, difficulty, search]);

  /* ── category counts ──────────────────────────────────────── */

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allSpecies.length };
    for (const s of allSpecies) c[s.category] = (c[s.category] || 0) + 1;
    return c;
  }, [allSpecies]);

  const subcategoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    const base = category !== 'all' ? allSpecies.filter(s => s.category === category) : allSpecies;
    for (const s of base) if (s.subcategory) c[s.subcategory] = (c[s.subcategory] || 0) + 1;
    return c;
  }, [allSpecies, category]);

  /* ── handlers ─────────────────────────────────────────────── */

  const selectCategory = (key: string) => {
    setCategory(key);
    setSubcategory(null);
    setDifficulty('All');
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── skeleton loading ─────────────────────────────────────── */

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-5 w-72 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-12 w-full bg-[#1c2a41] rounded-xl animate-pulse" />
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-24 bg-[#1c2a41] rounded-full animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-[3/4] bg-[#1c2a41] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  /* ── main render ──────────────────────────────────────────── */

  return (
    <div className="space-y-5 pb-28">

      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Encyclopedia</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Species Library</h1>
        <p className="text-sm text-[#c5c6cd] mt-1">
          {filtered.length === allSpecies.length
            ? `${allSpecies.length} species \u00B7 Fish, Corals, Invertebrates & Pests`
            : `${filtered.length} of ${allSpecies.length} species`
          }
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF7F50] transition-colors">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#010e24] border-none rounded-xl py-3.5 pl-12 pr-4 text-[#d6e3ff] placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 transition-all text-sm"
          placeholder="Search by name, scientific name..."
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => selectCategory(c.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-sm tracking-wide transition-all whitespace-nowrap shrink-0 ${
              category === c.key
                ? 'bg-[#FF7F50] text-white font-bold shadow-lg shadow-[#FF7F50]/20'
                : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
            }`}
          >
            {c.emoji && <span className="text-base">{c.emoji}</span>}
            {c.label}
            <span className={`text-xs ${category === c.key ? 'text-white/70' : 'text-[#8f9097]'}`}>
              ({counts[c.key] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      {category !== 'all' && SUBCATEGORIES[category] && SUBCATEGORIES[category].length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <button
            onClick={() => setSubcategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              !subcategory ? 'bg-[#4cd6fb]/15 text-[#4cd6fb] ring-1 ring-[#4cd6fb]/30' : 'bg-[#0d1c32] text-[#8f9097] hover:text-[#c5c6cd]'
            }`}
          >
            All
          </button>
          {SUBCATEGORIES[category].filter(sc => subcategoryCounts[sc]).map(sc => (
            <button
              key={sc}
              onClick={() => setSubcategory(subcategory === sc ? null : sc)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                subcategory === sc
                  ? `${SUBCATEGORY_COLORS[sc] || 'bg-[#4cd6fb]/15 text-[#4cd6fb]'} ring-1 ring-current/30`
                  : 'bg-[#0d1c32] text-[#8f9097] hover:text-[#c5c6cd]'
              }`}
            >
              {sc} ({subcategoryCounts[sc]})
            </button>
          ))}
        </div>
      )}

      {/* Difficulty Filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {DIFFICULTIES.map(d => {
          const colors = d === 'All' ? null : DIFFICULTY_COLORS[d];
          const isActive = difficulty === d;
          return (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? d === 'All'
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : `${colors!.bg} ${colors!.text} ring-1 ring-current/30`
                  : 'bg-[#0d1c32] text-[#8f9097] hover:text-[#c5c6cd]'
              }`}
            >
              {d !== 'All' && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${colors!.dot}`} />}
              {d}
            </button>
          );
        })}
      </div>

      {/* Species Grid */}
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(species => (
          <SpeciesCard key={species.id} species={species} onClick={() => setSelected(species)} />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">search_off</span>
          <p className="text-[#c5c6cd] text-sm font-medium">No species found</p>
          <p className="text-[#8f9097] text-xs mt-1">Try adjusting your filters or search term</p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); setSubcategory(null); setDifficulty('All'); }}
            className="mt-4 px-4 py-2 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl text-xs font-semibold hover:bg-[#FF7F50]/20 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <SpeciesModal species={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ── Species Card ───────────────────────────────────────────── */

function SpeciesCard({ species, onClick }: { species: Species; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const diff = species.difficulty ? DIFFICULTY_COLORS[species.difficulty] : null;
  const reefSafe = species.reef_safe ? REEF_SAFE_COLORS[species.reef_safe] : null;

  return (
    <button
      onClick={onClick}
      className="relative group overflow-hidden rounded-2xl bg-[#0d1c32] text-left cursor-pointer hover:scale-[1.03] transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF7F50]/40"
    >
      {/* Photo or placeholder */}
      <div className="aspect-[4/3] overflow-hidden relative">
        {species.photo_url && !imgError ? (
          <img
            src={species.photo_url}
            alt={species.common_name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#112036] to-[#0d1c32]">
            <span className="material-symbols-outlined text-4xl text-[#1c2a41]">
              {CATEGORY_ICON[species.category] || 'pets'}
            </span>
          </div>
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#041329] via-[#041329]/30 to-transparent opacity-90" />

        {/* Badges on top-right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {diff && (
            <span className={`${diff.bg} ${diff.text} backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold`}>
              {species.difficulty}
            </span>
          )}
          {species.subcategory && (
            <span className={`${SUBCATEGORY_COLORS[species.subcategory] || 'bg-white/10 text-[#c5c6cd]'} backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold`}>
              {species.subcategory}
            </span>
          )}
        </div>

        {/* Text at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-[family-name:var(--font-headline)] text-sm font-bold text-white leading-tight truncate">
            {species.common_name}
          </h3>
          <p className="text-[10px] italic text-[#FF7F50]/70 truncate mt-0.5">
            {species.scientific_name}
          </p>
          {reefSafe && (
            <span className={`inline-flex items-center gap-1 mt-1.5 ${reefSafe.bg} ${reefSafe.text} px-2 py-0.5 rounded-full text-[8px] font-bold`}>
              <span className="w-1 h-1 rounded-full bg-current" />
              Reef {species.reef_safe}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Species Detail Modal ───────────────────────────────────── */

function SpeciesModal({ species, onClose }: { species: Species; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const diff = species.difficulty ? DIFFICULTY_COLORS[species.difficulty] : null;
  const reefSafe = species.reef_safe ? REEF_SAFE_COLORS[species.reef_safe] : null;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const careItems = [
    { icon: 'light_mode', label: 'Light', value: species.light_need, color: 'text-[#F1C40F]' },
    { icon: 'waves', label: 'Flow', value: species.flow_need, color: 'text-[#4cd6fb]' },
    { icon: 'swords', label: 'Aggression', value: species.aggression, color: 'text-[#ffb4ab]' },
    { icon: 'pin_drop', label: 'Placement', value: species.placement_zone, color: 'text-[#2ff801]' },
    { icon: 'speed', label: 'Growth', value: species.growth_speed, color: 'text-[#4cd6fb]' },
    { icon: 'social_distance', label: 'Min Distance', value: species.min_distance_inches ? `${species.min_distance_inches}"` : null, color: 'text-[#ffb4ab]' },
    { icon: 'straighten', label: 'Max Size', value: species.max_size, color: 'text-[#FF7F50]' },
    { icon: 'restaurant', label: 'Diet', value: species.diet, color: 'text-[#F1C40F]' },
  ].filter(item => item.value);

  return (
    <div
      className="fixed inset-0 bg-black/85 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#ffb59c]/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <span className="material-symbols-outlined text-white text-sm">close</span>
        </button>

        {/* Photo */}
        {species.photo_url && !imgError ? (
          <div className="relative">
            <img
              src={species.photo_url}
              alt={species.common_name}
              onError={() => setImgError(true)}
              className="w-full h-64 object-cover rounded-t-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#112036] via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-gradient-to-br from-[#112036] to-[#0d1c32] rounded-t-3xl">
            <span className="material-symbols-outlined text-6xl text-[#1c2a41]">
              {CATEGORY_ICON[species.category] || 'pets'}
            </span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <h2 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">{species.common_name}</h2>
            {species.scientific_name && (
              <p className="text-[#FF7F50]/70 italic text-sm mt-1">{species.scientific_name}</p>
            )}
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {diff && (
              <span className={`${diff.bg} ${diff.text} px-3 py-1 rounded-full text-xs font-semibold`}>
                {species.difficulty}
              </span>
            )}
            {species.subcategory && (
              <span className={`${SUBCATEGORY_COLORS[species.subcategory] || 'bg-white/10 text-[#c5c6cd]'} px-3 py-1 rounded-full text-xs font-semibold`}>
                {species.subcategory}
              </span>
            )}
            {reefSafe && (
              <span className={`${reefSafe.bg} ${reefSafe.text} px-3 py-1 rounded-full text-xs font-semibold`}>
                Reef: {species.reef_safe}
              </span>
            )}
            <span className="bg-white/5 text-[#c5c6cd] px-3 py-1 rounded-full text-xs font-semibold capitalize">
              {species.category}
            </span>
          </div>

          {/* Care Requirements Grid */}
          {careItems.length > 0 && (
            <div>
              <p className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#8f9097] uppercase font-medium mb-2.5">Care Requirements</p>
              <div className="grid grid-cols-2 gap-2">
                {careItems.map(item => (
                  <div key={item.label} className="bg-[#0d1c32] rounded-xl p-3 flex items-center gap-2.5">
                    <span className={`material-symbols-outlined ${item.color} text-lg`}>{item.icon}</span>
                    <div>
                      <p className="text-[9px] text-[#8f9097] uppercase tracking-wide">{item.label}</p>
                      <p className="text-xs text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {species.description && (
            <div>
              <p className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#8f9097] uppercase font-medium mb-1.5">About</p>
              <p className="text-sm text-[#c5c6cd] leading-relaxed">{species.description}</p>
            </div>
          )}

          {/* Care Notes */}
          {species.care_notes && (
            <div>
              <p className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#8f9097] uppercase font-medium mb-1.5">Care Notes</p>
              <p className="text-sm text-[#c5c6cd] leading-relaxed">{species.care_notes}</p>
            </div>
          )}

          {/* Fun Fact */}
          {species.fun_fact && (
            <div className="bg-[#F1C40F]/5 border border-[#F1C40F]/15 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#F1C40F] text-lg shrink-0 mt-0.5">lightbulb</span>
              <div>
                <p className="text-[10px] text-[#F1C40F] uppercase tracking-widest font-bold mb-1">Fun Fact</p>
                <p className="text-sm text-[#c5c6cd] leading-relaxed">{species.fun_fact}</p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {species.warnings && species.warnings.length > 0 && (
            <div className="space-y-2">
              {species.warnings.map((w, i) => (
                <div key={i} className="bg-[#93000a]/10 border border-[#ffb4ab]/10 rounded-xl p-3.5 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-lg shrink-0 mt-0.5">warning</span>
                  <p className="text-sm text-[#ffb4ab] leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl hover:bg-[#FF7F50]/20 transition font-semibold cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
