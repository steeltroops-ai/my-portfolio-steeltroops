/**
 * Smart Cache Manager with Multi-Tab Sync
 * Features:
 * - Cross-tab cache synchronization using BroadcastChannel
 * - Version-based invalidation
 * - TTL-based expiration
 * - Stale-while-revalidate pattern
 */

const CACHE_VERSION = "1.0.0";
const CACHE_PREFIX = "portfolio_cache_";

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  blogList: 5 * 60 * 1000, // 5 minutes - lists change more often
  blogPost: 10 * 60 * 1000, // 10 minutes - individual posts rarely change
  tags: 30 * 60 * 1000, // 30 minutes - tags rarely change
  default: 5 * 60 * 1000, // 5 minutes - default fallback
};

// BroadcastChannel for cross-tab communication
let broadcastChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  broadcastChannel = new BroadcastChannel("cache_sync");
}

// Cache event listeners for cross-tab sync
const cacheListeners = new Set();

class SmartCacheManager {
  constructor() {
    // Listen for cache updates from other tabs
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const { type, key, data } = event.data;

        if (type === "CACHE_UPDATE") {
          // Notify all listeners about the update
          cacheListeners.forEach((listener) => listener(key, data));
        } else if (type === "CACHE_INVALIDATE") {
          this._removeFromStorage(key);
          cacheListeners.forEach((listener) => listener(key, null));
        }
      };
    }
  }

  /**
   * Generate cache key with prefix
   */
  _getCacheKey(key) {
    return `${CACHE_PREFIX}${key}`;
  }

  /**
   * Get data from localStorage
   */
  _getFromStorage(key) {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(this._getCacheKey(key));
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn("Cache read error:", error);
      return null;
    }
  }

  /**
   * Save data to localStorage
   */
  _saveToStorage(key, data) {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this._getCacheKey(key), JSON.stringify(data));
    } catch (error) {
      // Handle quota exceeded
      if (error.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, clearing old cache");
        this.clearOldCache();
        // Try again
        try {
          localStorage.setItem(this._getCacheKey(key), JSON.stringify(data));
        } catch (e) {
          console.error("Failed to save cache after clearing:", e);
        }
      }
    }
  }

  /**
   * Remove data from localStorage
   */
  _removeFromStorage(key) {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(this._getCacheKey(key));
    } catch (error) {
      console.warn("Cache delete error:", error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  _isValid(cacheEntry, ttl) {
    if (!cacheEntry) return false;

    const { version, timestamp } = cacheEntry;

    // Check version
    if (version !== CACHE_VERSION) {
      return false;
    }

    // Check TTL
    const age = Date.now() - timestamp;
    return age < ttl;
  }

  /**
   * Validate data structure
   */
  _validateData(data, dataType) {
    if (!data) return false;

    switch (dataType) {
      case "blogList":
        return Array.isArray(data.data) && typeof data.count === "number";
      case "blogPost":
        return data.id && data.slug && data.title;
      case "tags":
        return Array.isArray(data);
      default:
        return true;
    }
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @param {string} dataType - Type of data (blogList, blogPost, tags)
   * @returns {object|null} Cached data or null if invalid/expired
   */
  get(key, dataType = "default") {
    const cacheEntry = this._getFromStorage(key);
    const ttl = CACHE_TTL[dataType] || CACHE_TTL.default;

    if (!this._isValid(cacheEntry, ttl)) {
      return null;
    }

    // Validate data structure
    if (!this._validateData(cacheEntry.data, dataType)) {
      this._removeFromStorage(key);
      return null;
    }

    return cacheEntry.data;
  }

  /**
   * Set cached data and broadcast to other tabs
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} dataType - Type of data
   */
  set(key, data, dataType = "default") {
    // Validate before caching
    if (!this._validateData(data, dataType)) {
      console.warn("Invalid data structure, not caching:", dataType);
      return;
    }

    const cacheEntry = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      dataType,
      data,
    };

    this._saveToStorage(key, cacheEntry);

    // Broadcast to other tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: "CACHE_UPDATE",
          key,
          data,
        });
      } catch (error) {
        console.warn("Broadcast error:", error);
      }
    }
  }

  /**
   * Invalidate specific cache entry and broadcast to other tabs
   */
  invalidate(key) {
    this._removeFromStorage(key);

    // Broadcast to other tabs
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          type: "CACHE_INVALIDATE",
          key,
        });
      } catch (error) {
        console.warn("Broadcast error:", error);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll() {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Cache clear error:", error);
    }
  }

  /**
   * Clear old/expired cache entries
   */
  clearOldCache() {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach((key) => {
        if (!key.startsWith(CACHE_PREFIX)) return;

        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (!cached || !cached.timestamp) {
            localStorage.removeItem(key);
            return;
          }

          const ttl = CACHE_TTL[cached.dataType] || CACHE_TTL.default;
          const age = now - cached.timestamp;

          if (age > ttl * 2) {
            // Remove if 2x expired
            localStorage.removeItem(key);
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Old cache clear error:", error);
    }
  }

  /**
   * Subscribe to cache updates from other tabs
   */
  subscribe(callback) {
    cacheListeners.add(callback);

    return () => {
      cacheListeners.delete(callback);
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    if (typeof window === "undefined") return null;

    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      let totalSize = 0;
      const entries = {};

      cacheKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;

        try {
          const cached = JSON.parse(value);
          entries[key] = {
            dataType: cached.dataType,
            size,
            age: Date.now() - cached.timestamp,
            valid: this._isValid(
              cached,
              CACHE_TTL[cached.dataType] || CACHE_TTL.default
            ),
          };
        } catch (e) {
          // Ignore
        }
      });

      return {
        totalEntries: cacheKeys.length,
        totalSize,
        entries,
      };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const cacheManager = new SmartCacheManager();
