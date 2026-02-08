/**
 * Password Hashing Utility
 *
 * Usage: node scripts/hash-password.js <your-password>
 *
 * This generates a hash that you can use to update your admin user in Neon.
 *
 * Example:
 *   node scripts/hash-password.js mySecurePassword123
 *
 * Then run in Neon SQL Editor:
 *   UPDATE admin_profiles SET password_hash = '<generated-hash>' WHERE email = 'your@email.com';
 */

import crypto from "crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const password = process.argv[2];

if (!password) {
  console.log("");
  console.log("  Password Hashing Utility");
  console.log("  ========================");
  console.log("");
  console.log("  Usage: node scripts/hash-password.js <your-password>");
  console.log("");
  console.log("  Example:");
  console.log("    node scripts/hash-password.js mySecurePassword123");
  console.log("");
  console.log("  Then update your admin in Neon:");
  console.log(
    "    UPDATE admin_profiles SET password_hash = '<hash>' WHERE email = 'your@email.com';"
  );
  console.log("");
  process.exit(1);
}

const hash = hashPassword(password);

console.log("");
console.log("  Password Hash Generated");
console.log("  =======================");
console.log("");
console.log("  Password Hash:");
console.log(`  ${hash}`);
console.log("");
console.log("  To update your admin user, run this SQL in Neon Dashboard:");
console.log("");
console.log(
  `  UPDATE admin_profiles SET password_hash = '${hash}' WHERE email = 'your-email@example.com';`
);
console.log("");
