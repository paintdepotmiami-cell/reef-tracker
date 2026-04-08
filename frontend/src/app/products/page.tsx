'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getProducts, getUserProducts, addUserProduct, removeUserProduct, searchProducts } from '@/lib/queries';
import type { Product, UserProduct } from '@/lib/queries';
import Link from 'next/link';

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
  chemistry: '#FF7F50',
  biological: '#2ff801',
  food: '#F1C40F',
  nutrition: '#ffb59c',
  media: '#4cd6fb',
  carbon_dosing: '#c5c6cd',
  salt: '#4cd6fb',
  trace: '#d7ffc5',
  conditioner: '#ffb4ab',
  instrument: '#8f9097',
};

export default function ProductsPage() {
  const { user, tank } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [tab, setTab] = useState<'catalog' | 'mine'>('catalog');

  const myProductIds = new Set(myProducts.map(up => up.product_id));

  useEffect(() => {
    if (!user) return;
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
        <p className="text-[#c5c6cd] text-sm mt-1">59 supplements, foods, media & instruments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('catalog')}
          className={`flex-1 py-3 rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm tracking-wider uppercase transition-all ${
            tab === 'catalog'
              ? 'bg-[#FF7F50] text-white'
              : 'bg-[#0d1c32] text-[#c5c6cd]'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">storefront</span>
          Catalog
        </button>
        <button
          onClick={() => setTab('mine')}
          className={`flex-1 py-3 rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm tracking-wider uppercase transition-all relative ${
            tab === 'mine'
              ? 'bg-[#FF7F50] text-white'
              : 'bg-[#0d1c32] text-[#c5c6cd]'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">inventory_2</span>
          My Products
          {myProducts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2ff801] text-[#041329] rounded-full text-[9px] font-bold flex items-center justify-center">
              {myProducts.length}
            </span>
          )}
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
                  category === c.key
                    ? 'bg-[#FF7F50] text-white'
                    : 'bg-[#0d1c32] text-[#c5c6cd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="space-y-3">
            {displayProducts.map(p => {
              const isOwned = myProductIds.has(p.id);
              const color = CATEGORY_COLORS[p.category] || '#FF7F50';
              return (
                <div key={p.id} className="bg-[#0d1c32] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(1,14,36,0.2)]">
                  <div className="flex gap-4 p-4">
                    {/* Product image */}
                    <div className="w-20 h-20 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-[#1c2a41]">inventory_2</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{p.brand}</p>
                          <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm leading-tight mt-0.5">{p.name}</p>
                        </div>
                        {isOwned && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#2ff801]/15 text-[#2ff801]">MINE</span>
                        )}
                      </div>
                      <p className="text-[#8f9097] text-[10px] mt-1 line-clamp-2">{p.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#1c2a41] text-[#c5c6cd]">
                          {p.category.replace('_', ' ')}
                        </span>
                        {p.subcategory && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#1c2a41] text-[#8f9097]">
                            {p.subcategory.replace('_', ' ')}
                          </span>
                        )}
                        {(p.affects_params as string[])?.slice(0, 3).map(param => (
                          <span key={param} className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: `${color}15`, color }}>
                            {param}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-[#1c2a41]">
                    {!isOwned ? (
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={adding === p.id}
                        className="flex-1 py-3 text-[#2ff801] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#2ff801]/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {adding === p.id ? 'progress_activity' : 'add_circle'}
                        </span>
                        {adding === p.id ? 'Adding...' : 'Add to My Products'}
                      </button>
                    ) : (
                      <div className="flex-1 py-3 text-[#8f9097] text-xs font-bold flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#2ff801]">check_circle</span>
                        In your collection
                      </div>
                    )}
                  </div>
                </div>
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
              <button
                onClick={() => setTab('catalog')}
                className="mt-4 px-6 py-3 bg-[#FF7F50] text-white rounded-xl font-bold text-sm"
              >
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
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-2xl text-[#1c2a41]">inventory_2</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color }}>{p.brand}</p>
                      <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{p.name}</p>
                      {p.dosing_instructions && (
                        <p className="text-[#8f9097] text-[10px] mt-1">{p.dosing_instructions}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                          up.status === 'active' ? 'bg-[#2ff801]/15 text-[#2ff801]' :
                          up.status === 'empty' ? 'bg-[#FF7F50]/15 text-[#FF7F50]' :
                          'bg-[#1c2a41] text-[#8f9097]'
                        }`}>
                          {up.status}
                        </span>
                        {up.daily_dose && (
                          <span className="text-[10px] text-[#c5c6cd]">{up.daily_dose} {up.dose_unit || p.dosing_unit}/day</span>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(up.id)}
                      className="shrink-0 self-start p-1"
                    >
                      <span className="material-symbols-outlined text-[#8f9097]/40 text-sm hover:text-[#ffb4ab]">delete</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
