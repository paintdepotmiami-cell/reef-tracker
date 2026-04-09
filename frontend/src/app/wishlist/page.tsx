'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getWishlist, removeFromWishlist, addToWishlist, getAnimals, getSpecies } from '@/lib/queries';
import type { WishlistItem, Species, Animal } from '@/lib/queries';
import { checkCompatibility } from '@/lib/compatibility';
import { getCached, setCache } from '@/lib/cache';

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]', label: 'High' },
  medium: { bg: 'bg-[#F1C40F]/10',  text: 'text-[#F1C40F]', label: 'Medium' },
  low:    { bg: 'bg-[#2ff801]/10',  text: 'text-[#2ff801]', label: 'Low' },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy:     { bg: 'bg-[#2ff801]/10', text: 'text-[#2ff801]' },
  Moderate: { bg: 'bg-[#F1C40F]/10', text: 'text-[#F1C40F]' },
  Hard:     { bg: 'bg-[#FF7F50]/10', text: 'text-[#FF7F50]' },
  Expert:   { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]' },
};

export default function WishlistPage() {
  const { user, tank } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [animals, setAnimals] = useState<Animal[]>(getCached<Animal[]>('animals') || []);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.allSettled([
      getWishlist().then(w => setWishlist(w)),
      getAnimals().then(a => { setAnimals(a); setCache('animals', a); }),
    ]).finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (id: string) => {
    await removeFromWishlist(id);
    setWishlist(prev => prev.filter(w => w.id !== id));
  };

  const handleAdd = async (species: Species, priority: string) => {
    const result = await addToWishlist(species.id, priority);
    if (result) {
      // Refetch the full list with joined data
      const updated = await getWishlist();
      setWishlist(updated);
    }
    setShowPicker(false);
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-44 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-5 w-64 bg-[#1c2a41] rounded-lg animate-pulse" />
      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#1c2a41] rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Want List</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Wishlist</h1>
        <p className="text-sm text-[#c5c6cd] mt-1">
          {wishlist.length} species · Track what you want + compatibility
        </p>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-3.5 bg-gradient-to-r from-[#FF7F50]/15 to-[#4cd6fb]/10 border border-[#FF7F50]/20 rounded-2xl flex items-center justify-center gap-2 text-[#FF7F50] font-[family-name:var(--font-headline)] font-bold text-sm hover:from-[#FF7F50]/25 hover:to-[#4cd6fb]/15 transition-all active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Add from Species Library
      </button>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">favorite_border</span>
          <p className="text-[#c5c6cd] text-sm font-medium">Your wishlist is empty</p>
          <p className="text-[#8f9097] text-xs mt-1">Browse the Species Library to add animals you want</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wishlist.map(item => (
            <WishlistCard
              key={item.id}
              item={item}
              animals={animals}
              tankGallons={tank?.size_gallons || null}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      )}

      {/* Species Picker Modal */}
      {showPicker && (
        <SpeciesPickerModal
          onSelect={handleAdd}
          onClose={() => setShowPicker(false)}
          existingIds={wishlist.map(w => w.species_id)}
        />
      )}
    </div>
  );
}

/* ── Wishlist Card ──────────────────────────────────────────── */

function WishlistCard({
  item, animals, tankGallons, onRemove
}: {
  item: WishlistItem;
  animals: Animal[];
  tankGallons: number | null;
  onRemove: () => void;
}) {
  const species = item.species;
  if (!species) return null;

  const compat = checkCompatibility(species, animals, tankGallons);
  const priority = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium;
  const [imgError, setImgError] = useState(false);

  const compatColor =
    compat.level === 'safe' ? 'text-[#2ff801]' :
    compat.level === 'caution' ? 'text-[#F1C40F]' :
    compat.level === 'risky' ? 'text-[#FF7F50]' :
    'text-[#ffb4ab]';

  const compatBg =
    compat.level === 'safe' ? 'bg-[#2ff801]/10' :
    compat.level === 'caution' ? 'bg-[#F1C40F]/10' :
    compat.level === 'risky' ? 'bg-[#FF7F50]/10' :
    'bg-[#ffb4ab]/10';

  return (
    <div className="bg-[#0d1c32] rounded-2xl p-4 flex gap-3">
      {/* Photo */}
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
        {species.photo_url && !imgError ? (
          <img src={species.photo_url} alt={species.common_name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#112036] to-[#0d1c32] flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-[#1c2a41]">pets</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-sm truncate">{species.common_name}</h3>
          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${priority.bg} ${priority.text}`}>
            {priority.label}
          </span>
        </div>
        <p className="text-[10px] text-[#FF7F50]/60 italic truncate">{species.scientific_name}</p>

        {/* Compatibility score */}
        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${compatBg}`}>
            <span className={`material-symbols-outlined text-xs ${compatColor}`}>
              {compat.level === 'safe' ? 'check_circle' :
               compat.level === 'caution' ? 'warning' :
               'dangerous'}
            </span>
            <span className={`text-[10px] font-bold ${compatColor}`}>
              {compat.score}% Compatible
            </span>
          </div>
          {compat.issues.length > 0 && (
            <span className="text-[10px] text-[#8f9097]">
              {compat.issues.length} issue{compat.issues.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Top issue */}
        {compat.issues.length > 0 && (
          <p className="text-[10px] text-[#c5c6cd]/60 mt-1 truncate">
            ⚠ {compat.issues[0].title}
          </p>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="self-start p-1.5 rounded-lg text-[#8f9097] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-lg">delete_outline</span>
      </button>
    </div>
  );
}

/* ── Species Picker Modal ──────────────────────────────────── */

function SpeciesPickerModal({
  onSelect, onClose, existingIds
}: {
  onSelect: (species: Species, priority: string) => void;
  onClose: () => void;
  existingIds: string[];
}) {
  const [allSpecies, setAllSpecies] = useState<Species[]>(getCached<Species[]>('allSpecies') || []);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(!getCached('allSpecies'));
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    if (allSpecies.length > 0) return;
    getSpecies()
      .then(data => { setCache('allSpecies', data); setAllSpecies(data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = allSpecies.filter(s => !existingIds.includes(s.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.common_name.toLowerCase().includes(q) ||
        s.scientific_name?.toLowerCase().includes(q)
      );
    }
    return result.slice(0, 30);
  }, [allSpecies, search, existingIds]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (selectedSpecies) {
    const diff = selectedSpecies.difficulty ? DIFFICULTY_COLORS[selectedSpecies.difficulty] : null;
    return (
      <div className="fixed inset-0 bg-black/85 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
        <div className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
              {selectedSpecies.photo_url ? (
                <img src={selectedSpecies.photo_url} alt={selectedSpecies.common_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#1c2a41] flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-[#2a3a52]">pets</span></div>
              )}
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">{selectedSpecies.common_name}</h3>
              <p className="text-xs text-[#FF7F50]/60 italic">{selectedSpecies.scientific_name}</p>
            </div>
          </div>

          {diff && (
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${diff.bg} ${diff.text}`}>
              {selectedSpecies.difficulty}
            </span>
          )}

          {/* Priority selector */}
          <div>
            <p className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#8f9097] uppercase font-medium mb-2">Priority</p>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map(p => {
                const c = PRIORITY_COLORS[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      priority === p ? `${c.bg} ${c.text} ring-1 ring-current/30` : 'bg-[#0d1c32] text-[#8f9097]'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedSpecies(null)}
              className="flex-1 py-3 bg-[#1c2a41] text-[#c5c6cd] rounded-xl text-sm font-semibold hover:bg-[#27354c] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => onSelect(selectedSpecies, priority)}
              className="flex-1 py-3 bg-[#FF7F50] text-white rounded-xl text-sm font-bold hover:bg-[#FF7F50]/90 transition-colors"
            >
              Add to Wishlist
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">Add to Wishlist</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center hover:bg-[#27354c] transition-colors">
              <span className="material-symbols-outlined text-sm text-[#c5c6cd]">close</span>
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#010e24] rounded-xl py-3 pl-10 pr-4 text-[#d6e3ff] placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-[#FF7F50]/50 border-none"
              placeholder="Search species..."
              autoFocus
            />
          </div>
        </div>

        {/* Species list */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-2">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-[#1c2a41] rounded-xl animate-pulse" />)
          ) : filtered.length === 0 ? (
            <p className="text-center text-[#8f9097] text-sm py-8">No species found</p>
          ) : (
            filtered.map(species => (
              <button
                key={species.id}
                onClick={() => setSelectedSpecies(species)}
                className="w-full bg-[#0d1c32] rounded-xl p-3 flex items-center gap-3 hover:bg-[#142745] transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                  {species.photo_url ? (
                    <img src={species.photo_url} alt={species.common_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1c2a41] flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg text-[#2a3a52]">pets</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{species.common_name}</p>
                  <p className="text-[10px] text-[#8f9097] capitalize">{species.category}</p>
                </div>
                <span className="material-symbols-outlined text-[#c5c6cd]/30">chevron_right</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
