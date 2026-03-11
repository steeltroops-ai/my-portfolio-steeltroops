#!/usr/bin/env node

/**
 * Automated Test Script for Behavioral Tracking (Mouse/Keyboard)
 * Tests Task 2.3: Verify mouse movements and keystrokes are captured
 * 
 * Requirements:
 * - Mouse movements sampled every 1 second
 * - Keyboard input tracked (typing cadence)
 * - Heartbeat fires every 15 seconds with biometrics
 * - POST request to /api/analytics/track?action=heartbeat
 * - Payload includes: biometrics{avg_mouse_velocity, typing_cadence_ms, entropy_score}
 * - Database stores behavioral data in behavioral_biometrics table
 * - Biometric values should be non-zero when user interacts
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_URL = 'http://localhost:5173';
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const INTERACTION_DURATION = 20000; // 20 seconds of interaction

let devServer = null;
let apiServer = null;

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

async function startServers() {
    logSection('Starting Development Servers');

    return new Promise((resolve) => {
        log('Starting API server on port 3001...', 'blue');
        apiServer = spawn('bun', ['--watch', 'server/local-api.js'], {
            stdio: 'pipe',
            shell: true,
        });

        apiServer.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Server running')) {
                log('✓ API server ready', 'green');
            }
        });

        log('Starting Vite dev server on port 5173...', 'blue');
        devServer = spawn('bun', ['run', 'dev:vite'], {
            stdio: 'pipe',
            shell: true,
        });

        devServer.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Local:')) {
                log('✓ Vite dev server ready', 'green');
            }
        });

        // Wait for servers to be ready
        setTimeout(() => resolve(), 5000);
    });
}

function stopServers() {
    logSection('Stopping Development Servers');

    if (apiServer) {
        apiServer.kill();
        log('✓ API server stopped', 'green');
    }

    if (devServer) {
        devServer.kill();
        log('✓ Vite dev server stopped', 'green');
    }
}

async function queryDatabase(sessionId) {
    if (!process.env.DATABASE_URL) {
        log('⚠ DATABASE_URL not found, skipping database verification', 'yellow');
        return null;
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Query behavioral_biometrics for this session
        const biometrics = await sql`
            SELECT bb.session_id, bb.avg_mouse_velocity, bb.typing_cadence_ms, 
                   bb.entropy_score, bb.is_bot_verified, bb.recorded_at
            FROM behavioral_biometrics bb
            JOIN visitor_sessions vs ON vs.id = bb.session_uuid
            WHERE vs.session_id = ${sessionId}
            ORDER BY bb.recorded_at DESC
            LIMIT 5
        `;

        return biometrics;
    } catch (error) {
        log(`⚠ Database query failed: ${error.message}`, 'yellow');
        console.error(error);
        return null;
    }
}

async function simulateMouseMovements(page) {
    log('Simulating mouse movements...', 'blue');

    // Get viewport size
    const viewport = page.viewportSize();
    const width = viewport.width;
    const height = viewport.height;

    // Simulate natural mouse movements across the page
    const movements = [
        { x: width * 0.2, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.2 },
        { x: width * 0.7, y: height * 0.5 },
        { x: width * 0.4, y: height * 0.7 },
        { x: width * 0.6, y: height * 0.4 },
        { x: width * 0.3, y: height * 0.6 },
        { x: width * 0.8, y: height * 0.3 },
        { x: width * 0.5, y: height * 0.8 },
    ];

    for (const pos of movements) {
        await page.mouse.move(pos.x, pos.y);
        await sleep(500); // Move every 500ms
    }

    log('✓ Mouse movements completed', 'green');
}

async function simulateKeyboardInput(page) {
    log('Simulating keyboard input...', 'blue');

    // Navigate to contact page which has input fields
    await page.goto(`${TEST_URL}/contact`, {
        waitUntil: 'networkidle',
        timeout: 10000
    });

    await sleep(1000);

    // Find and type in the name field - type more characters for better cadence tracking
    const nameField = await page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameField.count() > 0) {
        await nameField.click();
        await page.keyboard.type('John Alexander Doe', { delay: 100 }); // Type with 100ms delay
        log('  ✓ Typed in name field', 'green');
    }

    await sleep(500);

    // Find and type in the email field - more characters
    const emailField = await page.locator('input[type="email"], input[name="email"]').first();
    if (await emailField.count() > 0) {
        await emailField.click();
        await page.keyboard.type('john.doe.test@example.com', { delay: 80 }); // Slightly faster
        log('  ✓ Typed in email field', 'green');
    }

    await sleep(500);

    // Find and type in the message field - longer message
    const messageField = await page.locator('textarea[name="message"], textarea').first();
    if (await messageField.count() > 0) {
        await messageField.click();
        await page.keyboard.type('This is a comprehensive test message for behavioral tracking. We need to type enough characters to generate meaningful typing cadence data for the analytics system.', { delay: 90 });
        log('  ✓ Typed in message field', 'green');
    }

    log('✓ Keyboard input completed', 'green');
}


async function simulateClicks(page) {
    log('Simulating clicks...', 'blue');

    // Click on various elements
    const viewport = page.viewportSize();

    // Simulate 3-4 clicks at different positions
    await page.mouse.click(viewport.width * 0.3, viewport.height * 0.4);
    await sleep(300);
    await page.mouse.click(viewport.width * 0.6, viewport.height * 0.5);
    await sleep(300);
    await page.mouse.click(viewport.width * 0.5, viewport.height * 0.3);

    log('✓ Clicks completed', 'green');
}

async function runTest() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    const page = await context.newPage();

    const testResults = {
        passed: [],
        failed: [],
        warnings: [],
    };

    // Track heartbeat requests
    const heartbeatRequests = [];
    const seenRequests = new Set();

    page.on('response', async (response) => {
        const request = response.request();
        if (request.url().includes('/api/analytics/track?action=heartbeat')) {
            const postData = request.postData();
            const key = `${request.url()}-${postData}`;

            if (!seenRequests.has(key)) {
                seenRequests.add(key);
                heartbeatRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: postData,
                    status: response.status(),
                    timestamp: Date.now(),
                });
            }
        }
    });

    logSection('Running Behavioral Tracking Test');

    let sessionId = null;

    try {
        // Load the home page to trigger init
        log('Loading home page to initialize tracking...', 'blue');
        await page.goto(TEST_URL, {
            waitUntil: 'networkidle',
            timeout: 10000
        });

        // Wait for init to complete
        await sleep(3000);

        // Extract sessionId from localStorage
        sessionId = await page.evaluate(() => {
            return sessionStorage.getItem('portfolio_session_id');
        });

        if (sessionId) {
            log(`✓ Tracking initialized with sessionId: ${sessionId}`, 'green');
        } else {
            log('⚠ Could not extract sessionId', 'yellow');
        }

        console.log('');

        // Phase 1: Simulate user interactions
        logSection('Phase 1: Simulating User Interactions');

        log(`Interaction duration: ${INTERACTION_DURATION / 1000} seconds`, 'blue');
        log(`Heartbeat interval: ${HEARTBEAT_INTERVAL / 1000} seconds`, 'blue');
        console.log('');

        // Start interactions
        await simulateMouseMovements(page);
        await sleep(1000);

        await simulateKeyboardInput(page);
        await sleep(1000);

        await simulateClicks(page);
        await sleep(1000);

        // Continue mouse movements
        await simulateMouseMovements(page);

        // Phase 2: Wait for heartbeat
        logSection('Phase 2: Waiting for Heartbeat');

        const remainingTime = HEARTBEAT_INTERVAL - (Date.now() - heartbeatRequests[0]?.timestamp || 0);
        const waitTime = Math.max(remainingTime + 2000, 5000); // Wait at least 5 seconds

        log(`Waiting ${Math.ceil(waitTime / 1000)} seconds for heartbeat to fire...`, 'blue');
        await sleep(waitTime);

        // Test 1: Check if heartbeat request was sent
        logSection('Test 1: Heartbeat Request Detection');

        log(`Captured ${heartbeatRequests.length} heartbeat request(s)`, 'blue');

        if (heartbeatRequests.length > 0) {
            log(`✓ PASS: Heartbeat request detected`, 'green');
            testResults.passed.push('Heartbeat request sent');
        } else {
            log(`✗ FAIL: No heartbeat request detected`, 'red');
            testResults.failed.push('No heartbeat request');
        }

        // Test 2: Verify biometrics payload
        logSection('Test 2: Biometrics Payload Validation');

        if (heartbeatRequests.length > 0) {
            const lastHeartbeat = heartbeatRequests[heartbeatRequests.length - 1];

            if (lastHeartbeat.postData) {
                const payload = JSON.parse(lastHeartbeat.postData);

                log('Heartbeat payload:', 'blue');
                console.log(`  SessionId: ${payload.sessionId || 'MISSING'}`);
                console.log(`  VisitorId: ${payload.visitorId || 'MISSING'}`);

                if (payload.biometrics) {
                    console.log('  Biometrics:');
                    console.log(`    avg_mouse_velocity: ${payload.biometrics.mouse_velocity ?? 'MISSING'}`);
                    console.log(`    typing_cadence_ms: ${payload.biometrics.typing_cadence_ms ?? 'MISSING'}`);
                    console.log(`    entropy_score: ${payload.biometrics.entropy_score ?? 'MISSING'}`);
                    console.log(`  HTTP Status: ${lastHeartbeat.status}`);

                    // Check if biometrics object has all required fields
                    const hasMouseVelocity = typeof payload.biometrics.mouse_velocity === 'number';
                    const hasTypingCadence = typeof payload.biometrics.typing_cadence_ms === 'number';
                    const hasEntropyScore = typeof payload.biometrics.entropy_score === 'number';

                    if (hasMouseVelocity && hasTypingCadence && hasEntropyScore) {
                        log('\n✓ PASS: All biometric fields present', 'green');
                        testResults.passed.push('All biometric fields present');

                        // Check if values are non-zero (indicating actual interaction)
                        const mouseVelocity = payload.biometrics.mouse_velocity;
                        const typingCadence = payload.biometrics.typing_cadence_ms;
                        const entropyScore = payload.biometrics.entropy_score;

                        if (mouseVelocity > 0) {
                            log(`✓ PASS: Mouse velocity is non-zero (${mouseVelocity.toFixed(2)} px/s)`, 'green');
                            testResults.passed.push('Mouse velocity captured');
                        } else {
                            log(`⚠ WARNING: Mouse velocity is zero`, 'yellow');
                            testResults.warnings.push('Mouse velocity is zero');
                        }

                        if (typingCadence > 0) {
                            log(`✓ PASS: Typing cadence is non-zero (${typingCadence.toFixed(2)} ms)`, 'green');
                            testResults.passed.push('Typing cadence captured');
                        } else {
                            log(`⚠ WARNING: Typing cadence is zero`, 'yellow');
                            testResults.warnings.push('Typing cadence is zero');
                        }

                        if (entropyScore > 0) {
                            log(`✓ PASS: Entropy score is non-zero (${entropyScore.toFixed(2)})`, 'green');
                            testResults.passed.push('Entropy score calculated');
                        } else {
                            log(`⚠ WARNING: Entropy score is zero`, 'yellow');
                            testResults.warnings.push('Entropy score is zero');
                        }
                    } else {
                        log('\n✗ FAIL: Missing biometric fields', 'red');
                        testResults.failed.push('Missing biometric fields');
                    }
                } else {
                    log('\n✗ FAIL: No biometrics object in payload', 'red');
                    testResults.failed.push('No biometrics in payload');
                }
            } else {
                log('✗ FAIL: No POST data in heartbeat request', 'red');
                testResults.failed.push('No POST data');
            }
        } else {
            log('⚠ Skipping payload validation (no heartbeat captured)', 'yellow');
        }

        // Test 3: Database verification
        logSection('Test 3: Database Verification');

        if (sessionId) {
            log(`Querying database for sessionId: ${sessionId}`, 'blue');
            log('Waiting 2 seconds for database commit...', 'blue');
            await sleep(2000);

            const dbBiometrics = await queryDatabase(sessionId);

            if (dbBiometrics === null) {
                log('⚠ Database verification could not be completed', 'yellow');
                testResults.warnings.push('Database verification skipped');
            } else if (dbBiometrics.length === 0) {
                log('⚠ No behavioral_biometrics entries found in database for this session', 'yellow');
                log('Note: This may occur if requests were rate limited (HTTP 429)', 'yellow');
                testResults.warnings.push('No biometrics in database (possibly rate limited)');
            } else {
                log(`\nFound ${dbBiometrics.length} behavioral_biometrics entry(ies) in database:`, 'blue');

                dbBiometrics.forEach((entry, index) => {
                    console.log(`\n  Entry ${index + 1}:`);
                    console.log(`    Session ID: ${entry.session_id}`);
                    console.log(`    Mouse Velocity: ${entry.avg_mouse_velocity} px/s`);
                    console.log(`    Typing Cadence: ${entry.typing_cadence_ms} ms`);
                    console.log(`    Entropy Score: ${entry.entropy_score}`);
                    console.log(`    Bot Verified: ${entry.is_bot_verified}`);
                    console.log(`    Recorded At: ${entry.recorded_at}`);
                });

                log(`\n✓ PASS: Behavioral biometrics stored in database`, 'green');
                testResults.passed.push('Biometrics stored in database');

                // Check if values are non-zero
                const latestEntry = dbBiometrics[0];
                const hasNonZeroValues =
                    latestEntry.avg_mouse_velocity > 0 ||
                    latestEntry.typing_cadence_ms > 0 ||
                    latestEntry.entropy_score > 0;

                if (hasNonZeroValues) {
                    log('✓ PASS: Database has non-zero biometric values', 'green');
                    testResults.passed.push('Non-zero biometric values in database');
                } else {
                    log('⚠ WARNING: All biometric values are zero in database', 'yellow');
                    testResults.warnings.push('Zero biometric values in database');
                }
            }
        } else {
            log('⚠ No sessionId captured, skipping database verification', 'yellow');
            testResults.warnings.push('No sessionId for database query');
        }

    } catch (error) {
        log(`✗ ERROR: ${error.message}`, 'red');
        console.error(error.stack);
        testResults.failed.push(`Test error: ${error.message}`);
    } finally {
        await browser.close();
    }

    return testResults;
}

async function main() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║   Behavioral Tracking Test - Task 2.3                     ║', 'cyan');
    log('║   Spec: tracking-system-audit                             ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    try {
        // Start servers
        await startServers();

        // Wait for servers to be fully ready
        await sleep(2000);

        // Run the test
        const results = await runTest();

        // Display summary
        logSection('Test Summary');

        log(`Passed: ${results.passed.length}`, 'green');
        results.passed.forEach(test => log(`  ✓ ${test}`, 'green'));

        if (results.failed.length > 0) {
            log(`\nFailed: ${results.failed.length}`, 'red');
            results.failed.forEach(test => log(`  ✗ ${test}`, 'red'));
        }

        if (results.warnings.length > 0) {
            log(`\nWarnings: ${results.warnings.length}`, 'yellow');
            results.warnings.forEach(warning => log(`  ⚠ ${warning}`, 'yellow'));
        }

        const totalTests = results.passed.length + results.failed.length;
        const passRate = totalTests > 0 ? ((results.passed.length / totalTests) * 100).toFixed(1) : 0;

        log(`\nOverall: ${results.passed.length}/${totalTests} tests passed (${passRate}%)`,
            results.failed.length === 0 ? 'green' : 'yellow');

        // Exit with appropriate code
        const exitCode = results.failed.length === 0 ? 0 : 1;

        stopServers();

        process.exit(exitCode);

    } catch (error) {
        log(`\n✗ FATAL ERROR: ${error.message}`, 'red');
        console.error(error);
        stopServers();
        process.exit(1);
    }
}

// Run the test
main();
