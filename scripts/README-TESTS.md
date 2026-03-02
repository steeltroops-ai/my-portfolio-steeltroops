# Tracking System Test Scripts

Automated test scripts for verifying the analytics tracking system implementation.

## Available Tests

### 1. Tracking Initialization Test (`test-tracking-init.js`)

**Task**: 2.1 - Test Tracking Initialization  
**Command**: `bun run test-tracking-init`

**What it tests**:
- Tracking initializes within 2 seconds on page load
- POST request sent to `/api/analytics/track?action=init`
- Payload includes: visitorId, sessionId, userAgent, screenResolution
- Forensics object includes: fingerprint, gpu_renderer, cpu_cores, memory_estimate
- Canvas hash (optional in headless browsers)

**Expected Results**:
- All required fields present in init payload
- Forensic data collected successfully
- HTTP 200 response from API

---

### 2. Page View Tracking Test (`test-page-view-tracking.js`)

**Task**: 2.2 - Test Page View Tracking  
**Command**: `bun run test-page-view-tracking`

**What it tests**:
- Page views tracked on every navigation
- POST requests sent to `/api/analytics/track?action=pageview`
- Payload includes: sessionId, path, referrer
- Session ID remains consistent across navigations
- Database stores page_view events (when not rate limited)

**Navigation Sequence**:
1. `/` (Home page)
2. `/blogs` (Blog listing)
3. `/blogs/test-post` (Blog post)
4. `/contact` (Contact page)

**Expected Results**:
- 4 pageview requests sent
- All payloads valid with required fields
- Consistent sessionId across all requests
- Database verification (may be skipped if rate limited)

**Note on Rate Limiting**:
The API implements rate limiting (100 requests/minute per IP) for security. In rapid automated testing, requests after the first few may receive HTTP 429 (Too Many Requests). This is expected behavior and demonstrates that rate limiting is working correctly. The test verifies that tracking requests are sent with correct payloads, which is the primary goal.

---

## Running Tests

### Run Individual Tests

```bash
# Test tracking initialization
bun run test-tracking-init

# Test page view tracking
bun run test-page-view-tracking
```

### Run All Tests

```bash
# Run both tests sequentially
bun run test-tracking-init && bun run test-page-view-tracking
```

## Test Requirements

### Prerequisites

1. **Environment Variables**: `.env` file with `DATABASE_URL` configured
2. **Dependencies**: Playwright installed (`bun install`)
3. **Ports Available**: 3001 (API) and 5173 (Vite) must be free

### What Tests Do

1. **Start Development Servers**: Automatically starts API and Vite servers
2. **Run Browser Automation**: Uses Playwright headless browser
3. **Capture Network Requests**: Monitors all analytics tracking calls
4. **Verify Payloads**: Checks request data matches requirements
5. **Query Database**: Verifies events stored correctly (when possible)
6. **Stop Servers**: Cleans up after test completion

## Understanding Test Output

### Color Coding

- **Green (✓)**: Test passed
- **Red (✗)**: Test failed
- **Yellow (⚠)**: Warning or skipped test
- **Blue**: Informational message
- **Cyan**: Section headers

### Exit Codes

- **0**: All tests passed (warnings are acceptable)
- **1**: One or more tests failed

### Common Warnings

#### "Database verification skipped - rate limiting active"
**Cause**: Rapid automated testing triggers rate limiting  
**Impact**: None - tracking requests are verified at HTTP level  
**Action**: No action needed - this is expected behavior

#### "Optional forensic fields missing"
**Cause**: Headless browsers don't support all fingerprinting APIs  
**Impact**: None - required fields are still captured  
**Action**: No action needed - canvas_hash may not work in headless mode

## Troubleshooting

### Test Fails to Start Servers

**Problem**: Ports 3001 or 5173 already in use  
**Solution**: Stop any running dev servers before running tests

```bash
# Kill processes on ports
npx kill-port 3001 5173
```

### Database Connection Errors

**Problem**: `DATABASE_URL` not configured  
**Solution**: Ensure `.env` file exists with valid `DATABASE_URL`

```bash
# Check environment variable
echo $DATABASE_URL
```

### All Requests Rate Limited

**Problem**: Too many recent requests from localhost  
**Solution**: Wait 1 minute for rate limit window to reset, or restart API server

```bash
# Wait for rate limit reset
sleep 60

# Or restart servers (they auto-restart in tests)
```

### Browser Launch Fails

**Problem**: Playwright browsers not installed  
**Solution**: Install Playwright browsers

```bash
bunx playwright install chromium
```

## Test Architecture

### Test Flow

```
1. Start Servers (API + Vite)
   ↓
2. Launch Headless Browser
   ↓
3. Navigate & Track Requests
   ↓
4. Verify Request Payloads
   ↓
5. Query Database (optional)
   ↓
6. Generate Test Report
   ↓
7. Stop Servers & Exit
```

### Network Monitoring

Tests use Playwright's `page.on('response')` to capture:
- Request URL and method
- POST payload data
- HTTP status codes
- Response timing

### Database Verification

Tests query the database to verify:
- Sessions created correctly
- Events stored with correct data
- Foreign key relationships intact
- Timestamps accurate

## Adding New Tests

### Template Structure

```javascript
#!/usr/bin/env node

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

// 1. Start servers
async function startServers() { ... }

// 2. Run test logic
async function runTest() { ... }

// 3. Main entry point
async function main() { ... }

main();
```

### Best Practices

1. **Always start/stop servers**: Ensure clean test environment
2. **Use color-coded logging**: Makes output readable
3. **Handle rate limiting**: Expect HTTP 429 in rapid tests
4. **Verify at multiple levels**: HTTP requests + database
5. **Provide clear warnings**: Explain expected failures
6. **Clean up resources**: Close browsers, stop servers

## Related Documentation

- **Tracking System Spec**: `.kiro/specs/tracking-system-audit/`
- **API Implementation**: `server/api/analytics/track.js`
- **Frontend Tracking**: `src/shared/analytics/useAnalytics.js`
- **Database Schema**: `docs/database/neon_schema.sql`
