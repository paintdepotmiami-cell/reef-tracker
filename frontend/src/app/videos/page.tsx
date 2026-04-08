'use client';

import { useEffect, useState, useMemo } from 'react';
import { getVideos, VIDEO_CATEGORIES } from '@/lib/video-queries';
import type { ReefVideo } from '@/lib/video-queries';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

export default function VideosPage() {
  const [videos, setVideos] = useState<ReefVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    getVideos().then(v => {
      setVideos(v);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (category === 'all') return videos;
    return videos.filter(v => v.category === category);
  }, [videos, category]);

  const featured = useMemo(() => videos.filter(v => v.featured), [videos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50] animate-pulse">smart_display</span>
          <p className="text-[#c5c6cd] text-sm">Loading videos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Learn</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">ReefOS Videos</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">{videos.length} video{videos.length !== 1 ? 's' : ''} • Guides, tips & tutorials</p>
      </div>

      {/* YouTube Channel Link */}
      <a
        href="https://www.youtube.com/@ReefOS_US"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#ff0000]/10 border border-[#ff0000]/15 rounded-2xl p-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-xl bg-[#ff0000]/15 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#ff0000">
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">@ReefOS_US</p>
          <p className="text-[#c5c6cd]/60 text-xs">Subscribe on YouTube</p>
        </div>
        <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">open_in_new</span>
      </a>

      {/* Featured Video */}
      {featured.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF7F50] text-sm">star</span>
            Featured
          </p>
          <VideoCard video={featured[0]} />
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {VIDEO_CATEGORIES.filter(c => c.key === 'all' || videos.some(v => v.category === c.key)).map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              category === cat.key
                ? 'bg-[#FF7F50]/15 text-[#FF7F50]'
                : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: category === cat.key ? '#FF7F50' : cat.color }}>
              {cat.icon}
            </span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(v => (
            <VideoCard key={v.id} video={v} compact={filtered.length > 2} />
          ))}
        </div>
      ) : (
        <div className="bg-[#0d1c32] rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-3xl text-[#c5c6cd]/30 mb-2 block">videocam_off</span>
          <p className="text-[#c5c6cd] text-sm">No videos in this category yet</p>
          <p className="text-[#c5c6cd]/50 text-xs mt-1">New content coming soon!</p>
        </div>
      )}

      {/* Empty state / CTA for more */}
      {videos.length < 3 && (
        <div className="bg-[#0d1c32] rounded-2xl p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-[#4cd6fb] mb-2 block">upcoming</span>
          <p className="text-white font-medium text-sm">More videos coming soon!</p>
          <p className="text-[#c5c6cd]/50 text-xs mt-1">
            Subscribe to @ReefOS_US on YouTube to get notified
          </p>
        </div>
      )}
    </div>
  );
}
