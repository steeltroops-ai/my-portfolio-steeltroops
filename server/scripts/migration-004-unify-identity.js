import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log("Migration 004: Unify Identity Systems\n");

  // Step 1: Migrate master_identities -> known_entities
  // These are real people already captured via previous systems
  console.log("Step 1: Migrating master_identities -> known_entities");
  const masters = await sql`SELECT * FROM master_identities`;
  console.log(`  Found ${masters.length} identities in master_identities`);

  for (const m of masters) {
    try {
      const result = await sql`
        INSERT INTO known_entities (
          real_name, email, linkedin_url, role, notes,
          confidence_score, resolution_sources,
          first_seen, last_seen
        )
        VALUES (
          ${m.real_name},
          ${m.email?.toLowerCase()},
          ${m.linkedin_url || null},
          'Known Contact',
          ${`Migrated from master_identities. Original reveal: ${m.first_reveal_timestamp}`},
          0.5,
          ARRAY['form_submit'],
          ${m.first_reveal_timestamp || new Date().toISOString()},
          ${m.last_active_timestamp || new Date().toISOString()}
        )
        ON CONFLICT (email) DO UPDATE SET
          real_name = CASE WHEN known_entities.real_name = 'Unknown' THEN EXCLUDED.real_name ELSE known_entities.real_name END,
          linkedin_url = COALESCE(known_entities.linkedin_url, EXCLUDED.linkedin_url),
          confidence_score = GREATEST(known_entities.confidence_score, 0.5),
          updated_at = NOW()
        RETURNING entity_id, email
      `;
      console.log(
        `  [OK] ${m.real_name} (${m.email}) -> entity_id: ${result[0].entity_id}`
      );
    } catch (e) {
      console.error(`  [FAIL] ${m.email}: ${e.message}`);
    }
  }

  // Step 2: Migrate identity_resolution_map -> link visitor_profiles
  // identity_resolution_map has (identity_id, visitor_id, fingerprint, email)
  // We use email to find the known_entity and link the visitor_profile
  console.log(
    "\nStep 2: Linking identity_resolution_map records to visitor_profiles"
  );
  const irm = await sql`SELECT * FROM identity_resolution_map`;
  console.log(`  Found ${irm.length} records in identity_resolution_map`);

  let linked = 0;
  let retroLinked = 0;
  for (const r of irm) {
    try {
      if (!r.email) continue;

      // Find the entity we just created
      const entity = await sql`
        SELECT entity_id FROM known_entities WHERE email = ${r.email.toLowerCase()} LIMIT 1
      `;
      if (entity.length === 0) continue;
      const entityId = entity[0].entity_id;

      // Link the visitor_profile by visitor_id
      if (r.visitor_id) {
        const update = await sql`
          UPDATE visitor_profiles SET
            likely_entity_id = ${entityId}
          WHERE visitor_id = ${r.visitor_id}
            AND likely_entity_id IS NULL
          RETURNING id
        `;
        if (update.length > 0) linked++;
      }

      // Retroactive: link by fingerprint (hardware_hash)
      if (r.fingerprint) {
        const retro = await sql`
          UPDATE visitor_profiles SET
            likely_entity_id = ${entityId},
            hardware_hash = COALESCE(hardware_hash, ${r.fingerprint})
          WHERE (fingerprint = ${r.fingerprint} OR hardware_hash = ${r.fingerprint})
            AND likely_entity_id IS NULL
          RETURNING id
        `;
        retroLinked += retro.length;
      }

      // Also link by IP if fingerprint doesn't exist and IP is specific enough
      // (Only do this for very clean IPs - skip 0.0.0.0 etc)
      if (r.ip_address && r.ip_address !== "0.0.0.0" && !r.fingerprint) {
        const ipRetro = await sql`
          UPDATE visitor_profiles SET
            likely_entity_id = ${entityId}
          WHERE ip_address = ${r.ip_address}
            AND likely_entity_id IS NULL
          RETURNING id
        `;
        retroLinked += ipRetro.length;
      }
    } catch (e) {
      console.error(`  [FAIL] IRM record ${r.visitor_id}: ${e.message}`);
    }
  }
  console.log(`  Directly linked: ${linked} visitor_profiles`);
  console.log(
    `  Retroactively linked (fingerprint/IP): ${retroLinked} visitor_profiles`
  );

  // Step 3: Link contact_messages to known_entities
  console.log("\nStep 3: Linking contact_messages -> known_entities");
  const contacts = await sql`
    SELECT DISTINCT name, email FROM contact_messages WHERE email IS NOT NULL AND email != ''
  `;
  console.log(`  Found ${contacts.length} unique emails in contact_messages`);

  let contactsLinked = 0;
  for (const contact of contacts) {
    try {
      const result = await sql`
        INSERT INTO known_entities (real_name, email, role, notes, confidence_score, resolution_sources)
        VALUES (
          ${contact.name?.trim() || "Unknown"},
          ${contact.email?.toLowerCase()?.trim()},
          'Contact Inquiry',
          'Auto-resolved from contact form submission',
          0.5,
          ARRAY['form_submit']
        )
        ON CONFLICT (email) DO UPDATE SET
          real_name = CASE WHEN known_entities.real_name = 'Unknown' THEN EXCLUDED.real_name ELSE known_entities.real_name END,
          confidence_score = GREATEST(known_entities.confidence_score, 0.5),
          updated_at = NOW()
        RETURNING entity_id, email
      `;
      contactsLinked++;
    } catch (e) {
      console.error(`  [FAIL] ${contact.email}: ${e.message}`);
    }
  }
  console.log(`  Upserted ${contactsLinked} entities from contact_messages`);

  // Step 4: Add FK constraint from visitor_sessions.visitor_uuid -> visitor_profiles.id
  console.log(
    "\nStep 4: Adding FK constraint on visitor_sessions.visitor_uuid"
  );
  try {
    await sql`
      ALTER TABLE visitor_sessions
      ADD CONSTRAINT fk_sessions_visitor
      FOREIGN KEY (visitor_uuid) REFERENCES visitor_profiles(id) ON DELETE SET NULL
    `;
    console.log("  [OK] FK added");
  } catch (e) {
    if (
      e.message.includes("already exists") ||
      e.message.includes("multiple")
    ) {
      console.log("  [SKIP] FK already exists or constrained differently");
    } else {
      console.log(`  [WARN] ${e.message}`);
    }
  }

  // Step 5: Backfill identity_clusters from linked visitor_profiles
  console.log(
    "\nStep 5: Backfilling identity_clusters from linked fingerprints"
  );
  const clusterBackfill = await sql`
    INSERT INTO identity_clusters (fingerprint_hash, primary_entity_id, linked_visitor_count, confidence_score)
    SELECT
      hardware_hash,
      likely_entity_id,
      COUNT(*) as linked_visitor_count,
      0.5 as confidence_score
    FROM visitor_profiles
    WHERE hardware_hash IS NOT NULL AND likely_entity_id IS NOT NULL
    GROUP BY hardware_hash, likely_entity_id
    ON CONFLICT (fingerprint_hash) DO UPDATE SET
      primary_entity_id = EXCLUDED.primary_entity_id,
      linked_visitor_count = EXCLUDED.linked_visitor_count,
      updated_at = NOW()
    RETURNING cluster_id
  `;
  console.log(`  [OK] ${clusterBackfill.length} identity_clusters upserted`);

  // Step 6: Backfill identity_signals audit records for migrated entities
  console.log("\nStep 6: Seeding identity_signals for migrated identities");
  const allEntities = await sql`SELECT entity_id, email FROM known_entities`;
  let sigCount = 0;
  for (const e of allEntities) {
    try {
      await sql`
        INSERT INTO identity_signals (entity_id, visitor_id, signal_type, signal_weight, signal_value)
        VALUES (${e.entity_id}, null, 'form_submit', 0.5, ${e.email})
        ON CONFLICT DO NOTHING
      `;
      sigCount++;
    } catch {}
  }
  console.log(`  [OK] ${sigCount} identity_signals seeded`);

  // Step 7: Refresh confidence + total_visits on known_entities
  console.log("\nStep 7: Refreshing known_entities aggregate stats");
  await sql`
    UPDATE known_entities ke SET
      total_visits = (
        SELECT COALESCE(SUM(vp.visit_count), 0)
        FROM visitor_profiles vp WHERE vp.likely_entity_id = ke.entity_id
      ),
      last_seen = GREATEST(
        ke.last_seen,
        (SELECT MAX(vp.last_seen) FROM visitor_profiles vp WHERE vp.likely_entity_id = ke.entity_id)
      )
    WHERE EXISTS (
      SELECT 1 FROM visitor_profiles vp WHERE vp.likely_entity_id = ke.entity_id
    )
  `;
  console.log("  [OK] Aggregate stats refreshed");

  // Final verification
  console.log("\n--- FINAL STATE ---");
  const final = await sql`
    SELECT
      (SELECT COUNT(*) FROM known_entities) as entities,
      (SELECT COUNT(*) FROM visitor_profiles WHERE likely_entity_id IS NOT NULL) as linked_profiles,
      (SELECT COUNT(*) FROM identity_clusters) as clusters,
      (SELECT COUNT(*) FROM identity_signals) as signals
  `;
  const f = final[0];
  console.log(`  known_entities:                    ${f.entities}`);
  console.log(`  visitor_profiles with entity link:  ${f.linked_profiles}`);
  console.log(`  identity_clusters:                  ${f.clusters}`);
  console.log(`  identity_signals:                   ${f.signals}`);
  console.log("\nMigration 004 complete.");
}

run().catch((e) => console.error("FATAL:", e.message));
