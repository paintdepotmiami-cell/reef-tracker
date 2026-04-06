'use client';

import { useAuth } from '@/lib/auth';

export default function TopBar() {
  const { profile, tank } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329]/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[#FF7F50]">waves</span>
        <div>
          <span className="font-[family-name:var(--font-headline)] font-bold tracking-[0.15em] text-[#FF7F50] text-lg uppercase">
            ReefOS
          </span>
          {tank && (
            <p className="text-[9px] text-[#c5c6cd]/60 -mt-1 tracking-wider">
              {tank.name}{tank.size_gallons ? ` · ${tank.size_gallons}gal` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#c5c6cd] hover:bg-[#1c2a41] transition-colors">
          <span className="material-symbols-outlined text-xl">notifications</span>
        </button>
        {profile && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] flex items-center justify-center text-white text-xs font-bold">
            {(profile.display_name || '?')[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
