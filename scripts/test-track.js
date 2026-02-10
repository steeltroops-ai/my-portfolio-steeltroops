import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";

const sql = neon(process.env.DATABASE_URL);

async function test() {
  const visitorId = "test-visitor-" + Date.now();
  const sessionId = "test-session-" + Date.now();
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const ip = "8.8.8.8";

  console.log("Testing UAParser...");
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    console.log("Browser:", browser.name);
  } catch (e) {
    console.error("UAParser Failed:", e.message);
  }

  console.log("Testing SQL INSERT into visitor_profiles...");
  try {
    await sql`
      INSERT INTO visitor_profiles (
        visitor_id, ip_address, browser, os, device_type, screen_size,
        country, city, region, isp, org, first_seen, last_seen, visit_count, is_owner
      )
      VALUES (
        ${visitorId}, ${ip}, 'Chrome', 'Windows', 
        'desktop', '1920x1080',
        'US', 'Mountain View', 'California', 'Google', 'Google',
        NOW(), NOW(), 1, FALSE
      )
    `;
    console.log("Profile Insert Success");
  } catch (e) {
    console.error("Profile Insert Failed:", e.message);
  }

  console.log("Testing SQL INSERT into visitor_sessions...");
  try {
    await sql`
      INSERT INTO visitor_sessions (
        visitor_uuid, session_id, start_time, last_heartbeat, 
        referrer, utm_source, utm_medium, utm_campaign, entry_page
      )
      SELECT id, ${sessionId}, NOW(), NOW(), '', '', '', '', '/'
      FROM visitor_profiles WHERE visitor_id = ${visitorId}
    `;
    console.log("Session Insert Success");
  } catch (e) {
    console.error("Session Insert Failed:", e.message);
  }

  process.exit();
}

test();
