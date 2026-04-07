'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

interface PlannerLayout {
  id: string;
  name: string;
  tank_length_in: number | null;
  tank_width_in: number | null;
  tank_height_in: number | null;
  pumps: unknown[];
  lights: unknown[];
  corals: unknown[];
  updated_at: string;
}

export default function PlannerPage() {
  const { user, tank } = useAuth();
  const [layout, setLayout] = useState<PlannerLayout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getSupabase()
      .from('reef_planner_layouts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setLayout(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">view_in_ar</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">3D Simulation</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Planner</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Flow, PAR & placement advisor for your reef</p>
      </div>

      {/* Layout Card or Empty State */}
      {layout ? (
        <div className="bg-[#0d1c32] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">{layout.name}</h3>
              <p className="text-xs text-[#c5c6cd]">
                {layout.tank_length_in}&quot; x {layout.tank_width_in}&quot; x {layout.tank_height_in}&quot;
              </p>
            </div>
            <div className="bg-[#FF7F50]/10 rounded-xl px-3 py-1.5">
              <span className="text-[#FF7F50] text-xs font-bold">{(layout.corals as unknown[]).length} corals</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#010e24] rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-[#4cd6fb] text-lg">waves</span>
              <p className="text-white font-bold text-sm mt-1">{(layout.pumps as unknown[]).length}</p>
              <p className="text-[#8f9097] text-[9px] uppercase">Pumps</p>
            </div>
            <div className="bg-[#010e24] rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-[#F1C40F] text-lg">light_mode</span>
              <p className="text-white font-bold text-sm mt-1">{(layout.lights as unknown[]).length}</p>
              <p className="text-[#8f9097] text-[9px] uppercase">Lights</p>
            </div>
            <div className="bg-[#010e24] rounded-xl p-3 text-center">
              <span className="material-symbols-outlined text-[#2ff801] text-lg">spa</span>
              <p className="text-white font-bold text-sm mt-1">{(layout.corals as unknown[]).length}</p>
              <p className="text-[#8f9097] text-[9px] uppercase">Corals</p>
            </div>
          </div>
          <p className="text-[9px] text-[#8f9097] text-center">
            Last updated: {new Date(layout.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ) : (
        <div className="bg-[#0d1c32] rounded-2xl p-8 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[#FF7F50]">view_in_ar</span>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">No Layout Yet</h3>
            <p className="text-[#c5c6cd] text-sm mt-1">Open the 3D Planner to design your reef layout with flow simulation and PAR mapping.</p>
          </div>
        </div>
      )}

      {/* Open Planner Button */}
      <a
        href="http://localhost:5173"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-5 rounded-2xl text-base tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.97] transition-transform duration-150 text-center"
      >
        <span className="material-symbols-outlined text-xl align-middle mr-2">open_in_new</span>
        Open 3D Planner
      </a>

      {/* Features */}
      <div className="space-y-3">
        <h3 className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium">What the Planner does</h3>
        {[
          { icon: 'waves', color: '#4cd6fb', title: 'Flow Simulation', desc: 'Real pump specs, dead zone detection, turnover analysis' },
          { icon: 'light_mode', color: '#F1C40F', title: 'PAR Mapping', desc: 'Light spread, depth attenuation, coverage analysis' },
          { icon: 'swords', color: '#ffb4ab', title: 'Conflict Detection', desc: 'Sweeper tentacle reach, spacing warnings, aggression checks' },
          { icon: 'psychology', color: '#2ff801', title: 'Placement Advisor', desc: 'AI-powered suggestions to optimize coral placement' },
        ].map(f => (
          <div key={f.title} className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${f.color}15` }}>
              <span className="material-symbols-outlined text-lg" style={{ color: f.color }}>{f.icon}</span>
            </div>
            <div>
              <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm">{f.title}</p>
              <p className="text-[#8f9097] text-xs">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
