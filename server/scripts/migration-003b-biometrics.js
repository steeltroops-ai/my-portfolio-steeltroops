import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS behavioral_biometrics (
        id BIGSERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        session_uuid UUID REFERENCES visitor_sessions(id),
        avg_mouse_velocity FLOAT,
        click_dead_zones BOOLEAN,
        scroll_linearity FLOAT,
        typing_cadence_ms FLOAT,
        entropy_score FLOAT,
        is_bot_verified BOOLEAN DEFAULT FALSE,
        recorded_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log("[OK] behavioral_biometrics created with proper FK");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_bio_session_uuid ON behavioral_biometrics(session_uuid)
    `;
    console.log("[OK] idx_bio_session_uuid created");

    await sql`
      CREATE INDEX IF NOT EXISTS idx_bio_session_id ON behavioral_biometrics(session_id)
    `;
    console.log("[OK] idx_bio_session_id created");

    const test = await sql`SELECT COUNT(*) as count FROM behavioral_biometrics`;
    console.log(
      `[OK] Verified: ${test[0].count} rows in behavioral_biometrics`
    );
  } catch (e) {
    console.error("[FAIL]", e.message);
  }
}

run();
