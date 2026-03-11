/**
 * Test Admin Bypass Functionality
 * 
 * Verifies that the admin bypass flag prevents tracking requests from firing.
 * This test uses Playwright to automate browser testing.
 * 
 * Task: 2.5 - Test Admin Bypass
 * Spec: tracking-system-audit
 */

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:5173';

async function testAdminBypass() {
    console.log('🧪 Starting Admin Bypass Test\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    let testsPassed = 0;
    let testsFailed = 0;

    try {
        // ========================================
        // TEST 1: Verify tracking works normally
        // ========================================
        console.log('📋 Test 1: Verify tracking works WITHOUT bypass');

        const normalRequests = [];

        // Intercept tracking requests
        await page.route('**/api/analytics/track**', route => {
            const url = route.request().url();
            normalRequests.push(url);
            route.continue();
        });

        await page.goto(TEST_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(4000); // Wait for init tracking and idle callback

        if (normalRequests.length > 0) {
            console.log('✅ PASS: Tracking requests fired normally');
            console.log(`   Found ${normalRequests.length} tracking request(s):`);
            normalRequests.forEach(url => {
                const action = url.match(/action=(\w+)/)?.[1] || 'unknown';
                console.log(`   - ${action}`);
            });
            testsPassed++;
        } else {
            console.log('❌ FAIL: No tracking requests found (expected some)');
            console.log('   Note: Check if dev server is running on port 5173');
            testsFailed++;
        }

        // ========================================
        // TEST 2: Enable bypass and verify no tracking
        // ========================================
        console.log('\n📋 Test 2: Enable admin bypass and verify NO tracking');

        // Set the bypass flag in localStorage
        await page.evaluate(() => {
            localStorage.setItem('portfolio_admin_bypass', 'true');
        });

        // Clear route and set up new one
        await page.unroute('**/api/analytics/track**');
        const bypassRequests = [];

        await page.route('**/api/analytics/track**', route => {
            const url = route.request().url();
            bypassRequests.push(url);
            route.continue();
        });

        // Refresh page to trigger tracking with bypass enabled
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(4000); // Wait to ensure no tracking fires

        if (bypassRequests.length === 0) {
            console.log('✅ PASS: No tracking requests with bypass enabled');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Tracking requests still fired with bypass enabled');
            console.log(`   Found ${bypassRequests.length} unexpected request(s):`);
            bypassRequests.forEach(url => {
                const action = url.match(/action=(\w+)/)?.[1] || 'unknown';
                console.log(`   - ${action}`);
            });
            testsFailed++;
        }

        // ========================================
        // TEST 3: Verify bypass flag is set
        // ========================================
        console.log('\n📋 Test 3: Verify bypass flag in localStorage');

        const bypassFlag = await page.evaluate(() => {
            return localStorage.getItem('portfolio_admin_bypass');
        });

        if (bypassFlag === 'true') {
            console.log('✅ PASS: Bypass flag correctly set to "true"');
            testsPassed++;
        } else {
            console.log(`❌ FAIL: Bypass flag is "${bypassFlag}" (expected "true")`);
            testsFailed++;
        }

        // ========================================
        // TEST 4: Navigate to different pages (no tracking)
        // ========================================
        console.log('\n📋 Test 4: Navigate with bypass enabled (no tracking)');

        await page.unroute('**/api/analytics/track**');
        const navigationRequests = [];

        await page.route('**/api/analytics/track**', route => {
            const url = route.request().url();
            navigationRequests.push(url);
            route.continue();
        });

        // Navigate to different pages
        await page.goto(`${TEST_URL}/blogs`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        await page.goto(`${TEST_URL}/contact`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        if (navigationRequests.length === 0) {
            console.log('✅ PASS: No tracking during navigation with bypass');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Tracking fired during navigation with bypass');
            console.log(`   Found ${navigationRequests.length} unexpected request(s):`);
            navigationRequests.forEach(url => {
                const action = url.match(/action=(\w+)/)?.[1] || 'unknown';
                console.log(`   - ${action}`);
            });
            testsFailed++;
        }

        // ========================================
        // TEST 5: Remove bypass and verify tracking resumes
        // ========================================
        console.log('\n📋 Test 5: Remove bypass and verify tracking resumes');

        // Remove the bypass flag
        await page.evaluate(() => {
            localStorage.removeItem('portfolio_admin_bypass');
        });

        await page.unroute('**/api/analytics/track**');
        const resumedRequests = [];

        await page.route('**/api/analytics/track**', route => {
            const url = route.request().url();
            resumedRequests.push(url);
            route.continue();
        });

        // Refresh to trigger tracking again
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(4000);

        if (resumedRequests.length > 0) {
            console.log('✅ PASS: Tracking resumed after removing bypass');
            console.log(`   Found ${resumedRequests.length} tracking request(s):`);
            resumedRequests.forEach(url => {
                const action = url.match(/action=(\w+)/)?.[1] || 'unknown';
                console.log(`   - ${action}`);
            });
            testsPassed++;
        } else {
            console.log('❌ FAIL: Tracking did not resume after removing bypass');
            testsFailed++;
        }

        // ========================================
        // TEST 6: Verify bypass flag is removed
        // ========================================
        console.log('\n📋 Test 6: Verify bypass flag removed from localStorage');

        const removedFlag = await page.evaluate(() => {
            return localStorage.getItem('portfolio_admin_bypass');
        });

        if (removedFlag === null) {
            console.log('✅ PASS: Bypass flag successfully removed');
            testsPassed++;
        } else {
            console.log(`❌ FAIL: Bypass flag still exists: "${removedFlag}"`);
            testsFailed++;
        }

        // ========================================
        // TEST 7: Verify console message (optional check)
        // ========================================
        console.log('\n📋 Test 7: Check for console logs (informational)');

        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.text().includes('bypass') || msg.text().includes('Analytics')) {
                consoleLogs.push(msg.text());
            }
        });

        // Enable bypass again and reload
        await page.evaluate(() => {
            localStorage.setItem('portfolio_admin_bypass', 'true');
        });

        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        if (consoleLogs.length > 0) {
            console.log('ℹ️  INFO: Console logs detected:');
            consoleLogs.forEach(log => console.log(`   - ${log}`));
        } else {
            console.log('ℹ️  INFO: No specific console logs detected (this is optional)');
        }

        // This test doesn't affect pass/fail count

    } catch (error) {
        console.error('\n❌ Test execution error:', error.message);
        testsFailed++;
    } finally {
        await browser.close();
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testsPassed}/6`);
    console.log(`❌ Failed: ${testsFailed}/6`);
    console.log('='.repeat(50));

    if (testsFailed === 0) {
        console.log('\n🎉 All tests passed! Admin bypass works correctly.');
        console.log('\n✨ Key Findings:');
        console.log('   • Admin bypass flag prevents all tracking requests');
        console.log('   • Tracking resumes normally when bypass is removed');
        console.log('   • localStorage flag persists across page navigations');
        console.log('   • No tracking leaks during navigation with bypass enabled');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
        process.exit(1);
    }
}

// Run the test
testAdminBypass().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
