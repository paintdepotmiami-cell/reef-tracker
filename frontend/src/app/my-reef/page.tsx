'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getAnimals, getEquipment } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MyReefPage() {
  const { user, tank } = useAuth();
  const [animalCount, setAnimalCount] = useState(0);
  const [equipCount, setEquipCount] = useState(0);
  const [hasLayout, setHasLayout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.allSettled([
      getAnimals().then(a => { setAnimalCount(a.length); setCache('animals', a); }),
      getEquipment().then(e => { setEquipCount(e.length); setCache('equipment', e); }),
      getSupabase()
        .from('reef_planner_layouts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .then(({ data }) => setHasLayout(!!(data && data.length > 0))),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">waves</span>
    </div>
  );

  const sections = [
    {
      href: '/livestock',
      icon: 'sailing',
      color: '#4cd6fb',
      title: 'Livestock',
      desc: `${animalCount} animal${animalCount !== 1 ? 's' : ''} in your tank`,
      badge: animalCount > 0 ? `${animalCount}` : null,
    },
    {
      href: '/gear',
      icon: 'settings_input_component',
      color: '#FF7F50',
      title: 'Equipment & Supplements',
      desc: `${equipCount} piece${equipCount !== 1 ? 's' : ''} of gear configured`,
      badge: equipCount > 0 ? `${equipCount}` : null,
    },
    {
      href: '/products',
      icon: 'inventory_2',
      color: '#F1C40F',
      title: 'Products & Supplements',
      desc: 'Browse 67 products + AI recommendations for your reef',
      badge: null,
    },
    {
      href: '/planner',
      icon: 'view_in_ar',
      color: '#2ff801',
      title: '3D Reef Planner',
      desc: hasLayout ? 'View & edit your tank layout' : 'Design your reef with flow & PAR simulation',
      badge: hasLayout ? 'Active' : null,
    },
    {
      href: '/wishlist',
      icon: 'favorite',
      color: '#ffb4ab',
      title: 'Wishlist',
      desc: 'Track species you want + compatibility check',
      badge: null,
    },
    {
      href: '/acclimate',
      icon: 'scuba_diving',
      color: '#4cd6fb',
      title: 'Acclimation Guide',
      desc: 'Step-by-step protocols for new arrivals',
      badge: null,
    },
  ];

  const comingSoon: { icon: string; color: string; title: string; desc: string }[] = [
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Your Aquarium</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">My Reef</h1>
        {tank && (
          <p className="text-[#c5c6cd] text-sm mt-1">
            {tank.name}{tank.size_gallons ? ` \u00b7 ${tank.size_gallons} gal` : ''}{tank.tank_type ? ` \u00b7 ${tank.tank_type === 'mixed' ? 'Mixed Reef' : tank.tank_type === 'reef' ? 'Reef' : tank.tank_type === 'fish_only' ? 'Fish Only' : 'Nano'}` : ''}
          </p>
        )}
      </div>

      {/* Main Sections */}
      <div className="space-y-3">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-[#0d1c32] rounded-2xl p-5 flex items-center gap-4 active:scale-[0.98] transition-transform block"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${s.color}15` }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-[family-name:var(--font-headline)] font-bold text-white text-base">{s.title}</p>
                {s.badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ backgroundColor: `${s.color}20`, color: s.color }}
                  >
                    {s.badge}
                  </span>
                )}
              </div>
              <p className="text-[#c5c6cd] text-xs mt-0.5">{s.desc}</p>
            </div>
            <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Coming Soon</p>
        {comingSoon.map(s => (
          <div
            key={s.title}
            className="bg-[#0d1c32]/50 rounded-2xl p-5 flex items-center gap-4 opacity-50"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${s.color}10` }}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-[family-name:var(--font-headline)] font-bold text-white text-base">{s.title}</p>
              <p className="text-[#c5c6cd] text-xs mt-0.5">{s.desc}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#1c2a41] text-[#8f9097] uppercase tracking-wider">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
