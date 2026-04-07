'use client';

import { useEffect, useState, useMemo } from 'react';
import { getAnimals, getSpecies } from '@/lib/queries';
import type { Animal, Species } from '@/lib/queries';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { getCached, setCache } from '@/lib/cache';
import { checkCompatibility, type CompatibilityResult } from '@/lib/compatibility';

const TABS = [
  { key: 'fish', label: 'Fish', icon: 'set_meal' },
  { key: 'coral', label: 'Corals', icon: 'waves' },
  { key: 'invertebrate', label: 'Inverts', icon: 'water_drop' },
];

const CATEGORY_MAP: Record<string, string> = { fish: 'fish', coral: 'coral', invertebrate: 'invertebrate' };

const BADGE_COLORS: Record<string, string> = {
  Soft: 'bg-[#2ff801]/10 text-[#2ff801]',
  LPS: 'bg-[#FF7F50]/10 text-[#FF7F50]',
  SPS: 'bg-red-500/10 text-red-400',
  Anemone: 'bg-purple-500/10 text-purple-400',
  fish: 'bg-[#4cd6fb]/10 text-[#4cd6fb]',
  invertebrate: 'bg-[#ffb59c]/10 text-[#ffb59c]',
};

export default function LivestockPage() {
  const { user, tank } = useAuth();
  const [animals, setAnimals] = useState<Animal[]>(getCached<Animal[]>('animals') || []);
  const [tab, setTab] = useState('fish');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(!getCached('animals'));

  // Add livestock modal
  const [showAdd, setShowAdd] = useState(false);
  const [speciesList, setSpeciesList] = useState<Species[]>(getCached<Species[]>('species') || []);
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => setLoading(false), 6000);
    getAnimals().then(a => { setCache('animals', a); setAnimals(a); }).catch(() => {}).finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user]);

  const openAddModal = async () => {
    setShowAdd(true);
    setSelectedSpecies(null);
    setSpeciesSearch('');
    setAddName('');
    setAddQty('1');
    setAddSuccess(false);
    if (speciesList.length === 0) {
      const species = await getSpecies();
      const filtered = species.filter(s => s.category !== 'pest');
      setCache('species', filtered);
      setSpeciesList(filtered);
    }
  };

  const filteredSpecies = speciesList
    .filter(s => {
      const catMap: Record<string, string> = { fish: 'fish', coral: 'coral', invertebrate: 'invertebrate' };
      return s.category === catMap[tab];
    })
    .filter(s => !speciesSearch ||
      s.common_name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
      s.scientific_name?.toLowerCase().includes(speciesSearch.toLowerCase()) ||
      s.subcategory?.toLowerCase().includes(speciesSearch.toLowerCase())
    )
    .slice(0, 20);

  const selectSpecies = (sp: Species) => {
    setSelectedSpecies(sp);
    setAddName(sp.common_name);
  };

  const handleAdd = async () => {
    if (!user || !selectedSpecies) return;
    setAdding(true);

    const { error } = await getSupabase().from('reef_animals').insert({
      user_id: user.id,
      tank_id: tank?.id || null,
      name: addName || selectedSpecies.common_name,
      species: selectedSpecies.scientific_name,
      type: tab as 'fish' | 'coral' | 'invertebrate',
      subtype: selectedSpecies.subcategory,
      quantity: parseInt(addQty) || 1,
      condition: 'healthy',
      difficulty: selectedSpecies.difficulty,
      light_need: selectedSpecies.light_need,
      flow_need: selectedSpecies.flow_need,
      aggression: selectedSpecies.aggression,
      growth_speed: selectedSpecies.growth_speed,
      min_distance_inches: selectedSpecies.min_distance_inches,
      placement_zone: selectedSpecies.placement_zone,
      reef_safe: selectedSpecies.reef_safe,
      description: selectedSpecies.description,
      care_notes: selectedSpecies.care_notes,
      warnings: selectedSpecies.warnings,
      date_added: new Date().toISOString().split('T')[0],
    });

    if (!error) {
      setAddSuccess(true);
      // Refresh animals list
      const updated = await getAnimals();
      setAnimals(updated);
      setTimeout(() => {
        setShowAdd(false);
        setAddSuccess(false);
      }, 1500);
    }
    setAdding(false);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Your collection</p>
          <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Livestock</h1>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm shadow-lg shadow-[#FF7F50]/20 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add
        </button>
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
                {selected.difficulty && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-[#c5c6cd]">{selected.difficulty}</span>}
              </div>

              {/* Care Requirements Grid */}
              {(selected.light_need || selected.flow_need || selected.aggression || selected.placement_zone) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selected.light_need && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#F1C40F] text-sm">light_mode</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Light</p><p className="text-xs text-white font-medium">{selected.light_need}</p></div>
                    </div>
                  )}
                  {selected.flow_need && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4cd6fb] text-sm">waves</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Flow</p><p className="text-xs text-white font-medium">{selected.flow_need}</p></div>
                    </div>
                  )}
                  {selected.aggression && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-sm">swords</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Aggression</p><p className="text-xs text-white font-medium">{selected.aggression}</p></div>
                    </div>
                  )}
                  {selected.placement_zone && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2ff801] text-sm">pin_drop</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Placement</p><p className="text-xs text-white font-medium">{selected.placement_zone}</p></div>
                    </div>
                  )}
                  {selected.growth_speed && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2ff801] text-sm">speed</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Growth</p><p className="text-xs text-white font-medium">{selected.growth_speed}</p></div>
                    </div>
                  )}
                  {selected.min_distance_inches && (
                    <div className="bg-[#0d1c32] rounded-lg p-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-sm">social_distance</span>
                      <div><p className="text-[9px] text-[#8f9097] uppercase">Min Distance</p><p className="text-xs text-white font-medium">{selected.min_distance_inches}&quot;</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {selected.warnings && selected.warnings.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selected.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 bg-[#93000a]/10 rounded-lg p-2.5">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-sm shrink-0 mt-0.5">warning</span>
                      <p className="text-xs text-[#ffb4ab]">{w}</p>
                    </div>
                  ))}
                </div>
              )}

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

      {/* ADD LIVESTOCK MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#ffb59c]/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-[family-name:var(--font-headline)] font-bold text-white">Add Livestock</h2>
                  <p className="text-xs text-[#c5c6cd] mt-0.5">Search from 160+ species</p>
                </div>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
                </button>
              </div>

              {/* Success */}
              {addSuccess && (
                <div className="bg-[#2ff801]/10 border border-[#2ff801]/20 rounded-xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
                  <span className="text-[#2ff801] font-semibold text-sm">Added to your tank!</span>
                </div>
              )}

              {/* Category tabs in modal */}
              <div className="flex gap-2">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setSelectedSpecies(null); setSpeciesSearch(''); }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      tab === t.key ? 'bg-[#FF7F50] text-white' : 'bg-[#1c2a41] text-[#c5c6cd]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {!selectedSpecies ? (
                <>
                  {/* Species Search */}
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                    <input
                      type="text"
                      value={speciesSearch}
                      onChange={e => setSpeciesSearch(e.target.value)}
                      className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                      placeholder={`Search ${tab === 'fish' ? 'fish' : tab === 'coral' ? 'corals' : 'invertebrates'}...`}
                      autoFocus
                    />
                  </div>

                  {/* Species Results */}
                  <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                    {filteredSpecies.map(sp => (
                      <button
                        key={sp.id}
                        onClick={() => selectSpecies(sp)}
                        className="w-full bg-[#0d1c32] hover:bg-[#112036] rounded-xl p-3 flex items-center gap-3 transition-colors text-left"
                      >
                        {sp.photo_url ? (
                          <img
                            src={sp.photo_url}
                            alt={sp.common_name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sp.photo_url ? 'hidden' : ''} ${
                          sp.difficulty === 'Easy' ? 'bg-[#2ff801]/10' :
                          sp.difficulty === 'Moderate' ? 'bg-[#F1C40F]/10' :
                          sp.difficulty === 'Hard' ? 'bg-[#FF7F50]/10' :
                          'bg-[#ffb4ab]/10'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            sp.difficulty === 'Easy' ? 'text-[#2ff801]' :
                            sp.difficulty === 'Moderate' ? 'text-[#F1C40F]' :
                            sp.difficulty === 'Hard' ? 'text-[#FF7F50]' :
                            'text-[#ffb4ab]'
                          }`}>
                            {tab === 'fish' ? 'set_meal' : tab === 'coral' ? 'waves' : 'water_drop'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-[family-name:var(--font-headline)] text-sm font-semibold text-white truncate">{sp.common_name}</p>
                          <p className="text-[10px] text-[#FF7F50]/60 italic truncate">{sp.scientific_name}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {sp.subcategory && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${BADGE_COLORS[sp.subcategory] || 'bg-white/5 text-[#c5c6cd]'}`}>
                              {sp.subcategory}
                            </span>
                          )}
                          <span className={`text-[9px] font-medium ${
                            sp.difficulty === 'Easy' ? 'text-[#2ff801]' :
                            sp.difficulty === 'Moderate' ? 'text-[#F1C40F]' :
                            sp.difficulty === 'Hard' ? 'text-[#FF7F50]' :
                            'text-[#ffb4ab]'
                          }`}>{sp.difficulty}</span>
                        </div>
                      </button>
                    ))}
                    {filteredSpecies.length === 0 && (
                      <div className="text-center py-8 text-[#c5c6cd] text-sm">
                        <span className="material-symbols-outlined text-3xl text-[#1c2a41] mb-2 block">search_off</span>
                        No species found. Try a different search.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Selected Species Details */}
                  <div className="bg-[#0d1c32] rounded-xl overflow-hidden space-y-0">
                    {selectedSpecies.photo_url && (
                      <img
                        src={selectedSpecies.photo_url}
                        alt={selectedSpecies.common_name}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-[family-name:var(--font-headline)] font-bold text-white">{selectedSpecies.common_name}</p>
                        <p className="text-xs text-[#FF7F50]/60 italic">{selectedSpecies.scientific_name}</p>
                      </div>
                      <button onClick={() => setSelectedSpecies(null)} className="text-[#4cd6fb] text-xs font-semibold hover:underline">Change</button>
                    </div>
                    {selectedSpecies.description && (
                      <p className="text-xs text-[#c5c6cd] leading-relaxed">{selectedSpecies.description}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {selectedSpecies.difficulty && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          selectedSpecies.difficulty === 'Easy' ? 'bg-[#2ff801]/10 text-[#2ff801]' :
                          selectedSpecies.difficulty === 'Moderate' ? 'bg-[#F1C40F]/10 text-[#F1C40F]' :
                          'bg-[#FF7F50]/10 text-[#FF7F50]'
                        }`}>{selectedSpecies.difficulty}</span>
                      )}
                      {selectedSpecies.reef_safe && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          selectedSpecies.reef_safe === 'Yes' ? 'bg-[#2ff801]/10 text-[#2ff801]' :
                          selectedSpecies.reef_safe === 'Caution' ? 'bg-[#F1C40F]/10 text-[#F1C40F]' :
                          'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                        }`}>Reef: {selectedSpecies.reef_safe}</span>
                      )}
                      {selectedSpecies.max_size && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-[#c5c6cd]">Max: {selectedSpecies.max_size}</span>}
                    </div>
                    {selectedSpecies.warnings && selectedSpecies.warnings.length > 0 && (
                      <div className="flex items-start gap-2 bg-[#93000a]/10 rounded-lg p-2.5">
                        <span className="material-symbols-outlined text-[#ffb4ab] text-xs shrink-0 mt-0.5">warning</span>
                        <p className="text-[10px] text-[#ffb4ab]">{selectedSpecies.warnings[0]}</p>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Compatibility Advisor */}
                  {(() => {
                    const compat = checkCompatibility(selectedSpecies, animals, tank?.size_gallons || null);
                    const levelColor = compat.level === 'safe' ? '#2ff801' : compat.level === 'caution' ? '#F1C40F' : compat.level === 'risky' ? '#FF7F50' : '#ffb4ab';
                    const levelBg = compat.level === 'safe' ? 'bg-[#2ff801]/10' : compat.level === 'caution' ? 'bg-[#F1C40F]/10' : compat.level === 'risky' ? 'bg-[#FF7F50]/10' : 'bg-[#ffb4ab]/10';
                    const levelIcon = compat.level === 'safe' ? 'check_circle' : compat.level === 'caution' ? 'warning' : compat.level === 'risky' ? 'error' : 'dangerous';
                    const levelText = compat.level === 'safe' ? 'Compatible' : compat.level === 'caution' ? 'Caution' : compat.level === 'risky' ? 'Risky' : 'Not Recommended';

                    return (
                      <div className={`rounded-xl border overflow-hidden ${
                        compat.level === 'safe' ? 'border-[#2ff801]/20' :
                        compat.level === 'caution' ? 'border-[#F1C40F]/20' :
                        'border-[#ffb4ab]/20'
                      }`}>
                        {/* Header */}
                        <div className={`${levelBg} px-3 py-2 flex items-center gap-2`}>
                          <span className="material-symbols-outlined text-sm" style={{ color: levelColor }}>{levelIcon}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: levelColor }}>{levelText}</span>
                          <span className="ml-auto text-[10px] font-bold" style={{ color: levelColor }}>{compat.score}/100</span>
                        </div>

                        {/* Issues */}
                        {compat.issues.length > 0 && (
                          <div className="p-2.5 space-y-1.5">
                            {compat.issues.slice(0, 4).map((issue, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className={`material-symbols-outlined text-xs shrink-0 mt-0.5 ${
                                  issue.severity === 'critical' ? 'text-[#ffb4ab]' :
                                  issue.severity === 'warning' ? 'text-[#F1C40F]' : 'text-[#4cd6fb]'
                                }`}>{issue.icon}</span>
                                <div>
                                  <p className="text-[10px] font-semibold text-white">{issue.title}</p>
                                  <p className="text-[9px] text-[#c5c6cd] leading-relaxed">{issue.description}</p>
                                </div>
                              </div>
                            ))}
                            {compat.issues.length > 4 && (
                              <p className="text-[9px] text-[#8f9097] pl-5">+{compat.issues.length - 4} more issues</p>
                            )}
                          </div>
                        )}

                        {/* Tips */}
                        {compat.tips.length > 0 && compat.issues.length === 0 && (
                          <div className="p-2.5">
                            {compat.tips.slice(0, 2).map((tip, idx) => (
                              <p key={idx} className="text-[9px] text-[#c5c6cd] leading-relaxed flex items-start gap-1.5">
                                <span className="material-symbols-outlined text-[#2ff801] text-xs shrink-0 mt-0.5">lightbulb</span>
                                {tip}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Custom Name & Quantity */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Name (optional)</label>
                      <input
                        type="text"
                        value={addName}
                        onChange={e => setAddName(e.target.value)}
                        className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-2.5 px-3 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent"
                        placeholder={selectedSpecies.common_name}
                      />
                    </div>
                    <div>
                      <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Qty</label>
                      <input
                        type="number"
                        value={addQty}
                        onChange={e => setAddQty(e.target.value)}
                        min="1"
                        className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-2.5 px-3 text-white text-sm text-center focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-3.5 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Adding...</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">add</span> Add to My Tank</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
