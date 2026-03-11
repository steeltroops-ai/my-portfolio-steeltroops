#!/usr/bin/env node

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function checkBiometrics() {
    console.log('Checking behavioral_biometrics table...\n');

    const result = await sql`
        SELECT bb.session_id, bb.avg_mouse_velocity, bb.typing_cadence_ms, 
               bb.entropy_score, bb.is_bot_verified, bb.recorded_at
        FROM behavioral_biometrics bb
        ORDER BY bb.recorded_at DESC
        LIMIT 10
    `;

    if (result.length === 0) {
        console.log('No entries found in behavioral_biometrics table.');
    } else {
        console.log(`Found ${result.length} entries:\n`);
        result.forEach((entry, index) => {
            console.log(`Entry ${index + 1}:`);
            console.log(`  Session ID: ${entry.session_id}`);
            console.log(`  Mouse Velocity: ${entry.avg_mouse_velocity} px/s`);
            console.log(`  Typing Cadence: ${entry.typing_cadence_ms} ms`);
            console.log(`  Entropy Score: ${entry.entropy_score}`);
            console.log(`  Bot Verified: ${entry.is_bot_verified}`);
            console.log(`  Recorded At: ${entry.recorded_at}`);
            console.log('');
        });
    }
}

checkBiometrics().catch(console.error);
