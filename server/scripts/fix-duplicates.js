import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    console.log("Checking for duplicate known_entities by email...");

    // Find all duplicate emails
    const dups = await sql`
      SELECT email, COUNT(*) 
      FROM known_entities 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;

    console.log(`Found ${dups.length} duplicate emails.`);

    for (const dup of dups) {
      if (!dup.email) continue;

      console.log(`Merging duplicates for ${dup.email}...`);

      // Get all entities with this email
      const entities = await sql`
        SELECT * FROM known_entities WHERE email = ${dup.email} ORDER BY created_at ASC
      `;

      const primary = entities[0];
      const others = entities.slice(1);

      for (const other of others) {
        // Re-link visitor_profiles
        await sql`
          UPDATE visitor_profiles SET likely_entity_id = ${primary.entity_id} WHERE likely_entity_id = ${other.entity_id}
        `;

        // Accumulate confidence / sources if we had those fields

        // Delete the duplicate
        await sql`
          DELETE FROM known_entities WHERE entity_id = ${other.entity_id}
        `;
      }
    }

    console.log("Adding UNIQUE constraint to email if not exists...");
    try {
      await sql`ALTER TABLE known_entities ADD CONSTRAINT known_entities_email_key UNIQUE (email)`;
      console.log("Success: Unique constraint added.");
    } catch (e) {
      console.log("Constraint might already exist:", e.message);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
