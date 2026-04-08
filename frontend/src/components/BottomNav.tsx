'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', icon: 'home', label: 'Home', match: ['/'] },
  { href: '/my-reef', icon: 'water_drop', label: 'My Reef', match: ['/my-reef', '/livestock', '/gear', '/planner', '/flow', '/products'] },
  { href: '/logs', icon: 'history_edu', label: 'Logs', match: ['/logs'] },
  { href: '/tools', icon: 'handyman', label: 'Tools', match: ['/tools', '/library', '/dosing', '/cycle', '/sos', '/articles', '/bioload', '/trends', '/pest-id', '/videos', '/maintenance', '/power-outage', '/quarantine', '/bio-accelerator', '/volume-calc', '/sump-guide', '/alerts', '/param-center'] },
  { href: '/profile', icon: 'account_circle', label: 'Profile', match: ['/profile'] },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-[4.5rem] px-2 pb-[env(safe-area-inset-bottom,0.5rem)] bg-[#041329]/90 backdrop-blur-2xl z-50 rounded-t-3xl shadow-[0_-8px_32px_rgba(1,14,36,0.6)]">
      {tabs.map(tab => {
        const active = tab.match.includes(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[2.75rem] transition-all duration-200 active:scale-90 ${
              active
                ? 'bg-[#FF7F50]/15 text-[#FF7F50] px-5 py-1.5 rounded-2xl'
                : 'text-slate-500 hover:text-white px-3 py-1.5'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className={`font-[family-name:var(--font-inter)] font-medium tracking-wider uppercase leading-none ${
              active ? 'text-[10px]' : 'text-[9px]'
            }`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
