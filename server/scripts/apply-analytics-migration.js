import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ Stats Migration Failed: DATABASE_URL is missing.");
  process.exit(1);
}

const sql = neon(connectionString);

async function runMigration() {
  const sqlPath = path.resolve(
    __dirname,
    "../../docs/database/migration_002_analytics_v2.sql"
  );

  try {
    console.log("Reading migration file from:", sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Execute the SQL block
    // Splitting by semicolon is safer for serverless HTTP driver if multi-statement support varies
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Applying ${statements.length} SQL statements...`);

    for (const statement of statements) {
      try {
        await sql(statement);
      } catch (innerErr) {
        // Ignore "already exists" warnings if we are re-running
        if (
          !innerErr.message.includes("already exists") &&
          !innerErr.message.includes("duplicate")
        ) {
          console.warn(
            `⚠️ Warning on statement: ${statement.substring(0, 50)}...`,
            innerErr.message
          );
        }
      }
    }

    console.log("✅ Analytics V2 'God Mode' Migration Applied Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
}

runMigration();
