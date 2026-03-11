#!/usr/bin/env bun
/**
 * Task 3.4: Test Identify Action Processing
 * 
 * Verifies that the identify action:
 * - Creates/updates known_entities entry
 * - Links visitor_profiles.likely_entity_id
 * - Logs identity_signals
 * - Calculates confidence scores
 * - Merges aliases array
 * - Updates entity metadata
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testIdentifyAction() {
    console.log('🧪 Task 3.4: Testing Identify Action Processing\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let sessionId, visitorId, hardwareHash;
    let identifyDetected = false;

    // Generate unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';

    console.log(`📧 Test email: ${testEmail}`);
    console.log(`👤 Test name: ${testName}\n`);

    // Capture tracking requests
    page.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            sessionId = payload.sessionId;
            visitorId = payload.visitorId;
            hardwareHash = payload.forensics?.fingerprint;
            console.log(`✅ Session ID: ${sessionId}`);
            console.log(`✅ Visitor ID: ${visitorId}`);
            console.log(`✅ Hardware Hash: ${hardwareHash || 'Not captured'}`);
        }

        if (response.url().includes('/api/analytics/track?action=identify')) {
            identifyDetected = true;
            const request = response.request();
            const payload = request.postDataJSON();
            console.log(`\n🎯 Identify action detected!`);
            console.log(`   Email: ${payload.email}`);
            console.log(`   Name: ${payload.name}`);
            console.log(`   Source: ${payload.source}`);
        }
    });

    // Navigate to contact page
    console.log('🌐 Loading contact page...');
    await page.goto(`${BASE_URL}/contact`);
    await page.waitForTimeout(2000);

    if (!sessionId || !visitorId) {
        console.error('❌ Failed to capture session/visitor IDs');
        await browser.close();
        return;
    }

    // Check initial state (no entity link)
    console.log('\n📊 Checking initial visitor state...');
    const initialProfile = await sql`
    SELECT visitor_id, likely_entity_id, hardware_hash
    FROM visitor_profiles
    WHERE visitor_id = ${visitorId}
  `;

    console.log(`   Likely entity ID: ${initialProfile[0]?.likely_entity_id || 'NULL (not linked)'}`);

    // Fill contact form
    console.log('\n📝 Filling contact form...');

    try {
        // Find and fill email field
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
            await emailInput.fill(testEmail);
            console.log('   ✅ Email filled');
        } else {
            console.log('   ⚠️  Email field not found');
        }

        // Find and fill name field
        const nameInput = await page.$('input[name="name"], input[placeholder*="name" i]');
        if (nameInput) {
            await nameInput.fill(testName);
            console.log('   ✅ Name filled');
        } else {
            console.log('   ⚠️  Name field not found');
        }

        // Find and fill message field
        const messageInput = await page.$('textarea[name="message"], textarea');
        if (messageInput) {
            await messageInput.fill('This is a test message for identity resolution testing.');
            console.log('   ✅ Message filled');
        }

        // Wait for autofill detection
        await page.waitForTimeout(2000);

        if (!identifyDetected) {
            console.log('\n⚠️  Autofill detection did not trigger, submitting form...');
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
                await submitButton.click();
                await page.waitForTimeout(2000);
            }
        }

    } catch (e) {
        console.error('❌ Error filling form:', e.message);
    }

    // Wait for identify action to process
    await page.waitForTimeout(2000);

    if (!identifyDetected) {
        console.log('\n⚠️  No identify action detected. This may be expected if autofill detection is not working.');
        console.log('   Manually triggering identify for testing purposes...');

        // Manually send identify request
        await page.evaluate(async (data) => {
            const response = await fetch('/api/analytics/track?action=identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return response.json();
        }, {
            visitorId,
            sessionId,
            email: testEmail,
            name: testName,
            source: 'manual'
        });

        await page.waitForTimeout(1000);
    }

    // Verify known_entities entry
    console.log('\n📊 Checking known_entities table...');
    const entities = await sql`
    SELECT 
      entity_id,
      real_name,
      email,
      role,
      confidence_score,
      resolution_sources,
      total_visits,
      aliases,
      first_seen,
      last_seen
    FROM known_entities
    WHERE email = ${testEmail.toLowerCase()}
  `;

    if (entities.length === 0) {
        console.error('   ❌ No entity created');
    } else {
        const entity = entities[0];
        console.log('   ✅ Entity created');
        console.log(`      Entity ID: ${entity.entity_id}`);
        console.log(`      Name: ${entity.real_name}`);
        console.log(`      Email: ${entity.email}`);
        console.log(`      Role: ${entity.role}`);
        console.log(`      Confidence: ${entity.confidence_score}`);
        console.log(`      Sources: ${entity.resolution_sources}`);
        console.log(`      Total visits: ${entity.total_visits}`);
        console.log(`      Aliases: ${entity.aliases}`);
    }

    // Verify visitor profile link
    console.log('\n📊 Checking visitor profile link...');
    const updatedProfile = await sql`
    SELECT 
      vp.visitor_id,
      vp.likely_entity_id,
      vp.hardware_hash,
      ke.email,
      ke.real_name
    FROM visitor_profiles vp
    LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
    WHERE vp.visitor_id = ${visitorId}
  `;

    if (updatedProfile.length === 0) {
        console.error('   ❌ Profile not found');
    } else {
        const profile = updatedProfile[0];
        if (profile.likely_entity_id) {
            console.log('   ✅ Profile linked to entity');
            console.log(`      Entity ID: ${profile.likely_entity_id}`);
            console.log(`      Entity email: ${profile.email}`);
            console.log(`      Entity name: ${profile.real_name}`);
        } else {
            console.error('   ❌ Profile not linked (likely_entity_id is NULL)');
        }
    }

    // Verify identity_signals
    console.log('\n📊 Checking identity_signals...');
    if (entities.length > 0) {
        const signals = await sql`
      SELECT 
        signal_type,
        signal_weight,
        signal_value,
        recorded_at
      FROM identity_signals
      WHERE entity_id = ${entities[0].entity_id}
      ORDER BY recorded_at DESC
    `;

        console.log(`   Found ${signals.length} identity signals`);
        signals.forEach((signal, idx) => {
            console.log(`\n   Signal ${idx + 1}:`);
            console.log(`      Type: ${signal.signal_type}`);
            console.log(`      Weight: ${signal.signal_weight}`);
            console.log(`      Value: ${signal.signal_value}`);
            console.log(`      Recorded: ${signal.recorded_at}`);
        });
    }

    // Verify confidence score calculation
    console.log('\n📊 Verifying confidence score...');
    if (entities.length > 0) {
        const entity = entities[0];
        const expectedBase = 0.3; // autofill or manual
        console.log(`   Base weight: ${expectedBase}`);
        console.log(`   Actual confidence: ${entity.confidence_score}`);

        if (entity.confidence_score >= expectedBase && entity.confidence_score <= 1.0) {
            console.log('   ✅ Confidence score in valid range');
        } else {
            console.log('   ❌ Confidence score out of range');
        }
    }

    // Verify identity_clusters
    console.log('\n📊 Checking identity_clusters...');
    if (entities.length > 0 && hardwareHash) {
        const clusters = await sql`
      SELECT 
        cluster_id,
        fingerprint_hash,
        primary_entity_id,
        confidence_score
      FROM identity_clusters
      WHERE fingerprint_hash = ${hardwareHash}
    `;

        if (clusters.length > 0) {
            console.log('   ✅ Identity cluster created');
            console.log(`      Cluster ID: ${clusters[0].cluster_id}`);
            console.log(`      Fingerprint: ${clusters[0].fingerprint_hash}`);
            console.log(`      Entity ID: ${clusters[0].primary_entity_id}`);
            console.log(`      Confidence: ${clusters[0].confidence_score}`);
        } else {
            console.log('   ⚠️  No identity cluster found');
        }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.4 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Identify Detected: ${identifyDetected ? 'YES' : 'NO (manual trigger used)'}`);
    console.log(`✅ Entity Created: ${entities.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Profile Linked: ${updatedProfile[0]?.likely_entity_id ? 'YES' : 'NO'}`);
    console.log(`✅ Signals Logged: ${entities.length > 0 && signals.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Confidence Score: ${entities[0]?.confidence_score || 'N/A'}`);
    console.log(`✅ Identity Cluster: ${hardwareHash && clusters?.length > 0 ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));

    await browser.close();
}

// Run test
testIdentifyAction().catch(console.error);
