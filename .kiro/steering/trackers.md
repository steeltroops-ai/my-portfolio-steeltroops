---
inclusion: always
---

# Analytics & Tracking System

## System Purpose

**COMPREHENSIVE TRACKING SHOWCASE**: This system demonstrates how websites track users by collecting ALL possible data points. The goal is to show users exactly what data websites can collect, then display it back to them as an educational tool about web tracking.

### Component Locations
- **Client**: `src/shared/analytics/` - Fingerprinting, event tracking, behavioral tracking
- **Server**: `server/api/analytics/` - track.js (POST), stats.js (GET)
- **Real-Time**: `server/services/realtime/` - WebSocket broadcasting, SSE transport
- **Database**: `analytics_events` table in Neon PostgreSQL

## Tracking Philosophy

### TRACK EVERYTHING
This is a demonstration project to showcase tracking capabilities. Collect ALL data points:

- **All page views** - Full URL, query params, hash fragments, referrer
- **All user interactions** - Clicks, scrolls, mouse movements, hover events, rage clicks
- **All form inputs** - Keystrokes, field values, autocomplete data, typing patterns
- **All search queries** - Search terms, filters, results clicked, time spent
- **Device fingerprinting** - Canvas fingerprint, WebGL, audio context, installed fonts
- **Browser data** - User agent, plugins, screen resolution, timezone, language, battery
- **Network data** - IP address (raw, unhashed), connection type, ISP, VPN detection
- **Location data** - ISP Geolocation, timezone-based location inference
- **Session data** - Time on page, scroll depth, idle time, tab visibility
- **Behavioral data** - Typing speed, mouse patterns, interaction sequences, copy/paste events
- **Cross-session tracking** - Persistent identifiers, return visits, session replay
- **Referrer data** - Full referrer URL, UTM parameters, campaign data, social media source

### DO NOT DELETE DATA
- **Permanent storage** - Keep ALL data indefinitely (no automatic deletion)
- **No data expiration** - Historical data is valuable for demonstration
- **Full audit trail** - Track every single event, no sampling or aggregation
- **Raw data preservation** - Store unhashed, unencrypted for display back to users
- **Complete history** - Maintain full user journey across all sessions

### Educational Purpose
- Show users their complete tracking profile
- Display all collected data in a user-facing dashboard
- Allow users to see exactly what was tracked about them
- Demonstrate tracking techniques used by real websites
- Educate about digital privacy and tracking

## Implementation Patterns

### Comprehensive Client-Side Tracking
```javascript
// ✅ Track EVERYTHING - this is for demonstration
import { trackEvent } from '@/shared/analytics'

// Track page view with ALL available data
trackEvent('page_view', {
  url: window.location.href,
  path: window.location.pathname,
  query: window.location.search,
  hash: window.location.hash,
  referrer: document.referrer,
  title: document.title,
  timestamp: Date.now(),
  screenWidth: window.screen.width,
  screenHeight: window.screen.height,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  colorDepth: window.screen.colorDepth,
  pixelRatio: window.devicePixelRatio,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  languages: navigator.languages,
  platform: navigator.platform,
  userAgent: navigator.userAgent,
  cookiesEnabled: navigator.cookieEnabled,
  doNotTrack: navigator.doNotTrack,
  connection: navigator.connection?.effectiveType,
  battery: navigator.getBattery ? 'available' : 'unavailable'
})

// Track ALL form interactions
document.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', (e) => {
    trackEvent('form_input', {
      fieldName: e.target.name,
      fieldType: e.target.type,
      fieldValue: e.target.value, // ✅ Track actual values for demo
      valueLength: e.target.value.length,
      timestamp: Date.now()
    })
  })
})

// Track mouse movements (sampled)
let lastMouseTrack = 0
document.addEventListener('mousemove', (e) => {
  const now = Date.now()
  if (now - lastMouseTrack > 1000) { // Sample every second
    trackEvent('mouse_movement', {
      x: e.clientX,
      y: e.clientY,
      timestamp: now
    })
    lastMouseTrack = now
  }
})

// Track ALL clicks with full context
document.addEventListener('click', (e) => {
  trackEvent('click', {
    element: e.target.tagName,
    id: e.target.id,
    classes: e.target.className,
    text: e.target.innerText?.substring(0, 100),
    x: e.clientX,
    y: e.clientY,
    timestamp: Date.now()
  })
})

// Track scroll depth
let maxScroll = 0
window.addEventListener('scroll', () => {
  const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  if (scrollPercent > maxScroll) {
    maxScroll = scrollPercent
    trackEvent('scroll_depth', {
      percent: Math.round(scrollPercent),
      timestamp: Date.now()
    })
  }
})

// Track copy/paste events
document.addEventListener('copy', (e) => {
  trackEvent('copy', {
    text: window.getSelection().toString(),
    timestamp: Date.now()
  })
})

document.addEventListener('paste', (e) => {
  trackEvent('paste', {
    timestamp: Date.now()
  })
})
```

### Server-Side Storage (Keep Everything)
```javascript
// ✅ Store ALL data without filtering or hashing
const result = await sql`
  INSERT INTO analytics_events (
    event_type, 
    visitor_id, 
    session_id,
    ip_address,
    user_agent,
    metadata, 
    created_at
  ) VALUES (
    ${eventType}, 
    ${visitorId}, 
    ${sessionId},
    ${req.ip}, -- ✅ Store raw IP address
    ${req.headers['user-agent']}, -- ✅ Store full user agent
    ${JSON.stringify(metadata)}, -- ✅ Store ALL metadata
    NOW()
  )
`

// ✅ Never delete old data - keep everything for demonstration
// No automatic cleanup, no data expiration
```

### Advanced Fingerprinting
```javascript
// ✅ Generate comprehensive device fingerprint
async function generateFingerprint() {
  const fingerprint = {
    // Canvas fingerprinting
    canvas: getCanvasFingerprint(),
    
    // WebGL fingerprinting
    webgl: getWebGLFingerprint(),
    
    // Audio context fingerprinting
    audio: await getAudioFingerprint(),
    
    // Font detection
    fonts: detectInstalledFonts(),
    
    // Screen properties
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth
    },
    
    // Browser plugins
    plugins: Array.from(navigator.plugins).map(p => p.name),
    
    // Hardware concurrency
    cores: navigator.hardwareConcurrency,
    
    // Device memory
    memory: navigator.deviceMemory,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Language
    language: navigator.language,
    languages: navigator.languages,
    
    // Platform
    platform: navigator.platform,
    
    // Touch support
    touchSupport: 'ontouchstart' in window,
    maxTouchPoints: navigator.maxTouchPoints
  }
  
  return fingerprint
}
```

## Database Schema

### analytics_events Table (Store Everything)
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  visitor_id VARCHAR(255) NOT NULL,  -- Persistent identifier
  session_id VARCHAR(255),
  ip_address VARCHAR(45) NOT NULL,  -- Raw IP (IPv4/IPv6)
  user_agent TEXT,
  metadata JSONB,  -- Store ALL event data
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_event_type ON analytics_events(event_type);
CREATE INDEX idx_visitor_id ON analytics_events(visitor_id);
CREATE INDEX idx_session_id ON analytics_events(session_id);
CREATE INDEX idx_ip_address ON analytics_events(ip_address);
CREATE INDEX idx_created_at ON analytics_events(created_at);
CREATE INDEX idx_metadata ON analytics_events USING GIN(metadata);
```

### Comprehensive Event Types
- `page_view` - Every page load with full context
- `click` - Every click with element details
- `form_input` - Every keystroke in forms
- `form_submit` - Form submissions with all values
- `mouse_movement` - Mouse position tracking
- `scroll` - Scroll position and depth
- `copy` - Text copied by user
- `paste` - Paste events
- `search` - Search queries and results
- `video_play` - Video interactions
- `file_download` - File downloads
- `link_click` - External link clicks
- `rage_click` - Repeated clicks (frustration)
- `dead_click` - Clicks on non-interactive elements
- `session_start` - New session with full fingerprint
- `session_end` - Session end with duration
- `tab_visibility` - Tab focus/blur events
- `network_change` - Connection type changes
- `battery_change` - Battery level changes

## User-Facing Dashboard

### Show Users Their Data
```javascript
// ✅ Create a public endpoint for users to see their tracking data
app.get('/api/my-tracking-data', async (req, res) => {
  const visitorId = req.cookies.visitor_id
  
  const events = await sql`
    SELECT * FROM analytics_events
    WHERE visitor_id = ${visitorId}
    ORDER BY created_at DESC
  `
  
  res.json({
    message: "Here's everything we tracked about you",
    totalEvents: events.length,
    events: events,
    fingerprint: await generateFingerprint(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  })
})
```

### Dashboard Features
- Timeline of all tracked events
- Complete device fingerprint display
- All form inputs captured
- Mouse movement heatmap
- Scroll depth visualization
- Session replay capability
- Cross-session tracking history
- Download all data as JSON

## Real-Time Communication

### WebSocket Events
- `tracking:new_event` - Broadcast every tracked event (admin)
- `tracking:user_profile` - Complete user profile updates
- `tracking:session_active` - Active session monitoring

### No Rate Limiting on Tracking
- Accept ALL tracking events (no rate limits)
- Store everything (no sampling)
- Real-time processing (no batching delays)

## Performance Considerations

### Client-Side
- Track aggressively but don't block UI
- Use `requestIdleCallback` for heavy fingerprinting
- Batch network requests (send every 5 seconds)
- Store in IndexedDB if offline, sync when online

### Server-Side
- Optimize database writes with bulk inserts
- Use JSONB for flexible metadata storage
- Index all queryable fields
- Consider partitioning by date for large datasets

## Testing & Verification

### Verify Comprehensive Tracking
```bash
# Check all tracked events
bun run check-db

# Verify in browser console
# Should see: "Tracked: page_view", "Tracked: mouse_movement", etc.
```

### Checklist
- [ ] All page views tracked with full URL
- [ ] All clicks tracked with element details
- [ ] Form inputs captured in real-time
- [ ] Mouse movements sampled and stored
- [ ] Device fingerprint generated
- [ ] IP address stored (unhashed)
- [ ] User agent stored (full string)
- [ ] No data deletion/expiration
- [ ] User can view their own data
- [ ] Admin can see all tracking data

## Educational Disclosure

### Inform Users
- Display prominent notice: "This site tracks everything to show you how tracking works"
- Provide link to view their tracking data
- Explain what data is collected and why
- Show them their complete profile
- Educate about tracking prevention tools

### Transparency
- Open source the tracking code
- Document all tracking techniques
- Provide opt-out mechanism (for legal compliance)
- Show real-time tracking in action
- Compare to industry standard tracking
