'use client';

import { useState } from 'react';
import type { ReefVideo } from '@/lib/video-queries';
import { formatDuration } from '@/lib/video-queries';

interface VideoCardProps {
  video: ReefVideo;
  compact?: boolean;
}

export default function VideoCard({ video, compact = false }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);

  const thumbnail = video.thumbnail_url || `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className={`rounded-2xl overflow-hidden bg-black ${compact ? '' : 'mb-2'}`}>
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {!compact && (
          <div className="bg-[#0d1c32] p-3">
            <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
            {video.description && (
              <p className="text-[#c5c6cd]/60 text-xs mt-1 line-clamp-2">{video.description}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => setPlaying(true)}
        className="w-full flex items-center gap-3 bg-[#0d1c32] rounded-2xl p-3 active:scale-[0.98] transition-transform text-left"
      >
        {/* Thumbnail */}
        <div className="relative w-24 h-14 rounded-xl overflow-hidden shrink-0 bg-[#1c2a41]">
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_circle
            </span>
          </div>
          {video.duration_seconds && (
            <div className="absolute bottom-1 right-1 bg-black/80 rounded px-1 text-[9px] text-white font-mono">
              {formatDuration(video.duration_seconds)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
          <p className="text-[#c5c6cd]/50 text-[10px] mt-0.5 uppercase">{video.category}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className="w-full bg-[#0d1c32] rounded-2xl overflow-hidden active:scale-[0.98] transition-transform text-left"
    >
      {/* Thumbnail */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <img src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#FF7F50]/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-2xl ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>

        {/* Duration badge */}
        {video.duration_seconds && (
          <div className="absolute bottom-2 right-2 bg-black/80 rounded-md px-1.5 py-0.5 text-[10px] text-white font-mono">
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Featured badge */}
        {video.featured && (
          <div className="absolute top-2 left-2 bg-[#FF7F50]/90 rounded-md px-2 py-0.5 text-[9px] text-white font-bold uppercase tracking-wider">
            Featured
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-white text-sm font-[family-name:var(--font-headline)] font-bold line-clamp-2">{video.title}</p>
        {video.description && (
          <p className="text-[#c5c6cd]/60 text-xs mt-1 line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[#FF7F50] text-xs">play_circle</span>
            <span className="text-[#c5c6cd]/50 text-[10px] uppercase">{video.category}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
