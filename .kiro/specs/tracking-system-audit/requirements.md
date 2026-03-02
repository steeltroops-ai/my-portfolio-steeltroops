# Requirements Document: Tracking System Audit

## Introduction

This document specifies the comprehensive audit requirements for the portfolio website's advanced tracking and analytics system. The system implements sophisticated visitor tracking with forensic device fingerprinting, behavioral biometrics, identity resolution, and real-time analytics dashboards.

The audit will verify end-to-end data flow integrity, performance characteristics, accuracy of identity resolution, and proper functioning of all tracking components from frontend collection through backend processing to database storage and dashboard visualization.

## Glossary

- **Tracking_System**: The complete analytics infrastructure including frontend collectors, backend processors, database storage, and admin dashboards
- **Forensic_Fingerprint**: Immutable hardware signature derived from GPU, canvas, audio context, and device characteristics
- **Identity_Resolution**: Process of linking anonymous visitor profiles to known entities through autofill detection and behavioral correlation
- **Behavioral_Biometrics**: Mouse velocity, typing cadence, and entropy scores used for bot detection
- **Entity_Dossier**: Detailed visitor profile viewer showing hardware DNA, activity timeline, and threat assessment
- **Real_Time_Pipeline**: SSE-based event broadcasting system for live dashboard updates
- **Hardware_Hash**: Unique identifier computed from device fingerprint for cross-session tracking
- **Confidence_Score**: Probabilistic measure (0.0-1.0) of identity resolution accuracy
- **Threat_Matrix**: Geospatial visualization of visitor locations with risk classification
- **Session_UUID**: Database foreign key linking sessions to visitor profiles
- **Visitor_Profile**: Core entity representing a unique device/browser combination
- **Known_Entity**: Resolved identity with email, name, and confidence score
- **Retroactive_Linking**: Process of associating historical anonymous sessions with newly resolved identities


## Requirements

### Requirement 1: Frontend Tracking Data Collection Verification

**User Story:** As a tracking system auditor, I want to verify that all forensic data is correctly collected on the frontend, so that I can ensure complete device fingerprinting.

#### Acceptance Criteria

1. WHEN a visitor loads any page, THE Tracking_System SHALL initialize within 2 seconds using requestIdleCallback
2. WHEN forensic data collection executes, THE Forensic_Fingerprint SHALL include GPU vendor, GPU renderer, canvas hash, audio context hash, CPU cores, memory estimate, timezone, and WebRTC local IPs
3. WHEN the fingerprint is generated, THE Tracking_System SHALL compute a consistent hash from the forensic data using MurmurHash3
4. WHEN behavioral tracking starts, THE Tracking_System SHALL capture mouse movements (sampled every 1 second), keystroke intervals, and click counts
5. WHEN a heartbeat fires (every 15 seconds), THE Tracking_System SHALL calculate mouse velocity (pixels/second), typing cadence (milliseconds), and entropy score (0-100)
6. WHEN tracking is bypassed (admin mode), THE Tracking_System SHALL skip all tracking calls if localStorage contains 'portfolio_admin_bypass' = 'true'
7. FOR ALL forensic data collection, THE Tracking_System SHALL handle failures gracefully without blocking page rendering
8. WHEN page navigation occurs, THE Tracking_System SHALL track page views with full URL, referrer, and timestamp


### Requirement 2: Backend Tracking Endpoint Processing Verification

**User Story:** As a tracking system auditor, I want to verify that the backend correctly processes all tracking actions, so that I can ensure data integrity from frontend to database.

#### Acceptance Criteria

1. WHEN the backend receives an 'init' action, THE Tracking_System SHALL validate the payload with Zod schema, extract geolocation from IP address, detect bots using user agent patterns, and create/update visitor_profiles and visitor_sessions tables
2. WHEN forensic fingerprint data is provided, THE Tracking_System SHALL upsert the fingerprint_dna table with hash_id as primary key
3. WHEN the backend receives an 'event' action, THE Tracking_System SHALL insert into visitor_events table with session_uuid foreign key
4. WHEN the backend receives a 'heartbeat' action, THE Tracking_System SHALL update visitor_sessions.last_heartbeat and insert behavioral_biometrics if biometrics data is provided
5. WHEN the backend receives a 'pageview' action, THE Tracking_System SHALL insert a page_view event into visitor_events
6. WHEN the backend receives an 'identify' action, THE Tracking_System SHALL upsert known_entities table, link visitor_profiles via likely_entity_id, perform retroactive linking using hardware_hash, calculate confidence scores, and log identity_signals
7. WHEN any tracking action completes, THE Tracking_System SHALL broadcast real-time events via SSE to admin dashboards with 400ms delay for database consistency
8. WHEN rate limiting is exceeded, THE Tracking_System SHALL return HTTP 429 status
9. WHEN Zod validation fails, THE Tracking_System SHALL return HTTP 400 with error details
10. FOR ALL database operations, THE Tracking_System SHALL use parameterized queries to prevent SQL injection


### Requirement 3: Database Schema Integrity Verification

**User Story:** As a tracking system auditor, I want to verify that all 8 tracking tables are correctly structured with proper relationships, so that I can ensure data consistency and referential integrity.

#### Acceptance Criteria

1. THE Tracking_System SHALL maintain the visitor_profiles table with columns: id (UUID primary key), visitor_id (unique), ip_address, browser, os, device_type, screen_size, country, city, region, isp, org, latitude, longitude, first_seen, last_seen, visit_count, is_owner, is_bot, fingerprint, gpu_vendor, gpu_renderer, cpu_cores, memory_estimate, max_touch_points, timezone_offset, device_model, timezone_name, languages, platform, network_downlink, hardware_hash, likely_entity_id (foreign key to known_entities)
2. THE Tracking_System SHALL maintain the visitor_sessions table with columns: id (UUID primary key), visitor_uuid (foreign key to visitor_profiles.id), session_id (unique), ip_address, start_time, last_heartbeat, referrer, utm_source, utm_medium, utm_campaign, entry_page, network_type
3. THE Tracking_System SHALL maintain the visitor_events table with columns: id (UUID primary key), session_uuid (foreign key to visitor_sessions.id), event_type, event_label, event_value, path, timestamp
4. THE Tracking_System SHALL maintain the fingerprint_dna table with columns: hash_id (primary key), gpu_renderer, canvas_hash, audio_context_hash, cpu_cores, memory_gb, screen_resolution, last_seen
5. THE Tracking_System SHALL maintain the known_entities table with columns: entity_id (UUID primary key), real_name, email (unique), role, notes, confidence_score, resolution_sources (array), total_visits, first_seen, last_seen, aliases (array), linkedin_url, updated_at
6. THE Tracking_System SHALL maintain the behavioral_biometrics table with columns: id (UUID primary key), session_id, session_uuid (foreign key to visitor_sessions.id), avg_mouse_velocity, typing_cadence_ms, entropy_score, is_bot_verified, recorded_at
7. THE Tracking_System SHALL maintain the identity_clusters table with columns: cluster_id (UUID primary key), fingerprint_hash (unique), primary_entity_id (foreign key to known_entities.entity_id), confidence_score, created_at, updated_at
8. THE Tracking_System SHALL maintain the identity_signals table with columns: signal_id (UUID primary key), entity_id (foreign key to known_entities.entity_id), visitor_id, signal_type, signal_weight, signal_value, recorded_at
9. WHEN foreign key relationships are queried, THE Tracking_System SHALL maintain referential integrity across all table joins
10. WHEN indexes are checked, THE Tracking_System SHALL have indexes on: visitor_profiles.visitor_id, visitor_profiles.hardware_hash, visitor_profiles.likely_entity_id, visitor_sessions.session_id, visitor_sessions.visitor_uuid, visitor_events.session_uuid, visitor_events.event_type, known_entities.email, identity_clusters.fingerprint_hash


### Requirement 4: Identity Resolution Accuracy Verification

**User Story:** As a tracking system auditor, I want to verify that identity resolution correctly links anonymous visitors to known entities, so that I can ensure accurate visitor attribution.

#### Acceptance Criteria

1. WHEN autofill detection captures email and name from the Contact form, THE Tracking_System SHALL send an 'identify' action with source='autofill' or 'autofill_nav'
2. WHEN an identify action is processed, THE Tracking_System SHALL upsert known_entities table with email as unique key and merge aliases array
3. WHEN a visitor profile is linked to an entity, THE Tracking_System SHALL update visitor_profiles.likely_entity_id with the entity_id
4. WHEN retroactive linking executes, THE Tracking_System SHALL find all visitor_profiles with matching hardware_hash and update their likely_entity_id
5. WHEN confidence score is calculated, THE Tracking_System SHALL use base weights: autofill=0.3, form_submit=0.5, manual=0.4, plus device correlation bonus (0.15 per device, max 0.3) and IP correlation bonus (0.05 per IP, max 0.1)
6. WHEN identity signals are logged, THE Tracking_System SHALL insert into identity_signals table with entity_id, visitor_id, signal_type, signal_weight, and signal_value
7. WHEN known_entities is updated, THE Tracking_System SHALL recalculate total_visits by summing visit_count from all linked visitor_profiles
8. WHEN identity_clusters is updated, THE Tracking_System SHALL upsert with fingerprint_hash as unique key and update confidence_score to maximum of existing or new value
9. WHEN the same email is identified multiple times, THE Tracking_System SHALL preserve the highest confidence_score and merge resolution_sources arrays
10. FOR ALL identity resolution operations, THE Tracking_System SHALL complete within 500ms to maintain real-time responsiveness


### Requirement 5: Real-Time Event Broadcasting Verification

**User Story:** As a tracking system auditor, I want to verify that real-time events are correctly broadcast to admin dashboards, so that I can ensure live analytics updates.

#### Acceptance Criteria

1. WHEN a tracking action completes successfully, THE Real_Time_Pipeline SHALL broadcast an 'ANALYTICS:SIGNAL' event via SSE to all connected admin clients
2. WHEN a VISITOR_INIT event is broadcast, THE Real_Time_Pipeline SHALL include visitorId, sessionId, city, country, device, os, browser, path, and timestamp
3. WHEN an EVENT or PAGE_VIEW is broadcast, THE Real_Time_Pipeline SHALL include sessionId, eventType, label, value, path, and timestamp
4. WHEN a HEARTBEAT is broadcast, THE Real_Time_Pipeline SHALL include sessionId, visitorId, and timestamp
5. WHEN an IDENTITY_RESOLVED event is broadcast, THE Real_Time_Pipeline SHALL include method, email, name, entityId, visitorId, confidence, and timestamp
6. WHEN database writes complete, THE Real_Time_Pipeline SHALL delay broadcasts by 400ms to ensure Neon PostgreSQL commit consistency
7. WHEN SSE connections are established, THE Real_Time_Pipeline SHALL maintain persistent connections with automatic reconnection on failure
8. WHEN admin clients receive events, THE Tracking_System SHALL use React Query cache patching for EVENT/PAGE_VIEW and full invalidation for VISITOR_INIT/IDENTITY_RESOLVED
9. WHEN broadcast failures occur, THE Tracking_System SHALL log errors but continue processing without blocking the tracking pipeline
10. FOR ALL real-time events, THE Real_Time_Pipeline SHALL deliver within 500ms of the triggering action


### Requirement 6: Analytics Dashboard Data Retrieval Verification

**User Story:** As a tracking system auditor, I want to verify that the stats API correctly aggregates and returns analytics data, so that I can ensure dashboard accuracy.

#### Acceptance Criteria

1. WHEN the stats API is called without action parameter, THE Tracking_System SHALL return core stats: liveNow (visitors in last 2 minutes), totalVisitors (unique IPs), totalSessions, pageViews7d, botSessions
2. WHEN the stats API is called, THE Tracking_System SHALL return deviceBreakdown grouped by device_model or device_type with counts
3. WHEN the stats API is called, THE Tracking_System SHALL return browserBreakdown grouped by browser with counts
4. WHEN the stats API is called, THE Tracking_System SHALL return topLocations with country, city, region, latitude, longitude, count, and last_active
5. WHEN the stats API is called, THE Tracking_System SHALL return topReferrers excluding localhost with counts
6. WHEN the stats API is called, THE Tracking_System SHALL return topUTMs grouped by utm_source with counts
7. WHEN the stats API is called, THE Tracking_System SHALL return topPages grouped by path with counts
8. WHEN the stats API is called, THE Tracking_System SHALL return recentVisitors (last 100) with full profile data, linked entity data, total_clicks, total_pageviews, last_referrer, last_path, duration_seconds, and visit_log (JSON array of last 10 sessions per visitor)
9. WHEN the stats API is called, THE Tracking_System SHALL return recentActions (last 100 events) with timestamp, event_type, event_label, path, city, country, os, browser, ip_address, is_bot
10. WHEN the stats API is called, THE Tracking_System SHALL return mapNodes with id, city, country, latitude, longitude, last_active, count, is_bot, is_owner for geospatial visualization
11. WHEN action='visitor_detail' is called, THE Tracking_System SHALL return profile, sessions, events, historical IPs, fingerprint matches, and IP matches for the specified visitorId
12. WHEN action='entities' is called, THE Tracking_System SHALL return all known_entities with aggregated linked_device_count, total_sessions, known_ips, known_devices, known_locations, browsers_used, os_used, and identity_signals
13. WHEN action='biometric_radar' is called, THE Tracking_System SHALL return behavioral_biometrics data with entropy_score, avg_mouse_velocity, typing_cadence_ms, is_bot_verified, session_id, city, country, is_bot, real_name, visitor_id
14. WHEN action='read_funnel' is called, THE Tracking_System SHALL return global funnel stages (blog_open, read_depth_25pct, read_depth_50pct, read_depth_75pct, read_depth_100pct, blog_finish, blog_bounce) with unique visitor counts
15. WHEN action='entity_graph' is called, THE Tracking_System SHALL return entities and device_nodes for cross-device identity visualization
16. FOR ALL stats queries, THE Tracking_System SHALL complete within 2 seconds to maintain dashboard responsiveness


### Requirement 7: Admin Dashboard Component Integration Verification

**User Story:** As a tracking system auditor, I want to verify that all admin dashboard components correctly display tracking data, so that I can ensure visual accuracy and usability.

#### Acceptance Criteria

1. WHEN the Analytics component loads, THE Tracking_System SHALL display core metrics cards showing liveNow, totalVisitors, totalSessions, pageViews7d, botSessions with appropriate icons and colors
2. WHEN the Global Threat Matrix renders, THE Tracking_System SHALL display a Leaflet map with marker clustering, custom forensic markers colored by threat level (green=safe, blue=datacenter, red=bot, orange=admin), and hub nodes for top locations
3. WHEN a map marker is clicked, THE Tracking_System SHALL display a popup with entity ID, location, session count, and threat classification
4. WHEN a location is selected on the map, THE Tracking_System SHALL filter the visitor list to show only visitors from that city and country
5. WHEN the Behavioral Stream renders, THE Tracking_System SHALL display recent actions with event type icons, city, IP address, timestamp, and path
6. WHEN the visitor filter is changed, THE Tracking_System SHALL filter visitors by: all, humans (not bots), resolved (has email/name), recurring (no identity but visit_count > 2), bots
7. WHEN the sort option is changed, THE Tracking_System SHALL sort visitors by: last_seen (default), first_seen, sessions (visit_count), threat (calculated threat level)
8. WHEN a visitor row is clicked, THE Entity_Dossier SHALL open as a draggable modal showing profile, timeline, engagement, and threat tabs
9. WHEN the Entity_Dossier profile tab is active, THE Entity_Dossier SHALL display identity link, location, timezone, OS, browser, device class, display resolution, processor, GPU, memory, power state, and network uplink
10. WHEN the Entity_Dossier timeline tab is active, THE Entity_Dossier SHALL display visit log with visit number, date/time, duration, event count, and referrer for each session
11. WHEN the Entity_Dossier engagement tab is active, THE Entity_Dossier SHALL display page views, total clicks, sessions, total time, pages visited, and blog reads with completion status
12. WHEN the Entity_Dossier threat tab is active, THE Entity_Dossier SHALL display bot detection status, connection security, language locale, user agent, and risk score as a circular progress indicator
13. WHEN the BehavioralRadar component renders, THE Tracking_System SHALL display a scatter plot with entropy_score on X-axis and avg_mouse_velocity on Y-axis, with bot suspects colored red and organic humans colored green
14. WHEN the ReadFunnel component renders, THE Tracking_System SHALL display a funnel visualization showing drop-off rates at each scroll depth milestone
15. WHEN the EntityGraph component renders, THE Tracking_System SHALL display a network graph showing entities as central nodes and linked devices as connected nodes
16. WHEN the ActiveSwimlane component renders, THE Tracking_System SHALL display real-time visitor activity in a timeline format
17. FOR ALL dashboard components, THE Tracking_System SHALL use skeleton loaders during initial data fetch and show stale data immediately on subsequent loads while revalidating in background


### Requirement 8: Cross-Page Tracking Consistency Verification

**User Story:** As a tracking system auditor, I want to verify that tracking works consistently across all pages, so that I can ensure complete visitor journey capture.

#### Acceptance Criteria

1. WHEN a visitor navigates to any public page (/, /blogs, /blogs/:slug, /contact), THE Tracking_System SHALL initialize tracking and send an 'init' action on first page load
2. WHEN a visitor navigates between pages, THE Tracking_System SHALL track page views with the useAnalytics hook triggered by React Router location changes
3. WHEN a visitor interacts with the Contact form, THE Tracking_System SHALL detect autofill events and send 'identify' actions with captured email and name
4. WHEN a visitor reads a blog post, THE Tracking_System SHALL track blog_open, read_depth milestones (25%, 50%, 75%, 100%), section_view events, and blog_finish or blog_bounce events
5. WHEN a visitor clicks on elements, THE Tracking_System SHALL track click events with element details
6. WHEN a visitor's session remains active, THE Tracking_System SHALL send heartbeat actions every 15 seconds with updated behavioral biometrics
7. WHEN a visitor returns after session expiration, THE Tracking_System SHALL create a new session with the same visitor_id but new session_id
8. WHEN admin bypass is enabled, THE Tracking_System SHALL skip all tracking on all pages
9. WHEN tracking initialization fails, THE Tracking_System SHALL fail silently without breaking page functionality
10. FOR ALL pages, THE Tracking_System SHALL maintain consistent visitor_id in localStorage and session_id in sessionStorage


### Requirement 9: Performance and Scalability Verification

**User Story:** As a tracking system auditor, I want to verify that the tracking system meets performance requirements, so that I can ensure it doesn't degrade user experience.

#### Acceptance Criteria

1. WHEN tracking initializes on page load, THE Tracking_System SHALL use requestIdleCallback to defer non-critical work and complete within 2 seconds
2. WHEN forensic data collection executes, THE Tracking_System SHALL not block main thread rendering or user interactions
3. WHEN tracking API calls are made, THE Tracking_System SHALL use fetch with no-await pattern to avoid blocking JavaScript execution
4. WHEN behavioral tracking captures mouse movements, THE Tracking_System SHALL sample at maximum 1 event per second to limit memory usage
5. WHEN heartbeat intervals fire, THE Tracking_System SHALL limit behavioral data arrays to last 50 events to prevent memory leaks
6. WHEN the backend processes tracking actions, THE Tracking_System SHALL respond within 200ms for init/event/heartbeat/pageview actions
7. WHEN the backend processes identify actions, THE Tracking_System SHALL complete retroactive linking within 500ms
8. WHEN the stats API aggregates dashboard data, THE Tracking_System SHALL complete within 2 seconds using parallel query batching
9. WHEN database queries execute, THE Tracking_System SHALL use indexes on all foreign keys and frequently queried columns
10. WHEN the admin dashboard loads, THE Tracking_System SHALL show skeleton loaders for initial load and use React Query stale-while-revalidate for subsequent loads
11. WHEN real-time events are broadcast, THE Tracking_System SHALL use selective cache patching instead of full refetches to minimize network overhead
12. FOR ALL tracking operations, THE Tracking_System SHALL maintain First Contentful Paint (FCP) < 400ms and Time to Interactive (TTI) < 2s as per product requirements


### Requirement 10: Data Accuracy and Completeness Verification

**User Story:** As a tracking system auditor, I want to verify that tracked data is accurate and complete, so that I can trust analytics insights.

#### Acceptance Criteria

1. WHEN visitor geolocation is determined, THE Tracking_System SHALL use ip-api.com with 3-second timeout and fall back to "Unknown" on failure
2. WHEN bot detection executes, THE Tracking_System SHALL check user agent against 25+ bot patterns including googlebot, bingbot, headless, crawler, spider, selenium, puppeteer, playwright
3. WHEN device fingerprints are generated, THE Tracking_System SHALL produce consistent hashes for the same device across sessions
4. WHEN hardware_hash is stored, THE Tracking_System SHALL use the same value as the fingerprint field for cross-device tracking
5. WHEN visitor profiles are updated, THE Tracking_System SHALL use COALESCE to preserve existing non-null values and only update with new non-null values
6. WHEN session duration is calculated, THE Tracking_System SHALL compute as (last_heartbeat - start_time) in seconds
7. WHEN visit_count is incremented, THE Tracking_System SHALL increment on each new session for the same visitor_id
8. WHEN confidence scores are calculated, THE Tracking_System SHALL cap at 1.0 maximum and use GREATEST to preserve highest score
9. WHEN entity aliases are merged, THE Tracking_System SHALL use ARRAY(SELECT DISTINCT unnest()) to deduplicate and filter null values
10. WHEN forensic data includes WebRTC local IPs, THE Tracking_System SHALL extract and log all non-loopback IP addresses
11. WHEN timezone detection executes, THE Tracking_System SHALL use Intl.DateTimeFormat().resolvedOptions().timeZone with fallback to timezone_offset
12. FOR ALL tracked data, THE Tracking_System SHALL validate data types and ranges before database insertion to prevent corruption


### Requirement 11: Security and Privacy Compliance Verification

**User Story:** As a tracking system auditor, I want to verify that the tracking system follows security best practices, so that I can ensure visitor data protection.

#### Acceptance Criteria

1. WHEN tracking API endpoints are accessed, THE Tracking_System SHALL enforce rate limiting to prevent abuse
2. WHEN database queries are executed, THE Tracking_System SHALL use parameterized queries exclusively to prevent SQL injection
3. WHEN user input is processed, THE Tracking_System SHALL validate all payloads with Zod schemas before processing
4. WHEN IP addresses are stored, THE Tracking_System SHALL store raw IPs for geolocation but consider hashing for production privacy compliance
5. WHEN admin authentication is required, THE Tracking_System SHALL verify JWT tokens using verifyAuth utility before returning sensitive data
6. WHEN CORS headers are set, THE Tracking_System SHALL use setCorsHeaders utility to allow only authorized origins
7. WHEN tracking is bypassed, THE Tracking_System SHALL respect localStorage 'portfolio_admin_bypass' flag to prevent admin self-tracking
8. WHEN error messages are returned, THE Tracking_System SHALL not expose sensitive database schema or internal implementation details
9. WHEN real-time events are broadcast, THE Tracking_System SHALL only send to authenticated admin connections
10. FOR ALL tracking operations, THE Tracking_System SHALL log errors server-side without exposing stack traces to clients in production


### Requirement 12: Error Handling and Resilience Verification

**User Story:** As a tracking system auditor, I want to verify that the tracking system handles errors gracefully, so that I can ensure system reliability.

#### Acceptance Criteria

1. WHEN forensic data collection fails, THE Tracking_System SHALL log warnings to console and continue with partial data
2. WHEN geolocation API fails or times out, THE Tracking_System SHALL fall back to "Unknown" location with default coordinates (28.6139, 77.209)
3. WHEN database writes fail, THE Tracking_System SHALL return HTTP 500 with generic error message and log detailed error server-side
4. WHEN real-time broadcast fails, THE Tracking_System SHALL log error but continue processing tracking action without blocking
5. WHEN React Query cache updates fail, THE Tracking_System SHALL fall back to full refetch on next query
6. WHEN SSE connections drop, THE Tracking_System SHALL automatically reconnect using useTelemetry hook
7. WHEN Zod validation fails, THE Tracking_System SHALL return HTTP 400 with validation error details
8. WHEN foreign key constraints fail, THE Tracking_System SHALL handle gracefully with ON CONFLICT clauses or conditional inserts
9. WHEN admin dashboard components fail to load data, THE Tracking_System SHALL display empty states with helpful messages
10. FOR ALL error scenarios, THE Tracking_System SHALL never crash the page or expose sensitive information to end users


### Requirement 13: Edge Case Handling Verification

**User Story:** As a tracking system auditor, I want to verify that the tracking system handles edge cases correctly, so that I can ensure robustness in unusual scenarios.

#### Acceptance Criteria

1. WHEN a visitor uses incognito mode, THE Tracking_System SHALL create a new visitor_id but potentially match via hardware_hash if the device was previously tracked
2. WHEN a visitor clears cookies/localStorage, THE Tracking_System SHALL create a new visitor_id but retroactive linking SHALL reconnect via hardware_hash when identity is resolved
3. WHEN a visitor uses VPN or proxy, THE Tracking_System SHALL track the VPN/proxy IP address and detect ISP changes across sessions
4. WHEN a visitor has JavaScript disabled, THE Tracking_System SHALL fail gracefully with no tracking but page functionality SHALL remain intact
5. WHEN a visitor uses ad blockers, THE Tracking_System SHALL attempt tracking but fail silently if blocked without breaking page functionality
6. WHEN multiple tabs are open for the same visitor, THE Tracking_System SHALL maintain the same visitor_id but create separate session_ids per tab
7. WHEN a visitor's IP address changes mid-session (mobile network switching), THE Tracking_System SHALL update visitor_profiles.ip_address on next heartbeat
8. WHEN forensic fingerprinting is blocked by browser privacy settings, THE Tracking_System SHALL collect partial data and generate a less unique fingerprint
9. WHEN the same device is used by multiple people, THE Tracking_System SHALL track as single visitor_id until identity resolution differentiates them
10. WHEN database connection fails temporarily, THE Tracking_System SHALL return HTTP 500 and client SHALL retry with exponential backoff
11. WHEN geolocation returns [0,0] coordinates, THE Tracking_System SHALL skip map marker creation to avoid invalid data points
12. FOR ALL edge cases, THE Tracking_System SHALL log detailed diagnostics server-side for debugging while maintaining user experience


### Requirement 14: Audit Testing Methodology Verification

**User Story:** As a tracking system auditor, I want to define comprehensive testing procedures, so that I can systematically verify all tracking system components.

#### Acceptance Criteria

1. THE Tracking_System SHALL provide SQL verification queries to check table schemas, indexes, foreign keys, and row counts for all 8 tracking tables
2. THE Tracking_System SHALL provide test procedures to simulate visitor journeys: first visit, return visit, identity resolution, cross-device tracking
3. THE Tracking_System SHALL provide performance benchmarks to measure: frontend initialization time, API response times, database query times, real-time broadcast latency
4. THE Tracking_System SHALL provide data integrity checks to verify: foreign key relationships, confidence score calculations, retroactive linking accuracy, duplicate prevention
5. THE Tracking_System SHALL provide dashboard validation procedures to verify: map marker rendering, visitor list filtering/sorting, entity dossier data accuracy, real-time updates
6. THE Tracking_System SHALL provide identity resolution test cases to verify: autofill detection, confidence scoring, retroactive linking, alias merging
7. THE Tracking_System SHALL provide behavioral biometrics validation to verify: mouse velocity calculations, typing cadence measurements, entropy score accuracy, bot detection
8. THE Tracking_System SHALL provide real-time pipeline tests to verify: SSE connection establishment, event broadcasting, cache patching, reconnection logic
9. THE Tracking_System SHALL provide cross-page tracking tests to verify: visitor_id persistence, session_id generation, page view tracking, event tracking
10. THE Tracking_System SHALL provide security audit procedures to verify: SQL injection prevention, XSS protection, rate limiting, authentication enforcement
11. THE Tracking_System SHALL provide error simulation tests to verify: network failures, database errors, validation failures, timeout handling
12. FOR ALL test procedures, THE Tracking_System SHALL document expected results and acceptance criteria for pass/fail determination


### Requirement 15: Audit Reporting and Documentation Verification

**User Story:** As a tracking system auditor, I want to generate comprehensive audit reports, so that I can document findings and recommendations.

#### Acceptance Criteria

1. THE Tracking_System SHALL generate an audit report documenting: system architecture overview, data flow diagrams, component inventory, database schema documentation
2. THE Tracking_System SHALL document test results for: frontend tracking verification, backend processing verification, database integrity verification, dashboard accuracy verification
3. THE Tracking_System SHALL document performance metrics for: page load impact, API response times, database query performance, real-time latency measurements
4. THE Tracking_System SHALL document data accuracy findings for: geolocation accuracy, bot detection accuracy, identity resolution accuracy, fingerprint uniqueness
5. THE Tracking_System SHALL document security audit results for: vulnerability assessment, authentication verification, input validation testing, rate limiting effectiveness
6. THE Tracking_System SHALL document identified issues with: severity classification (critical/high/medium/low), affected components, reproduction steps, recommended fixes
7. THE Tracking_System SHALL document optimization opportunities for: query optimization, index improvements, caching strategies, code refactoring
8. THE Tracking_System SHALL document compliance considerations for: privacy regulations (GDPR/CCPA), data retention policies, user consent mechanisms, data anonymization
9. THE Tracking_System SHALL provide recommendations for: system improvements, feature enhancements, monitoring strategies, maintenance procedures
10. FOR ALL audit documentation, THE Tracking_System SHALL include: executive summary, detailed findings, test evidence, actionable recommendations, implementation priorities


### Requirement 16: Data Serialization and Query Round-Trip Verification

**User Story:** As a tracking system auditor, I want to verify that data serialization and database queries maintain data integrity, so that I can ensure no data corruption occurs during storage and retrieval.

#### Acceptance Criteria

1. WHEN forensic data is serialized to JSON for database storage, THE Tracking_System SHALL preserve all data types and nested structures
2. WHEN forensic data is retrieved from the database, THE Tracking_System SHALL deserialize JSON back to original structure with identical values
3. WHEN JSONB metadata is stored in visitor_events, THE Tracking_System SHALL support querying nested fields using PostgreSQL JSONB operators
4. WHEN arrays are stored (aliases, resolution_sources, known_ips), THE Tracking_System SHALL use PostgreSQL array types and preserve order and duplicates as intended
5. WHEN timestamps are stored, THE Tracking_System SHALL use PostgreSQL TIMESTAMP type and preserve timezone information
6. WHEN UUIDs are generated for primary keys, THE Tracking_System SHALL use gen_random_uuid() for cryptographically secure identifiers
7. WHEN confidence scores are calculated and stored, THE Tracking_System SHALL maintain precision to 2 decimal places and enforce range [0.0, 1.0]
8. WHEN visitor data is retrieved and displayed in dashboard, THE Tracking_System SHALL render all fields correctly without data loss or type coercion errors
9. WHEN complex aggregations are performed (entity profiles with CTEs), THE Tracking_System SHALL produce accurate counts, arrays, and computed fields
10. FOR ALL data round-trips (write → read → display), THE Tracking_System SHALL maintain data integrity with zero corruption or loss


## Requirements Summary

This requirements document defines 16 comprehensive requirement areas covering the complete tracking system audit:

1. **Frontend Tracking Data Collection** - Forensic fingerprinting, behavioral tracking, initialization
2. **Backend Tracking Endpoint Processing** - Action handling, database writes, real-time broadcasting
3. **Database Schema Integrity** - 8 tables, foreign keys, indexes, referential integrity
4. **Identity Resolution Accuracy** - Autofill detection, confidence scoring, retroactive linking
5. **Real-Time Event Broadcasting** - SSE pipeline, event types, cache management
6. **Analytics Dashboard Data Retrieval** - Stats API, aggregations, query performance
7. **Admin Dashboard Component Integration** - Visual accuracy, user interactions, data display
8. **Cross-Page Tracking Consistency** - Journey capture, session management, visitor persistence
9. **Performance and Scalability** - Load times, query optimization, memory management
10. **Data Accuracy and Completeness** - Geolocation, bot detection, fingerprint consistency
11. **Security and Privacy Compliance** - Authentication, validation, rate limiting, data protection
12. **Error Handling and Resilience** - Graceful degradation, fallbacks, error logging
13. **Edge Case Handling** - Incognito mode, VPNs, ad blockers, network changes
14. **Audit Testing Methodology** - Test procedures, benchmarks, validation checks
15. **Audit Reporting and Documentation** - Findings, metrics, recommendations
16. **Data Serialization and Round-Trip** - JSON integrity, type preservation, query accuracy

The audit will systematically verify each requirement through a combination of:
- SQL queries to validate database structure and data integrity
- Automated test scripts to simulate visitor journeys and edge cases
- Performance benchmarking to measure response times and resource usage
- Manual testing of dashboard components and user interactions
- Security scanning for vulnerabilities and compliance issues
- Documentation review for completeness and accuracy

All requirements follow EARS patterns and INCOSE quality rules to ensure testability, clarity, and completeness.
