// Service Worker for Portfolio Caching - Optimized for Bun + Vite
const CACHE_VERSION = "1.1.0";
const STATIC_CACHE_NAME = `portfolio-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `portfolio-dynamic-v${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/profiletop.png",
  // Add other static assets as needed
];

// Dynamic assets patterns to cache
const DYNAMIC_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:js|css)$/,
];

// Assets to never cache
const NEVER_CACHE_PATTERNS = [/\/api\//, /\/admin\//, /chrome-extension:/];

// Maximum cache size (in items)
const MAX_CACHE_SIZE = 100;

// Cache duration (in milliseconds)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then(async (cache) => {
        console.log("Service Worker: Caching static assets");

        // Cache assets individually to handle missing files gracefully
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
            console.log(`Service Worker: Cached ${asset}`);
          } catch (error) {
            console.warn(
              `Service Worker: Failed to cache ${asset}:`,
              error.message
            );
          }
        });

        await Promise.allSettled(cachePromises);
        console.log("Service Worker: Static assets caching completed");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Failed to cache static assets", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith("portfolio-")
            ) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip requests that should never be cached
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))) {
    return;
  }

  // Handle different types of requests
  if (
    requestUrl.pathname.includes("/api/") ||
    requestUrl.hostname.includes("supabase.co")
  ) {
    // API requests - network first, cache as fallback
    event.respondWith(networkFirstStrategy(request));
  } else if (
    STATIC_ASSETS.some((asset) => requestUrl.pathname.endsWith(asset))
  ) {
    // Static assets - cache first
    event.respondWith(cacheFirstStrategy(request));
  } else if (
    DYNAMIC_CACHE_PATTERNS.some((pattern) => pattern.test(request.url))
  ) {
    // Dynamic assets - stale while revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // Default - network first for HTML pages
    event.respondWith(networkFirstStrategy(request));
  }
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error("Cache-first strategy failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

// Network-first strategy (for API calls and HTML pages)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());

      // Clean up cache if it gets too large
      cleanupCache(DYNAMIC_CACHE_NAME);
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/") || new Response("Offline", { status: 503 });
    }

    return new Response("Offline", { status: 503 });
  }
}

// Stale-while-revalidate strategy (for images and other assets)
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        cleanupCache(DYNAMIC_CACHE_NAME);
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, but we might have cached version
      return cachedResponse;
    });

  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise;
}

// Clean up cache to prevent unlimited growth
async function cleanupCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    console.log(
      `Service Worker: Cleaned up ${keysToDelete.length} cache entries`
    );
  }
}

// Handle cache expiration
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  const now = Date.now();

  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith("portfolio-")) continue;

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get("date");
        if (dateHeader) {
          const responseDate = new Date(dateHeader).getTime();
          if (now - responseDate > CACHE_DURATION) {
            await cache.delete(request);
            console.log(
              "Service Worker: Removed expired cache entry",
              request.url
            );
          }
        }
      }
    }
  }
}

// Run cache cleanup periodically
setInterval(cleanupExpiredCache, 60 * 60 * 1000); // Every hour

// Handle messages from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    const urls = event.data.urls;
    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
      cache.addAll(urls);
    });
  }
});

// Background sync for offline actions (if supported)
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "background-sync") {
      event.waitUntil(handleBackgroundSync());
    }
  });
}

async function handleBackgroundSync() {
  // Handle any offline actions that need to be synced
  console.log("Service Worker: Background sync triggered");
}
