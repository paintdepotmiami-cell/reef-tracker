'use client';

import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function TopBar() {
  const { profile, tank } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329]/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(1,14,36,0.3)]">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/icons/logo-40.png" alt="ReefOS" width={32} height={32} className="rounded-lg" />
        <div>
          <span className="font-[family-name:var(--font-headline)] font-extrabold italic tracking-tight text-[#FF7F50] text-xl">
            ReefOS
          </span>
          {tank && (
            <p className="text-[9px] text-[#c5c6cd]/60 -mt-0.5 tracking-wider">
              {tank.name}{tank.size_gallons ? ` \u00b7 ${tank.size_gallons}gal` : ''}
            </p>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#c5c6cd] hover:bg-[#1c2a41] transition-colors">
          <span className="material-symbols-outlined text-xl">notifications</span>
        </button>
        {profile && (
          <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] flex items-center justify-center text-white text-xs font-bold active:scale-90 transition-transform">
            {(profile.display_name || '?')[0].toUpperCase()}
          </Link>
        )}
      </div>
    </header>
  );
}
