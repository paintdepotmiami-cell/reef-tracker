const CACHE_NAME = 'reefos-v4';

// Install: skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate: clean all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for everything, cache as fallback for offline
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, Supabase, and chrome-extension requests
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname.includes('supabase') || url.protocol === 'chrome-extension:') return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok && (request.mode === 'navigate' || url.pathname.match(/\.(js|css|png|svg|woff2?)$/))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/');
          return new Response('', { status: 408 });
        });
      })
  );
});
