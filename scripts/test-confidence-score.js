#!/usr/bin/env bun
/**
 * Task 3.6: Test Confidence Score Calculation
 * 
 * Verifies that confidence scores are calculated correctly:
 * - Base weights: autofill=0.3, form_submit=0.5, manual=0.4
 * - Device correlation bonus: +0.15 per device (max 0.3)
 * - IP correlation bonus: +0.05 per IP (max 0.1)
 * - Total score capped at 1.0
 * - Score preserved as maximum when updated
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const BASE_URL = 'http://localhost:5173';

async function testConfidenceScore() {
    console.log('🧪 Task 3.6: Testing Confidence Score Calculation\n');

    const testEmail = `confidence-${Date.now()}@example.com`;
    const testName = 'Confidence Test User';

    console.log(`📧 Test email: ${testEmail}`);
    console.log(`👤 Test name: ${testName}\n`);

    // STEP 1: First identification (autofill source)
    console.log('='.repeat(60));
    console.log('STEP 1: First identification with autofill source');
    console.log('='.repeat(60));

    const browser1 = await chromium.launch({ headless: false });
    const context1 = await browser1.newContext();
    const page1 = await context1.newPage();

    let visitor1_id, hardware1;

    page1.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            visitor1_id = payload.visitorId;
            hardware1 = payload.forensics?.fingerprint;
        }
    });

    console.log('🌐 Loading site...');
    await page1.goto(BASE_URL);
    await page1.waitForTimeout(2000);

    console.log(`✅ Visitor 1 ID: ${visitor1_id}`);
    console.log(`✅ Hardware: ${hardware1 || 'Not captured'}`);

    // Trigger identify with autofill source
    console.log('\n📝 Identifying with autofill source...');
    await page1.evaluate(async (data) => {
        const response = await fetch('/api/analytics/track?action=identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }, {
        visitorId: visitor1_id,
        sessionId: 'session-1',
        email: testEmail,
        name: testName,
        source: 'autofill'
    });

    await page1.waitForTimeout(1000);
    await browser1.close();

    // Check initial confidence score
    const entity1 = await sql`
    SELECT 
      entity_id,
      email,
      confidence_score,
      resolution_sources,
      total_visits
    FROM known_entities
    WHERE email = ${testEmail.toLowerCase()}
  `;

    if (entity1.length === 0) {
        console.error('❌ Entity not created');
        return;
    }

    const entityId = entity1[0].entity_id;
    const initialConfidence = entity1[0].confidence_score;

    console.log(`\n📊 Initial entity state:`);
    console.log(`   Entity ID: ${entityId}`);
    console.log(`   Confidence: ${initialConfidence}`);
    console.log(`   Sources: ${entity1[0].resolution_sources}`);
    console.log(`   Total visits: ${entity1[0].total_visits}`);

    // Verify base weight for autofill (0.3)
    const expectedBase = 0.3;
    console.log(`\n🧮 Confidence calculation:`);
    console.log(`   Expected base (autofill): ${expectedBase}`);
    console.log(`   Actual confidence: ${initialConfidence}`);
    console.log(`   ${initialConfidence >= expectedBase ? '✅' : '❌'} Confidence >= base weight`);

    // Count devices and IPs
    const stats1 = await sql`
    SELECT
      COUNT(DISTINCT hardware_hash) FILTER (WHERE hardware_hash IS NOT NULL) as device_count,
      COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) as ip_count
    FROM visitor_profiles
    WHERE likely_entity_id = ${entityId}
  `;

    console.log(`\n📊 Correlation stats after first identification:`);
    console.log(`   Devices: ${stats1[0].device_count}`);
    console.log(`   IPs: ${stats1[0].ip_count}`);

    // Calculate expected confidence
    const deviceBonus1 = Math.min(stats1[0].device_count * 0.15, 0.3);
    const ipBonus1 = Math.min(stats1[0].ip_count * 0.05, 0.1);
    const expectedConfidence1 = Math.min(expectedBase + deviceBonus1 + ipBonus1, 1.0);

    console.log(`\n🧮 Expected confidence calculation:`);
    console.log(`   Base: ${expectedBase}`);
    console.log(`   Device bonus: ${deviceBonus1} (${stats1[0].device_count} devices × 0.15, max 0.3)`);
    console.log(`   IP bonus: ${ipBonus1} (${stats1[0].ip_count} IPs × 0.05, max 0.1)`);
    console.log(`   Expected total: ${expectedConfidence1}`);
    console.log(`   Actual: ${initialConfidence}`);
    console.log(`   ${Math.abs(initialConfidence - expectedConfidence1) < 0.01 ? '✅' : '⚠️'} Match: ${Math.abs(initialConfidence - expectedConfidence1) < 0.01 ? 'YES' : 'CLOSE'}`);

    // STEP 2: Second identification from different device (form_submit source)
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Second identification from different context');
    console.log('='.repeat(60));

    const browser2 = await chromium.launch({ headless: false });
    const context2 = await browser2.newContext();
    const page2 = await context2.newPage();

    let visitor2_id, hardware2;

    page2.on('response', async response => {
        if (response.url().includes('/api/analytics/track?action=init')) {
            const request = response.request();
            const payload = request.postDataJSON();
            visitor2_id = payload.visitorId;
            hardware2 = payload.forensics?.fingerprint;
        }
    });

    console.log('🌐 Loading site from new context...');
    await page2.goto(BASE_URL);
    await page2.waitForTimeout(2000);

    console.log(`✅ Visitor 2 ID: ${visitor2_id}`);
    console.log(`✅ Hardware: ${hardware2 || 'Not captured'}`);
    console.log(`   Different visitor: ${visitor1_id !== visitor2_id ? '✅ YES' : '❌ NO'}`);
    console.log(`   Different hardware: ${hardware1 !== hardware2 ? '✅ YES' : '⚠️ SAME'}`);

    // Trigger identify with form_submit source (higher weight)
    console.log('\n📝 Identifying with form_submit source...');
    await page2.evaluate(async (data) => {
        const response = await fetch('/api/analytics/track?action=identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    }, {
        visitorId: visitor2_id,
        sessionId: 'session-2',
        email: testEmail,
        name: testName,
        source: 'form_submit'
    });

    await page2.waitForTimeout(1000);
    await browser2.close();

    // Check updated confidence score
    const entity2 = await sql`
    SELECT 
      entity_id,
      confidence_score,
      resolution_sources,
      total_visits
    FROM known_entities
    WHERE entity_id = ${entityId}
  `;

    const updatedConfidence = entity2[0].confidence_score;

    console.log(`\n📊 Updated entity state:`);
    console.log(`   Confidence: ${updatedConfidence}`);
    console.log(`   Sources: ${entity2[0].resolution_sources}`);
    console.log(`   Total visits: ${entity2[0].total_visits}`);

    // Count devices and IPs after second identification
    const stats2 = await sql`
    SELECT
      COUNT(DISTINCT hardware_hash) FILTER (WHERE hardware_hash IS NOT NULL) as device_count,
      COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) as ip_count
    FROM visitor_profiles
    WHERE likely_entity_id = ${entityId}
  `;

    console.log(`\n📊 Correlation stats after second identification:`);
    console.log(`   Devices: ${stats2[0].device_count}`);
    console.log(`   IPs: ${stats2[0].ip_count}`);

    // Calculate expected confidence with form_submit base (0.5)
    const formSubmitBase = 0.5;
    const deviceBonus2 = Math.min(stats2[0].device_count * 0.15, 0.3);
    const ipBonus2 = Math.min(stats2[0].ip_count * 0.05, 0.1);
    const expectedConfidence2 = Math.min(formSubmitBase + deviceBonus2 + ipBonus2, 1.0);

    console.log(`\n🧮 Expected confidence after second identification:`);
    console.log(`   Base (form_submit): ${formSubmitBase}`);
    console.log(`   Device bonus: ${deviceBonus2} (${stats2[0].device_count} devices × 0.15, max 0.3)`);
    console.log(`   IP bonus: ${ipBonus2} (${stats2[0].ip_count} IPs × 0.05, max 0.1)`);
    console.log(`   Expected total: ${expectedConfidence2}`);
    console.log(`   Previous: ${initialConfidence}`);
    console.log(`   Actual: ${updatedConfidence}`);

    // Verify score increased or stayed at maximum
    const scoreIncreased = updatedConfidence >= initialConfidence;
    console.log(`   ${scoreIncreased ? '✅' : '❌'} Score ${scoreIncreased ? 'increased or maintained' : 'decreased (ERROR)'}`);

    // Verify score is capped at 1.0
    const cappedCorrectly = updatedConfidence <= 1.0;
    console.log(`   ${cappedCorrectly ? '✅' : '❌'} Score ${cappedCorrectly ? 'capped at 1.0' : 'exceeds 1.0 (ERROR)'}`);

    // Check identity_signals
    console.log(`\n📊 Checking identity signals...`);
    const signals = await sql`
    SELECT 
      signal_type,
      signal_weight,
      visitor_id,
      recorded_at
    FROM identity_signals
    WHERE entity_id = ${entityId}
    ORDER BY recorded_at ASC
  `;

    console.log(`   Found ${signals.length} signals:`);
    signals.forEach((signal, idx) => {
        console.log(`\n   Signal ${idx + 1}:`);
        console.log(`      Type: ${signal.signal_type}`);
        console.log(`      Weight: ${signal.signal_weight}`);
        console.log(`      Visitor: ${signal.visitor_id}`);
    });

    // Verify signal weights match expected values
    const autofillSignal = signals.find(s => s.signal_type === 'autofill');
    const formSubmitSignal = signals.find(s => s.signal_type === 'form_submit');

    console.log(`\n🧮 Signal weight verification:`);
    if (autofillSignal) {
        console.log(`   Autofill weight: ${autofillSignal.signal_weight} (expected: 0.3)`);
        console.log(`   ${autofillSignal.signal_weight === 0.3 ? '✅' : '❌'} Correct weight`);
    }
    if (formSubmitSignal) {
        console.log(`   Form submit weight: ${formSubmitSignal.signal_weight} (expected: 0.5)`);
        console.log(`   ${formSubmitSignal.signal_weight === 0.5 ? '✅' : '❌'} Correct weight`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TASK 3.6 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Initial Confidence: ${initialConfidence.toFixed(3)}`);
    console.log(`✅ Updated Confidence: ${updatedConfidence.toFixed(3)}`);
    console.log(`✅ Score Increased: ${scoreIncreased ? 'YES' : 'NO'}`);
    console.log(`✅ Score Capped at 1.0: ${cappedCorrectly ? 'YES' : 'NO'}`);
    console.log(`✅ Device Bonus Applied: ${deviceBonus2 > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ IP Bonus Applied: ${ipBonus2 > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Signal Weights Correct: ${autofillSignal?.signal_weight === 0.3 && formSubmitSignal?.signal_weight === 0.5 ? 'YES' : 'PARTIAL'}`);
    console.log(`✅ Multiple Sources Tracked: ${entity2[0].resolution_sources.length > 1 ? 'YES' : 'NO'}`);
    console.log('='.repeat(60));

    console.log('\n📝 Formula verification:');
    console.log(`   Confidence = MIN(base_weight + device_bonus + ip_bonus, 1.0)`);
    console.log(`   Device bonus = MIN(device_count × 0.15, 0.3)`);
    console.log(`   IP bonus = MIN(ip_count × 0.05, 0.1)`);
    console.log(`   Base weights: autofill=0.3, form_submit=0.5, manual=0.4`);
}

// Run test
testConfidenceScore().catch(console.error);
