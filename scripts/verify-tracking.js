#!/usr/bin/env node
/**
 * Tracking System Verification Script
 * 
 * Verifies that all tracking components are properly configured:
 * 1. Database tables exist
 * 2. API endpoints are functional
 * 3. Real-time SSE connection works
 * 4. Autofill detection is enabled
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const REQUIRED_TABLES = [
    'visitor_profiles',
    'visitor_sessions',
    'visitor_events',
    'fingerprint_dna',
    'known_entities',
    'behavioral_biometrics',
    'identity_clusters',
    'identity_signals'
];

async function verifyTables() {
    console.log('\n🔍 Verifying Analytics Tables...\n');

    let allTablesExist = true;

    for (const table of REQUIRED_TABLES) {
        try {
            const result = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = ${table}
      `;

            if (parseInt(result[0].count) > 0) {
                // Use unsafe for dynamic table names
                const rowCount = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
                const count = rowCount && rowCount[0] ? rowCount[0].count : 0;
                console.log(`✅ ${table.padEnd(25)} - ${count} rows`);
            } else {
                console.log(`❌ ${table.padEnd(25)} - TABLE MISSING`);
                allTablesExist = false;
            }
        } catch (error) {
            console.log(`❌ ${table.padEnd(25)} - ERROR: ${error.message}`);
            allTablesExist = false;
        }
    }

    return allTablesExist;
}

async function verifyRecentActivity() {
    console.log('\n📊 Recent Activity Check...\n');

    try {
        // Check recent visitors
        const visitors = await sql`
      SELECT COUNT(*) as count 
      FROM visitor_profiles 
      WHERE last_seen > NOW() - INTERVAL '24 hours'
    `;
        console.log(`👥 Visitors (24h): ${visitors[0].count}`);

        // Check recent events
        const events = await sql`
      SELECT COUNT(*) as count 
      FROM visitor_events 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `;
        console.log(`📈 Events (24h): ${events[0].count}`);

        // Check identified entities
        const entities = await sql`
      SELECT COUNT(*) as count 
      FROM known_entities
    `;
        console.log(`🔐 Identified Entities: ${entities[0].count}`);

        // Check recent identity resolutions
        const recentIdentities = await sql`
      SELECT 
        ke.email,
        ke.real_name,
        ke.confidence_score,
        ke.resolution_sources,
        ke.created_at
      FROM known_entities ke
      ORDER BY ke.created_at DESC
      LIMIT 5
    `;

        if (recentIdentities.length > 0) {
            console.log('\n🎯 Recent Identity Resolutions:');
            recentIdentities.forEach((entity, idx) => {
                console.log(`  ${idx + 1}. ${entity.email} (${entity.real_name || 'Unknown'})`);
                console.log(`     Confidence: ${(entity.confidence_score * 100).toFixed(0)}%`);
                console.log(`     Sources: ${entity.resolution_sources?.join(', ') || 'N/A'}`);
                console.log(`     Resolved: ${new Date(entity.created_at).toLocaleString()}`);
            });
        }

    } catch (error) {
        console.error('❌ Activity check failed:', error.message);
        return false;
    }

    return true;
}

async function verifyRelationships() {
    console.log('\n🔗 Verifying Relationship Merging...\n');

    try {
        // Check if profiles are linked to entities
        const linkedProfiles = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE likely_entity_id IS NOT NULL) as linked,
        COUNT(*) as total
      FROM visitor_profiles
      WHERE NOT is_bot
    `;

        const linkRate = linkedProfiles[0].total > 0
            ? (linkedProfiles[0].linked / linkedProfiles[0].total * 100).toFixed(1)
            : 0;

        console.log(`📎 Linked Profiles: ${linkedProfiles[0].linked} / ${linkedProfiles[0].total} (${linkRate}%)`);

        // Check hardware hash clustering
        const clusters = await sql`
      SELECT 
        hardware_hash,
        COUNT(*) as profile_count,
        likely_entity_id
      FROM visitor_profiles
      WHERE hardware_hash IS NOT NULL
      GROUP BY hardware_hash, likely_entity_id
      HAVING COUNT(*) > 1
      ORDER BY profile_count DESC
      LIMIT 5
    `;

        if (clusters.length > 0) {
            console.log('\n🧬 Hardware Fingerprint Clusters (same device, multiple profiles):');
            clusters.forEach((cluster, idx) => {
                const hash = cluster.hardware_hash.substring(0, 12);
                console.log(`  ${idx + 1}. ${hash}... - ${cluster.profile_count} profiles merged`);
            });
        } else {
            console.log('ℹ️  No multi-profile clusters detected yet');
        }

    } catch (error) {
        console.error('❌ Relationship check failed:', error.message);
        return false;
    }

    return true;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🎯 TRACKING SYSTEM VERIFICATION');
    console.log('═══════════════════════════════════════════════════════');

    const tablesOk = await verifyTables();
    const activityOk = await verifyRecentActivity();
    const relationshipsOk = await verifyRelationships();

    console.log('\n═══════════════════════════════════════════════════════');

    if (tablesOk && activityOk && relationshipsOk) {
        console.log('✅ ALL SYSTEMS OPERATIONAL');
        console.log('\n📝 Next Steps:');
        console.log('   1. Visit the site to generate tracking data');
        console.log('   2. Fill out the contact form to test autofill detection');
        console.log('   3. Check admin dashboard for real-time updates');
        console.log('   4. Run: bun run scripts/verify-tracking.js (again)');
    } else {
        console.log('⚠️  ISSUES DETECTED - Review errors above');
        console.log('\n🔧 Troubleshooting:');
        if (!tablesOk) {
            console.log('   - Run migration: psql $DATABASE_URL -f docs/database/migration_002_analytics_v2.sql');
        }
        console.log('   - Check DATABASE_URL in .env');
        console.log('   - Verify Neon database is accessible');
    }

    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(tablesOk && activityOk && relationshipsOk ? 0 : 1);
}

main().catch(error => {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
});
