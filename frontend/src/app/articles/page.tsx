'use client';

import { useEffect, useState, useMemo } from 'react';
import { getArticles } from '@/lib/queries';
import type { Article } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'beginner', label: 'Beginner', icon: 'school' },
  { key: 'chemistry', label: 'Chemistry', icon: 'science' },
  { key: 'coral_care', label: 'Coral Care', icon: 'waves' },
  { key: 'fish_care', label: 'Fish Care', icon: 'set_meal' },
  { key: 'equipment', label: 'Equipment', icon: 'settings_input_component' },
  { key: 'troubleshooting', label: 'Troubleshoot', icon: 'build' },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:        { bg: 'bg-[#2ff801]/10', text: 'text-[#2ff801]' },
  chemistry:       { bg: 'bg-[#4cd6fb]/10', text: 'text-[#4cd6fb]' },
  coral_care:      { bg: 'bg-[#FF7F50]/10', text: 'text-[#FF7F50]' },
  fish_care:       { bg: 'bg-[#F1C40F]/10', text: 'text-[#F1C40F]' },
  equipment:       { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  troubleshooting: { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]' },
};

const CATEGORY_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  chemistry: 'Chemistry',
  coral_care: 'Coral Care',
  fish_care: 'Fish Care',
  equipment: 'Equipment',
  troubleshooting: 'Troubleshoot',
};

export default function ArticlesPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>(getCached<Article[]>('articles') || []);
  const [loading, setLoading] = useState(!getCached('articles'));
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 6000);
    getArticles()
      .then(data => { setCache('articles', data); setArticles(data); })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user]);

  const filtered = useMemo(() => {
    let result = articles;
    if (category !== 'all') result = result.filter(a => a.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary?.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, category, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: articles.length };
    articles.forEach(a => c[a.category] = (c[a.category] || 0) + 1);
    return c;
  }, [articles]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-5 w-72 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-12 w-full bg-[#1c2a41] rounded-xl animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-28 bg-[#1c2a41] rounded-full animate-pulse shrink-0" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#1c2a41] rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Knowledge Base</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Articles & Guides</h1>
        <p className="text-sm text-[#c5c6cd] mt-1">
          {filtered.length === articles.length
            ? `${articles.length} guides · Master your reef`
            : `${filtered.length} of ${articles.length} articles`
          }
        </p>
      </div>

      {/* Search */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF7F50] transition-colors">search</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#010e24] border-none rounded-xl py-3.5 pl-12 pr-4 text-[#d6e3ff] placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 transition-all text-sm"
          placeholder="Search articles..."
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-sm tracking-wide transition-all whitespace-nowrap shrink-0 ${
              category === c.key
                ? 'bg-[#FF7F50] text-white font-bold shadow-lg shadow-[#FF7F50]/20'
                : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
            }`}
          >
            <span className="material-symbols-outlined text-base">{c.icon}</span>
            {c.label}
            {(counts[c.key] || 0) > 0 && (
              <span className={`text-xs ${category === c.key ? 'text-white/70' : 'text-[#8f9097]'}`}>
                ({counts[c.key] || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Article Cards */}
      <div className="space-y-4">
        {filtered.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">article</span>
          <p className="text-[#c5c6cd] text-sm font-medium">No articles found</p>
          <p className="text-[#8f9097] text-xs mt-1">Try a different category or search term</p>
          <button
            onClick={() => { setSearch(''); setCategory('all'); }}
            className="mt-4 px-4 py-2 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl text-xs font-semibold hover:bg-[#FF7F50]/20 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const colors = CATEGORY_COLORS[article.category] || { bg: 'bg-white/10', text: 'text-[#c5c6cd]' };
  const label = CATEGORY_LABELS[article.category] || article.category;
  const [imgError, setImgError] = useState(false);
  const hasImage = article.image_url && !imgError;

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="bg-[#0d1c32] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform block group"
    >
      {/* Hero Image */}
      {hasImage && (
        <div className="relative w-full h-40 overflow-hidden">
          <img
            src={article.image_url!}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1c32] via-transparent to-transparent" />
          {/* Category badge on image */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${colors.bg} ${colors.text}`}>
              {label}
            </span>
          </div>
          {/* Reading time on image */}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full text-[9px] font-medium text-white/80 bg-black/40 backdrop-blur-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">schedule</span>
              {article.reading_time} min
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`p-4 flex items-start gap-3 ${hasImage ? 'pt-3' : ''}`}>
        {/* Icon circle — only show when no image */}
        {!hasImage && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
            <span className={`material-symbols-outlined text-xl ${colors.text}`}>
              {article.category === 'beginner' ? 'school' :
               article.category === 'chemistry' ? 'science' :
               article.category === 'coral_care' ? 'waves' :
               article.category === 'fish_care' ? 'set_meal' :
               article.category === 'equipment' ? 'settings_input_component' :
               'build'}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Show category/time inline only when no hero image */}
          {!hasImage && (
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                {label}
              </span>
              <span className="text-[10px] text-[#8f9097] flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">schedule</span>
                {article.reading_time} min
              </span>
            </div>
          )}
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-sm leading-tight group-hover:text-[#FF7F50] transition-colors">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-[#c5c6cd] text-xs mt-1 line-clamp-2">{article.summary}</p>
          )}
        </div>

        <span className="material-symbols-outlined text-[#c5c6cd]/40 self-center shrink-0">chevron_right</span>
      </div>
    </Link>
  );
}
