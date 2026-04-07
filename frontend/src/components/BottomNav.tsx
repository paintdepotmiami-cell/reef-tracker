'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', icon: 'dashboard', label: 'Dashboard' },
  { href: '/livestock', icon: 'sailing', label: 'Livestock' },
  { href: '/logs', icon: 'insert_chart', label: 'Logs' },
  { href: '/planner', icon: 'view_in_ar', label: 'Planner' },
  { href: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center h-[4.5rem] px-2 pb-[env(safe-area-inset-bottom,0.5rem)] bg-[#041329]/90 backdrop-blur-2xl z-50 rounded-t-3xl shadow-[0_-8px_32px_rgba(1,14,36,0.6)]">
      {tabs.map(tab => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[3rem] min-h-[2.75rem] transition-all duration-200 active:scale-90 ${
              active
                ? 'text-[#FF7F50] scale-105'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-[family-name:var(--font-inter)] font-medium text-[9px] tracking-tight leading-none">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
