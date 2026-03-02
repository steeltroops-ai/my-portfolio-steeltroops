#!/usr/bin/env bun
/**
 * Data Integrity Verification Script
 * Task 1.5: Check Data Integrity (No Orphans)
 * 
 * This script checks for orphaned records with broken foreign key references:
 * 1. Orphaned sessions (sessions without matching visitor profile)
 * 2. Orphaned events (events without matching session)
 * 3. Invalid entity links (profiles with invalid entity_id)
 * 
 * Expected Result: All counts should return 0 (no orphans)
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Starting Data Integrity Check...\n');

async function checkOrphanedSessions() {
    console.log('📋 Checking for orphaned sessions...');

    try {
        const result = await sql`
      SELECT COUNT(*) as orphan_count
      FROM visitor_sessions vs
      LEFT JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
      WHERE vp.id IS NULL
    `;

        const count = parseInt(result[0].orphan_count);

        if (count === 0) {
            console.log('✅ No orphaned sessions found');
        } else {
            console.log(`❌ Found ${count} orphaned session(s)`);

            // Get details of orphaned sessions
            const orphans = await sql`
        SELECT vs.id, vs.session_id, vs.visitor_uuid, vs.start_time
        FROM visitor_sessions vs
        LEFT JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
        WHERE vp.id IS NULL
        LIMIT 10
      `;

            console.log('   Sample orphaned sessions:');
            orphans.forEach(session => {
                console.log(`   - Session ID: ${session.session_id}, Visitor UUID: ${session.visitor_uuid}, Started: ${session.start_time}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking orphaned sessions:', error.message);
        return -1;
    }
}

async function checkOrphanedEvents() {
    console.log('\n📋 Checking for orphaned events...');

    try {
        const result = await sql`
      SELECT COUNT(*) as orphan_count
      FROM visitor_events ve
      LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
      WHERE vs.id IS NULL
    `;

        const count = parseInt(result[0].orphan_count);

        if (count === 0) {
            console.log('✅ No orphaned events found');
        } else {
            console.log(`❌ Found ${count} orphaned event(s)`);

            // Get details of orphaned events
            const orphans = await sql`
        SELECT ve.id, ve.event_type, ve.session_uuid, ve.timestamp
        FROM visitor_events ve
        LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
        WHERE vs.id IS NULL
        LIMIT 10
      `;

            console.log('   Sample orphaned events:');
            orphans.forEach(event => {
                console.log(`   - Event Type: ${event.event_type}, Session UUID: ${event.session_uuid}, Time: ${event.timestamp}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking orphaned events:', error.message);
        return -1;
    }
}

async function checkInvalidEntityLinks() {
    console.log('\n📋 Checking for invalid entity links...');

    try {
        const result = await sql`
      SELECT COUNT(*) as invalid_count
      FROM visitor_profiles vp
      LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
      WHERE vp.likely_entity_id IS NOT NULL AND ke.entity_id IS NULL
    `;

        const count = parseInt(result[0].invalid_count);

        if (count === 0) {
            console.log('✅ No invalid entity links found');
        } else {
            console.log(`❌ Found ${count} invalid entity link(s)`);

            // Get details of invalid links
            const invalids = await sql`
        SELECT vp.id, vp.visitor_id, vp.likely_entity_id, vp.first_seen
        FROM visitor_profiles vp
        LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
        WHERE vp.likely_entity_id IS NOT NULL AND ke.entity_id IS NULL
        LIMIT 10
      `;

            console.log('   Sample invalid entity links:');
            invalids.forEach(profile => {
                console.log(`   - Visitor ID: ${profile.visitor_id}, Invalid Entity ID: ${profile.likely_entity_id}, First Seen: ${profile.first_seen}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking invalid entity links:', error.message);
        return -1;
    }
}

async function checkBehavioralBiometricsOrphans() {
    console.log('\n📋 Checking for orphaned behavioral biometrics...');

    try {
        const result = await sql`
      SELECT COUNT(*) as orphan_count
      FROM behavioral_biometrics bb
      LEFT JOIN visitor_sessions vs ON vs.id = bb.session_uuid
      WHERE vs.id IS NULL
    `;

        const count = parseInt(result[0].orphan_count);

        if (count === 0) {
            console.log('✅ No orphaned behavioral biometrics found');
        } else {
            console.log(`❌ Found ${count} orphaned behavioral biometric(s)`);

            // Get details
            const orphans = await sql`
        SELECT bb.id, bb.session_id, bb.session_uuid, bb.recorded_at
        FROM behavioral_biometrics bb
        LEFT JOIN visitor_sessions vs ON vs.id = bb.session_uuid
        WHERE vs.id IS NULL
        LIMIT 10
      `;

            console.log('   Sample orphaned biometrics:');
            orphans.forEach(bio => {
                console.log(`   - Session ID: ${bio.session_id}, Session UUID: ${bio.session_uuid}, Recorded: ${bio.recorded_at}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking orphaned behavioral biometrics:', error.message);
        return -1;
    }
}

async function checkIdentitySignalsOrphans() {
    console.log('\n📋 Checking for orphaned identity signals...');

    try {
        const result = await sql`
      SELECT COUNT(*) as orphan_count
      FROM identity_signals isig
      LEFT JOIN known_entities ke ON ke.entity_id = isig.entity_id
      WHERE ke.entity_id IS NULL
    `;

        const count = parseInt(result[0].orphan_count);

        if (count === 0) {
            console.log('✅ No orphaned identity signals found');
        } else {
            console.log(`❌ Found ${count} orphaned identity signal(s)`);

            // Get details
            const orphans = await sql`
        SELECT isig.signal_id, isig.entity_id, isig.signal_type, isig.recorded_at
        FROM identity_signals isig
        LEFT JOIN known_entities ke ON ke.entity_id = isig.entity_id
        WHERE ke.entity_id IS NULL
        LIMIT 10
      `;

            console.log('   Sample orphaned signals:');
            orphans.forEach(signal => {
                console.log(`   - Signal Type: ${signal.signal_type}, Entity ID: ${signal.entity_id}, Recorded: ${signal.recorded_at}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking orphaned identity signals:', error.message);
        return -1;
    }
}

async function checkIdentityClustersOrphans() {
    console.log('\n📋 Checking for orphaned identity clusters...');

    try {
        const result = await sql`
      SELECT COUNT(*) as orphan_count
      FROM identity_clusters ic
      LEFT JOIN known_entities ke ON ke.entity_id = ic.primary_entity_id
      WHERE ic.primary_entity_id IS NOT NULL AND ke.entity_id IS NULL
    `;

        const count = parseInt(result[0].orphan_count);

        if (count === 0) {
            console.log('✅ No orphaned identity clusters found');
        } else {
            console.log(`❌ Found ${count} orphaned identity cluster(s)`);

            // Get details
            const orphans = await sql`
        SELECT ic.cluster_id, ic.fingerprint_hash, ic.primary_entity_id, ic.created_at
        FROM identity_clusters ic
        LEFT JOIN known_entities ke ON ke.entity_id = ic.primary_entity_id
        WHERE ic.primary_entity_id IS NOT NULL AND ke.entity_id IS NULL
        LIMIT 10
      `;

            console.log('   Sample orphaned clusters:');
            orphans.forEach(cluster => {
                console.log(`   - Fingerprint Hash: ${cluster.fingerprint_hash}, Entity ID: ${cluster.primary_entity_id}, Created: ${cluster.created_at}`);
            });
        }

        return count;
    } catch (error) {
        console.error('❌ Error checking orphaned identity clusters:', error.message);
        return -1;
    }
}

async function generateSummaryReport(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DATA INTEGRITY SUMMARY REPORT');
    console.log('='.repeat(60));

    const totalIssues = Object.values(results).reduce((sum, count) => sum + Math.max(0, count), 0);

    console.log('\nResults:');
    console.log(`  Orphaned Sessions:              ${results.sessions === 0 ? '✅' : '❌'} ${results.sessions}`);
    console.log(`  Orphaned Events:                ${results.events === 0 ? '✅' : '❌'} ${results.events}`);
    console.log(`  Invalid Entity Links:           ${results.entityLinks === 0 ? '✅' : '❌'} ${results.entityLinks}`);
    console.log(`  Orphaned Behavioral Biometrics: ${results.biometrics === 0 ? '✅' : '❌'} ${results.biometrics}`);
    console.log(`  Orphaned Identity Signals:      ${results.signals === 0 ? '✅' : '❌'} ${results.signals}`);
    console.log(`  Orphaned Identity Clusters:     ${results.clusters === 0 ? '✅' : '❌'} ${results.clusters}`);

    console.log('\n' + '-'.repeat(60));
    console.log(`Total Issues Found: ${totalIssues}`);

    if (totalIssues === 0) {
        console.log('\n🎉 SUCCESS: All data integrity checks passed!');
        console.log('   No orphaned records found in the database.');
    } else {
        console.log('\n⚠️  WARNING: Data integrity issues detected!');
        console.log('   Please review the orphaned records above.');
        console.log('   Consider running cleanup scripts or investigating the root cause.');
    }

    console.log('='.repeat(60) + '\n');

    return totalIssues === 0;
}

async function main() {
    try {
        const results = {
            sessions: await checkOrphanedSessions(),
            events: await checkOrphanedEvents(),
            entityLinks: await checkInvalidEntityLinks(),
            biometrics: await checkBehavioralBiometricsOrphans(),
            signals: await checkIdentitySignalsOrphans(),
            clusters: await checkIdentityClustersOrphans()
        };

        const allPassed = await generateSummaryReport(results);

        process.exit(allPassed ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Fatal error during integrity check:', error);
        process.exit(1);
    }
}

main();
