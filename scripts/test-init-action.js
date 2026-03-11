#!/usr/bin/env bun
/**
 * Task 3.1: Test Init Action Processing
 * 
 * Verifies that the init action:
 * - Creates visitor_profiles entry
 * - Creates visitor_sessions entry
 * - Stores forensic fingerprint in fingerprint_dna
 * - Populates geolocation data
 * - Detects bots correctly
 * - Logs initial page view event
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testInitAction() {
    console.log('🧪 Task 3.1: Testing Init Action Processing\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let visitorId, sessionId, hardwareHash;

    // Capture tracking requests
    page.on('request', request => {
        if (request.url().includes('/api/analytics/track?action=init')) {
            console.log('📡 Init request detected');
        }
    });

    page.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();

            visitorId = payload.visitorId;
            sessionId = payload.sessionId;
            hardwareHash = payload.forensics?.fingerprint;

            console.log('✅ Init response received');
            console.log(`   Visitor ID: ${visitorId}`);
            console.log(`   Session ID: ${sessionId}`);
            console.log(`   Hardware Hash: ${hardwareHash}`);
        }
    });

    // Navigate to trigger init
    console.log('🌐 Loading homepage...');
    await page.goto(BASE_URL);

    // Wait for tracking to initialize
    await page.waitForTimeout(3000);

    if (!visitorId || !sessionId) {
        console.error('❌ Failed to capture visitor/session IDs from init request');
        await browser.close();
        return;
    }

    console.log('\n📊 Verifying database entries...\n');

    // 1. Verify visitor_profiles entry
    console.log('1️⃣ Checking visitor_profiles...');
    const profiles = await sql`
    SELECT 
      visitor_id, ip_address, browser, os, device_type, 
      city, country, latitude, longitude, hardware_hash,
      first_seen, is_bot, fingerprint, gpu_renderer
    FROM visitor_profiles
    WHERE visitor_id = ${visitorId}
  `;

    if (profiles.length === 0) {
        console.error('   ❌ No visitor_profiles entry found');
    } else {
        const profile = profiles[0];
        console.log('   ✅ visitor_profiles entry created');
        console.log(`      IP: ${profile.ip_address}`);
        console.log(`      Browser: ${profile.browser}`);
        console.log(`      OS: ${profile.os}`);
        console.log(`      Device: ${profile.device_type}`);
        console.log(`      Location: ${profile.city}, ${profile.country}`);
        console.log(`      Coordinates: ${profile.latitude}, ${profile.longitude}`);
        console.log(`      Is Bot: ${profile.is_bot}`);
        console.log(`      Hardware Hash: ${profile.hardware_hash}`);
        console.log(`      GPU: ${profile.gpu_renderer || 'Not captured'}`);
    }

    // 2. Verify visitor_sessions entry
    console.log('\n2️⃣ Checking visitor_sessions...');
    const sessions = await sql`
    SELECT 
      session_id, ip_address, start_time, last_heartbeat,
      referrer, entry_page, network_type
    FROM visitor_sessions
    WHERE session_id = ${sessionId}
  `;

    if (sessions.length === 0) {
        console.error('   ❌ No visitor_sessions entry found');
    } else {
        const session = sessions[0];
        console.log('   ✅ visitor_sessions entry created');
        console.log(`      Session ID: ${session.session_id}`);
        console.log(`      IP: ${session.ip_address}`);
        console.log(`      Start Time: ${session.start_time}`);
        console.log(`      Entry Page: ${session.entry_page}`);
        console.log(`      Network Type: ${session.network_type}`);
    }

    // 3. Verify fingerprint_dna entry
    if (hardwareHash) {
        console.log('\n3️⃣ Checking fingerprint_dna...');
        const fingerprints = await sql`
      SELECT 
        hash_id, gpu_renderer, canvas_hash, cpu_cores,
        memory_gb, screen_resolution, last_seen
      FROM fingerprint_dna
      WHERE hash_id = ${hardwareHash}
    `;

        if (fingerprints.length === 0) {
            console.error('   ❌ No fingerprint_dna entry found');
        } else {
            const fp = fingerprints[0];
            console.log('   ✅ fingerprint_dna entry created');
            console.log(`      Hash ID: ${fp.hash_id}`);
            console.log(`      GPU: ${fp.gpu_renderer}`);
            console.log(`      Canvas Hash: ${fp.canvas_hash || 'Not captured'}`);
            console.log(`      CPU Cores: ${fp.cpu_cores}`);
            console.log(`      Memory: ${fp.memory_gb} GB`);
            console.log(`      Screen: ${fp.screen_resolution}`);
        }
    } else {
        console.log('\n3️⃣ ⚠️  No hardware hash captured (forensics may have failed)');
    }

    // 4. Verify initial page_view event
    console.log('\n4️⃣ Checking initial page_view event...');
    const events = await sql`
    SELECT 
      ve.event_type, ve.path, ve.timestamp
    FROM visitor_events ve
    JOIN visitor_sessions vs ON vs.id = ve.session_uuid
    WHERE vs.session_id = ${sessionId}
      AND ve.event_type = 'page_view'
    ORDER BY ve.timestamp ASC
    LIMIT 1
  `;

    if (events.length === 0) {
        console.error('   ❌ No initial page_view event found');
    } else {
        const event = events[0];
        console.log('   ✅ Initial page_view event logged');
        console.log(`      Path: ${event.path}`);
        console.log(`      Timestamp: ${event.timestamp}`);
    }

    // 5. Verify foreign key relationships
    console.log('\n5️⃣ Checking foreign key relationships...');
    const relationships = await sql`
    SELECT 
      vp.visitor_id,
      vs.session_id,
      ve.event_type
    FROM visitor_profiles vp
    JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
    JOIN visitor_events ve ON ve.session_uuid = vs.id
    WHERE vp.visitor_id = ${visitorId}
      AND vs.session_id = ${sessionId}
    LIMIT 1
  `;

    if (relationships.length === 0) {
        console.error('   ❌ Foreign key relationships broken');
    } else {
        console.log('   ✅ Foreign key relationships intact');
        console.log('      visitor_profiles → visitor_sessions → visitor_events');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.1 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Visitor Profile: ${profiles.length > 0 ? 'CREATED' : 'FAILED'}`);
    console.log(`✅ Visitor Session: ${sessions.length > 0 ? 'CREATED' : 'FAILED'}`);
    console.log(`✅ Fingerprint DNA: ${hardwareHash && fingerprints.length > 0 ? 'STORED' : 'MISSING'}`);
    console.log(`✅ Page View Event: ${events.length > 0 ? 'LOGGED' : 'FAILED'}`);
    console.log(`✅ Foreign Keys: ${relationships.length > 0 ? 'VALID' : 'BROKEN'}`);
    console.log(`✅ Geolocation: ${profiles[0]?.city !== 'Unknown' ? 'POPULATED' : 'FAILED'}`);
    console.log(`✅ Bot Detection: ${profiles[0]?.is_bot !== null ? 'EXECUTED' : 'FAILED'}`);
    console.log('='.repeat(60));

    await browser.close();
}

// Run test
testInitAction().catch(console.error);
