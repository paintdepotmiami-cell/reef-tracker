'use client';

import { useEffect, useState } from 'react';
import { getVideosForPage } from '@/lib/video-queries';
import type { ReefVideo } from '@/lib/video-queries';
import VideoCard from './VideoCard';

interface ContextVideosProps {
  page: string; // e.g. '/cycle', '/dosing'
  maxVideos?: number;
}

/**
 * Drop-in component that shows relevant ReefOS YouTube videos
 * for any page. Just add <ContextVideos page="/cycle" /> anywhere.
 */
export default function ContextVideos({ page, maxVideos = 3 }: ContextVideosProps) {
  const [videos, setVideos] = useState<ReefVideo[]>([]);

  useEffect(() => {
    getVideosForPage(page).then(v => setVideos(v.slice(0, maxVideos)));
  }, [page, maxVideos]);

  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#FF7F50] text-sm">smart_display</span>
        <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">ReefOS Videos</p>
      </div>
      {videos.map(v => (
        <VideoCard key={v.id} video={v} compact={videos.length > 1} />
      ))}
    </div>
  );
}
