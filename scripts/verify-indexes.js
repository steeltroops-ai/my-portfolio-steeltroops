import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function verifyIndexes() {
    try {
        console.log("🔍 Verifying Database Indexes for Tracking System...\n");

        // Query all indexes on tracking tables
        const indexes = await sql`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (tablename LIKE 'visitor%' 
             OR tablename LIKE 'known%' 
             OR tablename LIKE 'identity%' 
             OR tablename = 'fingerprint_dna'
             OR tablename = 'behavioral_biometrics')
      ORDER BY tablename, indexname;
    `;

        console.log(`📊 Found ${indexes.length} indexes on tracking tables\n`);

        // Group indexes by table
        const indexesByTable = {};
        indexes.forEach(idx => {
            if (!indexesByTable[idx.tablename]) {
                indexesByTable[idx.tablename] = [];
            }
            indexesByTable[idx.tablename].push(idx);
        });

        // Display indexes by table
        Object.keys(indexesByTable).sort().forEach(tablename => {
            console.log(`\n📋 Table: ${tablename}`);
            console.log("─".repeat(80));
            indexesByTable[tablename].forEach(idx => {
                console.log(`  ✓ ${idx.indexname}`);
                console.log(`    ${idx.indexdef}`);
            });
        });

        // Check for expected critical indexes
        console.log("\n\n🎯 Checking Critical Indexes...\n");

        const criticalIndexes = [
            { table: 'visitor_profiles', column: 'visitor_id', description: 'Unique visitor identifier' },
            { table: 'visitor_profiles', column: 'hardware_hash', description: 'Cross-device tracking' },
            { table: 'visitor_profiles', column: 'likely_entity_id', description: 'Entity linking FK' },
            { table: 'visitor_sessions', column: 'session_id', description: 'Unique session identifier' },
            { table: 'visitor_sessions', column: 'visitor_uuid', description: 'Profile FK' },
            { table: 'visitor_events', column: 'session_uuid', description: 'Session FK' },
            { table: 'visitor_events', column: 'event_type', description: 'Event filtering' },
            { table: 'known_entities', column: 'email', description: 'Unique entity identifier' },
            { table: 'identity_clusters', column: 'fingerprint_hash', description: 'Fingerprint clustering' },
            { table: 'behavioral_biometrics', column: 'session_uuid', description: 'Session FK' },
        ];

        let foundCount = 0;
        let missingIndexes = [];

        criticalIndexes.forEach(({ table, column, description }) => {
            const found = indexes.some(idx =>
                idx.tablename === table &&
                (idx.indexdef.includes(`(${column})`) || idx.indexdef.includes(`${column}`))
            );

            if (found) {
                console.log(`  ✅ ${table}.${column} - ${description}`);
                foundCount++;
            } else {
                console.log(`  ❌ ${table}.${column} - ${description} - MISSING!`);
                missingIndexes.push({ table, column, description });
            }
        });

        // Summary
        console.log("\n\n" + "=".repeat(80));
        console.log("📈 SUMMARY");
        console.log("=".repeat(80));
        console.log(`Total indexes found: ${indexes.length}`);
        console.log(`Critical indexes found: ${foundCount}/${criticalIndexes.length}`);
        console.log(`Missing critical indexes: ${missingIndexes.length}`);

        if (missingIndexes.length > 0) {
            console.log("\n⚠️  WARNING: Missing critical indexes detected!");
            console.log("\nMissing indexes:");
            missingIndexes.forEach(({ table, column, description }) => {
                console.log(`  - ${table}.${column} (${description})`);
            });
            console.log("\n💡 These indexes should be created for optimal query performance.");
        } else {
            console.log("\n✅ All critical indexes are present!");
        }

        // Check if we meet the minimum requirement (10 indexes)
        if (indexes.length >= 10) {
            console.log(`\n✅ PASS: Found ${indexes.length} indexes (requirement: minimum 10)`);
        } else {
            console.log(`\n❌ FAIL: Found only ${indexes.length} indexes (requirement: minimum 10)`);
        }

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyIndexes();
