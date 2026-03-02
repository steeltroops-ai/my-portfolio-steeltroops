#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function checkTable() {
    try {
        // Check if table exists
        const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%fingerprint%'
    `;

        console.log('Tables with "fingerprint" in name:', tableCheck);

        // Try to create it manually
        console.log('\nAttempting to create fingerprint_dna table...');
        await sql`
      CREATE TABLE IF NOT EXISTS fingerprint_dna (
        hash_id VARCHAR(255) PRIMARY KEY,
        gpu_vendor VARCHAR(255),
        gpu_renderer VARCHAR(255),
        screen_resolution VARCHAR(50),
        audio_context_hash VARCHAR(255),
        canvas_hash VARCHAR(255),
        cpu_cores INT,
        memory_gb INT,
        is_vpn_suspect BOOLEAN DEFAULT FALSE,
        first_seen TIMESTAMP DEFAULT NOW(),
        last_seen TIMESTAMP DEFAULT NOW()
      )
    `;

        console.log('✅ Table created successfully');

        // Verify
        const verify = await sql`
      SELECT COUNT(*) as count FROM fingerprint_dna
    `;
        console.log('✅ Verified - fingerprint_dna has', verify[0].count, 'rows');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTable();
