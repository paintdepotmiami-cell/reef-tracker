import { getSupabase } from './supabase';

export interface ReefVideo {
  id: string;
  youtube_id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  category: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  tags: string[];
  context_pages: string[];
  sort_order: number;
  featured: boolean;
  created_at: string;
}

export const VIDEO_CATEGORIES: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'all', label: 'All', icon: 'play_circle', color: '#FF7F50' },
  { key: 'beginner', label: 'Beginner', icon: 'school', color: '#4cd6fb' },
  { key: 'maintenance', label: 'Maintenance', icon: 'build', color: '#2ff801' },
  { key: 'cycling', label: 'Cycling', icon: 'cycle', color: '#F1C40F' },
  { key: 'equipment', label: 'Equipment', icon: 'settings', color: '#d7ffc5' },
  { key: 'corals', label: 'Corals', icon: 'diamond', color: '#FF7F50' },
  { key: 'fish', label: 'Fish', icon: 'set_meal', color: '#ffb59c' },
  { key: 'chemistry', label: 'Chemistry', icon: 'science', color: '#4cd6fb' },
  { key: 'troubleshooting', label: 'Problems', icon: 'emergency', color: '#ff6b6b' },
  { key: 'general', label: 'General', icon: 'videocam', color: '#c5c6cd' },
];

/**
 * Get all videos, optionally filtered by category
 */
export async function getVideos(category?: string): Promise<ReefVideo[]> {
  let q = getSupabase()
    .from('reef_videos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    q = q.eq('category', category);
  }

  const { data } = await q;
  return data || [];
}

/**
 * Get videos relevant to a specific app page
 */
export async function getVideosForPage(page: string): Promise<ReefVideo[]> {
  const { data } = await getSupabase()
    .from('reef_videos')
    .select('*')
    .contains('context_pages', [page])
    .order('sort_order', { ascending: true });

  return data || [];
}

/**
 * Get featured videos
 */
export async function getFeaturedVideos(): Promise<ReefVideo[]> {
  const { data } = await getSupabase()
    .from('reef_videos')
    .select('*')
    .eq('featured', true)
    .order('sort_order', { ascending: true });

  return data || [];
}

/**
 * Format seconds to mm:ss or hh:mm:ss
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
