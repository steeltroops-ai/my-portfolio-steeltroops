import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const steps = [
    {
      name: "Add timezone_name, languages, platform, network_downlink to visitor_profiles",
      query: () => sql`
        ALTER TABLE visitor_profiles
        ADD COLUMN IF NOT EXISTS timezone_name TEXT,
        ADD COLUMN IF NOT EXISTS languages TEXT,
        ADD COLUMN IF NOT EXISTS platform TEXT,
        ADD COLUMN IF NOT EXISTS network_downlink FLOAT
      `,
    },
    {
      name: "Rename visitor_profiles.lat/lon to latitude/longitude aliases (index coverage)",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_lat_lon ON visitor_profiles(latitude, longitude)
      `,
    },
    {
      name: "Add identity_id FK reference to master_identities in visitor_profiles",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_identity_id ON visitor_profiles(identity_id)
      `,
    },
    {
      name: "Index visitor_profiles.hardware_hash",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_hardware_hash ON visitor_profiles(hardware_hash)
      `,
    },
    {
      name: "Index visitor_profiles.likely_entity_id",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_vp_entity_id ON visitor_profiles(likely_entity_id)
      `,
    },
    {
      name: "Add canvas_hash column to visitor_profiles for fingerprint correlation",
      query: () => sql`
        ALTER TABLE visitor_profiles
        ADD COLUMN IF NOT EXISTS canvas_hash TEXT
      `,
    },
    {
      name: "Create identity_clusters table (standalone, no FK to non-existent fingerprint_dna)",
      query: () => sql`
        CREATE TABLE IF NOT EXISTS identity_clusters (
          cluster_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          fingerprint_hash TEXT UNIQUE,
          primary_entity_id UUID REFERENCES known_entities(entity_id) ON DELETE SET NULL,
          confidence_score FLOAT DEFAULT 0.0,
          gpu_renderer TEXT,
          device_model TEXT,
          linked_visitor_count INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `,
    },
    {
      name: "Index identity_clusters.primary_entity_id",
      query: () => sql`
        CREATE INDEX IF NOT EXISTS idx_cluster_entity ON identity_clusters(primary_entity_id)
      `,
    },
    {
      name: "Backfill identity_clusters from existing visitor fingerprints",
      query: () => sql`
        INSERT INTO identity_clusters (fingerprint_hash, primary_entity_id, linked_visitor_count, confidence_score)
        SELECT
          hardware_hash,
          likely_entity_id,
          COUNT(*) as linked_visitor_count,
          CASE WHEN likely_entity_id IS NOT NULL THEN 0.5 ELSE 0.0 END as confidence_score
        FROM visitor_profiles
        WHERE hardware_hash IS NOT NULL
        GROUP BY hardware_hash, likely_entity_id
        ON CONFLICT (fingerprint_hash) DO UPDATE SET
          linked_visitor_count = EXCLUDED.linked_visitor_count,
          updated_at = NOW()
      `,
    },
    {
      name: "Verify: identity_clusters row count",
      query: () => sql`SELECT COUNT(*) as count FROM identity_clusters`,
      report: true,
    },
    {
      name: "Verify: identity_signals row count",
      query: () => sql`SELECT COUNT(*) as count FROM identity_signals`,
      report: true,
    },
    {
      name: "Verify: known_entities row count",
      query: () => sql`SELECT COUNT(*) as count FROM known_entities`,
      report: true,
    },
    {
      name: "Verify: master_identities row count",
      query: () => sql`SELECT COUNT(*) as count FROM master_identities`,
      report: true,
    },
  ];

  console.log(
    "Migration 003-final: Schema alignment + cluster table + index coverage"
  );

  for (const step of steps) {
    try {
      const result = await step.query();
      if (step.report) {
        console.log(`  [OK] ${step.name} -> ${result[0].count} rows`);
      } else {
        console.log(`  [OK] ${step.name}`);
      }
    } catch (e) {
      console.error(`  [FAIL] ${step.name}: ${e.message}`);
    }
  }

  console.log("\nDone. Schema is fully aligned.");
}

run();
