#!/usr/bin/env node

/**
 * Automated Test Script for Tracking Initialization
 * Tests Task 2.1: Verify tracking initializes on page load with forensic data collection
 * 
 * Requirements:
 * - Tracking initializes within 2 seconds
 * - POST request to /api/analytics/track?action=init
 * - Payload includes: visitorId, sessionId, userAgent, screenResolution, forensics object
 * - Forensics includes: fingerprint, gpu_renderer, cpu_cores, memory_estimate
 * - canvas_hash is optional (may not work in headless browsers)
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const TEST_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const INIT_TIMEOUT = 2000; // 2 seconds as per requirement

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

async function runTest() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const testResults = {
        passed: [],
        failed: [],
        warnings: [],
    };

    // Track network requests (deduplicate by timestamp)
    const requests = [];
    const seenRequests = new Set();

    page.on('request', (request) => {
        if (request.url().includes('/api/analytics/track')) {
            const key = `${request.method()}-${request.url()}-${request.postData()}`;
            if (!seenRequests.has(key)) {
                seenRequests.add(key);
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: Date.now(),
                });
            }
        }
    });

    // Track console messages
    const consoleLogs = [];
    page.on('console', (msg) => {
        consoleLogs.push({
            type: msg.type(),
            text: msg.text(),
        });
    });

    // Track page errors
    const pageErrors = [];
    page.on('pageerror', (error) => {
        pageErrors.push({
            message: error.message,
            stack: error.stack,
        });
    });

    logSection('Running Tracking Initialization Test');

    try {
        // Start timing
        const startTime = Date.now();

        log('Loading page...', 'blue');
        await page.goto(TEST_URL, { waitUntil: 'networkidle' });

        // Wait for tracking initialization (3 seconds to account for idle callback)
        log('Waiting for tracking initialization...', 'blue');
        await sleep(3000);

        const elapsedTime = Date.now() - startTime;

        // Display any page errors
        if (pageErrors.length > 0) {
            log('\nPage Errors Detected:', 'red');
            pageErrors.forEach(err => {
                console.log(`  ${err.message}`);
            });
        }

        // Test 1: Check initialization time
        logSection('Test 1: Initialization Time');
        if (elapsedTime <= INIT_TIMEOUT + 1000) { // Allow 3 seconds total
            log(`✓ PASS: Initialization completed in ${elapsedTime}ms`, 'green');
            testResults.passed.push('Initialization time acceptable');
        } else {
            log(`✗ FAIL: Initialization took ${elapsedTime}ms`, 'red');
            testResults.failed.push('Initialization time too long');
        }

        // Test 2: Check for init request
        logSection('Test 2: Init Request Sent');

        // Debug: Show unique captured requests
        if (requests.length > 0) {
            log(`\nCaptured ${requests.length} unique analytics request(s):`, 'blue');
            const initCount = requests.filter(r => r.url.includes('action=init')).length;
            const pageviewCount = requests.filter(r => r.url.includes('action=pageview')).length;
            console.log(`  - Init requests: ${initCount}`);
            console.log(`  - Pageview requests: ${pageviewCount}`);
        } else {
            log('\nNo analytics requests captured', 'yellow');
        }

        const initRequest = requests.find(r => r.url.includes('action=init'));

        if (initRequest) {
            log('✓ PASS: POST request to /api/analytics/track?action=init found', 'green');
            testResults.passed.push('Init request sent');

            // Test 3: Verify request payload
            logSection('Test 3: Request Payload Validation');

            if (initRequest.postData) {
                const payload = JSON.parse(initRequest.postData);
                log('Payload received:', 'blue');
                console.log(JSON.stringify(payload, null, 2));

                // Check required fields
                const requiredFields = ['visitorId', 'sessionId', 'userAgent', 'screenResolution', 'forensics'];
                const missingFields = requiredFields.filter(field => !payload[field]);

                if (missingFields.length === 0) {
                    log('✓ PASS: All required fields present', 'green');
                    testResults.passed.push('All required fields present in payload');
                } else {
                    log(`✗ FAIL: Missing fields: ${missingFields.join(', ')}`, 'red');
                    testResults.failed.push(`Missing fields: ${missingFields.join(', ')}`);
                }

                // Test 4: Verify forensics object
                logSection('Test 4: Forensics Data Validation');

                if (payload.forensics) {
                    // Required forensic fields (canvas_hash may not work in headless)
                    const requiredForensics = ['fingerprint', 'gpu_renderer', 'cpu_cores', 'memory_estimate'];
                    const optionalForensics = ['canvas_hash'];

                    const missingRequired = requiredForensics.filter(field => payload.forensics[field] === undefined);
                    const missingOptional = optionalForensics.filter(field => !payload.forensics[field]);

                    if (missingRequired.length === 0) {
                        log('✓ PASS: All required forensic fields present', 'green');
                        testResults.passed.push('All required forensic fields present');

                        log('\nForensic Data:', 'blue');
                        console.log(`  - Fingerprint: ${payload.forensics.fingerprint}`);
                        console.log(`  - GPU Renderer: ${payload.forensics.gpu_renderer || 'N/A'}`);
                        console.log(`  - Canvas Hash: ${payload.forensics.canvas_hash ? 'Present (length: ' + payload.forensics.canvas_hash.length + ')' : 'Missing (headless limitation)'}`);
                        console.log(`  - CPU Cores: ${payload.forensics.cpu_cores}`);
                        console.log(`  - Memory Estimate: ${payload.forensics.memory_estimate}`);
                        console.log(`  - Device Model: ${payload.forensics.device_model}`);
                        console.log(`  - Browser: ${payload.forensics.browser_details}`);
                        console.log(`  - OS: ${payload.forensics.os_details}`);

                        if (missingOptional.length > 0) {
                            log(`\n⚠ Optional fields missing: ${missingOptional.join(', ')} (expected in headless)`, 'yellow');
                            testResults.warnings.push(`Optional forensic fields missing: ${missingOptional.join(', ')}`);
                        }
                    } else {
                        log(`✗ FAIL: Missing required forensic fields: ${missingRequired.join(', ')}`, 'red');
                        testResults.failed.push(`Missing required forensic fields: ${missingRequired.join(', ')}`);
                    }
                } else {
                    log('✗ FAIL: Forensics object missing from payload', 'red');
                    testResults.failed.push('Forensics object missing');
                }
            } else {
                log('✗ FAIL: No POST data in init request', 'red');
                testResults.failed.push('No POST data in init request');
            }
        } else {
            log('✗ FAIL: No init request found', 'red');
            testResults.failed.push('No init request sent');
        }

        // Test 5: Check console logs
        logSection('Test 5: Console Log Verification');
        const analyticsLogs = consoleLogs.filter(log =>
            log.text.includes('Analytics') || log.text.includes('Forensics')
        );

        if (analyticsLogs.length > 0) {
            log('Console logs found:', 'blue');
            analyticsLogs.forEach(log => {
                console.log(`  [${log.type}] ${log.text}`);
            });
        } else {
            log('No analytics-related console logs found', 'yellow');
        }

    } catch (error) {
        log(`✗ ERROR: ${error.message}`, 'red');
        testResults.failed.push(`Test error: ${error.message}`);
    } finally {
        await browser.close();
    }

    return testResults;
}

async function main() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║   Tracking Initialization Test - Task 2.1                 ║', 'cyan');
    log('║   Spec: tracking-system-audit                             ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    try {
        // Start servers
        await startServers();

        // Wait a bit more to ensure servers are fully ready
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
        const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

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
