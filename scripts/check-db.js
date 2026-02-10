import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function check() {
  try {
    const columns =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'visitor_profiles'`;
    console.log(
      "COLUMNS:",
      columns.map((c) => c.column_name)
    );

    // Also check visitor_sessions
    const sessionCols =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'visitor_sessions'`;
    console.log(
      "SESSION_COLUMNS:",
      sessionCols.map((c) => c.column_name)
    );

    // Also check visitor_events
    const eventCols =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'visitor_events'`;
    console.log(
      "EVENT_COLUMNS:",
      eventCols.map((c) => c.column_name)
    );

    // Also check admin_profiles and sessions
    const adminCols =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_profiles'`;
    console.log(
      "ADMIN_COLUMNS:",
      adminCols.map((c) => c.column_name)
    );

    const authSessionCols =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions'`;
    console.log(
      "AUTH_SESSION_COLUMNS:",
      authSessionCols.map((c) => c.column_name)
    );
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

check();
