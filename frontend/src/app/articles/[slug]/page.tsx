'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArticleBySlug } from '@/lib/queries';
import type { Article } from '@/lib/queries';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:        { bg: 'bg-[#2ff801]/10', text: 'text-[#2ff801]' },
  chemistry:       { bg: 'bg-[#4cd6fb]/10', text: 'text-[#4cd6fb]' },
  coral_care:      { bg: 'bg-[#FF7F50]/10', text: 'text-[#FF7F50]' },
  fish_care:       { bg: 'bg-[#F1C40F]/10', text: 'text-[#F1C40F]' },
  equipment:       { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  troubleshooting: { bg: 'bg-[#ffb4ab]/10', text: 'text-[#ffb4ab]' },
};

const CATEGORY_LABELS: Record<string, string> = {
  beginner: 'Beginner Guide',
  chemistry: 'Water Chemistry',
  coral_care: 'Coral Care',
  fish_care: 'Fish Care',
  equipment: 'Equipment',
  troubleshooting: 'Troubleshooting',
};

/* ── Simple Markdown Renderer ──────────────────────────────── */

function renderMarkdown(md: string): string {
  return md
    // Tables
    .replace(/\n\|(.+)\|\n\|[-| :]+\|\n((\|.+\|\n?)+)/g, (_match, header, body) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = body.trim().split('\n').map((r: string) =>
        r.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      return `<div class="overflow-x-auto my-4"><table class="w-full text-sm"><thead><tr>${headers.map((h: string) => `<th class="text-left py-2 px-3 text-[#ffb59c] font-semibold text-xs uppercase tracking-wider border-b border-[#1c2a41]">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r: string[]) => `<tr class="border-b border-[#1c2a41]/50">${r.map((c: string) => `<td class="py-2 px-3 text-[#c5c6cd]">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    })
    // Checklist items
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><span class="w-4 h-4 rounded border border-[#4cd6fb]/40 shrink-0"></span><span class="text-[#c5c6cd] text-sm">$1</span></div>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-[family-name:var(--font-headline)] text-base font-bold text-white mt-6 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-[family-name:var(--font-headline)] text-lg font-bold text-[#FF7F50] mt-8 mb-3">$1</h3>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#4cd6fb] italic">$1</em>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-[#c5c6cd] text-sm leading-relaxed list-decimal">$1</li>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-[#c5c6cd] text-sm leading-relaxed list-disc marker:text-[#FF7F50]">$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-sm text-[#c5c6cd] leading-relaxed my-3">')
    // Line breaks
    .replace(/\n/g, '<br/>');
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.slug) return;
    const timeout = setTimeout(() => setLoading(false), 6000);
    getArticleBySlug(params.slug as string)
      .then(data => setArticle(data))
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [params.slug]);

  if (loading) return (
    <div className="space-y-6">
      <div className="h-6 w-32 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-10 w-full bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="h-4 w-48 bg-[#1c2a41] rounded-lg animate-pulse" />
      <div className="space-y-3 mt-8">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 w-full bg-[#1c2a41] rounded-lg animate-pulse" />)}
      </div>
    </div>
  );

  if (!article) return (
    <div className="text-center py-20">
      <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">article</span>
      <p className="text-[#c5c6cd] text-sm font-medium">Article not found</p>
      <button
        onClick={() => router.push('/articles')}
        className="mt-4 px-4 py-2 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl text-xs font-semibold hover:bg-[#FF7F50]/20 transition-colors"
      >
        Back to Articles
      </button>
    </div>
  );

  const colors = CATEGORY_COLORS[article.category] || { bg: 'bg-white/10', text: 'text-[#c5c6cd]' };
  const label = CATEGORY_LABELS[article.category] || article.category;

  return (
    <div className="pb-24">
      {/* Back button */}
      <button
        onClick={() => router.push('/articles')}
        className="flex items-center gap-1 text-[#c5c6cd] text-sm mb-6 hover:text-[#FF7F50] transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Articles
      </button>

      {/* Title area */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text}`}>
            {label}
          </span>
          <span className="text-[11px] text-[#8f9097] flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">schedule</span>
            {article.reading_time} min read
          </span>
        </div>
        <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white leading-tight">
          {article.title}
        </h1>
        {article.summary && (
          <p className="text-sm text-[#c5c6cd] mt-2 leading-relaxed">{article.summary}</p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-[#FF7F50]/30 via-[#4cd6fb]/20 to-transparent mb-6" />

      {/* Article content */}
      <div
        className="prose-reef"
        dangerouslySetInnerHTML={{ __html: `<p class="text-sm text-[#c5c6cd] leading-relaxed my-3">${renderMarkdown(article.content)}</p>` }}
      />

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-[#1c2a41]">
        <button
          onClick={() => router.push('/articles')}
          className="w-full py-3 bg-[#FF7F50]/10 text-[#FF7F50] rounded-xl hover:bg-[#FF7F50]/20 transition font-semibold cursor-pointer text-sm"
        >
          ← Back to All Articles
        </button>
      </div>
    </div>
  );
}
