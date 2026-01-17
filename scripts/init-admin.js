// Script to initialize the first admin user in the Neon database
// Run: node scripts/init-admin.js

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Hash password
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function initializeAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@portfolio.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const displayName = process.env.ADMIN_DISPLAY_NAME || 'Admin';

  console.log('Initializing admin user...');
  console.log(`Email: ${email}`);

  try {
    // Check if admin already exists
    const existing = await sql`
      SELECT * FROM admin_profiles WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log('Admin user already exists. Updating password...');
      
      const passwordHash = hashPassword(password);
      await sql`
        UPDATE admin_profiles
        SET password_hash = ${passwordHash}, role = 'admin', updated_at = NOW()
        WHERE email = ${email}
      `;
      
      console.log('Admin password updated successfully!');
    } else {
      // Create new admin user
      const passwordHash = hashPassword(password);
      
      await sql`
        INSERT INTO admin_profiles (email, password_hash, display_name, role)
        VALUES (${email}, ${passwordHash}, ${displayName}, 'admin')
      `;
      
      console.log('Admin user created successfully!');
    }

    console.log('\nYou can now login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\nIMPORTANT: Change these credentials in production!');
    
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  }
}

initializeAdmin();
