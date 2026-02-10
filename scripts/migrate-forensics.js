import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const sql = neon(process.env.DATABASE_URL || "");

async function migrate() {
  console.log("Starting Forensic Identity Migration...");

  try {
    // 1. Create Master Identities table
    await sql`
      CREATE TABLE IF NOT EXISTS master_identities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        real_name TEXT,
        email TEXT UNIQUE,
        phone TEXT,
        linkedin_url TEXT,
        github_username TEXT,
        twitter_handle TEXT,
        notes TEXT,
        first_reveal_timestamp TIMESTAMP DEFAULT NOW(),
        last_active_timestamp TIMESTAMP DEFAULT NOW()
      );
    `;

    // 2. Add Forensic columns to visitor_profiles
    const columnsToProfiles = [
      { name: "fingerprint", type: "TEXT" },
      { name: "identity_id", type: "UUID" }, // Foreign key added via manual DDL to avoid complex templating
      { name: "gpu_vendor", type: "TEXT" },
      { name: "gpu_renderer", type: "TEXT" },
      { name: "cpu_cores", type: "INT" },
      { name: "memory_estimate", type: "INT" },
      { name: "max_touch_points", type: "INT" },
      { name: "timezone_offset", type: "INT" },
      { name: "device_model", type: "TEXT" },
    ];

    for (const col of columnsToProfiles) {
      await sql.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitor_profiles' AND column_name='${col.name}') THEN
            ALTER TABLE visitor_profiles ADD COLUMN ${col.name} ${col.type};
          END IF;
        END $$;
      `);
    }

    // 3. Add Forensic columns to visitor_sessions
    const columnsToSessions = [
      { name: "network_type", type: "TEXT" },
      { name: "is_vpn", type: "BOOLEAN DEFAULT FALSE" },
    ];

    for (const col of columnsToSessions) {
      await sql.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visitor_sessions' AND column_name='${col.name}') THEN
            ALTER TABLE visitor_sessions ADD COLUMN ${col.name} ${col.type};
          END IF;
        END $$;
      `);
    }

    // 4. Create an Identity Merging view for the admin
    await sql`
      CREATE OR REPLACE VIEW identity_resolution_map AS
      SELECT 
        m.id as identity_id,
        m.real_name,
        m.email,
        v.visitor_id,
        v.fingerprint,
        v.ip_address,
        v.city,
        v.country,
        v.device_model,
        v.last_seen
      FROM master_identities m
      JOIN visitor_profiles v ON v.identity_id = m.id;
    `;

    console.log("Forensic Migration completed successfully.");
  } catch (error) {
    console.error("Forensic Migration failed:", error.message);
  }
}

migrate();
