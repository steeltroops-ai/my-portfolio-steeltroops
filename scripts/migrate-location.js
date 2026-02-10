import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const sql = neon(process.env.DATABASE_URL || "");

async function migrate() {
  console.log("Starting Location Migration...");

  try {
    console.log("Adding latitude column...");
    await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS latitude FLOAT`;
    console.log("Added latitude.");

    console.log("Adding longitude column...");
    await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS longitude FLOAT`;
    console.log("Added longitude.");

    console.log("Adding region column...");
    await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS region TEXT`;
    console.log("Added region.");

    console.log("Adding device_model column...");
    await sql`ALTER TABLE visitor_profiles ADD COLUMN IF NOT EXISTS device_model TEXT`;
    console.log("Added device_model.");

    console.log("Location Migration completed successfully.");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

migrate();
