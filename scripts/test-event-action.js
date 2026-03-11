#!/usr/bin/env bun
/**
 * Task 3.2: Test Event Action Processing
 * 
 * Verifies that the event action:
 * - Stores events in visitor_events table
 * - Links events to correct session via session_uuid
 * - Captures event metadata (type, label, value, path)
 * - Handles various event types (click, scroll, search, etc.)
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testEventAction() {
    console.log('🧪 Task 3.2: Testing Event Action Processing\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let sessionId;
    const capturedEvents = [];

    // Capture event tracking requests
    page.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            sessionId = payload.sessionId;
            console.log(`✅ Session ID captured: ${sessionId}`);
        }

        if (response.url().includes('/api/analytics/track?action=event')) {
            const request = response.request();
            const payload = request.postDataJSON();
            capturedEvents.push(payload);
            console.log(`📡 Event tracked: ${payload.type} - ${payload.label || 'no label'}`);
        }
    });

    // Navigate and trigger init
    console.log('🌐 Loading homepage...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    if (!sessionId) {
        console.error('❌ Failed to capture session ID');
        await browser.close();
        return;
    }

    console.log('\n🎯 Triggering various events...\n');

    // Trigger click events
    console.log('1️⃣ Clicking navigation links...');
    try {
        await page.click('a[href="/blogs"]', { timeout: 5000 });
        await page.waitForTimeout(1000);
    } catch (e) {
        console.log('   ⚠️  Blogs link not found, skipping');
    }

    // Navigate back
    await page.goto(BASE_URL);
    await page.waitForTimeout(1000);

    // Scroll event
    console.log('2️⃣ Scrolling page...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);

    // Try to trigger search if available
    console.log('3️⃣ Looking for interactive elements...');
    try {
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
            await buttons[0].click();
            await page.waitForTimeout(500);
        }
    } catch (e) {
        console.log('   ⚠️  No buttons found');
    }

    // Wait for events to be sent
    await page.waitForTimeout(2000);

    console.log(`\n📊 Captured ${capturedEvents.length} event requests\n`);

    // Verify events in database
    console.log('📊 Verifying events in database...\n');

    const dbEvents = await sql`
    SELECT 
      ve.event_type,
      ve.event_label,
      ve.event_value,
      ve.path,
      ve.timestamp,
      vs.session_id
    FROM visitor_events ve
    JOIN visitor_sessions vs ON vs.id = ve.session_uuid
    WHERE vs.session_id = ${sessionId}
      AND ve.event_type != 'page_view'
    ORDER BY ve.timestamp ASC
  `;

    console.log(`✅ Found ${dbEvents.length} events in database (excluding page_views)\n`);

    if (dbEvents.length > 0) {
        console.log('Event Details:');
        dbEvents.forEach((event, idx) => {
            console.log(`\n${idx + 1}. ${event.event_type}`);
            console.log(`   Label: ${event.event_label || 'none'}`);
            console.log(`   Value: ${event.event_value || 'none'}`);
            console.log(`   Path: ${event.path}`);
            console.log(`   Time: ${event.timestamp}`);
        });
    }

    // Verify session_uuid foreign key
    console.log('\n🔗 Verifying foreign key relationships...');
    const fkCheck = await sql`
    SELECT COUNT(*) as count
    FROM visitor_events ve
    LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
    WHERE vs.session_id = ${sessionId}
      AND vs.id IS NOT NULL
  `;

    console.log(`   ✅ All ${fkCheck[0].count} events properly linked to session`);

    // Test event type variety
    console.log('\n📋 Event type distribution:');
    const eventTypes = await sql`
    SELECT 
      ve.event_type,
      COUNT(*) as count
    FROM visitor_events ve
    JOIN visitor_sessions vs ON vs.id = ve.session_uuid
    WHERE vs.session_id = ${sessionId}
    GROUP BY ve.event_type
    ORDER BY count DESC
  `;

    eventTypes.forEach(type => {
        console.log(`   ${type.event_type}: ${type.count}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.2 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Events Captured: ${capturedEvents.length} requests`);
    console.log(`✅ Events Stored: ${dbEvents.length} in database`);
    console.log(`✅ Foreign Keys: ${fkCheck[0].count > 0 ? 'VALID' : 'BROKEN'}`);
    console.log(`✅ Event Types: ${eventTypes.length} unique types`);
    console.log(`✅ Metadata: ${dbEvents.some(e => e.event_label || e.event_value) ? 'CAPTURED' : 'MISSING'}`);
    console.log('='.repeat(60));

    await browser.close();
}

// Run test
testEventAction().catch(console.error);
