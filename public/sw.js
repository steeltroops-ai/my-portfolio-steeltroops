const CACHE_NAME = "steeltroops-v2-hybrid";
const OFFLINE_URL = "/offline.html";

// 1. PRECACHE CRITICAL ASSETS (Offline Page UI)
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/favicon-32x32.png",
  "/favicon.webp",
  "/logo.webp", // Re-adding carefully - logic inside install handles failure gracefully if missing
];

// 2. INSTALL PHASE
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We use addAll but catch individual failures so one missing file doesn't break the whole install
      return Promise.all(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Failed to precache:", url, err);
          })
        )
      );
    })
  );
});

// 3. ACTIVATE PHASE (Cleanup Old Caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 4. FETCH STRATEGY
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. NAVIGATION REQUESTS (HTML Pages)
  // Strategy: Network First -> Cache Fallback -> Offline Page
  // Goal: Show fresh content if online. Show cached content if offline. Only show Offline Page if neither exist.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Verify valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }
          // Clone and Cache the fresh page
          constresponseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // NETWORK FAILED - Check Cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse; // Serve cached page (Functional Offline)
            }
            // No cache? Serve Custom Offline Page
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // B. STATIC ASSETS (JS, CSS, Fonts, Images)
  // Strategy: Cache First (Performance & Battery) -> Network Fallback
  // Once an asset is cached, we use it. We assume hashed filenames (Vite) handle invalidation.
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Return fast from cache
        }

        // Not in cache? Fetch and Cache
        return fetch(request).then((networkResponse) => {
          // Don't cache bad responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "error"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  // C. API / OTHER
  // Strategy: Network Only (Don't cache dynamic API calls unless specific requirement)
  // We leave this to default browser behavior or specific fetch handlers in app code
});
