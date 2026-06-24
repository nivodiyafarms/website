// Service Worker — offline app shell cache
// Caches HTML/JS/CSS so the shell loads offline.
// API requests are ALWAYS network-only — never cached, never intercepted.
const CACHE = 'nf-shell-v2';
const SHELL = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // /api/* — strict network-only. Never cache, never return a stale response.
  // respondWith(fetch(...)) explicitly passes the request to the network and
  // keeps the SW out of the response path. A bare `return` here is wrong —
  // some browsers leave the request in an undefined state instead of
  // falling through to the network normally.
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell (HTML/JS/CSS/icons): cache-first, fall back to network.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
