import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function fixDatabase() {
  console.log("🛠️ Starting Database Fix...");
  console.log(
    "Connecting to:",
    process.env.DATABASE_URL.split("@")[1] || "???"
  ); // Log provider (masked)

  try {
    // 1. Create known_entities (without IF NOT EXISTS check -> IF NOT logic)
    console.log("Creating 'known_entities' table...");
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS known_entities (
            entity_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            real_name VARCHAR(255),
            email VARCHAR(255) UNIQUE, 
            linkedin_url VARCHAR(255),
            role VARCHAR(100), -- e.g., "Recruiter", "Developer", "Threat Actor"
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log("✅ 'known_entities' table active.");
    } catch (e) {
      console.error("❌ Failed to create 'known_entities':", e.message);
    }

    // 2. Add columns to visitor_profiles
    console.log("Updating 'visitor_profiles' schema...");
    try {
      await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS likely_entity_id UUID REFERENCES known_entities(entity_id)`;
      console.log("✅ Added/Verified likely_entity_id");
    } catch (e) {
      console.error("⚠️ Failed likely_entity_id:", e.message);
    }

    try {
      await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS hardware_hash VARCHAR(255)`;
      console.log("✅ Added/Verified hardware_hash");
    } catch (e) {
      console.error("⚠️ Failed hardware_hash:", e.message);
    }

    // 3. Create visitor_stats CTE Logic Verification (Try running the CTE query)
    console.log("Verifying logical integrity via query...");
    try {
      const test = await sql`SELECT count(*) FROM known_entities`;
      console.log(
        `✅ Table Query Success: ${test[0].count} known entities found.`
      );
    } catch (e) {
      console.error("❌ CRITICAL: Cannot query known_entities:", e.message);
    }
  } catch (globalErr) {
    console.error("UNKNOWN FATAL ERROR:", globalErr);
  }
}

fixDatabase();
