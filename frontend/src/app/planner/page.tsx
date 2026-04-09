'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function PlannerPage() {
  const { user, tank } = useAuth();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function buildUrl() {
      const base = 'https://reefos-planner.vercel.app';
      const params = new URLSearchParams();

      // Pass auth token if available
      try {
        const { data } = await getSupabase().auth.getSession();
        if (data?.session) {
          params.set('token', data.session.access_token);
          params.set('refresh', data.session.refresh_token);
        }
      } catch {}

      // Pass tank dimensions if available
      if (tank) {
        if (tank.length_in) params.set('length', String(tank.length_in));
        if (tank.width_in) params.set('width', String(tank.width_in));
        if (tank.height_in) params.set('height', String(tank.height_in));
      }

      // Embed mode
      params.set('embed', '1');

      const url = params.toString() ? `${base}?${params}` : base;
      setIframeUrl(url);
      setLoading(false);
    }

    buildUrl();
  }, [user, tank]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">view_in_ar</span>
        <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Loading Planner...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 pt-16 pb-[4.5rem] bg-[#010e24] z-10">
      {/* Mini toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#041329]/90 backdrop-blur-md border-b border-[#1c2a41]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF7F50] text-lg">view_in_ar</span>
          <span className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">3D Planner</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#c5c6cd]/60 hover:text-white hover:bg-[#1c2a41] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">info</span>
          </button>
          <button
            onClick={() => {
              if (iframeUrl) window.open(iframeUrl.replace('embed=1', ''), '_blank');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#c5c6cd]/60 hover:text-white hover:bg-[#1c2a41] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">open_in_new</span>
          </button>
          <button
            onClick={() => iframeRef.current?.contentWindow?.location.reload()}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#c5c6cd]/60 hover:text-white hover:bg-[#1c2a41] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Info overlay */}
      {showInfo && (
        <div className="absolute inset-x-0 top-[7rem] mx-4 bg-[#0d1c32] rounded-2xl p-5 space-y-3 z-20 shadow-2xl border border-[#1c2a41]">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-headline)] font-bold text-white">Planner Features</h3>
            <button onClick={() => setShowInfo(false)} className="text-[#c5c6cd]/60">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {[
            { icon: 'waves', color: '#4cd6fb', title: 'Flow Simulation', desc: 'Real pump specs, dead zone detection' },
            { icon: 'light_mode', color: '#F1C40F', title: 'PAR Mapping', desc: 'Light spread & depth attenuation' },
            { icon: 'swords', color: '#ffb4ab', title: 'Conflict Detection', desc: 'Sweeper reach & spacing warnings' },
            { icon: 'psychology', color: '#2ff801', title: 'AI Advisor', desc: 'Optimized coral placement' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ color: f.color }}>{f.icon}</span>
              <div>
                <p className="text-white text-sm font-semibold">{f.title}</p>
                <p className="text-[#8f9097] text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen iframe */}
      {iframeUrl && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          allow="accelerometer; gyroscope"
          title="ReefOS 3D Planner"
        />
      )}
    </div>
  );
}
