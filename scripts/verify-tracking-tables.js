#!/usr/bin/env bun

/**
 * Verify Tracking System Database Tables
 * Task 1.1: Verify All 8 Tables Exist
 * 
 * Checks that all required tracking tables exist in the Neon database
 */

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const REQUIRED_TABLES = [
    'visitor_profiles',
    'visitor_sessions',
    'visitor_events',
    'fingerprint_dna',
    'known_entities',
    'behavioral_biometrics',
    'identity_clusters',
    'identity_signals'
]

async function verifyTables() {
    console.log('🔍 Verifying tracking system tables...\n')

    try {
        // Query to check for all required tables
        const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'visitor_profiles', 
          'visitor_sessions', 
          'visitor_events', 
          'fingerprint_dna', 
          'known_entities', 
          'behavioral_biometrics', 
          'identity_clusters', 
          'identity_signals'
        ) 
      ORDER BY table_name
    `

        const foundTables = result.map(row => row.table_name)
        const missingTables = REQUIRED_TABLES.filter(table => !foundTables.includes(table))

        console.log('📊 Results:')
        console.log(`   Expected: ${REQUIRED_TABLES.length} tables`)
        console.log(`   Found: ${foundTables.length} tables\n`)

        if (foundTables.length > 0) {
            console.log('✅ Found tables:')
            foundTables.forEach(table => {
                console.log(`   - ${table}`)
            })
            console.log('')
        }

        if (missingTables.length > 0) {
            console.log('❌ Missing tables:')
            missingTables.forEach(table => {
                console.log(`   - ${table}`)
            })
            console.log('')
            console.log('⚠️  VERIFICATION FAILED: Not all required tables exist')
            process.exit(1)
        } else {
            console.log('✅ VERIFICATION PASSED: All 8 required tables exist!')
        }

    } catch (error) {
        console.error('❌ Error verifying tables:', error.message)
        process.exit(1)
    }
}

verifyTables()
