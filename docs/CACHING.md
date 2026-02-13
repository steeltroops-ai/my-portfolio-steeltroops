# Caching Strategy Documentation

## Architecture Overview

The caching system is designed around one core principle:
**Deploy = Instant Update.** When a new version is deployed, every user's
browser detects it and purges all stale caches automatically.

```
+-------------------+     +------------------+     +-------------------+
|   Build System    | --> |  Vercel CDN      | --> |  User's Browser   |
|                   |     |                  |     |                   |
|  version-bump.js  |     |  Cache Headers   |     |  cacheManager.js  |
|  build-meta.json  |     |  vercel.json     |     |  React Query      |
|  Vite hashing     |     |                  |     |  SW cleanup       |
+-------------------+     +------------------+     +-------------------+
```

---

## Cache Layers (from CDN edge to browser)

### Layer 1: Vercel CDN (HTTP Cache-Control Headers)

Configured in `vercel.json`:

| Content Type               | Cache Rule           | Rationale                                          |
| -------------------------- | -------------------- | -------------------------------------------------- |
| `/assets/*` (Vite bundles) | `immutable, 1 year`  | Content-hashed filenames -- safe to cache forever  |
| Images, fonts              | `immutable, 1 year`  | Static assets that rarely change                   |
| `/sw.js`                   | `no-cache, no-store` | Must NEVER be cached -- it's the cleanup mechanism |
| `/build-meta.json`         | `no-cache, no-store` | Must always return fresh version info              |
| `/api/*`                   | `no-store`           | API responses should never be CDN-cached           |
| Everything else            | (Vercel defaults)    | HTML pages get sensible defaults                   |

### Layer 2: Service Worker (Self-Destructing)

The old `sw.js` was a full caching SW that intercepted all fetch requests
and served cached content. This caused the "phone never updates" bug.

**The new `sw.js` is a self-destructing SW** that:

1. Clears all CacheStorage buckets
2. Unregisters itself
3. Tells all open tabs to reload

This ensures any device that had the old SW will clean up and never
interfere again.

### Layer 3: localStorage (cacheManager.js)

Used for **cold-start hydration only** -- when a user returns to the site,
cached data is shown immediately while fresh data loads in the background.

**Build-aware invalidation:**

- On first paint, fetches `/build-meta.json` (never cached)
- Compares `buildId` with locally stored one
- If different: purges ALL localStorage caches + unregisters any SWs
- Also checks on every `visibilitychange` (tab focus)

**TTLs by content type:**

| Type        | TTL    | Used For              |
| ----------- | ------ | --------------------- |
| `blogList`  | 3 min  | Blog listing pages    |
| `blogPost`  | 10 min | Individual blog posts |
| `tags`      | 15 min | Blog tags/categories  |
| `adminData` | 1 min  | Admin panel data      |
| `analytics` | 30 sec | Analytics dashboard   |
| `default`   | 5 min  | Everything else       |

**Key format:** `mps_cache_{key}`

### Layer 4: React Query (In-Memory)

React Query manages in-memory caching with these defaults:

- `staleTime: 3 min` -- data is "fresh" for 3 minutes
- `gcTime: 10 min` -- unused data is garbage collected after 10 min
- `refetchOnWindowFocus: false` -- handled by useSmartSync instead

### Layer 5: Smart Sync (useSmartSync.js)

Polls lightweight version-check endpoints every 30 seconds to detect
content changes (new blog posts, new messages, analytics updates).

When changes are detected:

1. React Query caches are invalidated (triggers refetch)
2. localStorage caches are invalidated (prevents stale initialData)

**Battery-friendly:** Pauses when tab is hidden, resumes on focus.

---

## How "Deploy = Instant Update" Works

1. **Build time:** `version-bump.js` generates a unique `buildId` in
   `public/build-meta.json`
2. **CDN:** `build-meta.json` is served with `no-cache` headers
3. **User visits:** `cacheManager.js` fetches `build-meta.json` on load
   and on every tab-focus
4. **New build detected:** All localStorage caches purged, CacheStorage
   cleared, service workers unregistered
5. **Fresh data:** React Query sees empty caches and fetches everything
   from the network

---

## Versioning Script

`scripts/version-bump.js` runs automatically before every build.

**Rules:**

- < 7 days since last deploy: **patch bump** (1.2.3 -> 1.2.4)
- > = 7 days since last deploy: **minor bump** (1.2.3 -> 1.3.0)
- `--major`, `--minor`, `--patch` flags for manual control

**Output:**

- Updates `version` in `package.json`
- Generates `public/build-meta.json` with `buildId`, `deployedAt`, etc.

---

## Common Scenarios

### User opens site after a new deployment

1. Page loads with Vite's new hashed JS/CSS bundles
2. cacheManager fetches build-meta.json, sees new buildId
3. Purges all localStorage caches
4. React Query has no initialData, fetches fresh from API
5. User sees latest content immediately

### User returns to tab after editing blog post in another tab

1. `visibilitychange` fires
2. useSmartSync runs a version check
3. Detects new post content hash
4. Invalidates blog query keys in React Query
5. React Query refetches blog data
6. UI updates without manual refresh

### User has old service worker cached on their phone

1. Browser downloads new sw.js (served with no-cache)
2. New SW activates, clears all CacheStorage
3. New SW sends SW_CACHE_CLEARED message to page
4. Page reloads automatically
5. New SW unregisters itself -- never runs again

---

## Files Modified

| File                                        | Change                                            |
| ------------------------------------------- | ------------------------------------------------- |
| `src/lib/cacheManager.js`                   | Complete rewrite with build-aware invalidation    |
| `public/sw.js`                              | Replaced with self-destructing cleanup SW         |
| `src/hooks/useSmartSync.js`                 | Reduced from 2s to 30s polling, added debounce    |
| `src/hooks/useNetworkStatus.js`             | Fixed duplicate invalidation bug                  |
| `src/features/blog/hooks/useBlogQueries.js` | Aligned TTLs, removed refetchInterval             |
| `vercel.json`                               | Fixed immutable headers, added no-cache for sw.js |
| `package.json`                              | Added version-bump script to build chain          |
| `scripts/version-bump.js`                   | New versioning automation                         |
| `public/build-meta.json`                    | New deployment metadata                           |
