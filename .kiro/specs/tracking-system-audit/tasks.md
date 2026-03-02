# Tracking System Audit - Tasks

## Overview
Comprehensive tasks for auditing, verifying, and fixing the tracking system pipeline from frontend collection through backend processing to database storage and dashboard visualization.

**Total Tasks**: 45 organized into 9 phases
**Estimated Total Time**: 15-20 hours

---

## PHASE 1: DATABASE SCHEMA VERIFICATION (Requirements 3, 16)

### Task 1.1: Verify All 8 Tables Exist
**Status**: ✅ completed | **Priority**: critical | **Time**: 15 min

**What to do**: Confirm all tracking tables exist in Neon database

**Steps**:
1. Connect: `psql $DATABASE_URL`
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('visitor_profiles', 'visitor_sessions', 'visitor_events', 'fingerprint_dna', 'known_entities', 'behavioral_biometrics', 'identity_clusters', 'identity_signals') ORDER BY table_name;`

**Expected**: 8 rows returned

**Verify**: All table names present

---

### Task 1.2: Verify visitor_profiles Schema
**Status**: pending | **Priority**: critical | **Time**: 20 min

**What to do**: Check visitor_profiles columns match requirements

**Steps**:
1. Run: `\d visitor_profiles` in psql
2. Verify columns: id (UUID PK), visitor_id (unique), ip_address, browser, os, device_type, screen_size, country, city, region, isp, org, latitude, longitude, first_seen, last_seen, visit_count, is_owner, is_bot, fingerprint, gpu_vendor, gpu_renderer, cpu_cores, memory_estimate, max_touch_points, timezone_offset, device_model, timezone_name, languages, platform, network_downlink, hardware_hash, likely_entity_id (FK)
3. Check data types match schema
4. Verify constraints (PK, unique, FK)

**Expected**: All 33 columns present with correct types

**Verify**: `SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'visitor_profiles';` returns 33

---

### Task 1.3: Verify Foreign Key Relationships
**Status**: pending | **Priority**: critical | **Time**: 25 min

**What to do**: Test all foreign key constraints work correctly

**Steps**:
1. Check FK definitions:
```sql
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'visitor%';
```
2. Test joins:
```sql
SELECT vp.visitor_id, vs.session_id, ve.event_type, ke.email
FROM visitor_profiles vp
LEFT JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
LEFT JOIN visitor_events ve ON ve.session_uuid = vs.id
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
LIMIT 5;
```

**Expected**: FKs on visitor_sessions.visitor_uuid, visitor_events.session_uuid, visitor_profiles.likely_entity_id, behavioral_biometrics.session_uuid, identity_clusters.primary_entity_id, identity_signals.entity_id

**Verify**: Joins return data without errors

---

### Task 1.4: Verify Database Indexes
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Confirm indexes exist on all foreign keys and frequently queried columns

**Steps**:
1. Check indexes:
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'visitor%' OR tablename LIKE 'known%' OR tablename LIKE 'identity%' OR tablename = 'fingerprint_dna')
ORDER BY tablename, indexname;
```
2. Verify indexes on: visitor_profiles.visitor_id, visitor_profiles.hardware_hash, visitor_profiles.likely_entity_id, visitor_sessions.session_id, visitor_sessions.visitor_uuid, visitor_events.session_uuid, visitor_events.event_type, known_entities.email, identity_clusters.fingerprint_hash, behavioral_biometrics.session_uuid

**Expected**: At least 10 indexes covering all foreign keys and unique constraints

**Verify**: All critical columns have indexes

---

### Task 1.5: Check Data Integrity (No Orphans)
**Status**: pending | **Priority**: high | **Time**: 15 min

**What to do**: Find orphaned records with broken foreign key references

**Steps**:
1. Check orphaned sessions:
```sql
SELECT COUNT(*) FROM visitor_sessions vs
LEFT JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
WHERE vp.id IS NULL;
```
2. Check orphaned events:
```sql
SELECT COUNT(*) FROM visitor_events ve
LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
WHERE vs.id IS NULL;
```
3. Check invalid entity links:
```sql
SELECT COUNT(*) FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
WHERE vp.likely_entity_id IS NOT NULL AND ke.entity_id IS NULL;
```

**Expected**: All counts return 0 (no orphans)

**Verify**: Zero orphaned records

---

## PHASE 2: FRONTEND TRACKING VERIFICATION (Requirements 1, 8)

### Task 2.1: Test Tracking Initialization
**Status**: ✅ completed | **Priority**: critical | **Time**: 20 min

**What to do**: Verify tracking initializes on page load with forensic data collection

**Steps**:
1. Start dev server: `bun run dev`
2. Open `http://localhost:5173` in Chrome
3. Open DevTools → Console
4. Look for "Analytics initialized" log
5. Open Network tab, filter XHR
6. Refresh page
7. Find POST to `/api/analytics/track?action=init`
8. Inspect request payload for: visitorId, sessionId, userAgent, screenResolution, forensics{fingerprint, gpu_renderer, canvas_hash, cpu_cores, memory_estimate}
9. Check response 200 OK

**Expected**: Init completes within 2 seconds, forensic data collected

**Verify**: Console shows "Analytics event tracked: init" with payload

---

### Task 2.2: Test Page View Tracking
**Status**: pending | **Priority**: critical | **Time**: 15 min

**What to do**: Verify page views tracked on navigation

**Steps**:
1. With DevTools Network tab open, navigate: / → /blogs → /blogs/some-post → /contact
2. For each navigation, find POST to `/api/analytics/track?action=pageview`
3. Check payload includes: sessionId, path, referrer, timestamp
4. Query database:
```sql
SELECT event_type, path, timestamp FROM visitor_events 
WHERE event_type = 'page_view' 
ORDER BY timestamp DESC LIMIT 10;
```

**Expected**: 4 page_view events in database matching navigation

**Verify**: Database shows all page views with correct paths

---

### Task 2.3: Test Behavioral Tracking (Mouse/Keyboard)
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify mouse movements and keystrokes are captured

**Steps**:
1. Open site, move mouse around for 30 seconds
2. Type in search box or contact form
3. Check console for behavioral data logs
4. Wait for heartbeat (15 seconds)
5. Find POST to `/api/analytics/track?action=heartbeat`
6. Check payload includes: biometrics{avg_mouse_velocity, typing_cadence_ms, entropy_score}
7. Query database:
```sql
SELECT session_id, avg_mouse_velocity, typing_cadence_ms, entropy_score, recorded_at
FROM behavioral_biometrics
ORDER BY recorded_at DESC LIMIT 5;
```

**Expected**: Behavioral data captured and stored

**Verify**: Database shows biometrics with non-zero values

---

### Task 2.4: Test Forensic Fingerprinting
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify device fingerprint is consistent and comprehensive

**Steps**:
1. Open site in Chrome, check init payload forensics object
2. Note fingerprint hash value
3. Close browser, reopen site
4. Check fingerprint hash is identical
5. Query database:
```sql
SELECT hash_id, gpu_renderer, canvas_hash, cpu_cores, memory_gb, screen_resolution, last_seen
FROM fingerprint_dna
ORDER BY last_seen DESC LIMIT 5;
```
6. Verify forensics includes: gpu_renderer, canvas_hash, audio_context_hash, cpu_cores, memory_estimate, screen_resolution

**Expected**: Same fingerprint hash across sessions, all forensic fields populated

**Verify**: Fingerprint is stable and comprehensive

---

### Task 2.5: Test Admin Bypass
**Status**: pending | **Priority**: medium | **Time**: 10 min

**What to do**: Verify admin bypass prevents self-tracking

**Steps**:
1. Open browser console
2. Run: `localStorage.setItem('portfolio_admin_bypass', 'true')`
3. Refresh page
4. Check Network tab - no tracking requests should fire
5. Check console - should see "Admin bypass enabled"
6. Remove bypass: `localStorage.removeItem('portfolio_admin_bypass')`
7. Refresh - tracking should resume

**Expected**: No tracking when bypass enabled

**Verify**: Zero tracking requests with bypass active

---

## PHASE 3: BACKEND PROCESSING VERIFICATION (Requirement 2)

### Task 3.1: Test Init Action Processing
**Status**: pending | **Priority**: critical | **Time**: 30 min

**What to do**: Verify init action creates visitor_profiles and visitor_sessions

**Steps**:
1. Clear browser data (new visitor)
2. Open site, trigger init
3. Note visitorId and sessionId from console
4. Query database:
```sql
SELECT visitor_id, ip_address, browser, os, device_type, city, country, hardware_hash, first_seen
FROM visitor_profiles
WHERE visitor_id = 'YOUR_VISITOR_ID';
```
5. Query sessions:
```sql
SELECT session_id, ip_address, start_time, referrer, entry_page
FROM visitor_sessions
WHERE session_id = 'YOUR_SESSION_ID';
```
6. Verify geolocation populated (city, country, latitude, longitude)
7. Verify bot detection ran (is_bot field)
8. Verify forensic data stored in fingerprint_dna table

**Expected**: Profile and session created with complete data

**Verify**: All fields populated correctly

---

### Task 3.2: Test Event Action Processing
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify events are stored in visitor_events table

**Steps**:
1. Trigger various events: click button, scroll, search
2. Check Network tab for event tracking calls
3. Query database:
```sql
SELECT event_type, event_label, event_value, path, timestamp
FROM visitor_events
WHERE session_uuid = (SELECT id FROM visitor_sessions WHERE session_id = 'YOUR_SESSION_ID')
ORDER BY timestamp DESC;
```

**Expected**: All events stored with correct metadata

**Verify**: Event types match actions performed

---

### Task 3.3: Test Heartbeat Processing
**Status**: pending | **Priority**: high | **Time**: 15 min

**What to do**: Verify heartbeats update session and store biometrics

**Steps**:
1. Wait 15 seconds for heartbeat
2. Check Network tab for heartbeat call
3. Query session:
```sql
SELECT session_id, start_time, last_heartbeat, 
       EXTRACT(EPOCH FROM (last_heartbeat - start_time)) as duration_seconds
FROM visitor_sessions
WHERE session_id = 'YOUR_SESSION_ID';
```
4. Verify last_heartbeat updated
5. Check behavioral_biometrics table for new entry

**Expected**: Session last_heartbeat updated, biometrics stored

**Verify**: Duration increases with each heartbeat

---

### Task 3.4: Test Identify Action Processing
**Status**: pending | **Priority**: critical | **Time**: 35 min

**What to do**: Verify identity resolution creates known_entities and links profiles

**Steps**:
1. Open site (anonymous visitor)
2. Fill contact form with autofill (email: test@example.com, name: Test User)
3. Check Network tab for identify action
4. Query known_entities:
```sql
SELECT entity_id, real_name, email, confidence_score, resolution_sources, total_visits
FROM known_entities
WHERE email = 'test@example.com';
```
5. Query visitor_profiles:
```sql
SELECT visitor_id, likely_entity_id, hardware_hash
FROM visitor_profiles
WHERE visitor_id = 'YOUR_VISITOR_ID';
```
6. Verify likely_entity_id matches entity_id
7. Check identity_signals table for signal log

**Expected**: Entity created, profile linked, confidence score calculated

**Verify**: likely_entity_id populated correctly

---

### Task 3.5: Test Retroactive Linking
**Status**: pending | **Priority**: critical | **Time**: 40 min

**What to do**: Verify retroactive linking connects historical sessions

**Steps**:
1. Visit site in normal browser (visitor A), note hardware_hash
2. Don't identify, just browse
3. Open incognito window (visitor B, same device)
4. Fill contact form with autofill (identify)
5. Query to check retroactive linking:
```sql
SELECT vp.visitor_id, vp.hardware_hash, vp.likely_entity_id, ke.email
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
WHERE vp.hardware_hash = 'YOUR_HARDWARE_HASH'
ORDER BY vp.first_seen;
```
6. Verify both visitor A and visitor B have same likely_entity_id

**Expected**: Both profiles linked to same entity via hardware_hash

**Verify**: Retroactive linking worked

---

### Task 3.6: Test Confidence Score Calculation
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify confidence scores calculated correctly

**Steps**:
1. Identify via autofill (base weight 0.3)
2. Check confidence_score in known_entities
3. Identify same email from different device
4. Check confidence_score increased (device correlation bonus +0.15)
5. Test formula: base_weight + device_bonus (max 0.3) + ip_bonus (max 0.1)
6. Query:
```sql
SELECT email, confidence_score, resolution_sources, 
       (SELECT COUNT(DISTINCT hardware_hash) FROM visitor_profiles WHERE likely_entity_id = ke.entity_id) as device_count
FROM known_entities ke
WHERE email = 'test@example.com';
```

**Expected**: Confidence increases with more signals, capped at 1.0

**Verify**: Score calculation matches formula

---

## PHASE 4: IDENTITY RESOLUTION TESTING (Requirement 4)

### Task 4.1: Test Autofill Detection
**Status**: pending | **Priority**: critical | **Time**: 30 min

**What to do**: Verify autofill events captured from Contact form

**Steps**:
1. Open /contact page
2. Enable browser autofill
3. Click in email field, select autofill suggestion
4. Click in name field, select autofill suggestion
5. Check console for "Autofill detected" logs
6. Check Network tab for identify action with source='autofill'
7. Verify payload includes: email, name, source, visitorId, sessionId

**Expected**: Autofill detection fires identify action

**Verify**: Console shows autofill detection, identify action sent

---

### Task 4.2: Test Cross-Device Identity Resolution
**Status**: pending | **Priority**: high | **Time**: 45 min

**What to do**: Verify same person identified across multiple devices

**Steps**:
1. Desktop browser: visit site, identify via autofill (email: user@test.com)
2. Note desktop hardware_hash
3. Mobile browser (or different browser): visit site, identify with same email
4. Note mobile hardware_hash
5. Query identity_clusters:
```sql
SELECT cluster_id, fingerprint_hash, primary_entity_id, confidence_score
FROM identity_clusters
WHERE primary_entity_id = (SELECT entity_id FROM known_entities WHERE email = 'user@test.com');
```
6. Verify multiple fingerprint_hash entries for same entity
7. Check entity profile shows multiple devices

**Expected**: Entity linked to multiple hardware fingerprints

**Verify**: identity_clusters has multiple rows for same entity

---

### Task 4.3: Test Alias Merging
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify multiple names for same email are merged into aliases array

**Steps**:
1. Identify with email: user@test.com, name: "John Doe"
2. Later identify with same email, name: "John D."
3. Query known_entities:
```sql
SELECT email, real_name, aliases
FROM known_entities
WHERE email = 'user@test.com';
```
4. Verify aliases array contains both names
5. Verify duplicates are removed

**Expected**: Aliases array contains ["John Doe", "John D."]

**Verify**: Array deduplicated and sorted

---

### Task 4.4: Test Identity Signals Logging
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify all identity signals logged to identity_signals table

**Steps**:
1. Perform identity resolution (autofill)
2. Query identity_signals:
```sql
SELECT signal_type, signal_weight, signal_value, recorded_at
FROM identity_signals
WHERE entity_id = (SELECT entity_id FROM known_entities WHERE email = 'test@example.com')
ORDER BY recorded_at DESC;
```
3. Verify signal_type matches source (autofill, form_submit, manual)
4. Verify signal_weight matches expected values

**Expected**: All identity events logged with correct weights

**Verify**: Signals table has entries for each identification

---

## PHASE 5: REAL-TIME BROADCASTING VERIFICATION (Requirement 5)

### Task 5.1: Test SSE Connection Establishment
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify SSE connection established for real-time updates

**Steps**:
1. Login to admin dashboard
2. Open DevTools → Network tab
3. Filter for "stream" or "realtime"
4. Look for EventSource connection to `/api/realtime/stream`
5. Check connection status is "pending" (persistent)
6. Check console for "SSE connected" or similar log

**Expected**: SSE connection established and maintained

**Verify**: EventSource connection active in Network tab

---

### Task 5.2: Test VISITOR_INIT Event Broadcasting
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify new visitor events broadcast to admin dashboard

**Steps**:
1. Open admin dashboard in one browser tab
2. Open site in incognito window (new visitor)
3. Check admin dashboard for real-time update
4. Verify visitor appears in recent visitors list
5. Check browser console for SSE event: `ANALYTICS:SIGNAL` with type `VISITOR_INIT`
6. Verify event includes: visitorId, sessionId, city, country, device, os, browser, path

**Expected**: New visitor appears in dashboard within 500ms

**Verify**: Dashboard updates without manual refresh

---

### Task 5.3: Test EVENT Broadcasting
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify events broadcast in real-time

**Steps**:
1. Admin dashboard open
2. In another tab, trigger events (clicks, page views)
3. Check admin dashboard "Behavioral Stream" updates
4. Verify events appear with correct type, path, timestamp

**Expected**: Events appear in dashboard within 500ms

**Verify**: Behavioral stream shows new events

---

### Task 5.4: Test IDENTITY_RESOLVED Event Broadcasting
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify identity resolution broadcasts to dashboard

**Steps**:
1. Admin dashboard open
2. In another tab, fill contact form with autofill
3. Check admin dashboard for identity resolution notification
4. Verify visitor row updates with email/name
5. Check console for SSE event with type `IDENTITY_RESOLVED`
6. Verify event includes: method, email, name, entityId, visitorId, confidence

**Expected**: Identity resolution appears in dashboard immediately

**Verify**: Visitor list updates with resolved identity

---

### Task 5.5: Test SSE Reconnection Logic
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify SSE reconnects automatically on connection loss

**Steps**:
1. Admin dashboard open with SSE connected
2. Simulate network interruption (DevTools → Network → Offline)
3. Wait 5 seconds
4. Re-enable network (Online)
5. Check console for reconnection attempt
6. Verify SSE connection re-established
7. Test that events still broadcast after reconnection

**Expected**: SSE reconnects automatically within 3 seconds

**Verify**: Connection restored without page refresh

---

### Task 5.6: Test React Query Cache Patching
**Status**: pending | **Priority**: medium | **Time**: 25 min

**What to do**: Verify SSE events update React Query cache efficiently

**Steps**:
1. Admin dashboard open
2. Open React DevTools → Query tab
3. Trigger events in another tab
4. Watch cache updates in React DevTools
5. Verify EVENT/PAGE_VIEW use cache patching (no full refetch)
6. Verify VISITOR_INIT/IDENTITY_RESOLVED trigger invalidation (refetch)
7. Check Network tab - should see minimal API calls

**Expected**: Cache updates efficiently without unnecessary refetches

**Verify**: React Query cache updates match SSE events

---

## PHASE 6: DASHBOARD COMPONENT VERIFICATION (Requirement 7)

### Task 6.1: Test Stats Cards Display
**Status**: pending | **Priority**: high | **Time**: 15 min

**What to do**: Verify core metrics cards show correct data

**Steps**:
1. Open admin dashboard
2. Check stats cards: Live Now, Total Visitors, Total Sessions, Page Views (7d), Bot Sessions
3. Query database to verify counts:
```sql
-- Live Now (last 2 minutes)
SELECT COUNT(DISTINCT visitor_uuid) FROM visitor_sessions 
WHERE last_heartbeat > NOW() - INTERVAL '2 minutes';

-- Total Visitors
SELECT COUNT(DISTINCT visitor_id) FROM visitor_profiles;

-- Total Sessions
SELECT COUNT(*) FROM visitor_sessions;

-- Page Views 7d
SELECT COUNT(*) FROM visitor_events 
WHERE event_type = 'page_view' AND timestamp > NOW() - INTERVAL '7 days';

-- Bot Sessions
SELECT COUNT(*) FROM visitor_sessions vs
JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
WHERE vp.is_bot = true;
```
4. Compare dashboard values with query results

**Expected**: Dashboard matches database counts

**Verify**: All stats cards accurate

---

### Task 6.2: Test Global Threat Matrix Map
**Status**: pending | **Priority**: high | **Time**: 30 min

**What to do**: Verify map renders markers correctly with clustering

**Steps**:
1. Open admin dashboard
2. Scroll to Global Threat Matrix
3. Verify Leaflet map loads
4. Check markers appear for visitor locations
5. Verify marker colors: green (safe), blue (datacenter), red (bot), orange (admin)
6. Click marker, verify popup shows: location, session count, threat level
7. Test marker clustering (zoom in/out)
8. Click location to filter visitor list

**Expected**: Map displays all visitor locations with correct threat colors

**Verify**: Markers match visitor locations in database

---

### Task 6.3: Test Visitor List Filtering
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify visitor list filters work correctly

**Steps**:
1. Open admin dashboard visitor list
2. Test filter: "All" - shows all visitors
3. Test filter: "Humans" - shows only is_bot = false
4. Test filter: "Resolved" - shows only visitors with likely_entity_id
5. Test filter: "Recurring" - shows visit_count > 2 AND likely_entity_id IS NULL
6. Test filter: "Bots" - shows only is_bot = true
7. For each filter, verify count matches database query

**Expected**: Filters show correct subset of visitors

**Verify**: Filtered counts match database

---

### Task 6.4: Test Visitor List Sorting
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify visitor list sorting options work

**Steps**:
1. Test sort: "Last Seen" (default) - most recent first
2. Test sort: "First Seen" - oldest first
3. Test sort: "Sessions" - highest visit_count first
4. Test sort: "Threat" - calculated threat level (bots first, then suspicious)
5. Verify order changes correctly for each sort option

**Expected**: List reorders based on selected sort

**Verify**: Sort order matches expected logic

---

### Task 6.5: Test Entity Dossier Modal
**Status**: pending | **Priority**: high | **Time**: 35 min

**What to do**: Verify Entity Dossier displays complete visitor profile

**Steps**:
1. Click on a visitor row in dashboard
2. Verify Entity Dossier modal opens
3. Test draggable functionality
4. Check Profile tab shows: identity link, location, timezone, OS, browser, device, display resolution, processor, GPU, memory, power state, network uplink
5. Check Timeline tab shows: visit log with visit number, date/time, duration, event count, referrer
6. Check Engagement tab shows: page views, total clicks, sessions, total time, pages visited, blog reads
7. Check Threat tab shows: bot detection, connection security, language, user agent, risk score
8. Verify all data matches database for that visitor

**Expected**: Dossier shows complete, accurate visitor profile

**Verify**: All tabs display correct data

---

### Task 6.6: Test Behavioral Stream
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify recent actions stream displays events

**Steps**:
1. Open admin dashboard
2. Scroll to Behavioral Stream section
3. Verify recent events displayed with: event type icon, city, IP, timestamp, path
4. Trigger new events in another tab
5. Verify stream updates in real-time
6. Check events are sorted by timestamp (newest first)

**Expected**: Stream shows last 100 events, updates live

**Verify**: Events match visitor_events table

---

## PHASE 7: PERFORMANCE & SCALABILITY TESTING (Requirement 9)

### Task 7.1: Measure Frontend Initialization Time
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify tracking doesn't block page rendering

**Steps**:
1. Open Chrome DevTools → Performance tab
2. Start recording
3. Refresh page
4. Stop recording after page load
5. Find "Analytics initialized" marker
6. Measure time from page load to tracking init
7. Check for long tasks (>50ms) blocking main thread
8. Verify requestIdleCallback used for deferred work

**Expected**: Init completes within 2 seconds, no long tasks

**Verify**: Performance timeline shows non-blocking init

---

### Task 7.2: Measure API Response Times
**Status**: pending | **Priority**: high | **Time**: 30 min

**What to do**: Verify all tracking endpoints meet performance targets

**Steps**:
1. Open DevTools → Network tab
2. Trigger each action type: init, event, heartbeat, pageview, identify
3. For each request, note response time in Network tab
4. Run multiple times, calculate average
5. Compare to targets:
   - init: < 200ms
   - event: < 100ms
   - heartbeat: < 150ms
   - pageview: < 100ms
   - identify: < 500ms

**Expected**: All endpoints meet response time targets

**Verify**: Average response times within limits

---

### Task 7.3: Measure Database Query Performance
**Status**: pending | **Priority**: high | **Time**: 35 min

**What to do**: Verify database queries use indexes efficiently

**Steps**:
1. Connect to database: `psql $DATABASE_URL`
2. Run EXPLAIN ANALYZE on key queries:
```sql
-- Stats aggregation
EXPLAIN ANALYZE
SELECT COUNT(DISTINCT visitor_uuid) as live_now
FROM visitor_sessions
WHERE last_heartbeat > NOW() - INTERVAL '2 minutes';

-- Visitor list with joins
EXPLAIN ANALYZE
SELECT vp.*, ke.email, COUNT(ve.id) as event_count
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
LEFT JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
LEFT JOIN visitor_events ve ON ve.session_uuid = vs.id
GROUP BY vp.id, ke.email
ORDER BY vp.last_seen DESC
LIMIT 100;
```
3. Check execution time and index usage
4. Verify "Index Scan" not "Seq Scan" for large tables

**Expected**: All queries < 2 seconds, indexes used

**Verify**: EXPLAIN shows index scans

---

### Task 7.4: Test Memory Usage and Leaks
**Status**: pending | **Priority**: medium | **Time**: 25 min

**What to do**: Verify tracking doesn't cause memory leaks

**Steps**:
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Browse site for 5 minutes (multiple pages, interactions)
4. Take another heap snapshot
5. Compare snapshots, look for growing arrays
6. Check behavioral tracking arrays limited to 50 events
7. Verify old event data is cleared

**Expected**: Memory usage stable, no unbounded growth

**Verify**: Heap size doesn't grow continuously

---

### Task 7.5: Test Page Load Performance Impact
**Status**: pending | **Priority**: critical | **Time**: 30 min

**What to do**: Verify tracking maintains FCP < 400ms and TTI < 2s

**Steps**:
1. Run Lighthouse audit with tracking enabled
2. Note FCP and TTI scores
3. Disable tracking (admin bypass)
4. Run Lighthouse again
5. Compare scores
6. Verify tracking adds < 100ms to FCP
7. Check Lighthouse score > 95

**Expected**: FCP < 400ms, TTI < 2s with tracking

**Verify**: Lighthouse report shows passing scores

---

## PHASE 8: SECURITY & DATA INTEGRITY (Requirements 10, 11)

### Task 8.1: Test SQL Injection Prevention
**Status**: pending | **Priority**: critical | **Time**: 30 min

**What to do**: Verify all queries use parameterized statements

**Steps**:
1. Review track.js code for SQL queries
2. Verify all use template literals with `sql` tag
3. Test malicious input: visitorId = "'; DROP TABLE visitor_profiles; --"
4. Send tracking request with malicious payload
5. Verify database unaffected
6. Check error handling returns safe error message

**Expected**: No SQL injection possible, safe error handling

**Verify**: Database tables intact after malicious input

---

### Task 8.2: Test Input Validation with Zod
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify all API inputs validated before processing

**Steps**:
1. Send invalid payloads to tracking endpoint:
   - Missing required fields
   - Wrong data types
   - Invalid email format
   - Oversized strings
2. Verify each returns HTTP 400 with validation error
3. Check error messages don't expose internal details
4. Verify valid payloads still process correctly

**Expected**: Invalid inputs rejected with 400, valid inputs accepted

**Verify**: Zod validation catches all invalid inputs

---

### Task 8.3: Test Rate Limiting
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify rate limiting prevents abuse

**Steps**:
1. Write script to send 100 tracking requests rapidly
2. Run script against tracking endpoint
3. Verify rate limit kicks in (HTTP 429)
4. Check rate limit headers in response
5. Wait for rate limit window to reset
6. Verify requests accepted again

**Expected**: Rate limiting blocks excessive requests

**Verify**: HTTP 429 returned after threshold

---

### Task 8.4: Test Admin Authentication
**Status**: pending | **Priority**: critical | **Time**: 20 min

**What to do**: Verify stats API requires authentication

**Steps**:
1. Call `/api/analytics/stats` without JWT token
2. Verify returns HTTP 401 Unauthorized
3. Login to admin dashboard (get JWT)
4. Call stats API with valid JWT
5. Verify returns data
6. Test with expired JWT
7. Verify returns 401

**Expected**: Stats API requires valid JWT token

**Verify**: Unauthenticated requests blocked

---

### Task 8.5: Test Data Accuracy (Geolocation)
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify geolocation data is accurate

**Steps**:
1. Visit site from known location
2. Check visitor_profiles for your IP
3. Verify city, country, latitude, longitude are correct
4. Test with VPN (different location)
5. Verify location updates
6. Test geolocation API timeout (3 seconds)
7. Verify fallback to "Unknown" on failure

**Expected**: Geolocation accurate within city-level

**Verify**: Location matches actual IP location

---

### Task 8.6: Test Bot Detection Accuracy
**Status**: pending | **Priority**: medium | **Time**: 25 min

**What to do**: Verify bot detection identifies automated traffic

**Steps**:
1. Visit site with normal browser (is_bot should be false)
2. Visit with curl: `curl http://localhost:5173`
3. Check visitor_profiles for curl request (is_bot should be true)
4. Test with various user agents: googlebot, headless chrome, selenium
5. Query database:
```sql
SELECT visitor_id, user_agent, is_bot
FROM visitor_profiles
ORDER BY first_seen DESC
LIMIT 10;
```
6. Verify bot patterns detected correctly

**Expected**: Bots identified, humans not flagged

**Verify**: is_bot field accurate

---

## PHASE 9: EDGE CASES & ERROR HANDLING (Requirements 12, 13)

### Task 9.1: Test Incognito Mode Tracking
**Status**: pending | **Priority**: high | **Time**: 25 min

**What to do**: Verify tracking works in incognito with new visitor_id

**Steps**:
1. Visit site in normal browser, note visitor_id and hardware_hash
2. Open incognito window
3. Visit site, note new visitor_id
4. Check hardware_hash is same as normal browser
5. Identify in incognito (autofill)
6. Verify retroactive linking connects both profiles

**Expected**: New visitor_id, same hardware_hash, retroactive linking works

**Verify**: Both profiles linked after identification

---

### Task 9.2: Test Cleared Cookies/LocalStorage
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify tracking handles cleared storage

**Steps**:
1. Visit site, note visitor_id
2. Clear cookies and localStorage
3. Refresh page
4. Verify new visitor_id generated
5. Check hardware_hash remains same
6. Identify with same email as before
7. Verify retroactive linking reconnects profiles

**Expected**: New visitor_id, retroactive linking via hardware_hash

**Verify**: Profiles reconnected after identification

---

### Task 9.3: Test VPN/Proxy IP Changes
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify tracking handles IP address changes

**Steps**:
1. Visit site without VPN, note IP address
2. Enable VPN
3. Refresh page (same session)
4. Check visitor_profiles.ip_address updated
5. Verify visitor_id remains same (localStorage)
6. Check session continues (session_id same)

**Expected**: IP updates, visitor_id persists

**Verify**: visitor_profiles shows new IP

---

### Task 9.4: Test JavaScript Disabled
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify site works without tracking when JS disabled

**Steps**:
1. Disable JavaScript in browser settings
2. Visit site
3. Verify page renders correctly
4. Verify no tracking errors
5. Check site functionality intact (static content)

**Expected**: Site works, tracking fails silently

**Verify**: No errors, page functional

---

### Task 9.5: Test Ad Blocker Interference
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify tracking handles ad blocker gracefully

**Steps**:
1. Install ad blocker extension (uBlock Origin)
2. Visit site
3. Check console for blocked requests
4. Verify page functionality not broken
5. Verify tracking fails silently without errors

**Expected**: Tracking blocked, site works normally

**Verify**: No console errors, page functional

---

### Task 9.6: Test Multiple Tabs Same Visitor
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify multiple tabs create separate sessions

**Steps**:
1. Open site in tab 1, note visitor_id and session_id
2. Open site in tab 2 (same browser)
3. Note visitor_id (should be same) and session_id (should be different)
4. Query database:
```sql
SELECT session_id, visitor_uuid, start_time
FROM visitor_sessions
WHERE visitor_uuid = (SELECT id FROM visitor_profiles WHERE visitor_id = 'YOUR_VISITOR_ID')
ORDER BY start_time DESC;
```
5. Verify 2 sessions for same visitor

**Expected**: Same visitor_id, different session_ids

**Verify**: Database shows 2 sessions

---

### Task 9.7: Test Database Connection Failure
**Status**: pending | **Priority**: high | **Time**: 20 min

**What to do**: Verify graceful handling of database errors

**Steps**:
1. Temporarily break DATABASE_URL in .env
2. Restart server
3. Visit site, trigger tracking
4. Check Network tab for tracking request
5. Verify returns HTTP 500
6. Check server logs for error details
7. Verify client doesn't crash
8. Restore DATABASE_URL, verify tracking resumes

**Expected**: HTTP 500 returned, client handles gracefully

**Verify**: No client-side crashes

---

### Task 9.8: Test Geolocation API Timeout
**Status**: pending | **Priority**: medium | **Time**: 15 min

**What to do**: Verify fallback when geolocation API fails

**Steps**:
1. Simulate slow geolocation API (add delay in track.js)
2. Set timeout to 1 second (lower than 3 second default)
3. Trigger init action
4. Verify fallback to "Unknown" location
5. Check default coordinates (28.6139, 77.209) used
6. Verify tracking continues despite geolocation failure

**Expected**: Fallback to Unknown, tracking continues

**Verify**: visitor_profiles has "Unknown" city

---

### Task 9.9: Test Forensic Data Collection Failures
**Status**: pending | **Priority**: medium | **Time**: 20 min

**What to do**: Verify partial forensic data handled gracefully

**Steps**:
1. Test in browser with limited APIs (Safari, Firefox)
2. Check which forensic APIs unavailable
3. Verify tracking continues with partial data
4. Check console for warnings (not errors)
5. Verify fingerprint still generated from available data

**Expected**: Partial forensic data accepted, tracking continues

**Verify**: No blocking errors, partial fingerprint stored

---

## PHASE 10: AUDIT REPORTING & DOCUMENTATION (Requirement 15)

### Task 10.1: Generate Audit Report
**Status**: pending | **Priority**: high | **Time**: 2 hours

**What to do**: Compile comprehensive audit findings document

**Steps**:
1. Create audit report document
2. Include executive summary
3. Document all test results (pass/fail)
4. List identified issues with severity
5. Document performance metrics
6. Include security findings
7. Provide recommendations
8. Add test evidence (screenshots, query results)

**Expected**: Complete audit report with findings

**Verify**: Report covers all 16 requirements

---

### Task 10.2: Document Issues and Fixes
**Status**: pending | **Priority**: high | **Time**: 1 hour

**What to do**: Create issue tracker for bugs found

**Steps**:
1. List all bugs/issues found during audit
2. Classify severity: critical, high, medium, low
3. Document reproduction steps
4. Provide recommended fixes
5. Estimate fix time for each issue
6. Prioritize by severity and impact

**Expected**: Issue list with fixes prioritized

**Verify**: All issues documented

---

### Task 10.3: Create Optimization Recommendations
**Status**: pending | **Priority**: medium | **Time**: 1 hour

**What to do**: Document performance and architecture improvements

**Steps**:
1. Review performance bottlenecks found
2. Suggest query optimizations
3. Recommend index additions
4. Propose caching strategies
5. Suggest code refactoring opportunities
6. Document scalability improvements

**Expected**: Optimization roadmap

**Verify**: Recommendations actionable

---

## SUMMARY

**Total Tasks**: 45
**Estimated Time**: 15-20 hours
**Critical Tasks**: 12
**High Priority**: 18
**Medium Priority**: 13
**Low Priority**: 2

**Phases**:
1. Database Schema (5 tasks, 1.5 hours)
2. Frontend Tracking (5 tasks, 1.5 hours)
3. Backend Processing (6 tasks, 2.5 hours)
4. Identity Resolution (4 tasks, 2 hours)
5. Real-Time Broadcasting (6 tasks, 2 hours)
6. Dashboard Components (6 tasks, 2.5 hours)
7. Performance Testing (5 tasks, 2.5 hours)
8. Security & Data Integrity (6 tasks, 2.5 hours)
9. Edge Cases & Errors (9 tasks, 3 hours)
10. Reporting (3 tasks, 4 hours)

**Next Steps**:
1. Start with Phase 1 (Database Schema) - critical foundation
2. Move to Phase 2 (Frontend) and Phase 3 (Backend) - core functionality
3. Test Phase 4 (Identity Resolution) - key feature
4. Verify Phase 5 (Real-Time) and Phase 6 (Dashboard) - user-facing
5. Measure Phase 7 (Performance) - ensure targets met
6. Audit Phase 8 (Security) - critical for production
7. Test Phase 9 (Edge Cases) - robustness
8. Complete Phase 10 (Reporting) - document findings

