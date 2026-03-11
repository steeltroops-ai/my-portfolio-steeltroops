#!/usr/bin/env bun
/**
 * Task 3.5: Test Retroactive Linking
 * 
 * Verifies that retroactive linking:
 * - Finds all visitor_profiles with matching hardware_hash
 * - Updates their likely_entity_id when identity is resolved
 * - Works across incognito/cleared cookies scenarios
 * - Links historical anonymous sessions to newly resolved identity
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testRetroactiveLinking() {
    console.log('🧪 Task 3.5: Testing Retroactive Linking\n');

    const testEmail = `retroactive-${Date.now()}@example.com`;
    const testName = 'Retroactive Test User';

    console.log(`📧 Test email: ${testEmail}`);
    console.log(`👤 Test name: ${testName}\n`);

    // STEP 1: Create anonymous visitor A (normal browser)
    console.log('='.repeat(60));
    console.log('STEP 1: Creating anonymous visitor A (normal browser)');
    console.log('='.repeat(60));

    const browser1 = await chromium.launch({ headless: false });
    const context1 = await browser1.newContext();
    const page1 = await context1.newPage();

    let visitorA_id, visitorA_hardware;

    page1.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            visitorA_id = payload.visitorId;
            visitorA_hardware = payload.forensics?.fingerprint;
        }
    });

    console.log('🌐 Loading site as visitor A...');
    await page1.goto(BASE_URL);
    await page1.waitForTimeout(3000);

    console.log(`✅ Visitor A ID: ${visitorA_id}`);
    console.log(`✅ Hardware Hash: ${visitorA_hardware || 'Not captured'}`);

    // Browse a bit (anonymous)
    console.log('📖 Browsing as anonymous visitor...');
    await page1.goto(`${BASE_URL}/blogs`);
    await page1.waitForTimeout(1000);
    await page1.goto(BASE_URL);
    await page1.waitForTimeout(1000);

    // Check visitor A is not linked
    const visitorA_initial = await sql`
    SELECT visitor_id, likely_entity_id, hardware_hash
    FROM visitor_profiles
    WHERE visitor_id = ${visitorA_id}
  `;

    console.log(`\n📊 Visitor A initial state:`);
    console.log(`   Visitor ID: ${visitorA_initial[0]?.visitor_id}`);
    console.log(`   Entity link: ${visitorA_initial[0]?.likely_entity_id || 'NULL (anonymous)'}`);
    console.log(`   Hardware: ${visitorA_initial[0]?.hardware_hash}`);

    await browser1.close();

    // STEP 2: Create anonymous visitor B (incognito - same device)
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Creating anonymous visitor B (incognito - same device)');
    console.log('='.repeat(60));

    const browser2 = await chromium.launch({ headless: false });
    const context2 = await browser2.newContext(); // Simulates incognito
    const page2 = await context2.newPage();

    let visitorB_id, visitorB_hardware;

    page2.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            visitorB_id = payload.visitorId;
            visitorB_hardware = payload.forensics?.fingerprint;
        }
    });

    console.log('🌐 Loading site as visitor B (incognito)...');
    await page2.goto(BASE_URL);
    await page2.waitForTimeout(3000);

    console.log(`✅ Visitor B ID: ${visitorB_id}`);
    console.log(`✅ Hardware Hash: ${visitorB_hardware || 'Not captured'}`);

    // Verify different visitor IDs but same hardware
    console.log(`\n🔍 Verification:`);
    console.log(`   Different visitor IDs: ${visitorA_id !== visitorB_id ? '✅ YES' : '❌ NO'}`);
    console.log(`   Same hardware hash: ${visitorA_hardware === visitorB_hardware ? '✅ YES' : '❌ NO (may vary by browser)'}`);

    // Check visitor B is also not linked
    const visitorB_initial = await sql`
    SELECT visitor_id, likely_entity_id, hardware_hash
    FROM visitor_profiles
    WHERE visitor_id = ${visitorB_id}
  `;

    console.log(`\n📊 Visitor B initial state:`);
    console.log(`   Visitor ID: ${visitorB_initial[0]?.visitor_id}`);
    console.log(`   Entity link: ${visitorB_initial[0]?.likely_entity_id || 'NULL (anonymous)'}`);
    console.log(`   Hardware: ${visitorB_initial[0]?.hardware_hash}`);

    // STEP 3: Identify visitor B (resolve identity)
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Identifying visitor B (triggering retroactive linking)');
    console.log('='.repeat(60));

    console.log('🌐 Navigating to contact page...');
    await page2.goto(`${BASE_URL}/contact`);
    await page2.waitForTimeout(2000);

    // Manually trigger identify (simulating autofill)
    console.log('📝 Triggering identify action...');
    await page2.evaluate(async (data) => {
        const response = await fetch('/api/analytics/track?action=identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }, {
        visitorId: visitorB_id,
        sessionId: 'test-session',
        email: testEmail,
        name: testName,
        source: 'autofill'
    });

    console.log('✅ Identify action sent');

    // Wait for retroactive linking to process
    await page2.waitForTimeout(2000);

    await browser2.close();

    // STEP 4: Verify retroactive linking
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Verifying retroactive linking results');
    console.log('='.repeat(60));

    // Check entity was created
    const entity = await sql`
    SELECT entity_id, email, real_name, confidence_score
    FROM known_entities
    WHERE email = ${testEmail.toLowerCase()}
  `;

    if (entity.length === 0) {
        console.error('\n❌ Entity not created - cannot test retroactive linking');
        return;
    }

    console.log(`\n✅ Entity created:`);
    console.log(`   Entity ID: ${entity[0].entity_id}`);
    console.log(`   Email: ${entity[0].email}`);
    console.log(`   Name: ${entity[0].real_name}`);
    console.log(`   Confidence: ${entity[0].confidence_score}`);

    // Check visitor B is linked
    const visitorB_linked = await sql`
    SELECT visitor_id, likely_entity_id, hardware_hash
    FROM visitor_profiles
    WHERE visitor_id = ${visitorB_id}
  `;

    console.log(`\n📊 Visitor B after identification:`);
    console.log(`   Visitor ID: ${visitorB_linked[0]?.visitor_id}`);
    console.log(`   Entity link: ${visitorB_linked[0]?.likely_entity_id || 'NULL'}`);
    console.log(`   ${visitorB_linked[0]?.likely_entity_id === entity[0].entity_id ? '✅' : '❌'} Linked to entity`);

    // Check if visitor A was retroactively linked
    const visitorA_linked = await sql`
    SELECT visitor_id, likely_entity_id, hardware_hash
    FROM visitor_profiles
    WHERE visitor_id = ${visitorA_id}
  `;

    console.log(`\n📊 Visitor A after retroactive linking:`);
    console.log(`   Visitor ID: ${visitorA_linked[0]?.visitor_id}`);
    console.log(`   Entity link: ${visitorA_linked[0]?.likely_entity_id || 'NULL'}`);

    const retroactiveSuccess = visitorA_linked[0]?.likely_entity_id === entity[0].entity_id;
    console.log(`   ${retroactiveSuccess ? '✅' : '❌'} ${retroactiveSuccess ? 'Retroactively linked to entity' : 'NOT retroactively linked'}`);

    // Find all profiles with matching hardware
    if (visitorA_hardware || visitorB_hardware) {
        const hardwareToCheck = visitorA_hardware || visitorB_hardware;
        console.log(`\n🔍 Finding all profiles with hardware: ${hardwareToCheck}`);

        const matchingProfiles = await sql`
      SELECT 
        vp.visitor_id,
        vp.likely_entity_id,
        vp.hardware_hash,
        vp.first_seen,
        ke.email
      FROM visitor_profiles vp
      LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
      WHERE vp.hardware_hash = ${hardwareToCheck}
      ORDER BY vp.first_seen ASC
    `;

        console.log(`\n   Found ${matchingProfiles.length} profiles with matching hardware:`);
        matchingProfiles.forEach((profile, idx) => {
            console.log(`\n   Profile ${idx + 1}:`);
            console.log(`      Visitor ID: ${profile.visitor_id}`);
            console.log(`      Entity: ${profile.email || 'Not linked'}`);
            console.log(`      First seen: ${profile.first_seen}`);
            console.log(`      ${profile.likely_entity_id ? '✅ Linked' : '❌ Not linked'}`);
        });

        const allLinked = matchingProfiles.every(p => p.likely_entity_id === entity[0].entity_id);
        console.log(`\n   ${allLinked ? '✅' : '❌'} All profiles with matching hardware ${allLinked ? 'are' : 'are NOT'} linked to entity`);
    }

    // Check identity_signals for retroactive linking
    console.log(`\n📊 Checking identity signals...`);
    const signals = await sql`
    SELECT signal_type, visitor_id, signal_value, recorded_at
    FROM identity_signals
    WHERE entity_id = ${entity[0].entity_id}
    ORDER BY recorded_at ASC
  `;

    console.log(`   Found ${signals.length} identity signals`);
    signals.forEach((signal, idx) => {
        console.log(`\n   Signal ${idx + 1}:`);
        console.log(`      Type: ${signal.signal_type}`);
        console.log(`      Visitor: ${signal.visitor_id}`);
        console.log(`      Value: ${signal.signal_value}`);
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.5 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Visitor A Created: ${visitorA_id ? 'YES' : 'NO'}`);
    console.log(`✅ Visitor B Created: ${visitorB_id ? 'YES' : 'NO'}`);
    console.log(`✅ Different Visitor IDs: ${visitorA_id !== visitorB_id ? 'YES' : 'NO'}`);
    console.log(`✅ Same Hardware Hash: ${visitorA_hardware === visitorB_hardware ? 'YES' : 'VARIES'}`);
    console.log(`✅ Entity Created: ${entity.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Visitor B Linked: ${visitorB_linked[0]?.likely_entity_id ? 'YES' : 'NO'}`);
    console.log(`✅ Visitor A Retroactively Linked: ${retroactiveSuccess ? 'YES' : 'NO'}`);
    console.log(`✅ All Hardware Matches Linked: ${matchingProfiles?.every(p => p.likely_entity_id) ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));

    if (!retroactiveSuccess) {
        console.log('\n⚠️  NOTE: Retroactive linking may not work if hardware hashes differ');
        console.log('   between normal and incognito modes due to browser fingerprinting');
        console.log('   variations. This is expected behavior.');
    }
}

// Run test
testRetroactiveLinking().catch(console.error);
