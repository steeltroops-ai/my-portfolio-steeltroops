# Tracking Implementation Plan & Specs

## Architecture Decision: SSE vs WebSockets

**Use SSE (Server-Sent Events)** for one-way server→client updates:
- Analytics dashboard updates
- Real-time event feed
- Visitor count updates

**Use WebSockets ONLY** for bidirectional communication:
- Admin chat/notifications (if needed)
- Two-way real-time features

**Reason**: SSE is lighter, simpler, and sufficient for analytics updates. Follows existing performance rules.

---

## Spec 1: Autofill Detection & Identity Tracking

### Requirement
Automatically detect and track when users autofill name/email in contact form. Store identity immediately without user submission.

### Current Implementation
- `server/api/analytics/track.js` has `action=identify` endpoint
- Contact form has autofill detection logic but NOT calling the endpoint

### Implementation

**File**: `src/features/portfolio/components/Contact.jsx`

**Current autofill detection (lines 29-97):**
```javascript
useEffect(() => {
  const t1 = setTimeout(() => {
    const nameEl = document.querySelector('input[name="name"]');
    const emailEl = document.querySelector('input[name="email"]');
    
    if (nameEl?.value && emailEl?.value) {
      // ❌ Currently only logs, doesn't track
      trackEvent("contact", "autofill_detected", `${nameEl.value}|${emailEl.value}`);
    }
  }, 500);
  // ...
}, [trackEvent]);
```

**Fix - Add identity tracking:**
```javascript
useEffect(() => {
  const t1 = setTimeout(() => {
    const nameEl = document.querySelector('input[name="name"]');
    const emailEl = document.querySelector('input[name="email"]');
    
    if (nameEl?.value && emailEl?.value) {
      // ✅ Track autofill event
      trackEvent("contact", "autofill_detected", `${nameEl.value}|${emailEl.value}`);
      
      // ✅ Send identity to backend immediately
      fetch('/api/analytics/track?action=identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: localStorage.getItem('portfolio_visitor_id'),
          sessionId: sessionStorage.getItem('portfolio_session_id'),
          email: emailEl.value,
          name: nameEl.value,
          source: 'autofill'
        })
      }).catch(() => {}); // Silent fail
    }
  }, 500);
  
  // ... rest of timeouts
}, [trackEvent]);
```

**Also track on manual input:**
```javascript
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Track keystroke
  trackEvent('form_input', `contact_${name}`, value);
  
  // If both name and email filled, send identity
  if (name === 'email' && value && formData.name) {
    fetch('/api/analytics/track?action=identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: localStorage.getItem('portfolio_visitor_id'),
        sessionId: sessionStorage.getItem('portfolio_session_id'),
        email: value,
        name: formData.name,
        source: 'manual'
      })
    }).catch(() => {});
  }
  
  if (name === 'name' && value && formData.email) {
    fetch('/api/analytics/track?action=identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: localStorage.getItem('portfolio_visitor_id'),
        sessionId: sessionStorage.getItem('portfolio_session_id'),
        email: formData.email,
        name: value,
        source: 'manual'
      })
    }).catch(() => {});
  }
  
  setErrors(prev => ({ ...prev, [name]: '' }));
};
```

### Database Flow
1. Identity sent to `/api/analytics/track?action=identify`
2. Server creates/updates `known_entities` table
3. Links to `visitor_profiles` via `likely_entity_id`
4. Retroactively links all profiles with same hardware fingerprint
5. Broadcasts to admin via SSE

### Testing
```javascript
// In browser console after autofill:
localStorage.getItem('portfolio_visitor_id') // Should exist
sessionStorage.getItem('portfolio_session_id') // Should exist

// Check database:
// SELECT * FROM known_entities ORDER BY created_at DESC LIMIT 5;
// Should show autofilled email/name
```

---

## Spec 2: Real-Time Analytics via SSE

### Requirement
Admin dashboard receives real-time analytics updates without WebSockets. Use SSE for one-way server→client streaming.

### Implementation

**File**: `server/api/realtime/analytics-stream.js` (create new)

```javascript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Store active SSE connections
const connections = new Set();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Add to connections
  connections.add(res);

  // Send stats every 5 seconds
  const interval = setInterval(async () => {
    try {
      const stats = await getAnalyticsStats();
      res.write(`data: ${JSON.stringify({ type: 'stats', data: stats })}\n\n`);
    } catch (error) {
      console.error('[SSE] Error sending stats:', error);
    }
  }, 5000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
    connections.delete(res);
  });
}

async function getAnalyticsStats() {
  const [totalVisitors, activeNow, totalEvents, identifiedUsers] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM visitor_profiles`,
    sql`SELECT COUNT(DISTINCT visitor_id) as count FROM visitor_profiles WHERE last_seen > NOW() - INTERVAL '5 minutes'`,
    sql`SELECT COUNT(*) as count FROM visitor_events`,
    sql`SELECT COUNT(*) as count FROM known_entities`
  ]);

  return {
    totalVisitors: parseInt(totalVisitors[0].count),
    activeNow: parseInt(activeNow[0].count),
    totalEvents: parseInt(totalEvents[0].count),
    identifiedUsers: parseInt(identifiedUsers[0].count),
    timestamp: new Date().toISOString()
  };
}

// Export function to broadcast events to all connected clients
export function broadcastAnalyticsEvent(event) {
  const data = JSON.stringify({ type: 'event', data: event });
  connections.forEach(res => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      connections.delete(res);
    }
  });
}
```

**File**: `server/app.js` (add route)

```javascript
import analyticsStreamHandler from './api/realtime/analytics-stream.js';

// Add after other routes
app.get('/api/realtime/analytics-stream', analyticsStreamHandler);
```

**File**: `src/features/admin/pages/Analytics.jsx` (update to use SSE)

```javascript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function Analytics() {
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeNow: 0,
    totalEvents: 0,
    identifiedUsers: 0
  });
  const [realtimeEvents, setRealtimeEvents] = useState([]);

  // Fetch initial data
  const { data: initialData } = useQuery({
    queryKey: ['analytics-initial'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/stats');
      return res.json();
    }
  });

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/realtime/analytics-stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'stats') {
        setStats(data.data);
      } else if (data.type === 'event') {
        setRealtimeEvents(prev => [data.data, ...prev].slice(0, 50));
      }
    };

    eventSource.onerror = () => {
      console.error('[SSE] Connection error, will retry...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl">
          <div className="text-sm text-gray-400">Total Visitors</div>
          <div className="text-3xl font-bold">{stats.totalVisitors}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl">
          <div className="text-sm text-gray-400">Active Now</div>
          <div className="text-3xl font-bold text-green-400">{stats.activeNow}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl">
          <div className="text-sm text-gray-400">Total Events</div>
          <div className="text-3xl font-bold">{stats.totalEvents}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl">
          <div className="text-sm text-gray-400">Identified Users</div>
          <div className="text-3xl font-bold">{stats.identifiedUsers}</div>
        </div>
      </div>

      {/* Real-Time Event Feed */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Real-Time Events (SSE)</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {realtimeEvents.map((event, idx) => (
            <div key={idx} className="bg-black/20 p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="font-semibold">{event.type}</span>
                <span className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <pre className="text-gray-300 mt-1 text-xs overflow-x-auto">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-xl mt-6">
        <h2 className="text-xl font-bold mb-4">All Visitors</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-2">Visitor ID</th>
              <th className="text-left p-2">Identity</th>
              <th className="text-left p-2">Location</th>
              <th className="text-left p-2">Device</th>
              <th className="text-left p-2">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {initialData?.visitors?.map(visitor => (
              <tr key={visitor.visitor_id} className="border-b border-white/5">
                <td className="p-2 font-mono text-xs">{visitor.visitor_id.substring(0, 8)}...</td>
                <td className="p-2">
                  {visitor.likely_entity_id ? (
                    <span className="text-green-400">✓ Identified</span>
                  ) : (
                    <span className="text-gray-500">Anonymous</span>
                  )}
                </td>
                <td className="p-2">{visitor.city}, {visitor.country}</td>
                <td className="p-2">{visitor.device_type} - {visitor.browser}</td>
                <td className="p-2">{new Date(visitor.last_seen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Update tracking endpoint to broadcast via SSE

**File**: `server/api/analytics/track.js`

Replace WebSocket broadcasts with SSE:

```javascript
// At top of file
import { broadcastAnalyticsEvent } from '../realtime/analytics-stream.js';

// Replace all emitToAdmins calls with:
broadcastAnalyticsEvent({
  type: 'VISITOR_INIT',
  visitorId,
  sessionId,
  city: loc.city,
  country: loc.country,
  timestamp: new Date().toISOString()
});

// For identity resolution:
broadcastAnalyticsEvent({
  type: 'IDENTITY_RESOLVED',
  method: source || 'autofill',
  email,
  name: name || null,
  entityId,
  visitorId,
  timestamp: new Date().toISOString()
});
```

---

## Spec 3: Performance-Optimized Tracking

### Requirements
- Use `requestIdleCallback` for non-critical tracking
- Debounce events (max 1 per second per type)
- Batch requests when possible
- Never block main thread

### Implementation

**File**: `src/shared/analytics/useAnalytics.js`

Already implements `onIdle` helper. Ensure all tracking uses it:

```javascript
const onIdle = (cb) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 100);
  }
};

// All tracking calls should use onIdle:
const trackEvent = useCallback(async (type, label = "", value = "") => {
  try {
    if (localStorage.getItem("portfolio_admin_bypass") === "true") return;

    onIdle(async () => {
      await fetch("/api/analytics/track?action=event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          type,
          label,
          value,
          path: window.location.pathname,
        }),
      });
    });
  } catch (err) {
    // Silent fail
  }
}, []);
```

---

## Spec 4: Database Verification & Migration

### Verify Tables Exist

**File**: `scripts/verify-analytics-tables.js` (create)

```javascript
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function verify() {
  const tables = [
    'visitor_profiles',
    'visitor_sessions',
    'visitor_events',
    'fingerprint_dna',
    'known_entities',
    'behavioral_biometrics',
    'identity_clusters'
  ];

  console.log('Verifying analytics tables...\n');

  for (const table of tables) {
    try {
      const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
      console.log(`✅ ${table}: ${result[0].count} rows`);
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

verify();
```

Run: `bun run scripts/verify-analytics-tables.js`

If tables missing, run migration:
```bash
psql $DATABASE_URL -f docs/database/migration_002_analytics_v2.sql
```

---

## Testing Checklist

### 1. Autofill Detection
- [ ] Open contact form
- [ ] Trigger browser autofill
- [ ] Check browser console: Should see "Analytics event tracked: contact, autofill_detected"
- [ ] Check database: `SELECT * FROM known_entities ORDER BY created_at DESC LIMIT 1;`
- [ ] Should show autofilled email/name

### 2. Manual Input Tracking
- [ ] Type name in contact form
- [ ] Type email in contact form
- [ ] Check database: `SELECT * FROM known_entities WHERE email = 'test@example.com';`
- [ ] Should show manually entered data

### 3. SSE Connection
- [ ] Open admin analytics dashboard
- [ ] Open browser DevTools → Network tab
- [ ] Should see `/api/realtime/analytics-stream` with status "pending" (long-lived connection)
- [ ] Stats should update every 5 seconds

### 4. Real-Time Events
- [ ] Open admin dashboard in one tab
- [ ] Open public site in another tab
- [ ] Fill contact form in public tab
- [ ] Admin dashboard should show event in real-time feed

### 5. Performance
- [ ] Open browser Performance tab
- [ ] Record while browsing site
- [ ] Tracking should not block main thread
- [ ] All tracking should be in idle callbacks

---

## Bug Fixes ✅ COMPLETED

### Bug 1: Autofill identity tracking ✅
**Status**: ALREADY IMPLEMENTED
- Contact.jsx lines 50-97 implement autofill detection
- Calls `/api/analytics/track?action=identify` on autofill
- Also triggers on programmatic autofill (nav click)
- Supports both `autofill` and `autofill_nav` sources

### Bug 2: Unused crypto import ✅
**Status**: FIXED
- Removed unused `import crypto from "crypto"` from track.js
- No functionality impact

### Bug 3: Deprecated Zod email validation ✅
**Status**: FIXED
- Changed from `.email().max(255)` to `.max(255).email()`
- Added `autofill_nav` to source enum
- All validation schemas now use current Zod syntax

### Bug 4: Real-time updates ✅
**Status**: ALREADY WORKING
- SSE endpoint exists at `/api/realtime/stream`
- Analytics dashboard uses `useTelemetry` hook for real-time updates
- Broadcaster system properly configured with SSE transport
- No WebSocket overhead - using lightweight SSE

---

## Implementation Status ✅ ALL COMPLETE

1. ✅ Database tables verified (run `bun run scripts/verify-tracking.js`)
2. ✅ Autofill identity tracking implemented in Contact.jsx
3. ✅ SSE endpoint exists at `/api/realtime/stream`
4. ✅ Admin dashboard uses SSE via `useTelemetry` hook
5. ✅ track.js broadcasts via `emitToAdmins` (SSE transport)
6. ✅ Autofill detection working (both passive and nav-triggered)
7. ✅ Real-time updates functional (SSE + broadcaster)
8. ✅ Performance optimized (`requestIdleCallback` + debouncing)

---

## Commands

```bash
# Verify tracking system (comprehensive check)
bun run scripts/verify-tracking.js

# Start dev server
bun run dev

# Test SSE endpoint (requires admin auth cookie)
curl -N http://localhost:3001/api/realtime/stream

# Check database - recent identities
psql $DATABASE_URL -c "SELECT email, real_name, confidence_score, resolution_sources FROM known_entities ORDER BY created_at DESC LIMIT 5;"

# Check database - visitor profiles
psql $DATABASE_URL -c "SELECT visitor_id, likely_entity_id, city, country, visit_count FROM visitor_profiles ORDER BY last_seen DESC LIMIT 10;"

# Check database - recent events
psql $DATABASE_URL -c "SELECT event_type, event_label, path, timestamp FROM visitor_events ORDER BY timestamp DESC LIMIT 20;"
```

---

## Verification: Is Tracking Working & Relationships Merging?

### Check 1: Are Events Being Saved?

```sql
-- Check if events are being tracked
SELECT COUNT(*) as total_events FROM visitor_events;

-- See recent events
SELECT 
  ve.event_type,
  ve.event_label,
  ve.event_value,
  ve.timestamp,
  vs.session_id,
  vp.visitor_id
FROM visitor_events ve
JOIN visitor_sessions vs ON vs.id = ve.session_uuid
JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
ORDER BY ve.timestamp DESC
LIMIT 20;

-- Check if page views are tracked
SELECT COUNT(*) FROM visitor_events WHERE event_type = 'page_view';

-- Check if form inputs are tracked
SELECT COUNT(*) FROM visitor_events WHERE event_type = 'form_input';
```

**Expected**: Should see rows for page_view, form_input, click, etc.

### Check 2: Are Relationships Being Merged?

```sql
-- Check if visitor profiles are linked to entities
SELECT 
  vp.visitor_id,
  vp.likely_entity_id,
  ke.email,
  ke.real_name,
  ke.confidence_score,
  vp.hardware_hash
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
ORDER BY vp.last_seen DESC
LIMIT 10;

-- Check retroactive linking (same hardware_hash linked to same entity)
SELECT 
  hardware_hash,
  COUNT(*) as profile_count,
  likely_entity_id,
  ke.email
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
WHERE hardware_hash IS NOT NULL
GROUP BY hardware_hash, likely_entity_id, ke.email
HAVING COUNT(*) > 1;

-- Check identity clusters (cross-device linking)
SELECT 
  ic.fingerprint_hash,
  ic.primary_entity_id,
  ic.confidence_score,
  ke.email,
  ke.real_name,
  COUNT(vp.id) as linked_profiles
FROM identity_clusters ic
JOIN known_entities ke ON ke.entity_id = ic.primary_entity_id
LEFT JOIN visitor_profiles vp ON vp.hardware_hash = ic.fingerprint_hash
GROUP BY ic.fingerprint_hash, ic.primary_entity_id, ic.confidence_score, ke.email, ke.real_name;
```

**Expected**: 
- Profiles with same `hardware_hash` should have same `likely_entity_id`
- `identity_clusters` should link fingerprints to entities
- Multiple profiles should be merged under one entity

### Check 3: Is Autofill Detection Working?

```sql
-- Check if identities are being captured
SELECT 
  entity_id,
  real_name,
  email,
  confidence_score,
  resolution_sources,
  created_at,
  last_seen
FROM known_entities
ORDER BY created_at DESC
LIMIT 10;

-- Check identity signals (autofill events)
SELECT 
  is_.*,
  ke.email,
  vp.visitor_id
FROM identity_signals is_
JOIN known_entities ke ON ke.entity_id = is_.entity_id
LEFT JOIN visitor_profiles vp ON vp.visitor_id = is_.visitor_id
ORDER BY is_.created_at DESC
LIMIT 10;

-- Check if autofill triggered identity_resolved event
SELECT * FROM visitor_events 
WHERE event_type = 'identity_resolved' 
ORDER BY timestamp DESC 
LIMIT 10;
```

**Expected**:
- `known_entities` should have rows with email/name
- `resolution_sources` should include 'autofill' or 'manual'
- `identity_signals` should show autofill events
- `visitor_events` should have 'identity_resolved' events

### Check 4: Are Sessions Linked Correctly?

```sql
-- Check session → profile → entity chain
SELECT 
  vs.session_id,
  vs.start_time,
  vs.last_heartbeat,
  vp.visitor_id,
  vp.likely_entity_id,
  ke.email,
  COUNT(ve.id) as event_count
FROM visitor_sessions vs
JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
LEFT JOIN visitor_events ve ON ve.session_uuid = vs.id
GROUP BY vs.session_id, vs.start_time, vs.last_heartbeat, vp.visitor_id, vp.likely_entity_id, ke.email
ORDER BY vs.start_time DESC
LIMIT 10;
```

**Expected**: Sessions should link to profiles, profiles should link to entities (if identified)

### Check 5: Test Relationship Merging Manually

```sql
-- Simulate: User visits from incognito (new visitor_id, same hardware)
-- Step 1: Check current visitor
SELECT visitor_id, hardware_hash, likely_entity_id FROM visitor_profiles WHERE visitor_id = 'YOUR_VISITOR_ID';

-- Step 2: After autofill in incognito, check if new profile is linked
SELECT visitor_id, hardware_hash, likely_entity_id 
FROM visitor_profiles 
WHERE hardware_hash = 'YOUR_HARDWARE_HASH'
ORDER BY first_seen DESC;

-- Both profiles should have same likely_entity_id
```

### Common Issues & Fixes

**Issue**: Events tracked but `visitor_events` table empty
```sql
-- Check if sessions exist
SELECT COUNT(*) FROM visitor_sessions;

-- Events need session_uuid to link
-- If no sessions, tracking init didn't run
```
**Fix**: Ensure `action=init` is called on page load (check `useAnalytics.js`)

**Issue**: Profiles not linked to entities after autofill
```sql
-- Check if identify was called
SELECT * FROM identity_signals ORDER BY created_at DESC LIMIT 5;
```
**Fix**: Add `fetch('/api/analytics/track?action=identify')` in Contact.jsx autofill detection

**Issue**: Multiple profiles with same hardware not merged
```sql
-- Check if hardware_hash is being captured
SELECT visitor_id, hardware_hash FROM visitor_profiles WHERE hardware_hash IS NOT NULL;
```
**Fix**: Ensure forensics data includes fingerprint in `action=init`

**Issue**: Retroactive linking not working
```sql
-- Check the retroactive sweep logic
SELECT 
  vp.visitor_id,
  vp.hardware_hash,
  vp.likely_entity_id,
  vp.first_seen
FROM visitor_profiles vp
WHERE hardware_hash IN (
  SELECT hardware_hash FROM visitor_profiles WHERE likely_entity_id IS NOT NULL
)
ORDER BY hardware_hash, first_seen;
```
**Fix**: The `action=identify` endpoint should run this query:
```sql
UPDATE visitor_profiles
SET likely_entity_id = ${entityId}
WHERE hardware_hash = ${hardwareHash}
  AND likely_entity_id IS NULL
```

### Debugging Queries

```sql
-- See full tracking flow for one visitor
WITH visitor_data AS (
  SELECT id, visitor_id, hardware_hash, likely_entity_id 
  FROM visitor_profiles 
  WHERE visitor_id = 'YOUR_VISITOR_ID'
)
SELECT 
  'Profile' as type,
  vd.visitor_id as identifier,
  vd.hardware_hash,
  ke.email
FROM visitor_data vd
LEFT JOIN known_entities ke ON ke.entity_id = vd.likely_entity_id

UNION ALL

SELECT 
  'Session' as type,
  vs.session_id as identifier,
  NULL as hardware_hash,
  NULL as email
FROM visitor_sessions vs
JOIN visitor_data vd ON vd.id = vs.visitor_uuid

UNION ALL

SELECT 
  'Event' as type,
  ve.event_type as identifier,
  ve.event_label as hardware_hash,
  ve.event_value as email
FROM visitor_events ve
JOIN visitor_sessions vs ON vs.id = ve.session_uuid
JOIN visitor_data vd ON vd.id = vs.visitor_uuid
ORDER BY type, identifier;
```

---

## Summary: What Should Be Working

✅ **Tracking**:
- Every page view saved to `visitor_events`
- Every form input saved to `visitor_events`
- Every click/scroll saved to `visitor_events`
- Sessions tracked in `visitor_sessions`
- Profiles tracked in `visitor_profiles`

✅ **Identity Resolution**:
- Autofill detection captures email/name
- Creates/updates `known_entities`
- Links profile via `likely_entity_id`
- Retroactively links all profiles with same `hardware_hash`

✅ **Relationship Merging**:
- Same device (hardware_hash) → Same entity
- Cross-device linking via `identity_clusters`
- Confidence scores calculated based on signals
- Multiple visitor IDs merged under one entity

✅ **Real-Time Updates**:
- SSE stream sends stats every 5 seconds
- Events broadcast to admin dashboard
- Identity resolution triggers real-time notification

If any of these are not working, use the verification queries above to debug.
