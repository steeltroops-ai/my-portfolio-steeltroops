#!/usr/bin/env node
/**
 * Run All Analytics Migrations
 * 
 * Applies all pending database migrations in order
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = neon(process.env.DATABASE_URL);

const MIGRATIONS = [
    'migration_002_analytics_v2.sql',
    'migration_003_identity_signals.sql'
];

async function runMigration(filename) {
    console.log(`\n📝 Running: ${filename}`);

    try {
        const migrationPath = join(__dirname, '..', 'docs', 'database', filename);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        // Split by semicolons and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                await sql.unsafe(statement);
            }
        }

        console.log(`✅ ${filename} completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ ${filename} failed:`, error.message);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🚀 RUNNING ANALYTICS MIGRATIONS');
    console.log('═══════════════════════════════════════════════════════');

    let successCount = 0;
    let failCount = 0;

    for (const migration of MIGRATIONS) {
        const success = await runMigration(migration);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failCount > 0) {
        console.log('⚠️  Some migrations failed. Check errors above.');
        process.exit(1);
    } else {
        console.log('🎉 All migrations completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Run: bun run verify-tracking');
        console.log('   2. Start dev server: bun run dev');
        console.log('   3. Visit site to generate tracking data\n');
        process.exit(0);
    }
}

main().catch(error => {
    console.error('\n💥 Fatal Error:', error.message);
    process.exit(1);
});
