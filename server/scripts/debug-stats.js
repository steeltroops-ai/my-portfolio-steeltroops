import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function debugStats() {
  console.log("Checking DB Connection...");
  try {
    const res = await sql`SELECT 1 as connected`;
    console.log("DB Connected:", res[0]);
  } catch (err) {
    console.error("DB Connection FAILED:", err);
    process.exit(1);
  }

  console.log("Running problematic stats query...");
  try {
    const result = await sql`
        WITH visitor_stats AS (
          SELECT
            s.visitor_uuid,
            COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) as total_clicks,
            COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END) as total_pageviews,
            (ARRAY_AGG(s.referrer ORDER BY s.last_heartbeat DESC) FILTER (WHERE s.referrer IS NOT NULL AND s.referrer != ''))[1] as last_referrer,
            (ARRAY_AGG(e.path ORDER BY e.timestamp DESC))[1] as last_path,
            EXTRACT(EPOCH FROM (MAX(e.timestamp) - MIN(e.timestamp))) as duration_seconds
          FROM visitor_sessions s
          LEFT JOIN visitor_events e ON e.session_uuid = s.id
          GROUP BY s.visitor_uuid
        )
        SELECT 
          p.id, 
          p.visitor_id, 
          p.visit_count
        FROM visitor_profiles p
        LEFT JOIN known_entities k ON p.likely_entity_id = k.entity_id
        LEFT JOIN visitor_stats vs ON vs.visitor_uuid = p.id
        WHERE p.is_owner = FALSE
        ORDER BY p.last_seen DESC
        LIMIT 5;
    `;
    console.log("Query Success! Rows:", result.length);
    console.log("First Row:", result[0]);
  } catch (error) {
    console.error("Query FAILED:", error);
    if (error.source) console.error("Source:", error.source);
    if (error.position) console.error("Position:", error.position);
  }
}

debugStats();
