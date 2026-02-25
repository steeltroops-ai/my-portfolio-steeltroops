import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sql = neon(process.env.DATABASE_URL);

// Neon tagged template does not support dynamic table names.
// Use explicit per-table queries instead.
const TABLE_NAMES = [
  "admin_profiles",
  "behavioral_biometrics",
  "blog_categories",
  "blog_post_categories",
  "blog_posts",
  "blog_views",
  "comments",
  "contact_messages",
  "identity_clusters",
  "identity_resolution_map",
  "identity_signals",
  "known_entities",
  "master_identities",
  "sessions",
  "user_profiles",
  "visitor_events",
  "visitor_profiles",
  "visitor_sessions",
];

async function countTable(name) {
  try {
    const r = await sql.query(`SELECT COUNT(*) as c FROM "${name}"`);
    return r[0]?.c ?? r?.rows?.[0]?.c ?? "?";
  } catch (e) {
    return `ERR: ${e.message.slice(0, 40)}`;
  }
}

async function audit() {
  console.log("=== FULL DATABASE SCHEMA AUDIT ===\n");

  // 1. Tables + row counts
  console.log("--- TABLES & ROW COUNTS ---");
  for (const name of TABLE_NAMES) {
    const count = await countTable(name);
    console.log(`  ${name.padEnd(35)} rows: ${String(count).padStart(6)}`);
  }

  // 2. Foreign keys
  console.log("\n--- FOREIGN KEYS ---");
  const fks = await sql`
    SELECT
      tc.table_name as from_table,
      kcu.column_name as from_col,
      ccu.table_name as to_table,
      ccu.column_name as to_col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `;
  if (fks.length === 0) {
    console.log("  [!!] NO FOREIGN KEYS DEFINED IN DATABASE");
  } else {
    for (const fk of fks) {
      console.log(
        `  ${fk.from_table}.${fk.from_col} -> ${fk.to_table}.${fk.to_col}`
      );
    }
  }

  // 3. Indexes
  console.log("\n--- INDEXES ---");
  const idxs = await sql`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `;
  for (const idx of idxs) {
    const tag = idx.indexdef.includes("UNIQUE") ? "[UNIQUE]" : "";
    console.log(
      `  ${idx.tablename.padEnd(30)} ${idx.indexname.padEnd(50)} ${tag}`
    );
  }

  // 4. Data integrity checks
  console.log("\n--- DATA INTEGRITY CHECKS ---");

  const unlinkedHuman = await sql`
    SELECT COUNT(*) as c FROM visitor_profiles
    WHERE likely_entity_id IS NULL AND hardware_hash IS NOT NULL AND is_bot = FALSE
  `;
  console.log(
    `  Humans with hardware_hash but NO entity link:  ${unlinkedHuman[0].c}`
  );

  const orphanSessions = await sql`
    SELECT COUNT(*) as c FROM visitor_sessions s
    WHERE s.visitor_uuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM visitor_profiles p WHERE p.id = s.visitor_uuid)
  `;
  console.log(
    `  visitor_sessions orphaned (no visitor_profile): ${orphanSessions[0].c}`
  );

  const orphanEvents = await sql`
    SELECT COUNT(*) as c FROM visitor_events e
    WHERE NOT EXISTS (SELECT 1 FROM visitor_sessions s WHERE s.id = e.session_uuid)
  `;
  console.log(
    `  visitor_events orphaned (no session):           ${orphanEvents[0].c}`
  );

  const bioOrphans = await sql`
    SELECT COUNT(*) as c FROM behavioral_biometrics b
    WHERE b.session_uuid IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM visitor_sessions s WHERE s.id = b.session_uuid)
  `;
  console.log(
    `  behavioral_biometrics orphaned session_uuid:    ${bioOrphans[0].c}`
  );

  const isolatedEntities = await sql`
    SELECT COUNT(*) as c FROM known_entities k
    WHERE NOT EXISTS (SELECT 1 FROM visitor_profiles p WHERE p.likely_entity_id = k.entity_id)
  `;
  console.log(
    `  known_entities with NO visitor_profile link:    ${isolatedEntities[0].c}`
  );

  const clusterNoEntity = await sql`
    SELECT COUNT(*) as c FROM identity_clusters WHERE primary_entity_id IS NULL
  `;
  console.log(
    `  identity_clusters with no entity (anon):        ${clusterNoEntity[0].c}`
  );

  // 5. Identity chain field coverage
  console.log("\n--- IDENTITY CHAIN FIELD COVERAGE (non-bot profiles) ---");
  const cov = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(ip_address) as has_ip,
      COUNT(fingerprint) as has_fingerprint,
      COUNT(hardware_hash) as has_hardware_hash,
      COUNT(gpu_renderer) as has_gpu,
      COUNT(canvas_hash) as has_canvas,
      COUNT(likely_entity_id) as has_entity,
      COUNT(identity_id) as has_identity_id
    FROM visitor_profiles WHERE is_bot = FALSE OR is_bot IS NULL
  `;
  const c = cov[0];
  const pct = (n) =>
    c.total > 0 ? `${Math.round((n / c.total) * 100)}%` : "0%";
  console.log(`  Total non-bot profiles:  ${c.total}`);
  console.log(
    `  Has IP:                  ${c.has_ip}/${c.total} (${pct(c.has_ip)})`
  );
  console.log(
    `  Has fingerprint:         ${c.has_fingerprint}/${c.total} (${pct(c.has_fingerprint)})`
  );
  console.log(
    `  Has hardware_hash:       ${c.has_hardware_hash}/${c.total} (${pct(c.has_hardware_hash)})`
  );
  console.log(
    `  Has GPU renderer:        ${c.has_gpu}/${c.total} (${pct(c.has_gpu)})`
  );
  console.log(
    `  Has canvas_hash:         ${c.has_canvas}/${c.total} (${pct(c.has_canvas)})`
  );
  console.log(
    `  Has entity link:         ${c.has_entity}/${c.total} (${pct(c.has_entity)})`
  );
  console.log(
    `  Has identity_id:         ${c.has_identity_id}/${c.total} (${pct(c.has_identity_id)})`
  );

  // 6. Session link integrity
  console.log("\n--- SESSION LINK INTEGRITY ---");
  const sessLink =
    await sql`SELECT COUNT(*) as c FROM visitor_sessions WHERE visitor_uuid IS NOT NULL`;
  const sessNoLink =
    await sql`SELECT COUNT(*) as c FROM visitor_sessions WHERE visitor_uuid IS NULL`;
  console.log(`  visitor_sessions WITH visitor_uuid:    ${sessLink[0].c}`);
  console.log(
    `  visitor_sessions WITHOUT visitor_uuid: ${sessNoLink[0].c}  [!!] These cannot be joined to profiles`
  );

  // 7. Event type breakdown
  console.log("\n--- VISITOR EVENT TYPES ---");
  const evTypes = await sql`
    SELECT event_type, COUNT(*) as c FROM visitor_events GROUP BY event_type ORDER BY c DESC
  `;
  if (evTypes.length === 0) {
    console.log("  [!!] NO EVENTS IN visitor_events TABLE YET");
  } else {
    for (const e of evTypes) console.log(`  ${e.event_type.padEnd(45)} ${e.c}`);
  }

  // 8. Multi-device detection (same hardware_hash, multiple visitor_ids)
  console.log("\n--- SAME-DEVICE MULTI-SESSION DETECTION ---");
  const multiVisitor = await sql`
    SELECT hardware_hash, COUNT(DISTINCT visitor_id) as visitor_count,
      COUNT(DISTINCT likely_entity_id) as entity_count
    FROM visitor_profiles WHERE hardware_hash IS NOT NULL
    GROUP BY hardware_hash HAVING COUNT(DISTINCT visitor_id) > 1
    ORDER BY visitor_count DESC LIMIT 10
  `;
  if (multiVisitor.length === 0) {
    console.log("  No multi-visitor devices yet (insufficient data)");
  } else {
    for (const r of multiVisitor) {
      console.log(
        `  hash:${r.hardware_hash?.slice(0, 12)}... visitors:${r.visitor_count} entities:${r.entity_count}`
      );
    }
  }

  // 9. identity_resolution_map contents
  console.log("\n--- identity_resolution_map SAMPLE ---");
  const irm = await sql`SELECT * FROM identity_resolution_map LIMIT 5`;
  if (irm.length === 0) console.log("  Empty");
  else irm.forEach((r) => console.log(`  ${JSON.stringify(r)}`));

  // 10. master_identities contents
  console.log("\n--- master_identities SAMPLE ---");
  const mi =
    await sql`SELECT id, real_name, email, linkedin_url, first_reveal_timestamp FROM master_identities LIMIT 5`;
  if (mi.length === 0) console.log("  Empty");
  else mi.forEach((r) => console.log(`  ${JSON.stringify(r)}`));

  console.log("\n=== AUDIT COMPLETE ===");
}

audit().catch((e) => console.error("FATAL:", e.message, e.stack));
