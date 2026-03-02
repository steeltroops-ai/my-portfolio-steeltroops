import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Expected columns for visitor_profiles table
const EXPECTED_COLUMNS = [
    'id',
    'visitor_id',
    'ip_address',
    'browser',
    'os',
    'device_type',
    'screen_size',
    'country',
    'city',
    'region',
    'isp',
    'org',
    'latitude',
    'longitude',
    'first_seen',
    'last_seen',
    'visit_count',
    'is_owner',
    'is_bot',
    'fingerprint',
    'gpu_vendor',
    'gpu_renderer',
    'cpu_cores',
    'memory_estimate',
    'max_touch_points',
    'timezone_offset',
    'device_model',
    'timezone_name',
    'languages',
    'platform',
    'network_downlink',
    'hardware_hash',
    'likely_entity_id'
];

async function verifySchema() {
    console.log('='.repeat(80));
    console.log('VISITOR_PROFILES SCHEMA VERIFICATION');
    console.log('='.repeat(80));
    console.log();

    try {
        // Get all columns with detailed information
        const columns = await sql`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length,
        numeric_precision
      FROM information_schema.columns
      WHERE table_name = 'visitor_profiles'
      ORDER BY ordinal_position
    `;

        console.log(`✓ Found ${columns.length} columns in visitor_profiles table`);
        console.log();

        // Check if we have the expected number of columns
        if (columns.length === EXPECTED_COLUMNS.length) {
            console.log(`✓ Column count matches expected: ${EXPECTED_COLUMNS.length}`);
        } else {
            console.log(`✗ Column count mismatch! Expected: ${EXPECTED_COLUMNS.length}, Found: ${columns.length}`);
        }
        console.log();

        // Display all columns with details
        console.log('COLUMN DETAILS:');
        console.log('-'.repeat(80));
        columns.forEach((col, idx) => {
            const typeInfo = col.character_maximum_length
                ? `${col.data_type}(${col.character_maximum_length})`
                : col.data_type;

            console.log(`${idx + 1}. ${col.column_name}`);
            console.log(`   Type: ${typeInfo}`);
            console.log(`   Nullable: ${col.is_nullable}`);
            if (col.column_default) {
                console.log(`   Default: ${col.column_default}`);
            }
            console.log();
        });

        // Check for missing columns
        const actualColumnNames = columns.map(c => c.column_name);
        const missingColumns = EXPECTED_COLUMNS.filter(
            expected => !actualColumnNames.includes(expected)
        );

        if (missingColumns.length > 0) {
            console.log('✗ MISSING COLUMNS:');
            missingColumns.forEach(col => console.log(`  - ${col}`));
            console.log();
        } else {
            console.log('✓ All expected columns are present');
            console.log();
        }

        // Check for extra columns
        const extraColumns = actualColumnNames.filter(
            actual => !EXPECTED_COLUMNS.includes(actual)
        );

        if (extraColumns.length > 0) {
            console.log('⚠ EXTRA COLUMNS (not in requirements):');
            extraColumns.forEach(col => console.log(`  - ${col}`));
            console.log();
        }

        // Check constraints
        console.log('CONSTRAINTS:');
        console.log('-'.repeat(80));

        const constraints = await sql`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'visitor_profiles'
      ORDER BY tc.constraint_type, tc.constraint_name
    `;

        constraints.forEach(constraint => {
            console.log(`${constraint.constraint_type}: ${constraint.constraint_name}`);
            console.log(`  Column: ${constraint.column_name}`);
            if (constraint.foreign_table_name) {
                console.log(`  References: ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
            }
            console.log();
        });

        // Check indexes
        console.log('INDEXES:');
        console.log('-'.repeat(80));

        const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'visitor_profiles'
      ORDER BY indexname
    `;

        indexes.forEach(idx => {
            console.log(`${idx.indexname}`);
            console.log(`  ${idx.indexdef}`);
            console.log();
        });

        // Summary
        console.log('='.repeat(80));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Columns: ${columns.length}/${EXPECTED_COLUMNS.length}`);
        console.log(`Missing Columns: ${missingColumns.length}`);
        console.log(`Extra Columns: ${extraColumns.length}`);
        console.log(`Constraints: ${constraints.length}`);
        console.log(`Indexes: ${indexes.length}`);
        console.log();

        if (missingColumns.length === 0 && columns.length === EXPECTED_COLUMNS.length) {
            console.log('✓ SCHEMA VERIFICATION PASSED');
        } else {
            console.log('✗ SCHEMA VERIFICATION FAILED');
        }
        console.log('='.repeat(80));

    } catch (error) {
        console.error('ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verifySchema();
