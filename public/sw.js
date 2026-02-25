/**
 * Self-Destructing Service Worker v3
 * =================================
 * This worker solves the "Stale Cache" problem by completely eliminating
 * itself and clearing all browser-level caches on activation.
 *
 * It follows the strategy documented in CACHING.md: "Deploy = Instant Update".
 */

self.addEventListener("install", (event) => {
  // Skip the 'waiting' phase and activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Clear all CacheStorage buckets
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log(`[SW-Cleanup] Cleared ${cacheNames.length} cache buckets.`);

      // 2. Unregister itself
      await self.registration.unregister();
      console.log("[SW-Cleanup] Service Worker unregistered.");

      // 3. Force all open tabs to reload to pickup new build
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        client.postMessage({ type: "SW_PURGE_COMPLETE" });
        // Optional: client.navigate(client.url);
      });
    })()
  );
});

// No fetch listener = No interception = Browser handles cache headers correctly (Vercel)
