import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    const rows =
      await sql`SELECT entity_id, real_name, email, role, notes, resolution_sources FROM known_entities`;
    console.log("known_entities:", rows);
  } catch (e) {
    console.error(e);
  }
}
run();
