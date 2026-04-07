/**
 * Simple in-memory cache for Supabase queries.
 * Returns stale data instantly while refreshing in the background.
 * This eliminates the loading spinner on every page navigation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Cache TTL: 30 seconds (data is still refreshed, but stale data is shown instantly)
const TTL = 30_000;

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  // Return cached data even if stale — the caller will refresh in background
  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

export function isFresh(key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < TTL;
}

export function clearCache(): void {
  store.clear();
}

/**
 * Fetch with cache: returns cached data immediately if available,
 * then refreshes in the background and calls onUpdate with fresh data.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  onUpdate: (data: T) => void,
): Promise<T> {
  const cached = getCached<T>(key);

  if (cached !== null) {
    // Return stale data instantly
    onUpdate(cached);

    // Refresh in background if stale
    if (!isFresh(key)) {
      fetcher().then(fresh => {
        setCache(key, fresh);
        onUpdate(fresh);
      }).catch(() => {});
    }

    return cached;
  }

  // No cache — must await
  const data = await fetcher();
  setCache(key, data);
  onUpdate(data);
  return data;
}
