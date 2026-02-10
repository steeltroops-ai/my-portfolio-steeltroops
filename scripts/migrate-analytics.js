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
  console.log("Starting Analytics Migration...");

  try {
    // 1. Add is_bot to visitor_profiles
    console.log("Checking for 'is_bot' in visitor_profiles...");
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitor_profiles' AND column_name='is_bot') THEN
          ALTER TABLE visitor_profiles ADD COLUMN is_bot BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `;

    // 2. Add ip_address to visitor_sessions
    console.log("Checking for 'ip_address' in visitor_sessions...");
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitor_sessions' AND column_name='ip_address') THEN
          ALTER TABLE visitor_sessions ADD COLUMN ip_address TEXT;
        END IF;
      END $$;
    `;

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error.message);
  }
}

migrate();
