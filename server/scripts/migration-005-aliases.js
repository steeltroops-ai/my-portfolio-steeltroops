import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Adding aliases array to known_entities...");
    await sql`
      ALTER TABLE known_entities
      ADD COLUMN IF NOT EXISTS aliases VARCHAR[] DEFAULT ARRAY[]::VARCHAR[]
    `;

    // Seed it with the existing real_name to start
    await sql`
      UPDATE known_entities 
      SET aliases = ARRAY[real_name]
      WHERE aliases = ARRAY[]::VARCHAR[] AND real_name IS NOT NULL AND real_name != 'Unknown'
    `;
    console.log("Migration 005 OK: Aliases column added.");
  } catch (e) {
    console.error("Migration 005 Failed:", e);
  }
}

run();
