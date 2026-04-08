'use client';

import Link from 'next/link';

interface ToolItem {
  href: string;
  icon: string;
  color: string;
  title: string;
  desc: string;
  live: boolean;
}

const categories: { label: string; icon: string; tools: ToolItem[] }[] = [
  {
    label: 'Manage',
    icon: 'tune',
    tools: [
      { href: '/dosing', icon: 'science', color: '#2ff801', title: 'Dosing Calculator', desc: 'Calculate Alk, Ca & Mg doses for your tank', live: true },
      { href: '/cycle', icon: 'cycle', color: '#4cd6fb', title: 'Cycle Tracker', desc: 'Monitor NH3, NO2 & NO3 during tank cycling', live: true },
      { href: '/bioload', icon: 'balance', color: '#FF7F50', title: 'Bioload Calculator', desc: 'Check fish capacity & stocking timeline', live: true },
      { href: '/trends', icon: 'monitoring', color: '#d7ffc5', title: 'Trend Graphs', desc: 'Track parameters over time with safe zones', live: true },
      { href: '/maintenance', icon: 'task_alt', color: '#F1C40F', title: 'Maintenance', desc: 'Track & schedule all tank maintenance tasks', live: true },
      { href: '#', icon: 'restaurant', color: '#8f9097', title: 'Feeding Schedule', desc: 'Plan & track coral and fish feeding', live: false },
    ],
  },
  {
    label: 'Learn',
    icon: 'school',
    tools: [
      { href: '/library', icon: 'menu_book', color: '#4cd6fb', title: 'Species Library', desc: 'Browse 180+ species with photos & care guides', live: true },
      { href: '/articles', icon: 'article', color: '#ffb59c', title: 'Articles & Guides', desc: 'Lighting, refugium, Balling method & more', live: true },
      { href: '/videos', icon: 'smart_display', color: '#ff0000', title: 'ReefOS Videos', desc: 'YouTube tutorials, guides & tips', live: true },
    ],
  },
  {
    label: 'Help',
    icon: 'support',
    tools: [
      { href: '/pest-id', icon: 'bug_report', color: '#FF7F50', title: 'Pest Identifier', desc: 'Identify pests & diseases with expert protocols', live: true },
      { href: '/quarantine', icon: 'local_hospital', color: '#4cd6fb', title: 'Hospital / QT', desc: 'Disease protocols, meds & quarantine setup', live: true },
      { href: '/sos', icon: 'emergency', color: '#ffb4ab', title: 'Emergency SOS', desc: 'Diagnose & fix common reef problems fast', live: true },
      { href: '/power-outage', icon: 'power_off', color: '#ff4444', title: 'Power Outage', desc: 'Emergency protocol when you lose electricity', live: true },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Utilities</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Tools</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Calculators, guides & emergency help</p>
      </div>

      {/* Tool Categories */}
      {categories.map(cat => (
        <div key={cat.label} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb59c] text-sm">{cat.icon}</span>
            <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">{cat.label}</p>
          </div>

          {cat.tools.map(tool => {
            const content = (
              <>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <span className="material-symbols-outlined text-xl" style={{ color: tool.color }}>{tool.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{tool.title}</p>
                    {!tool.live && (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#1c2a41] text-[#8f9097] uppercase tracking-wider">Soon</span>
                    )}
                  </div>
                  <p className="text-[#c5c6cd] text-xs mt-0.5">{tool.desc}</p>
                </div>
                {tool.live && (
                  <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
                )}
              </>
            );

            return tool.live ? (
              <Link
                key={tool.title}
                href={tool.href}
                className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform block"
              >
                {content}
              </Link>
            ) : (
              <div
                key={tool.title}
                className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 opacity-40"
              >
                {content}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
