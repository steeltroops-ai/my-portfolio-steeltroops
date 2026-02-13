/**
 * Self-Destructing Service Worker
 * ================================
 * This file replaces the old caching service worker.
 *
 * Purpose: If ANY user's device still has the old sw.js cached and
 * registered, this version will:
 *   1. Clear all CacheStorage buckets
 *   2. Unregister itself
 *   3. Force-reload all client pages so they get fresh content
 *
 * After this runs once, the SW is gone forever and will never
 * interfere with cache headers or deployments again.
 *
 * The app now relies on:
 *   - Vite's content-hashed filenames for immutable asset caching
 *   - Vercel's CDN headers for HTTP caching
 *   - The cacheManager.js for localStorage-based data caching
 *   - React Query for in-memory data caching
 */

// Skip waiting immediately -- take over from any old SW
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Nuke all CacheStorage buckets
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));

      // 2. Take control of all clients
      await self.clients.claim();

      // 3. Tell all open tabs to reload
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        client.postMessage({ type: "SW_CACHE_CLEARED" });
      });

      // 4. Unregister self -- this SW will never run again
      await self.registration.unregister();
    })()
  );
});

// Pass through all fetch requests -- no caching
self.addEventListener("fetch", () => {
  // Do nothing -- let the browser handle it normally
  return;
});
