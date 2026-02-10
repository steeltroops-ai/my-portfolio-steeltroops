import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const sql = neon(process.env.DATABASE_URL || "");

const dummyVisitors = [
  {
    visitor_id: "dummy_v1",
    ip_address: "1.1.1.1",
    city: "New York",
    country: "US",
    region: "NY",
    latitude: 40.7128,
    longitude: -74.006,
    browser: "Chrome",
    os: "Windows 10",
    device_type: "desktop",
    is_owner: false,
    last_seen: new Date().toISOString()
  },
  {
    visitor_id: "dummy_v2",
    ip_address: "2.2.2.2",
    city: "London",
    country: "GB",
    region: "England",
    latitude: 51.5074,
    longitude: -0.1278,
    browser: "Safari",
    os: "Mac OS",
    device_type: "desktop",
    is_owner: false,
    last_seen: new Date().toISOString()
  },
  {
    visitor_id: "dummy_v3",
    ip_address: "3.3.3.3",
    city: "Tokyo",
    country: "JP",
    region: "Tokyo",
    latitude: 35.6762,
    longitude: 139.6503,
    browser: "Firefox",
    os: "Windows 11",
    device_type: "desktop",
    is_owner: false,
    last_seen: new Date().toISOString()
  },
  {
    visitor_id: "dummy_v4",
    ip_address: "4.4.4.4",
    city: "Sydney",
    country: "AU",
    region: "NSW",
    latitude: -33.8688,
    longitude: 151.2093,
    browser: "Edge",
    os: "Windows 10",
    device_type: "desktop",
    is_owner: false,
    last_seen: new Date().toISOString()
  },
  {
    visitor_id: "dummy_v5",
    ip_address: "5.5.5.5",
    city: "New Delhi",
    country: "IN",
    region: "DL",
    latitude: 28.6139,
    longitude: 77.209,
    browser: "Chrome",
    os: "Android",
    device_type: "mobile",
    is_owner: false,
    last_seen: new Date().toISOString()
  }
];

async function seed() {
  console.log("Seeding dummy visitor data...");

  for (const v of dummyVisitors) {
    try {
      await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, city, country, region, 
          latitude, longitude, browser, os, device_type, is_owner, last_seen, first_seen, visit_count, is_bot
        ) VALUES (
          ${v.visitor_id}, ${v.ip_address}, ${v.city}, ${v.country}, ${v.region},
          ${v.latitude}, ${v.longitude}, ${v.browser}, ${v.os}, ${v.device_type}, ${v.is_owner}, ${v.last_seen}, ${v.last_seen}, 1, false
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          last_seen = EXCLUDED.last_seen
      `;
      console.log(`Inserted/Updated ${v.city}`);
    } catch (e) {
      console.error(`Error inserting ${v.city}:`, e.message);
    }
  }

  console.log("Seeding complete.");
}

seed();
