const CACHE_NAME = 'reefos-v5';

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

/* ── Push Notifications ── */

self.addEventListener('push', (event) => {
  let data = { title: 'ReefOS Alert', body: 'Check your tank!', icon: '/icons/icon-192.png', url: '/alerts' };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    // Use defaults if JSON parsing fails
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'reefos-alert',
    renotify: true,
    data: { url: data.url || '/alerts' },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click — open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/alerts';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

/* ── Periodic Background Sync (for scheduled alerts) ── */

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reefos-check-alerts') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  // This runs in the background periodically
  // In a full implementation, this would:
  // 1. Fetch latest water test from Supabase
  // 2. Run alert-engine logic
  // 3. Show notification if alerts found
  // For now, we rely on the app's client-side alert engine
  // and the push server for real-time notifications
}

/* ── Scheduled Local Notifications ── */

// Listen for messages from the app to schedule local notifications
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body, url, tag } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: tag || 'reefos-scheduled',
        data: { url: url || '/alerts' },
        actions: [
          { action: 'open', title: 'View' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    }, delay || 0);
  }
});
