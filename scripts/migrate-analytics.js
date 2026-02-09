import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("🚀 Starting analytics migration...");

  try {
    // 1. Create Visitors Table
    console.log("--- Creating table: visitor_profiles ---");
    await sql`
      CREATE TABLE IF NOT EXISTS visitor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id TEXT UNIQUE NOT NULL,
        ip_address TEXT,
        browser TEXT,
        os TEXT,
        device_brand TEXT,
        device_type TEXT,
        screen_size TEXT,
        country TEXT,
        region TEXT,
        city TEXT,
        continent TEXT,
        isp TEXT,
        org TEXT,
        lat NUMERIC,
        lon NUMERIC,
        visit_count INT DEFAULT 1,
        is_owner BOOLEAN DEFAULT FALSE,
        first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Create Sessions Table
    console.log("--- Creating table: visitor_sessions ---");
    await sql`
      CREATE TABLE IF NOT EXISTS visitor_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_uuid UUID REFERENCES visitor_profiles(id),
        session_id TEXT UNIQUE NOT NULL,
        referrer TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        entry_page TEXT,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 3. Create Events Table
    console.log("--- Creating table: visitor_events ---");
    await sql`
      CREATE TABLE IF NOT EXISTS visitor_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_uuid UUID REFERENCES visitor_sessions(id),
        event_type TEXT NOT NULL,
        event_label TEXT,
        event_value TEXT,
        path TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 4. Create Indexes
    console.log("--- Creating indexes ---");
    await sql`CREATE INDEX IF NOT EXISTS idx_visitor_last_seen ON visitor_profiles(last_seen);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_start ON visitor_sessions(start_time);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_event_timestamp ON visitor_events(timestamp);`;

    console.log("✅ Analytics migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

migrate();
