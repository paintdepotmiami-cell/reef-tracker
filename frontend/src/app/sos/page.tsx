'use client';

import { useState, useMemo } from 'react';
import { PROBLEMS, getProblemsByCategory } from '@/lib/troubleshooter';
import type { Problem } from '@/lib/troubleshooter';

/* ── urgency helpers ──────────────────────────────────────── */
const URGENCY_META: Record<Problem['urgency'], { label: string; color: string; bg: string; border: string; glow: string }> = {
  critical: { label: 'CRITICAL', color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/15', border: 'border-l-[#ffb4ab]', glow: 'shadow-[0_0_20px_rgba(255,180,171,0.25)]' },
  high:     { label: 'HIGH',     color: 'text-[#FF7F50]', bg: 'bg-[#FF7F50]/15', border: 'border-l-[#FF7F50]', glow: '' },
  medium:   { label: 'MEDIUM',   color: 'text-[#F1C40F]', bg: 'bg-[#F1C40F]/15', border: 'border-l-[#F1C40F]', glow: '' },
  low:      { label: 'LOW',      color: 'text-[#2ff801]', bg: 'bg-[#2ff801]/15', border: 'border-l-[#2ff801]', glow: '' },
};

const CATEGORIES = [
  { key: 'all',       label: 'All',       emoji: '' },
  { key: 'coral',     label: 'Coral',     emoji: '' },
  { key: 'fish',      label: 'Fish',      emoji: '' },
  { key: 'water',     label: 'Water',     emoji: '' },
  { key: 'algae',     label: 'Algae',     emoji: '' },
  { key: 'equipment', label: 'Equipment', emoji: '' },
] as const;

const CAT_ICONS: Record<string, string> = {
  all: 'select_all',
  coral: 'diamond',
  fish: 'set_meal',
  water: 'water_drop',
  algae: 'eco',
  equipment: 'settings',
};

/* ── main component ───────────────────────────────────────── */
export default function SOSPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = getProblemsByCategory(category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.symptoms.some((s) => s.toLowerCase().includes(q)) ||
          p.causes.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list;
  }, [category, search]);

  return (
    <div className="min-h-screen pb-28">
      {/* ── header ─────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ffb4ab]/15 mb-3 sos-pulse">
          <span className="material-symbols-outlined text-[#ffb4ab]" style={{ fontSize: 36 }}>sos</span>
        </div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-white">
          Emergency Troubleshooter
        </h1>
        <p className="text-sm text-[#8e99a4] mt-1">Quick diagnosis for common reef problems</p>
      </div>

      {/* ── category pills ─────────────────────── */}
      <div className="px-5 mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.key
                  ? 'bg-[#FF7F50] text-white'
                  : 'bg-[#0d1c32] text-[#8e99a4] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{CAT_ICONS[cat.key]}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── search ─────────────────────────────── */}
      <div className="px-5 mb-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8e99a4]" style={{ fontSize: 20 }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Describe the problem..."
            className="w-full bg-[#0d1c32] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#8e99a4] outline-none focus:ring-1 focus:ring-[#FF7F50]/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="material-symbols-outlined text-[#8e99a4] hover:text-white" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── results count ──────────────────────── */}
      <div className="px-5 mb-3">
        <p className="text-xs text-[#8e99a4]">{filtered.length} problem{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* ── problem cards ──────────────────────── */}
      <div className="px-5 space-y-3">
        {filtered.map((problem) => {
          const meta = URGENCY_META[problem.urgency];
          const isExpanded = expandedId === problem.id;

          return (
            <div
              key={problem.id}
              className={`bg-[#0d1c32] rounded-2xl border-l-4 ${meta.border} overflow-hidden transition-all duration-300 ${
                problem.urgency === 'critical' ? meta.glow : ''
              } ${problem.urgency === 'critical' && !isExpanded ? 'critical-card' : ''}`}
            >
              {/* collapsed header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : problem.id)}
                className="w-full flex items-start gap-3 p-4 text-left"
              >
                <div className="shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#8e99a4]" style={{ fontSize: 24 }}>{problem.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-[family-name:var(--font-headline)] text-[15px] font-semibold text-white">{problem.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} ${problem.urgency === 'critical' ? 'critical-badge' : ''}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#8e99a4] line-clamp-1">{problem.symptoms[0]}</p>
                </div>
                <span
                  className="material-symbols-outlined text-[#8e99a4] shrink-0 mt-1 transition-transform duration-300"
                  style={{ fontSize: 20, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </button>

              {/* expanded detail */}
              <div
                className="transition-all duration-300 ease-in-out overflow-hidden"
                style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0 }}
              >
                <div className="px-4 pb-5 space-y-5">
                  {/* divider */}
                  <div className="h-px bg-white/5" />

                  {/* symptoms */}
                  <Section icon="visibility" iconColor="text-[#ffb4ab]" title="SYMPTOMS">
                    <ul className="space-y-2">
                      {problem.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#c5c6cd]">
                          <span className="material-symbols-outlined text-[#ffb4ab] shrink-0 mt-0.5" style={{ fontSize: 14 }}>radio_button_checked</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* causes */}
                  <Section icon="help_outline" iconColor="text-[#F1C40F]" title="LIKELY CAUSES">
                    <ul className="space-y-2">
                      {problem.causes.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#c5c6cd]">
                          <span className="material-symbols-outlined text-[#F1C40F] shrink-0 mt-0.5" style={{ fontSize: 14 }}>arrow_right</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* solutions */}
                  <Section icon="check_circle" iconColor="text-[#2ff801]" title="SOLUTIONS">
                    <ol className="space-y-3">
                      {problem.solutions.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-[#c5c6cd]">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-[#2ff801]/10 text-[#2ff801] flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{s}</span>
                        </li>
                      ))}
                    </ol>
                  </Section>

                  {/* prevention */}
                  <Section icon="lightbulb" iconColor="text-[#4cd6fb]" title="PREVENTION">
                    <ul className="space-y-2">
                      {problem.prevention.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#c5c6cd]">
                          <span className="material-symbols-outlined text-[#4cd6fb] shrink-0 mt-0.5" style={{ fontSize: 14 }}>lightbulb</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Section>

                  {/* related params */}
                  {problem.relatedParams && problem.relatedParams.length > 0 && (
                    <Section icon="monitoring" iconColor="text-[#FF7F50]" title="CHECK THESE PARAMS">
                      <div className="flex flex-wrap gap-2">
                        {problem.relatedParams.map((param) => (
                          <span
                            key={param}
                            className="px-3 py-1.5 bg-[#FF7F50]/10 text-[#FF7F50] rounded-lg text-xs font-medium capitalize"
                          >
                            {param}
                          </span>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-[#8e99a4] mb-3" style={{ fontSize: 48 }}>search_off</span>
            <p className="text-[#8e99a4] text-sm">No matching problems found.</p>
            <p className="text-[#8e99a4] text-xs mt-1">Try a different search term or category.</p>
          </div>
        )}
      </div>

      {/* ── animations ─────────────────────────── */}
      <style jsx>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 180, 171, 0.4); }
          50% { box-shadow: 0 0 20px 8px rgba(255, 180, 171, 0.15); }
        }
        .sos-pulse {
          animation: sos-pulse 2s ease-in-out infinite;
        }
        @keyframes critical-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(255, 180, 171, 0.15); }
          50% { box-shadow: 0 0 20px rgba(255, 180, 171, 0.25); }
        }
        .critical-card {
          animation: critical-glow 3s ease-in-out infinite;
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .critical-badge {
          animation: badge-pulse 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

/* ── reusable section component ───────────────────────────── */
function Section({ icon, iconColor, title, children }: {
  icon: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: 18 }}>{icon}</span>
        <h4 className="text-xs font-bold text-[#8e99a4] tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}
