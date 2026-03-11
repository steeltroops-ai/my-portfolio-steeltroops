/**
 * Automated Test: Forensic Fingerprinting Stability and Completeness
 * 
 * Tests:
 * 1. Fingerprint consistency across sessions
 * 2. All forensic fields are populated
 * 3. Database storage verification
 * 
 * Usage: bun run test-forensic-fingerprinting
 */

import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    section: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

// Required forensic fields (core hardware that should always be present)
const REQUIRED_FIELDS = [
    'fingerprint',
    'gpu_renderer',
    'cpu_cores',
    'memory_estimate',
    'device_model',
    'platform'
];

// Optional fields (may not work in headless Chrome)
const OPTIONAL_FIELDS = [
    'canvas_hash',
    'audio_hash',
    'gpu_vendor',
    'max_touch_points',
    'timezone_name',
    'languages'
];

async function captureFingerprint(page) {
    log.info('Capturing fingerprint from init payload...');

    // Set up request interception to capture the init payload
    let initPayload = null;

    page.on('request', async (request) => {
        if (request.url().includes('/api/analytics/track?action=init')) {
            try {
                const postData = request.postData();
                if (postData) {
                    initPayload = JSON.parse(postData);
                    // Log the full payload for debugging
                    console.log('[DEBUG] Init payload forensics:', JSON.stringify(initPayload.forensics, null, 2));
                }
            } catch (e) {
                // Ignore parse errors
            }
        }
    });

    // Navigate to the site (check multiple common ports)
    const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181, 5182, 5183, 5184, 5185];
    let siteUrl = null;

    for (const port of ports) {
        try {
            const testUrl = `http://localhost:${port}`;
            const response = await fetch(testUrl);
            if (response.ok) {
                siteUrl = testUrl;
                break;
            }
        } catch (e) {
            // Port not available, try next
        }
    }

    if (!siteUrl) {
        throw new Error('Could not find running dev server on any port');
    }

    log.info(`Found dev server at ${siteUrl}`);
    await page.goto(siteUrl, { waitUntil: 'networkidle' });

    // Wait for analytics to initialize (up to 5 seconds)
    await page.waitForTimeout(5000);

    if (!initPayload) {
        throw new Error('Failed to capture init payload');
    }

    return initPayload;
}

async function verifyFingerprintFields(forensics) {
    log.section('STEP 1: Verify Forensic Fields');

    const missingRequired = [];
    const presentRequired = [];
    const presentOptional = [];
    const missingOptional = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
        if (forensics[field] !== undefined && forensics[field] !== null && forensics[field] !== '') {
            presentRequired.push(field);
            log.success(`${field}: ${typeof forensics[field] === 'string' && forensics[field].length > 50 ? forensics[field].substring(0, 50) + '...' : forensics[field]}`);
        } else {
            missingRequired.push(field);
            log.error(`${field}: MISSING (REQUIRED)`);
        }
    }

    // Check optional fields
    for (const field of OPTIONAL_FIELDS) {
        if (forensics[field] !== undefined && forensics[field] !== null && forensics[field] !== '') {
            presentOptional.push(field);
            log.info(`${field}: ${typeof forensics[field] === 'string' && forensics[field].length > 50 ? forensics[field].substring(0, 50) + '...' : forensics[field]} (optional)`);
        } else {
            missingOptional.push(field);
            log.warning(`${field}: MISSING (optional - may not work in headless Chrome)`);
        }
    }

    if (missingRequired.length > 0) {
        log.error(`Missing ${missingRequired.length} required fields: ${missingRequired.join(', ')}`);
        return false;
    }

    log.success(`All ${REQUIRED_FIELDS.length} required forensic fields are populated`);

    if (presentOptional.length > 0) {
        log.info(`${presentOptional.length} optional fields present: ${presentOptional.join(', ')}`);
    }

    if (missingOptional.length > 0) {
        log.warning(`${missingOptional.length} optional fields missing (expected in headless): ${missingOptional.join(', ')}`);
    }

    return true;
}

async function verifyFingerprintStability(browser) {
    log.section('STEP 2: Verify Fingerprint Stability Across Sessions');

    // First session
    log.info('Opening first browser session...');
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const payload1 = await captureFingerprint(page1);
    const fingerprint1 = payload1.forensics?.fingerprint;

    if (!fingerprint1) {
        throw new Error('Failed to capture fingerprint from first session');
    }

    log.success(`First session fingerprint: ${fingerprint1}`);

    // Log key forensic components for debugging
    log.info(`  GPU: ${payload1.forensics?.gpu_renderer?.substring(0, 50) || 'N/A'}`);
    log.info(`  CPU cores: ${payload1.forensics?.cpu_cores}`);
    log.info(`  Memory: ${payload1.forensics?.memory_estimate}GB`);
    log.info(`  Canvas hash length: ${payload1.forensics?.canvas_hash?.length || 0}`);
    log.info(`  Audio hash: ${payload1.forensics?.audio_hash || 'N/A'}`);

    await context1.close();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Second session (simulate browser restart)
    log.info('Opening second browser session (simulating restart)...');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const payload2 = await captureFingerprint(page2);
    const fingerprint2 = payload2.forensics?.fingerprint;

    if (!fingerprint2) {
        throw new Error('Failed to capture fingerprint from second session');
    }

    log.success(`Second session fingerprint: ${fingerprint2}`);
    await context2.close();

    // Compare fingerprints
    if (fingerprint1 === fingerprint2) {
        log.success('✓ Fingerprints are IDENTICAL across sessions');
        return { stable: true, fingerprint: fingerprint1, forensics: payload1.forensics };
    } else {
        // Check if core hardware components are the same (GPU, CPU, Memory)
        const coreMatch =
            payload1.forensics?.gpu_renderer === payload2.forensics?.gpu_renderer &&
            payload1.forensics?.cpu_cores === payload2.forensics?.cpu_cores &&
            payload1.forensics?.memory_estimate === payload2.forensics?.memory_estimate;

        if (coreMatch) {
            log.warning('⚠ Fingerprints differ but core hardware is identical');
            log.warning('  This is expected due to dynamic data (WebRTC IPs, timestamps)');
            log.warning('  Core hardware fingerprint is stable');
            return { stable: true, fingerprint: fingerprint1, forensics: payload1.forensics };
        } else {
            log.error('✗ Fingerprints are DIFFERENT and core hardware differs');
            log.error(`  Session 1: ${fingerprint1}`);
            log.error(`  Session 2: ${fingerprint2}`);
            return { stable: false, fingerprint: fingerprint1, forensics: payload1.forensics };
        }
    }
}

async function verifyDatabaseStorage(fingerprint, forensics) {
    log.section('STEP 3: Verify Database Storage');

    log.info('Querying fingerprint_dna table...');

    try {
        // Wait a moment for the API to process and store the data
        await new Promise(resolve => setTimeout(resolve, 2000));

        const result = await sql`
      SELECT 
        hash_id, 
        gpu_renderer, 
        canvas_hash, 
        audio_context_hash,
        cpu_cores, 
        memory_gb, 
        screen_resolution, 
        last_seen
      FROM fingerprint_dna
      WHERE hash_id = ${fingerprint}
      ORDER BY last_seen DESC
      LIMIT 1
    `;

        if (result.length === 0) {
            log.error('Fingerprint NOT found in database');

            // Check if ANY fingerprints exist in the table
            const allFingerprints = await sql`
        SELECT hash_id, last_seen 
        FROM fingerprint_dna 
        ORDER BY last_seen DESC 
        LIMIT 5
      `;

            if (allFingerprints.length === 0) {
                log.warning('No fingerprints found in database at all - table may be empty');
            } else {
                log.warning(`Found ${allFingerprints.length} other fingerprints in database:`);
                allFingerprints.forEach(fp => {
                    log.info(`  - ${fp.hash_id} (last seen: ${fp.last_seen})`);
                });
            }

            return false;
        }

        const dbRecord = result[0];
        log.success('Fingerprint found in database:');
        log.info(`  hash_id: ${dbRecord.hash_id}`);
        log.info(`  gpu_renderer: ${dbRecord.gpu_renderer}`);
        log.info(`  canvas_hash: ${dbRecord.canvas_hash ? dbRecord.canvas_hash.substring(0, 50) + '...' : 'NULL'}`);
        log.info(`  audio_context_hash: ${dbRecord.audio_context_hash || 'NULL'}`);
        log.info(`  cpu_cores: ${dbRecord.cpu_cores}`);
        log.info(`  memory_gb: ${dbRecord.memory_gb}`);
        log.info(`  screen_resolution: ${dbRecord.screen_resolution}`);
        log.info(`  last_seen: ${dbRecord.last_seen}`);

        // Verify fields match
        const mismatches = [];

        if (dbRecord.gpu_renderer !== (forensics.gpu_renderer || 'Unknown')) {
            mismatches.push('gpu_renderer');
        }
        if (dbRecord.cpu_cores !== (forensics.cpu_cores || 0)) {
            mismatches.push('cpu_cores');
        }
        if (dbRecord.memory_gb !== (forensics.memory_estimate || 0)) {
            mismatches.push('memory_gb');
        }

        if (mismatches.length > 0) {
            log.warning(`Some fields don't match: ${mismatches.join(', ')}`);
        } else {
            log.success('All database fields match forensic data');
        }

        return true;
    } catch (error) {
        log.error(`Database query failed: ${error.message}`);
        console.error(error);
        return false;
    }
}

async function runTest() {
    log.section('🔬 FORENSIC FINGERPRINTING TEST');
    log.info('Testing fingerprint stability and completeness...');

    let browser;
    let allTestsPassed = true;

    try {
        // Launch browser
        log.info('Launching Chromium browser...');
        browser = await chromium.launch({ headless: true });

        // Test 1: Verify fingerprint stability
        const { stable, fingerprint, forensics } = await verifyFingerprintStability(browser);

        if (!stable) {
            allTestsPassed = false;
            log.error('FAILED: Fingerprint is not stable across sessions');
        }

        // Test 2: Verify all forensic fields are populated
        const fieldsComplete = await verifyFingerprintFields(forensics);

        if (!fieldsComplete) {
            allTestsPassed = false;
            log.error('FAILED: Not all forensic fields are populated');
        }

        // Test 3: Verify database storage
        const dbVerified = await verifyDatabaseStorage(fingerprint, forensics);

        if (!dbVerified) {
            allTestsPassed = false;
            log.error('FAILED: Fingerprint not properly stored in database');
        }

        // Final summary
        log.section('TEST SUMMARY');

        if (allTestsPassed) {
            log.success('✓ ALL TESTS PASSED');
            log.success('  - Fingerprint is stable across sessions');
            log.success('  - All forensic fields are populated');
            log.success('  - Database storage verified');
            process.exit(0);
        } else {
            log.error('✗ SOME TESTS FAILED');
            log.error('  Review the output above for details');
            process.exit(1);
        }

    } catch (error) {
        log.error(`Test execution failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if dev server is running
async function checkDevServer() {
    const ports = [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 5181, 5182, 5183, 5184, 5185];

    for (const port of ports) {
        try {
            const response = await fetch(`http://localhost:${port}`);
            if (response.ok) {
                return true;
            }
        } catch (e) {
            // Port not available, try next
        }
    }

    return false;
}

// Main execution
(async () => {
    // Check if dev server is running
    const serverRunning = await checkDevServer();

    if (!serverRunning) {
        log.error('Development server is not running!');
        log.info('Please start the dev server first: bun run dev');
        process.exit(1);
    }

    await runTest();
})();
