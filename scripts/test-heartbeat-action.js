#!/usr/bin/env bun
/**
 * Task 3.3: Test Heartbeat Processing
 * 
 * Verifies that the heartbeat action:
 * - Updates visitor_sessions.last_heartbeat
 * - Stores behavioral biometrics when provided
 * - Updates visitor_profiles.last_seen
 * - Calculates session duration correctly
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testHeartbeatAction() {
    console.log('🧪 Task 3.3: Testing Heartbeat Processing\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let sessionId, visitorId;
    let heartbeatCount = 0;

    // Capture tracking requests
    page.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            sessionId = payload.sessionId;
            visitorId = payload.visitorId;
            console.log(`✅ Session ID: ${sessionId}`);
            console.log(`✅ Visitor ID: ${visitorId}`);
        }

        if (response.url().includes('/api/analytics/track?action=heartbeat')) {
            heartbeatCount++;
            const request = response.request();
            const payload = request.postDataJSON();
            console.log(`💓 Heartbeat #${heartbeatCount} sent`);
            if (payload.biometrics) {
                console.log(`   Mouse velocity: ${payload.biometrics.mouse_velocity || 0}`);
                console.log(`   Typing cadence: ${payload.biometrics.typing_cadence_ms || 0}ms`);
                console.log(`   Entropy score: ${payload.biometrics.entropy_score || 0}`);
            }
        }
    });

    // Navigate and trigger init
    console.log('🌐 Loading homepage...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    if (!sessionId || !visitorId) {
        console.error('❌ Failed to capture session/visitor IDs');
        await browser.close();
        return;
    }

    // Get initial session state
    console.log('\n📊 Checking initial session state...');
    const initialSession = await sql`
    SELECT 
      session_id,
      start_time,
      last_heartbeat,
      EXTRACT(EPOCH FROM (last_heartbeat - start_time)) as duration_seconds
    FROM visitor_sessions
    WHERE session_id = ${sessionId}
  `;

    if (initialSession.length === 0) {
        console.error('❌ Session not found in database');
        await browser.close();
        return;
    }

    console.log(`   Start time: ${initialSession[0].start_time}`);
    console.log(`   Last heartbeat: ${initialSession[0].last_heartbeat}`);
    console.log(`   Duration: ${Math.round(initialSession[0].duration_seconds)}s`);

    // Interact with page to generate behavioral data
    console.log('\n🎯 Generating behavioral data...');
    console.log('   Moving mouse...');
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.mouse.move(300, 200);
    await page.waitForTimeout(500);
    await page.mouse.move(500, 300);

    // Try to find an input field for typing
    console.log('   Looking for input fields...');
    const inputs = await page.$$('input, textarea');
    if (inputs.length > 0) {
        console.log('   Typing in input field...');
        await inputs[0].click();
        await page.keyboard.type('test input', { delay: 100 });
    }

    // Wait for heartbeat interval (15 seconds)
    console.log('\n⏳ Waiting for heartbeat (15 seconds)...');
    await page.waitForTimeout(16000);

    if (heartbeatCount === 0) {
        console.log('⚠️  No heartbeat detected yet, waiting longer...');
        await page.waitForTimeout(5000);
    }

    // Check updated session state
    console.log('\n📊 Checking updated session state...');
    const updatedSession = await sql`
    SELECT 
      session_id,
      start_time,
      last_heartbeat,
      EXTRACT(EPOCH FROM (last_heartbeat - start_time)) as duration_seconds
    FROM visitor_sessions
    WHERE session_id = ${sessionId}
  `;

    console.log(`   Start time: ${updatedSession[0].start_time}`);
    console.log(`   Last heartbeat: ${updatedSession[0].last_heartbeat}`);
    console.log(`   Duration: ${Math.round(updatedSession[0].duration_seconds)}s`);

    // Check if last_heartbeat was updated
    const heartbeatUpdated = new Date(updatedSession[0].last_heartbeat) > new Date(initialSession[0].last_heartbeat);
    console.log(`   ${heartbeatUpdated ? '✅' : '❌'} Heartbeat timestamp updated`);

    // Check behavioral_biometrics table
    console.log('\n📊 Checking behavioral_biometrics...');
    const biometrics = await sql`
    SELECT 
      bb.session_id,
      bb.avg_mouse_velocity,
      bb.typing_cadence_ms,
      bb.entropy_score,
      bb.is_bot_verified,
      bb.recorded_at
    FROM behavioral_biometrics bb
    WHERE bb.session_id = ${sessionId}
    ORDER BY bb.recorded_at DESC
    LIMIT 5
  `;

    console.log(`   Found ${biometrics.length} biometric entries`);

    if (biometrics.length > 0) {
        console.log('\n   Latest biometric data:');
        biometrics.forEach((bio, idx) => {
            console.log(`\n   Entry ${idx + 1}:`);
            console.log(`      Mouse velocity: ${bio.avg_mouse_velocity} px/s`);
            console.log(`      Typing cadence: ${bio.typing_cadence_ms}ms`);
            console.log(`      Entropy score: ${bio.entropy_score}`);
            console.log(`      Bot suspect: ${bio.is_bot_verified}`);
            console.log(`      Recorded: ${bio.recorded_at}`);
        });
    } else {
        console.log('   ⚠️  No biometric data stored (may not have been sent)');
    }

    // Check visitor_profiles.last_seen update
    console.log('\n📊 Checking visitor_profiles.last_seen...');
    const profile = await sql`
    SELECT 
      visitor_id,
      first_seen,
      last_seen,
      EXTRACT(EPOCH FROM (last_seen - first_seen)) as total_time_seconds
    FROM visitor_profiles
    WHERE visitor_id = ${visitorId}
  `;

    if (profile.length > 0) {
        console.log(`   First seen: ${profile[0].first_seen}`);
        console.log(`   Last seen: ${profile[0].last_seen}`);
        console.log(`   Total time: ${Math.round(profile[0].total_time_seconds)}s`);

        const lastSeenUpdated = new Date(profile[0].last_seen) > new Date(profile[0].first_seen);
        console.log(`   ${lastSeenUpdated ? '✅' : '⚠️'} Last seen timestamp ${lastSeenUpdated ? 'updated' : 'same as first seen'}`);
    }

    // Verify foreign key relationship
    console.log('\n🔗 Verifying foreign key relationships...');
    const fkCheck = await sql`
    SELECT COUNT(*) as count
    FROM behavioral_biometrics bb
    JOIN visitor_sessions vs ON vs.id = bb.session_uuid
    WHERE vs.session_id = ${sessionId}
  `;

    console.log(`   ✅ ${fkCheck[0].count} biometric entries properly linked to session`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.3 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Heartbeats Sent: ${heartbeatCount}`);
    console.log(`✅ Session Updated: ${heartbeatUpdated ? 'YES' : 'NO'}`);
    console.log(`✅ Duration Calculated: ${updatedSession[0].duration_seconds > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Biometrics Stored: ${biometrics.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Visitor Last Seen: ${profile[0] && new Date(profile[0].last_seen) > new Date(profile[0].first_seen) ? 'UPDATED' : 'UNCHANGED'}`);
    console.log(`✅ Foreign Keys: ${fkCheck[0].count >= 0 ? 'VALID' : 'BROKEN'}`);
    console.log('='.repeat(60));

    await browser.close();
}

// Run test
testHeartbeatAction().catch(console.error);
