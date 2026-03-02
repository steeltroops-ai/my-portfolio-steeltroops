import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function addMissingIndexes() {
    try {
        console.log("🔧 Adding Missing Critical Indexes...\n");

        // Index 1: visitor_sessions.visitor_uuid (Profile FK)
        console.log("Creating index on visitor_sessions.visitor_uuid...");
        await sql`
      CREATE INDEX IF NOT EXISTS idx_vs_visitor_uuid 
      ON visitor_sessions(visitor_uuid);
    `;
        console.log("✅ Created idx_vs_visitor_uuid");

        // Index 2: visitor_events.session_uuid (Session FK)
        console.log("\nCreating index on visitor_events.session_uuid...");
        await sql`
      CREATE INDEX IF NOT EXISTS idx_ve_session_uuid 
      ON visitor_events(session_uuid);
    `;
        console.log("✅ Created idx_ve_session_uuid");

        // Index 3: visitor_events.event_type (Event filtering)
        console.log("\nCreating index on visitor_events.event_type...");
        await sql`
      CREATE INDEX IF NOT EXISTS idx_ve_event_type 
      ON visitor_events(event_type);
    `;
        console.log("✅ Created idx_ve_event_type");

        console.log("\n" + "=".repeat(80));
        console.log("✅ All missing indexes have been created successfully!");
        console.log("=".repeat(80));

        // Verify the indexes were created
        console.log("\n🔍 Verifying new indexes...\n");

        const newIndexes = await sql`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN ('idx_vs_visitor_uuid', 'idx_ve_session_uuid', 'idx_ve_event_type')
      ORDER BY tablename, indexname;
    `;

        if (newIndexes.length === 3) {
            console.log("✅ All 3 indexes verified:");
            newIndexes.forEach(idx => {
                console.log(`  ✓ ${idx.indexname} on ${idx.tablename}`);
            });
        } else {
            console.log(`⚠️  Warning: Expected 3 indexes, found ${newIndexes.length}`);
        }

        console.log("\n💡 Run 'bun run scripts/verify-indexes.js' to confirm all indexes are present.");

    } catch (error) {
        console.error("❌ ERROR:", error.message);
        console.error(error);
        process.exit(1);
    }
}

addMissingIndexes();
