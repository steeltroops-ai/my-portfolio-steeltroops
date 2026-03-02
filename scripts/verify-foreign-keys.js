import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function verifyForeignKeys() {
    console.log("=== FOREIGN KEY VERIFICATION ===\n");

    try {
        // Step 1: Check FK definitions
        console.log("1. Checking Foreign Key Definitions...");
        const foreignKeys = await sql`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table, 
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name LIKE 'visitor%' 
          OR tc.table_name LIKE 'behavioral%'
          OR tc.table_name LIKE 'identity%')
      ORDER BY tc.table_name;
    `;

        console.log(`Found ${foreignKeys.length} foreign key constraints:\n`);
        foreignKeys.forEach((fk) => {
            console.log(
                `  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`
            );
        });

        // Expected foreign keys
        const expectedFKs = [
            { table: "visitor_sessions", column: "visitor_uuid", foreign_table: "visitor_profiles", foreign_column: "id" },
            { table: "visitor_events", column: "session_uuid", foreign_table: "visitor_sessions", foreign_column: "id" },
            { table: "visitor_profiles", column: "likely_entity_id", foreign_table: "known_entities", foreign_column: "entity_id" },
            { table: "behavioral_biometrics", column: "session_uuid", foreign_table: "visitor_sessions", foreign_column: "id" },
            { table: "identity_clusters", column: "primary_entity_id", foreign_table: "known_entities", foreign_column: "entity_id" },
            { table: "identity_signals", column: "entity_id", foreign_table: "known_entities", foreign_column: "entity_id" },
        ];

        console.log("\n2. Verifying Expected Foreign Keys...");
        let allFound = true;
        expectedFKs.forEach((expected) => {
            const found = foreignKeys.find(
                (fk) =>
                    fk.table_name === expected.table &&
                    fk.column_name === expected.column &&
                    fk.foreign_table === expected.foreign_table &&
                    fk.foreign_column === expected.foreign_column
            );
            if (found) {
                console.log(`  ✅ ${expected.table}.${expected.column} → ${expected.foreign_table}.${expected.foreign_column}`);
            } else {
                console.log(`  ❌ MISSING: ${expected.table}.${expected.column} → ${expected.foreign_table}.${expected.foreign_column}`);
                allFound = false;
            }
        });

        // Step 2: Test joins between related tables
        console.log("\n3. Testing Joins Between Related Tables...");

        const joinTest = await sql`
      SELECT 
        vp.visitor_id,
        vs.session_id,
        ve.event_type,
        ke.email
      FROM visitor_profiles vp
      LEFT JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
      LEFT JOIN visitor_events ve ON ve.session_uuid = vs.id
      LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
      LIMIT 5;
    `;

        console.log(`  Join test returned ${joinTest.length} rows`);
        if (joinTest.length > 0) {
            console.log("  ✅ Joins work correctly");
            console.log("\n  Sample data:");
            joinTest.forEach((row, idx) => {
                console.log(`    Row ${idx + 1}:`, {
                    visitor_id: row.visitor_id,
                    session_id: row.session_id || "null",
                    event_type: row.event_type || "null",
                    email: row.email || "null",
                });
            });
        } else {
            console.log("  ⚠️  No data available for join test (tables may be empty)");
        }

        // Step 3: Verify referential integrity (check for orphaned records)
        console.log("\n4. Checking Referential Integrity...");

        // Check orphaned sessions
        const orphanedSessions = await sql`
      SELECT COUNT(*) as count
      FROM visitor_sessions vs
      LEFT JOIN visitor_profiles vp ON vp.id = vs.visitor_uuid
      WHERE vp.id IS NULL;
    `;
        console.log(`  Orphaned sessions (no matching profile): ${orphanedSessions[0].count}`);
        if (orphanedSessions[0].count === 0) {
            console.log("    ✅ No orphaned sessions");
        } else {
            console.log(`    ❌ Found ${orphanedSessions[0].count} orphaned sessions`);
        }

        // Check orphaned events
        const orphanedEvents = await sql`
      SELECT COUNT(*) as count
      FROM visitor_events ve
      LEFT JOIN visitor_sessions vs ON vs.id = ve.session_uuid
      WHERE vs.id IS NULL;
    `;
        console.log(`  Orphaned events (no matching session): ${orphanedEvents[0].count}`);
        if (orphanedEvents[0].count === 0) {
            console.log("    ✅ No orphaned events");
        } else {
            console.log(`    ❌ Found ${orphanedEvents[0].count} orphaned events`);
        }

        // Check invalid entity links
        const invalidEntityLinks = await sql`
      SELECT COUNT(*) as count
      FROM visitor_profiles vp
      LEFT JOIN known_entities ke ON ke.entity_id = vp.likely_entity_id
      WHERE vp.likely_entity_id IS NOT NULL AND ke.entity_id IS NULL;
    `;
        console.log(`  Invalid entity links: ${invalidEntityLinks[0].count}`);
        if (invalidEntityLinks[0].count === 0) {
            console.log("    ✅ No invalid entity links");
        } else {
            console.log(`    ❌ Found ${invalidEntityLinks[0].count} invalid entity links`);
        }

        // Check orphaned behavioral biometrics
        const orphanedBiometrics = await sql`
      SELECT COUNT(*) as count
      FROM behavioral_biometrics bb
      LEFT JOIN visitor_sessions vs ON vs.id = bb.session_uuid
      WHERE vs.id IS NULL;
    `;
        console.log(`  Orphaned behavioral biometrics: ${orphanedBiometrics[0].count}`);
        if (orphanedBiometrics[0].count === 0) {
            console.log("    ✅ No orphaned biometrics");
        } else {
            console.log(`    ❌ Found ${orphanedBiometrics[0].count} orphaned biometrics`);
        }

        // Check orphaned identity signals
        const orphanedSignals = await sql`
      SELECT COUNT(*) as count
      FROM identity_signals isig
      LEFT JOIN known_entities ke ON ke.entity_id = isig.entity_id
      WHERE ke.entity_id IS NULL;
    `;
        console.log(`  Orphaned identity signals: ${orphanedSignals[0].count}`);
        if (orphanedSignals[0].count === 0) {
            console.log("    ✅ No orphaned identity signals");
        } else {
            console.log(`    ❌ Found ${orphanedSignals[0].count} orphaned identity signals`);
        }

        // Check orphaned identity clusters
        const orphanedClusters = await sql`
      SELECT COUNT(*) as count
      FROM identity_clusters ic
      LEFT JOIN known_entities ke ON ke.entity_id = ic.primary_entity_id
      WHERE ke.entity_id IS NULL;
    `;
        console.log(`  Orphaned identity clusters: ${orphanedClusters[0].count}`);
        if (orphanedClusters[0].count === 0) {
            console.log("    ✅ No orphaned identity clusters");
        } else {
            console.log(`    ❌ Found ${orphanedClusters[0].count} orphaned identity clusters`);
        }

        // Summary
        console.log("\n=== VERIFICATION SUMMARY ===");
        console.log(`Total foreign keys found: ${foreignKeys.length}`);
        console.log(`Expected foreign keys: ${expectedFKs.length}`);
        console.log(`All expected FKs present: ${allFound ? "✅ YES" : "❌ NO"}`);

        const totalOrphans =
            parseInt(orphanedSessions[0].count) +
            parseInt(orphanedEvents[0].count) +
            parseInt(invalidEntityLinks[0].count) +
            parseInt(orphanedBiometrics[0].count) +
            parseInt(orphanedSignals[0].count) +
            parseInt(orphanedClusters[0].count);

        console.log(`Total orphaned records: ${totalOrphans}`);
        console.log(`Referential integrity: ${totalOrphans === 0 ? "✅ PASS" : "❌ FAIL"}`);

        if (allFound && totalOrphans === 0) {
            console.log("\n✅ ALL FOREIGN KEY CHECKS PASSED");
            process.exit(0);
        } else {
            console.log("\n❌ SOME FOREIGN KEY CHECKS FAILED");
            process.exit(1);
        }

    } catch (error) {
        console.error("\n❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyForeignKeys();
