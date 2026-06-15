// ═══════════════════════════════════════════════════════
//  HUNTER SYSTEM — SERVICE WORKER v1
//  Caches everything for full offline use
// ═══════════════════════════════════════════════════════

const CACHE_NAME = 'hunter-system-v1';

// All files to cache on install
const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL: pre-cache all app files ─────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      // Force this SW to become active immediately
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: delete old caches ──────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      // Take control of all open tabs immediately
      return self.clients.claim();
    })
  );
});

// ── FETCH: Cache-first strategy (offline always works) ───
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For Google Fonts — network first, fall back to cache
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(function() {
        return caches.match(event.request);
      })
    );
    return;
  }

  // For everything else — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
