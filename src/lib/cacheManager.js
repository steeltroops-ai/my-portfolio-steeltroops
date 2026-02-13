/**
 * ==========================================================================
 *  Intelligent Cache Manager v2
 * ==========================================================================
 *
 *  Architecture:
 *  1. Build-aware invalidation -- fetches /build-meta.json on startup to
 *     detect new deployments. If the buildId changes, ALL caches are nuked.
 *  2. Tiered TTLs -- different content types get different lifetimes.
 *  3. Cross-tab sync via BroadcastChannel.
 *  4. localStorage with automatic quota management.
 *  5. Service Worker cleanup on version change.
 *  6. NO duplicate caching -- relies on React Query for in-memory cache,
 *     localStorage only for cold-start hydration.
 *
 *  Cache Key Structure:
 *     mps_cache_v{BUILD_ID}_{key}
 *
 *  When buildId changes, old keys are orphaned and cleaned up.
 */

// ---- Configuration ----

// TTLs in milliseconds, tuned per content type
const CACHE_TTL = {
  blogList: 3 * 60 * 1000, //  3 min -- blog lists change when you publish
  blogPost: 10 * 60 * 1000, // 10 min -- individual posts rarely change mid-session
  tags: 15 * 60 * 1000, // 15 min -- tags almost never change
  adminData: 1 * 60 * 1000, //  1 min -- admin needs fresh data
  analytics: 30 * 1000, // 30 sec -- analytics should be near-realtime
  default: 5 * 60 * 1000, //  5 min -- safe default
};

// Max localStorage entries before eviction
const MAX_ENTRIES = 60;

// Key used to store the known build ID locally
const BUILD_ID_KEY = "mps_known_build_id";
const CACHE_PREFIX = "mps_cache_";

// ---- BroadcastChannel for cross-tab sync ----
let channel = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    channel = new BroadcastChannel("mps_cache_sync");
  }
} catch {
  // BroadcastChannel not available (SSR, old browser)
}

const listeners = new Set();

// ---- Build-Aware Versioning ----

let currentBuildId = null;

/**
 * Fetches /build-meta.json to get the current deployment's buildId.
 * If it differs from the locally stored one, all caches are purged.
 * This is the key mechanism that makes "deploy = instant update".
 */
async function checkForNewBuild() {
  if (typeof window === "undefined") return;

  try {
    // Cache-bust this specific request so CDN never serves a stale version
    const res = await fetch(`/build-meta.json?_=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return;

    const meta = await res.json();
    const remoteBuildId = meta.buildId;

    if (!remoteBuildId) return;

    const localBuildId = localStorage.getItem(BUILD_ID_KEY);
    currentBuildId = remoteBuildId;

    if (localBuildId && localBuildId !== remoteBuildId) {
      console.log(
        `[CacheManager] New build detected: ${localBuildId} -> ${remoteBuildId}. Purging all caches.`
      );

      // 1. Purge all localStorage caches
      purgeAllCacheEntries();

      // 2. Unregister any lingering service workers
      await unregisterServiceWorkers();

      // 3. Clear CacheStorage (browser Cache API)
      await clearCacheStorage();

      // 4. Broadcast to other tabs
      broadcastMessage({ type: "FULL_PURGE", buildId: remoteBuildId });
    }

    // Always update the known build ID
    localStorage.setItem(BUILD_ID_KEY, remoteBuildId);
  } catch (err) {
    // Network error -- fine, we'll try again on next visibility change
    console.warn("[CacheManager] Build check failed:", err.message);
  }
}

/**
 * Unregister all service workers. This is critical because a stale SW
 * will intercept fetch requests and serve old cached content forever.
 */
async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if (registrations.length > 0) {
      console.log(
        `[CacheManager] Unregistered ${registrations.length} service worker(s).`
      );
    }
  } catch (err) {
    console.warn("[CacheManager] SW unregister error:", err);
  }
}

/**
 * Clear the browser's CacheStorage (used by Service Workers).
 */
async function clearCacheStorage() {
  if (typeof caches === "undefined") return;

  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
    if (names.length > 0) {
      console.log(
        `[CacheManager] Cleared ${names.length} CacheStorage bucket(s).`
      );
    }
  } catch (err) {
    console.warn("[CacheManager] CacheStorage clear error:", err);
  }
}

/**
 * Remove all mps_cache_* entries from localStorage.
 */
function purgeAllCacheEntries() {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(localStorage);
    let count = 0;
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX) || key.startsWith("portfolio_cache_")) {
        localStorage.removeItem(key);
        count++;
      }
    });
    if (count > 0) {
      console.log(`[CacheManager] Purged ${count} cache entries.`);
    }
  } catch {
    // localStorage might be unavailable
  }
}

// ---- Broadcast Helpers ----

function broadcastMessage(msg) {
  if (!channel) return;
  try {
    channel.postMessage(msg);
  } catch {
    // Channel closed or message too large
  }
}

// ---- SmartCacheManager Class ----

class SmartCacheManager {
  constructor() {
    // Listen for messages from other tabs
    if (channel) {
      channel.onmessage = (event) => {
        const { type, key, data, buildId } = event.data || {};
        if (type === "FULL_PURGE") {
          purgeAllCacheEntries();
          localStorage.setItem(BUILD_ID_KEY, buildId);
          currentBuildId = buildId;
          listeners.forEach((fn) => fn("__FULL_PURGE__", null));
        } else if (type === "CACHE_INVALIDATE") {
          this._removeFromStorage(key);
          listeners.forEach((fn) => fn(key, null));
        } else if (type === "CACHE_UPDATE") {
          listeners.forEach((fn) => fn(key, data));
        }
      };
    }

    // Check for new build on startup + when tab regains focus
    if (typeof window !== "undefined") {
      // Defer the initial check so it doesn't block first paint
      setTimeout(() => checkForNewBuild(), 1500);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          checkForNewBuild();
        }
      });
    }
  }

  // ---- Key Generation ----

  _fullKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  // ---- Storage Primitives ----

  _getFromStorage(key) {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(this._fullKey(key));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _saveToStorage(key, entry) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this._fullKey(key), JSON.stringify(entry));
    } catch (err) {
      if (err.name === "QuotaExceededError") {
        this.evictOldest();
        try {
          localStorage.setItem(this._fullKey(key), JSON.stringify(entry));
        } catch {
          // Still full -- give up silently
        }
      }
    }
  }

  _removeFromStorage(key) {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this._fullKey(key));
    } catch {
      // ignore
    }
  }

  // ---- Validation ----

  _isValid(entry, ttl) {
    if (!entry || !entry.timestamp) return false;
    // Build-ID check: if the entry was written by a different build, reject it
    if (entry.buildId && currentBuildId && entry.buildId !== currentBuildId) {
      return false;
    }
    return Date.now() - entry.timestamp < ttl;
  }

  // ---- Public API ----

  /**
   * Get cached data. Returns null if expired, wrong build, or missing.
   */
  get(key, dataType = "default") {
    // Never use localStorage cache in development -- always hit network
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      return null;
    }

    const entry = this._getFromStorage(key);
    const ttl = CACHE_TTL[dataType] || CACHE_TTL.default;

    if (!this._isValid(entry, ttl)) {
      // Auto-clean invalid entries
      if (entry) this._removeFromStorage(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in localStorage with buildId stamp.
   */
  set(key, data, dataType = "default") {
    if (data === null || data === undefined) return;

    const entry = {
      buildId:
        currentBuildId || localStorage.getItem(BUILD_ID_KEY) || "unknown",
      timestamp: Date.now(),
      dataType,
      data,
    };

    this._saveToStorage(key, entry);

    // Broadcast to other tabs
    broadcastMessage({ type: "CACHE_UPDATE", key, data });
  }

  /**
   * Invalidate a specific key (local + broadcast).
   */
  invalidate(key) {
    this._removeFromStorage(key);
    broadcastMessage({ type: "CACHE_INVALIDATE", key });
    listeners.forEach((fn) => fn(key, null));
  }

  /**
   * Invalidate all keys that match a prefix.
   * Good for batch invalidation, e.g. invalidatePrefix("blog-") after a post update.
   */
  invalidatePrefix(prefix) {
    if (typeof window === "undefined") return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((fullKey) => {
        if (fullKey.startsWith(this._fullKey(prefix))) {
          localStorage.removeItem(fullKey);
        }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Clear ALL cache entries (e.g. on sign-out).
   */
  clearAll() {
    purgeAllCacheEntries();
    broadcastMessage({
      type: "FULL_PURGE",
      buildId: currentBuildId || "manual-clear",
    });
  }

  /**
   * Clear admin-specific caches (called on sign-out).
   */
  clearAdminCache() {
    if (typeof window === "undefined") return;
    const prefixes = ["admin-", "blog-all-posts-", "visitor-detail-", "ai-"];
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((fullKey) => {
        if (!fullKey.startsWith(CACHE_PREFIX)) return;
        const shortKey = fullKey.slice(CACHE_PREFIX.length);
        if (prefixes.some((p) => shortKey.startsWith(p))) {
          localStorage.removeItem(fullKey);
        }
      });
    } catch {
      // ignore
    }
  }

  /**
   * Evict the oldest cache entries when localStorage is full.
   */
  evictOldest() {
    if (typeof window === "undefined") return;
    try {
      const entries = [];
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          entries.push({ key, timestamp: entry?.timestamp || 0 });
        } catch {
          // Corrupted entry -- remove immediately
          localStorage.removeItem(key);
        }
      });

      // Sort oldest first, remove the oldest half
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const removeCount = Math.max(Math.floor(entries.length / 2), 5);
      entries
        .slice(0, removeCount)
        .forEach((e) => localStorage.removeItem(e.key));
      console.log(`[CacheManager] Evicted ${removeCount} old entries.`);
    } catch {
      // ignore
    }
  }

  /**
   * Periodic cleanup: remove expired entries and enforce max count.
   */
  cleanup() {
    if (typeof window === "undefined") return;
    try {
      const now = Date.now();
      const entries = [];
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (!entry || !entry.timestamp) {
            localStorage.removeItem(key);
            return;
          }
          const ttl = CACHE_TTL[entry.dataType] || CACHE_TTL.default;
          // Remove if expired beyond 2x TTL (grace period for stale-while-revalidate)
          if (now - entry.timestamp > ttl * 2) {
            localStorage.removeItem(key);
            return;
          }
          // Remove if from a different build
          if (
            entry.buildId &&
            currentBuildId &&
            entry.buildId !== currentBuildId
          ) {
            localStorage.removeItem(key);
            return;
          }
          entries.push({ key, timestamp: entry.timestamp });
        } catch {
          localStorage.removeItem(key);
        }
      });

      // Enforce max entries
      if (entries.length > MAX_ENTRIES) {
        entries.sort((a, b) => a.timestamp - b.timestamp);
        const excess = entries.slice(0, entries.length - MAX_ENTRIES);
        excess.forEach((e) => localStorage.removeItem(e.key));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Subscribe to cache change events (for React Query integration).
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  /**
   * Force a build check right now (useful after navigation).
   */
  async forceCheckBuild() {
    await checkForNewBuild();
  }

  /**
   * Get debug stats about current cache state.
   */
  getStats() {
    if (typeof window === "undefined") return null;
    try {
      let totalSize = 0;
      let count = 0;
      const byType = {};
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;
        const value = localStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        totalSize += size;
        count++;

        try {
          const entry = JSON.parse(value);
          const dtype = entry?.dataType || "unknown";
          byType[dtype] = (byType[dtype] || 0) + 1;
        } catch {
          byType.corrupted = (byType.corrupted || 0) + 1;
        }
      });

      return {
        totalEntries: count,
        totalSizeKB: Math.round(totalSize / 1024),
        byType,
        currentBuildId,
        knownBuildId: localStorage.getItem(BUILD_ID_KEY),
      };
    } catch {
      return null;
    }
  }
}

// ---- Singleton + Auto-Cleanup ----

export const cacheManager = new SmartCacheManager();

// Run cleanup every 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => cacheManager.cleanup(), 5 * 60 * 1000);

  // Also migrate/clean on first load after 3 seconds
  setTimeout(() => {
    cacheManager.cleanup();
    // Clean up legacy "portfolio_cache_" entries from old cache manager
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("portfolio_cache_")) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }
  }, 3000);
}
