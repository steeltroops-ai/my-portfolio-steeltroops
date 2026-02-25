import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Migration 003: Correlation Engine & FK Integrity Fix");
  console.log("Target:", process.env.DATABASE_URL.split("@")[1] || "???");

  const steps = [
    {
      name: "Fix behavioral_biometrics: add session_uuid FK column",
      query: () => sql`
        ALTER TABLE behavioral_biometrics
        ADD COLUMN IF NOT EXISTS session_uuid UUID REFERENCES visitor_sessions(id)
      `,
    },
    {
      name: "Add IP reputation columns to visitor_profiles",
      query: () => sql`
        ALTER TABLE visitor_profiles
        ADD COLUMN IF NOT EXISTS ip_reputation_score INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS is_vpn BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_corporate_proxy BOOLEAN DEFAULT FALSE
      `,
    },
    {
      name: "Add confidence tracking columns to known_entities",
      query: () => sql`
        ALTER TABLE known_entities
        ADD COLUMN IF NOT EXISTS total_visits INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS first_seen TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS resolution_sources TEXT[] DEFAULT '{}'
      `,
    },
    {
      name: "Create identity_signals table for confidence audit trail",
      query: () => sql`
        CREATE TABLE IF NOT EXISTS identity_signals (
          id BIGSERIAL PRIMARY KEY,
          entity_id UUID REFERENCES known_entities(entity_id) ON DELETE CASCADE,
          visitor_id TEXT,
          signal_type VARCHAR(50) NOT NULL,
          signal_weight FLOAT NOT NULL DEFAULT 0.0,
          signal_value TEXT,
          recorded_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: "Index: visitor_profiles.hardware_hash (fast fingerprint sweeps)",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_hardware_hash ON visitor_profiles(hardware_hash)
      `,
    },
    {
      name: "Index: visitor_profiles.likely_entity_id (fast entity joins)",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_entity_id ON visitor_profiles(likely_entity_id)
      `,
    },
    {
      name: "Index: visitor_profiles.ip_address (fast IP correlation)",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_ip_address ON visitor_profiles(ip_address)
      `,
    },
    {
      name: "Index: identity_signals.entity_id",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_signals_entity ON identity_signals(entity_id)
      `,
    },
    {
      name: "Index: known_entities.confidence_score DESC (admin dashboard sort)",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_ke_confidence ON known_entities(confidence_score DESC)
      `,
    },
    {
      name: "Backfill known_entities.confidence_score from existing visitor links",
      query: () => sql`
        UPDATE known_entities ke
        SET
          confidence_score = LEAST(
            (SELECT COUNT(DISTINCT vp.hardware_hash) * 0.15 +
                    COUNT(DISTINCT vp.ip_address) * 0.05 +
                    0.3
             FROM visitor_profiles vp
             WHERE vp.likely_entity_id = ke.entity_id
            ), 1.0
          ),
          total_visits = (
            SELECT COALESCE(SUM(vp.visit_count), 0)
            FROM visitor_profiles vp
            WHERE vp.likely_entity_id = ke.entity_id
          ),
          first_seen = (
            SELECT MIN(vp.first_seen)
            FROM visitor_profiles vp
            WHERE vp.likely_entity_id = ke.entity_id
          ),
          last_seen = (
            SELECT MAX(vp.last_seen)
            FROM visitor_profiles vp
            WHERE vp.likely_entity_id = ke.entity_id
          )
        WHERE EXISTS (
          SELECT 1 FROM visitor_profiles vp
          WHERE vp.likely_entity_id = ke.entity_id
        )
      `,
    },
    {
      name: "Verify: known_entities count",
      query: () => sql`SELECT COUNT(*) as count FROM known_entities`,
      report: true,
    },
    {
      name: "Verify: identity_signals table accessible",
      query: () => sql`SELECT COUNT(*) as count FROM identity_signals`,
      report: true,
    },
  ];

  for (const step of steps) {
    try {
      const result = await step.query();
      if (step.report) {
        console.log(`  [OK] ${step.name} -> ${result[0].count} rows`);
      } else {
        console.log(`  [OK] ${step.name}`);
      }
    } catch (err) {
      console.error(`  [FAIL] ${step.name}:`, err.message);
    }
  }

  console.log("\nMigration 003 complete.");
}

migrate();
