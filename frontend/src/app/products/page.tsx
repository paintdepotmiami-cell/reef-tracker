'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getProducts, getUserProducts, addUserProduct, removeUserProduct, searchProducts } from '@/lib/queries';
import type { Product, UserProduct } from '@/lib/queries';
import Link from 'next/link';

interface AIRecommendation {
  product_id: string;
  priority: 'critical' | 'recommended' | 'nice_to_have';
  reason: string;
  category_tag: string;
  product: Product;
}

const CATEGORIES = [
  { key: '', label: 'All', icon: 'apps' },
  { key: 'chemistry', label: 'Chemistry', icon: 'science' },
  { key: 'biological', label: 'Biological', icon: 'biotech' },
  { key: 'food', label: 'Food', icon: 'restaurant' },
  { key: 'nutrition', label: 'Nutrition', icon: 'spa' },
  { key: 'media', label: 'Media', icon: 'filter_alt' },
  { key: 'carbon_dosing', label: 'Carbon', icon: 'water_drop' },
  { key: 'salt', label: 'Salts', icon: 'grain' },
  { key: 'trace', label: 'Trace', icon: 'colorize' },
  { key: 'conditioner', label: 'Conditioner', icon: 'sanitizer' },
  { key: 'instrument', label: 'Instruments', icon: 'straighten' },
];

const CATEGORY_COLORS: Record<string, string> = {
  chemistry: '#FF7F50', biological: '#2ff801', food: '#F1C40F', nutrition: '#ffb59c',
  media: '#4cd6fb', carbon_dosing: '#c5c6cd', salt: '#4cd6fb', trace: '#d7ffc5',
  conditioner: '#ffb4ab', instrument: '#8f9097',
};

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.3;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f${i}`} className="material-symbols-outlined text-[#F1C40F] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {half && <span className="material-symbols-outlined text-[#F1C40F] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e${i}`} className="material-symbols-outlined text-[#1c2a41] text-sm">star</span>
      ))}
      <span className="text-[#c5c6cd] text-xs font-bold ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ProductsPage() {
  const { user, tank } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [tab, setTab] = useState<'catalog' | 'mine' | 'ai'>('catalog');
  const [selected, setSelected] = useState<Product | null>(null);
  const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLoaded, setAiLoaded] = useState(false);

  const myProductIds = new Set(myProducts.map(up => up.product_id));

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.allSettled([
      getProducts().then(setProducts),
      getUserProducts().then(setMyProducts),
    ]).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (category) {
      getProducts(category).then(setProducts);
      setSearchResults(null);
      setSearch('');
    } else if (!search) {
      getProducts().then(setProducts);
      setSearchResults(null);
    }
  }, [category]);

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults(null); return; }
    setCategory('');
    const results = await searchProducts(q);
    setSearchResults(results);
  }, []);

  const handleAdd = async (product: Product) => {
    if (!user) return;
    setAdding(product.id);
    const result = await addUserProduct(product.id, user.id, tank?.id);
    if (result) setMyProducts(prev => [result, ...prev]);
    setAdding(null);
  };

  const handleRemove = async (userProductId: string) => {
    const ok = await removeUserProduct(userProductId);
    if (ok) setMyProducts(prev => prev.filter(p => p.id !== userProductId));
  };

  const fetchAiRecs = useCallback(async () => {
    if (!user || aiLoaded || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecs(data.recommendations || []);
      }
    } catch (e) {
      console.error('Failed to fetch AI recs:', e);
    } finally {
      setAiLoading(false);
      setAiLoaded(true);
    }
  }, [user, aiLoaded, aiLoading]);

  const handleTabChange = (newTab: 'catalog' | 'mine' | 'ai') => {
    setTab(newTab);
    if (newTab === 'ai' && !aiLoaded) fetchAiRecs();
  };

  const displayProducts = searchResults ?? products;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">inventory_2</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <Link href="/my-reef" className="text-[#4cd6fb] text-xs font-semibold flex items-center gap-1 mb-3">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          My Reef
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Catalog</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Products</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Supplements, foods, media & instruments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange('catalog')}
          className={`flex-1 py-3 rounded-xl font-[family-name:var(--font-headline)] font-bold text-xs tracking-wider uppercase transition-all ${
            tab === 'catalog' ? 'bg-[#FF7F50] text-white' : 'bg-[#0d1c32] text-[#c5c6cd]'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">storefront</span>
          Catalog
        </button>
        <button
          onClick={() => handleTabChange('mine')}
          className={`flex-1 py-3 rounded-xl font-[family-name:var(--font-headline)] font-bold text-xs tracking-wider uppercase transition-all relative ${
            tab === 'mine' ? 'bg-[#FF7F50] text-white' : 'bg-[#0d1c32] text-[#c5c6cd]'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">inventory_2</span>
          Mine
          {myProducts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2ff801] text-[#041329] rounded-full text-[9px] font-bold flex items-center justify-center">
              {myProducts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('ai')}
          className={`flex-1 py-3 rounded-xl font-[family-name:var(--font-headline)] font-bold text-xs tracking-wider uppercase transition-all relative ${
            tab === 'ai' ? 'bg-gradient-to-r from-[#4cd6fb] to-[#2ff801] text-[#041329]' : 'bg-[#0d1c32] text-[#c5c6cd]'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">auto_awesome</span>
          AI Recs
        </button>
      </div>

      {tab === 'catalog' && (
        <>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8f9097] text-xl">search</span>
            <input
              type="text"
              placeholder="Search products, brands..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="w-full bg-[#0d1c32] border-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-[#8f9097]/50 focus:ring-2 focus:ring-[#FF7F50]/40"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  category === c.key ? 'bg-[#FF7F50] text-white' : 'bg-[#0d1c32] text-[#c5c6cd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Product list */}
          <div className="space-y-3">
            {displayProducts.map(p => {
              const isOwned = myProductIds.has(p.id);
              const color = CATEGORY_COLORS[p.category] || '#FF7F50';
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full bg-[#0d1c32] rounded-2xl p-4 flex gap-4 items-center text-left active:scale-[0.98] transition-transform shadow-[0_4px_16px_rgba(1,14,36,0.2)]"
                >
                  <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-2xl text-[#1c2a41]">inventory_2</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{p.brand}</p>
                    <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm leading-tight">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.rating && <Stars rating={p.rating} />}
                      {isOwned && (
                        <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-[#2ff801]/15 text-[#2ff801]">MINE</span>
                      )}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[#c5c6cd]/30 shrink-0">chevron_right</span>
                </button>
              );
            })}
            {displayProducts.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-[#1c2a41]">search_off</span>
                <p className="text-[#8f9097] text-sm mt-2">No products found</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'mine' && (
        <>
          {myProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-[#FF7F50]">inventory_2</span>
              </div>
              <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">No products yet</p>
              <p className="text-[#8f9097] text-sm mt-1">Browse the catalog to add supplements,<br />food and equipment you use.</p>
              <button onClick={() => setTab('catalog')} className="mt-4 px-6 py-3 bg-[#FF7F50] text-white rounded-xl font-bold text-sm">
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myProducts.map(up => {
                const p = up.product;
                if (!p) return null;
                const color = CATEGORY_COLORS[p.category] || '#FF7F50';
                return (
                  <div key={up.id} className="bg-[#0d1c32] rounded-2xl p-4 flex gap-4">
                    <button onClick={() => setSelected(p)} className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-xl text-[#1c2a41]">inventory_2</span>
                      )}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => setSelected(p)}>
                      <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{p.brand}</p>
                      <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{p.name}</p>
                      {p.dosing_instructions && (
                        <p className="text-[#8f9097] text-[10px] mt-1 line-clamp-1">{p.dosing_instructions}</p>
                      )}
                    </div>
                    <button onClick={() => handleRemove(up.id)} className="shrink-0 self-start p-1">
                      <span className="material-symbols-outlined text-[#8f9097]/40 text-sm hover:text-[#ffb4ab]">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== AI RECOMMENDATIONS TAB ===== */}
      {tab === 'ai' && (
        <>
          {aiLoading ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4cd6fb]/20 to-[#2ff801]/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-[#4cd6fb] animate-spin">progress_activity</span>
              </div>
              <div>
                <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">Analyzing your reef...</p>
                <p className="text-[#8f9097] text-sm mt-1">Reviewing livestock, water params & current products</p>
              </div>
            </div>
          ) : aiRecs.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-[#2ff801]/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-[#2ff801]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">Your reef looks great!</p>
                <p className="text-[#8f9097] text-sm mt-1">No additional products recommended right now.<br />Keep testing and logging to get smarter insights.</p>
              </div>
              <button onClick={() => { setAiLoaded(false); fetchAiRecs(); }} className="mt-2 px-5 py-2.5 bg-[#0d1c32] text-[#4cd6fb] rounded-xl text-xs font-bold">
                <span className="material-symbols-outlined text-sm align-middle mr-1">refresh</span>
                Re-analyze
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* AI Header */}
              <div className="bg-gradient-to-br from-[#4cd6fb]/10 to-[#2ff801]/10 rounded-2xl p-4 border border-[#4cd6fb]/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#4cd6fb] text-lg">auto_awesome</span>
                  <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Personalized for Your Reef</p>
                </div>
                <p className="text-[#c5c6cd] text-xs leading-relaxed">Based on your corals, fish, water tests and current products. Tap any card for details.</p>
                <button onClick={() => { setAiLoaded(false); fetchAiRecs(); }} className="mt-2 text-[#4cd6fb] text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  Refresh analysis
                </button>
              </div>

              {/* Recommendation cards */}
              {aiRecs.map((rec, idx) => {
                const p = rec.product;
                const color = CATEGORY_COLORS[p.category] || '#FF7F50';
                const priorityConfig = {
                  critical: { bg: 'bg-[#ff4444]/10', border: 'border-[#ff4444]/20', icon: 'priority_high', iconColor: '#ff4444', label: 'URGENT' },
                  recommended: { bg: 'bg-[#FF7F50]/10', border: 'border-[#FF7F50]/20', icon: 'recommend', iconColor: '#FF7F50', label: 'RECOMMENDED' },
                  nice_to_have: { bg: 'bg-[#4cd6fb]/10', border: 'border-[#4cd6fb]/20', icon: 'lightbulb', iconColor: '#4cd6fb', label: 'NICE TO HAVE' },
                }[rec.priority];

                return (
                  <div
                    key={rec.product_id}
                    className={`${priorityConfig.bg} border ${priorityConfig.border} rounded-2xl overflow-hidden`}
                  >
                    {/* Priority badge + category */}
                    <div className="px-4 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm" style={{ color: priorityConfig.iconColor }}>{priorityConfig.icon}</span>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest" style={{ color: priorityConfig.iconColor }}>{priorityConfig.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#041329]/40 text-[#c5c6cd]">{rec.category_tag}</span>
                    </div>

                    {/* Product info */}
                    <button
                      onClick={() => setSelected(p)}
                      className="w-full px-4 py-3 flex gap-3 items-center text-left active:scale-[0.98] transition-transform"
                    >
                      <div className="w-14 h-14 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                        {p.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-xl text-[#1c2a41]">inventory_2</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{p.brand}</p>
                        <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm leading-tight">{p.name}</p>
                        {p.rating && <Stars rating={p.rating} />}
                      </div>
                      <span className="material-symbols-outlined text-[#c5c6cd]/30 shrink-0">chevron_right</span>
                    </button>

                    {/* AI reason */}
                    <div className="px-4 pb-4">
                      <div className="bg-[#041329]/40 rounded-xl p-3 flex gap-2">
                        <span className="material-symbols-outlined text-[#4cd6fb] text-sm shrink-0 mt-0.5">neurology</span>
                        <p className="text-[#c5c6cd] text-xs leading-relaxed">{rec.reason}</p>
                      </div>
                    </div>

                    {/* Quick add */}
                    {!myProductIds.has(p.id) && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleAdd(p)}
                          disabled={adding === p.id}
                          className="w-full py-2.5 rounded-xl bg-[#2ff801]/15 text-[#2ff801] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-sm">{adding === p.id ? 'progress_activity' : 'add_circle'}</span>
                          {adding === p.id ? 'Adding...' : 'Add to My Products'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== PRODUCT DETAIL SHEET ===== */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setSelected(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full max-w-lg bg-[#0a1628] rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 bg-[#0a1628] pt-3 pb-2 flex justify-center rounded-t-3xl">
              <div className="w-10 h-1 rounded-full bg-[#1c2a41]" />
            </div>

            {/* Hero image */}
            <div className="px-6 pb-4">
              <div className="w-full h-48 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
                {selected.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain p-4" />
                ) : (
                  <span className="material-symbols-outlined text-6xl text-[#1c2a41]">inventory_2</span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="px-6 space-y-5 pb-8">
              {/* Title + rating */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: CATEGORY_COLORS[selected.category] || '#FF7F50' }}>
                  {selected.brand}
                </p>
                <h2 className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-white mt-1">{selected.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  {selected.rating && <Stars rating={selected.rating} />}
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1c2a41] text-[#c5c6cd]">
                    {selected.category.replace('_', ' ')}
                  </span>
                  {selected.subcategory && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#1c2a41] text-[#8f9097]">
                      {selected.subcategory.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-[10px] font-bold text-[#8f9097] uppercase tracking-widest mb-2">Description</p>
                  <p className="text-[#c5c6cd] text-sm leading-relaxed">{selected.description}</p>
                </div>
              )}

              {/* Dosing */}
              {selected.dosing_instructions && (
                <div className="bg-[#041329] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#4cd6fb] text-sm">science</span>
                    <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest">How to Use</p>
                  </div>
                  <p className="text-[#c5c6cd] text-sm leading-relaxed">{selected.dosing_instructions}</p>
                  {selected.dosing_unit && (
                    <p className="text-[#8f9097] text-xs mt-2">Dosing unit: <span className="text-white font-bold">{selected.dosing_unit}</span></p>
                  )}
                </div>
              )}

              {/* Affects params */}
              {(selected.affects_params as string[])?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#8f9097] uppercase tracking-widest mb-2">Affects Parameters</p>
                  <div className="flex flex-wrap gap-2">
                    {(selected.affects_params as string[]).map(param => (
                      <span
                        key={param}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[selected.category] || '#FF7F50'}15`,
                          color: CATEGORY_COLORS[selected.category] || '#FF7F50',
                        }}
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              {((selected.pros && selected.pros.length > 0) || (selected.cons && selected.cons.length > 0)) && (
                <div className="grid grid-cols-2 gap-3">
                  {selected.pros && selected.pros.length > 0 && (
                    <div className="bg-[#2ff801]/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#2ff801] text-sm">thumb_up</span>
                        <p className="text-[9px] font-bold text-[#2ff801] uppercase tracking-widest">Pros</p>
                      </div>
                      {selected.pros.map((pro, i) => (
                        <p key={i} className="text-[#c5c6cd] text-[11px] flex gap-1.5">
                          <span className="text-[#2ff801] shrink-0">+</span>
                          {pro}
                        </p>
                      ))}
                    </div>
                  )}
                  {selected.cons && selected.cons.length > 0 && (
                    <div className="bg-[#FF7F50]/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#FF7F50] text-sm">thumb_down</span>
                        <p className="text-[9px] font-bold text-[#FF7F50] uppercase tracking-widest">Cons</p>
                      </div>
                      {selected.cons.map((con, i) => (
                        <p key={i} className="text-[#c5c6cd] text-[11px] flex gap-1.5">
                          <span className="text-[#FF7F50] shrink-0">-</span>
                          {con}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action button */}
              {!myProductIds.has(selected.id) ? (
                <button
                  onClick={() => handleAdd(selected)}
                  disabled={adding === selected.id}
                  className="w-full bg-gradient-to-br from-[#2ff801] to-[#1aad01] text-[#041329] font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-base tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">{adding === selected.id ? 'progress_activity' : 'add_circle'}</span>
                  {adding === selected.id ? 'Adding...' : 'Add to My Products'}
                </button>
              ) : (
                <div className="w-full bg-[#2ff801]/10 border border-[#2ff801]/20 text-[#2ff801] font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-base tracking-wider uppercase flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  In Your Collection
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation style */}
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
