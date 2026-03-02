# Tracking System Audit - Design Document

## Overview

This document outlines the technical approach for auditing the complete tracking system pipeline. The audit will verify data flow integrity, performance, accuracy, and proper functioning from frontend collection through backend processing to database storage and dashboard visualization.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  useAnalytics    │  │   forensics.js   │  │  Contact.jsx  │ │
│  │  - Init tracking │  │  - Canvas hash   │  │  - Autofill   │ │
│  │  - Page views    │  │  - WebGL hash    │  │    detection  │ │
│  │  - Events        │  │  - Audio hash    │  │  - Identity   │ │
│  │  - Heartbeats    │  │  - Device info   │  │    capture    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                     │                     │          │
│           └─────────────────────┴─────────────────────┘          │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ POST /api/analytics/track
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  server/api/analytics/track.js                           │   │
│  │  - action=init     → visitor_profiles, visitor_sessions  │   │
│  │  - action=event    → visitor_events                      │   │
│  │  - action=heartbeat → behavioral_biometrics              │   │
│  │  - action=pageview → visitor_events                      │   │
│  │  - action=identify → known_entities, identity_signals    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Real-Time Broadcasting (SSE)                            │   │
│  │  - broadcaster.js → sseTransport.js                      │   │
│  │  - 400ms delay for DB consistency                        │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Neon PostgreSQL)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ visitor_profiles │  │ visitor_sessions │  │visitor_events│  │
│  │ - hardware_hash  │  │ - session_id     │  │ - event_type │  │
│  │ - likely_entity  │  │ - visitor_uuid   │  │ - session_uuid│ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ fingerprint_dna  │  │ known_entities   │  │behavioral_   │  │
│  │ - hash_id        │  │ - email (unique) │  │  biometrics  │  │
│  │ - gpu_renderer   │  │ - confidence     │  │ - entropy    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │identity_clusters │  │ identity_signals │                    │
│  │ - fingerprint_hash│  │ - signal_type   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Analytics.jsx   │  │ EntityDossier    │  │ useTelemetry │  │
│  │  - Threat map    │  │ - Profile tabs   │  │ - SSE client │  │
│  │  - Visitor list  │  │ - Timeline       │  │ - Cache patch│  │
│  │  - Stats cards   │  │ - Engagement     │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Audit Methodology

### Phase 1: Database Schema Verification
**Goal**: Confirm all 8 tables exist with correct structure, indexes, and foreign keys

**Approach**:
1. Run SQL queries to check table existence
2. Verify column names, types, and constraints
3. Check indexes on foreign keys and frequently queried columns
4. Test foreign key relationships with sample joins
5. Verify row counts and data distribution

**Tools**: Direct SQL queries via `psql` or database client

### Phase 2: Data Flow Tracing
**Goal**: Follow a single visitor's data from frontend → backend → database → dashboard

**Approach**:
1. Open site in browser with DevTools Network tab
2. Trigger tracking events (page load, clicks, form fill)
3. Inspect POST requests to `/api/analytics/track`
4. Query database to verify data was written correctly
5. Check admin dashboard to confirm data appears
6. Verify real-time SSE updates arrive

**Tools**: Browser DevTools, SQL queries, admin dashboard

### Phase 3: Identity Resolution Testing
**Goal**: Verify autofill detection, confidence scoring, and retroactive linking

**Approach**:
1. Visit site in normal browser (visitor A)
2. Fill contact form with autofill (capture identity)
3. Query database to verify `known_entities` entry
4. Check `visitor_profiles.likely_entity_id` is linked
5. Open incognito window (visitor B, same device)
6. Verify `hardware_hash` matches visitor A
7. Fill contact form again
8. Verify visitor B is retroactively linked to same entity
9. Check confidence score calculation

**Tools**: Browser (normal + incognito), SQL queries

### Phase 4: Performance Profiling
**Goal**: Measure tracking overhead and ensure performance requirements are met

**Approach**:
1. Use Chrome DevTools Performance tab
2. Record page load with tracking enabled
3. Measure time to `requestIdleCallback` execution
4. Check for long tasks blocking main thread
5. Measure API response times for each action type
6. Profile database query execution times
7. Measure SSE broadcast latency

**Tools**: Chrome DevTools Performance, Lighthouse, SQL EXPLAIN ANALYZE

### Phase 5: Component Integration Testing
**Goal**: Verify all admin dashboard components display correct data

**Approach**:
1. Generate test data by browsing site
2. Open admin dashboard
3. Verify stats cards show correct counts
4. Test Global Threat Map marker rendering
5. Click map markers and verify popups
6. Test visitor list filtering (humans, bots, resolved, recurring)
7. Test visitor list sorting (last_seen, sessions, threat)
8. Click visitor row to open Entity Dossier
9. Verify all dossier tabs show correct data
10. Test real-time updates by opening site in another tab

**Tools**: Manual testing, browser DevTools

### Phase 6: Edge Case Validation
**Goal**: Test unusual scenarios and error conditions

**Approach**:
1. Test with JavaScript disabled
2. Test with ad blockers enabled
3. Test with VPN (IP address changes)
4. Test with incognito mode
5. Test with cleared cookies/localStorage
6. Test with multiple tabs open
7. Test with network throttling
8. Simulate database connection failures
9. Simulate geolocation API failures

**Tools**: Browser settings, network throttling, manual testing

## Test Data Generation

### Scenario 1: New Visitor Journey
```javascript
// 1. First page load
// Expected: visitor_profiles created, visitor_sessions created, page_view event

// 2. Navigate to /blogs
// Expected: new page_view event

// 3. Click on blog post
// Expected: click event, new page_view event

// 4. Scroll to 50%
// Expected: scroll_depth event

// 5. Wait 15 seconds
// Expected: heartbeat with behavioral_biometrics
```

### Scenario 2: Identity Resolution
```javascript
// 1. Visit site (anonymous)
// Expected: visitor_profiles with no likely_entity_id

// 2. Fill contact form with autofill
// Expected: known_entities created, visitor_profiles.likely_entity_id linked

// 3. Open incognito (same device)
// Expected: new visitor_id, same hardware_hash

// 4. Fill contact form again
// Expected: both visitor_profiles linked to same entity
```

### Scenario 3: Cross-Device Tracking
```javascript
// 1. Visit from desktop (identify via autofill)
// Expected: entity created with desktop hardware_hash

// 2. Visit from mobile (same email autofill)
// Expected: entity updated, mobile hardware_hash added to identity_clusters
```

## Verification Queries

### Check Table Structure
```sql
-- List all tracking tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'visitor_profiles', 'visitor_sessions', 'visitor_events',
    'fingerprint_dna', 'known_entities', 'behavioral_biometrics',
    'identity_clusters', 'identity_signals'
  )
ORDER BY table_name;

-- Check visitor_profiles columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'visitor_profiles'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'visitor_profiles';

-- Check foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'visitor%';
```

### Check Data Flow
```sql
-- Find a specific visitor's complete journey
WITH visitor_data AS (
  SELECT id, visitor_id, hardware_hash, likely_entity_id, city, country
  FROM visitor_profiles
  WHERE visitor_id = 'YOUR_VISITOR_ID'
)
SELECT 
  'Profile' as type,
  vd.visitor_id as identifier,
  vd.city,
  vd.country,
  ke.email
FROM visitor_data vd
LEFT JOIN known_entities ke ON ke.entity_id = vd.likely_entity_id

UNION ALL

SELECT 
  'Session' as type,
  vs.session_id as identifier,
  NULL as city,
  NULL as country,
  NULL as email
FROM visitor_sessions vs
JOIN visitor_data vd ON vd.id = vs.visitor_uuid

UNION ALL

SELECT 
  'Event' as type,
  ve.event_type as identifier,
  NULL as city,
  NULL as country,
  ve.path as email
FROM visitor_events ve
JOIN visitor_sessions vs ON vs.id = ve.session_uuid
JOIN visitor_data vd ON vd.id = vs.visitor_uuid
ORDER BY type, identifier;
```

### Check Identity Resolution
```sql
-- Check entity with linked profiles
SELECT 
  ke.entity_id,
  ke.email,
  ke.real_name,
  ke.confidence_score,
  ke.resolution_sources,
  COUNT(vp.id) as linked_profiles,
  ARRAY_AGG(DISTINCT vp.hardware_hash) as hardware_hashes,
  ARRAY_AGG(DISTINCT vp.visitor_id) as visitor_ids
FROM known_entities ke
LEFT JOIN visitor_profiles vp ON vp.likely_entity_id = ke.entity_id
GROUP BY ke.entity_id, ke.email, ke.real_name, ke.confidence_score, ke.resolution_sources
ORDER BY ke.created_at DESC
LIMIT 10;

-- Check retroactive linking (same hardware, same entity)
SELECT 
  hardware_hash,
  COUNT(*) as profile_count,
  likely_entity_id,
  ke.email,
  ARRAY_AGG(visitor_id) as visitor_ids
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
WHERE hardware_hash IS NOT NULL
GROUP BY hardware_hash, likely_entity_id, ke.email
HAVING COUNT(*) > 1
ORDER BY profile_count DESC;
```

### Check Performance
```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT 
  vp.visitor_id,
  vp.city,
  vp.country,
  vp.visit_count,
  ke.email,
  ke.real_name,
  COUNT(ve.id) as total_events
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
LEFT JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
LEFT JOIN visitor_events ve ON ve.session_uuid = vs.id
WHERE vp.last_seen > NOW() - INTERVAL '7 days'
GROUP BY vp.visitor_id, vp.city, vp.country, vp.visit_count, ke.email, ke.real_name
ORDER BY vp.last_seen DESC
LIMIT 100;
```

### Check Data Integrity
```sql
-- Find orphaned sessions (no matching profile)
SELECT COUNT(*)
FROM visitor_sessions vs
LEFT JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
WHERE vp.id IS NULL;

-- Find orphaned events (no matching session)
SELECT COUNT(*)
FROM visitor_events ve
LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
WHERE vs.id IS NULL;

-- Find profiles with invalid entity links
SELECT COUNT(*)
FROM visitor_profiles vp
LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
WHERE vp.likely_entity_id IS NOT NULL AND ke.entity_id IS NULL;

-- Check confidence score ranges
SELECT 
  MIN(confidence_score) as min_score,
  MAX(confidence_score) as max_score,
  AVG(confidence_score) as avg_score
FROM known_entities;
```

## Performance Benchmarks

### Frontend Targets
- Tracking initialization: < 2 seconds (via requestIdleCallback)
- Forensic data collection: < 500ms
- API call overhead: < 50ms (non-blocking)
- Heartbeat interval: 15 seconds
- Mouse movement sampling: 1 per second max

### Backend Targets
- `action=init`: < 200ms response time
- `action=event`: < 100ms response time
- `action=heartbeat`: < 150ms response time
- `action=pageview`: < 100ms response time
- `action=identify`: < 500ms response time (includes retroactive linking)

### Database Targets
- Single visitor profile query: < 50ms
- Stats aggregation query: < 2 seconds
- Visitor list with joins: < 1 second
- Entity profile with CTEs: < 500ms

### Real-Time Targets
- SSE connection establishment: < 1 second
- Event broadcast latency: < 500ms (including 400ms delay)
- Dashboard cache update: < 100ms

## Success Criteria

### Data Integrity
- ✅ All 8 tables exist with correct schema
- ✅ All foreign keys work correctly
- ✅ No orphaned records in child tables
- ✅ Confidence scores in range [0.0, 1.0]
- ✅ Hardware hashes are consistent per device
- ✅ Retroactive linking works for same hardware_hash

### Functionality
- ✅ Tracking initializes on all pages
- ✅ Page views are recorded correctly
- ✅ Events are captured with correct metadata
- ✅ Heartbeats update behavioral biometrics
- ✅ Autofill detection captures identity
- ✅ Identity resolution links profiles correctly
- ✅ Real-time SSE updates arrive in dashboard
- ✅ Admin dashboard displays accurate data

### Performance
- ✅ FCP < 400ms maintained with tracking
- ✅ TTI < 2s maintained with tracking
- ✅ All API endpoints meet response time targets
- ✅ Database queries use indexes efficiently
- ✅ No long tasks block main thread

### Security
- ✅ All queries use parameterized statements
- ✅ Zod validation on all API inputs
- ✅ Rate limiting prevents abuse
- ✅ Admin endpoints require authentication
- ✅ No sensitive data exposed in errors

## Issues and Recommendations

### Known Issues
1. **Deprecated Zod syntax**: `.email().max(255)` should be `.max(255).email()` ✅ FIXED
2. **Unused crypto import**: Removed from track.js ✅ FIXED
3. **Missing autofill_nav source**: Added to identity schema ✅ FIXED

### Optimization Opportunities
1. Add database connection pooling for high traffic
2. Implement query result caching for stats API
3. Add database partitioning for visitor_events by date
4. Optimize map marker clustering for large datasets
5. Add lazy loading for Entity Dossier tabs

### Security Recommendations
1. Consider hashing IP addresses for privacy compliance
2. Add data retention policy (auto-delete old events)
3. Implement GDPR opt-out mechanism
4. Add CSP headers to prevent XSS
5. Review and update privacy policy

### Monitoring Recommendations
1. Set up alerts for tracking API errors
2. Monitor database query performance
3. Track SSE connection stability
4. Monitor identity resolution rate
5. Alert on unusual bot traffic spikes

## Next Steps

After completing the audit:
1. Document all findings in audit report
2. Prioritize issues by severity
3. Create fix tasks for critical issues
4. Implement recommended optimizations
5. Set up ongoing monitoring
6. Schedule regular audits (quarterly)
