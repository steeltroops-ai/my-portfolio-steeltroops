/**
 * Update Admin Password Script
 *
 * Usage: node scripts/update-admin-password.js <email> <new-password>
 *
 * This script directly updates the admin password in the Neon database.
 * Make sure DATABASE_URL is set in your environment.
 *
 * Example:
 *   node scripts/update-admin-password.js admin@example.com MyNewPassword123
 */

import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("");
  console.error("  ERROR: DATABASE_URL environment variable is not set");
  console.error("");
  console.error(
    "  Make sure you have a .env file with DATABASE_URL or set it:"
  );
  console.error('    $env:DATABASE_URL="postgresql://..."');
  console.error("");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Hash password using the same algorithm as auth.js
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("");
  console.log("  Update Admin Password");
  console.log("  =====================");
  console.log("");
  console.log(
    "  Usage: node scripts/update-admin-password.js <email> <new-password>"
  );
  console.log("");
  console.log("  Example:");
  console.log(
    "    node scripts/update-admin-password.js admin@example.com MySecurePassword123"
  );
  console.log("");
  process.exit(1);
}

async function updatePassword() {
  console.log("");
  console.log("  Updating password...");
  console.log(`  Email: ${email}`);
  console.log("");

  try {
    // Check if user exists
    const users = await sql`
      SELECT id, email, display_name FROM admin_profiles WHERE email = ${email.toLowerCase()}
    `;

    if (users.length === 0) {
      console.error(`  ERROR: No admin user found with email: ${email}`);
      console.log("");
      console.log("  To create a new admin user, run:");
      console.log("    node scripts/init-admin.js");
      console.log("");
      process.exit(1);
    }

    const user = users[0];
    const passwordHash = hashPassword(password);

    // Update password
    await sql`
      UPDATE admin_profiles 
      SET password_hash = ${passwordHash}, updated_at = NOW()
      WHERE email = ${email.toLowerCase()}
    `;

    console.log("  SUCCESS! Password updated.");
    console.log("");
    console.log("  You can now login with:");
    console.log(`    Email: ${user.email}`);
    console.log(`    Password: (the password you just set)`);
    console.log("");
    console.log("  To test locally, run:");
    console.log("    bun run dev");
    console.log("    (This now uses vercel dev which serves the API routes)");
    console.log("");
  } catch (error) {
    console.error("  ERROR:", error.message);
    console.log("");
    process.exit(1);
  }
}

updatePassword();
