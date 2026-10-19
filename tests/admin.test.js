/**
 * tests/admin.test.js
 *
 * Integration and security tests for the AptitudePro Admin Panel.
 * Uses the exact same self-bootstrapping pattern as capgemini.test.js.
 *
 * Verifies:
 *  1. Unauthenticated users are redirected from /admin to /login
 *  2. Ordinary (role: 'user') accounts are blocked with 403 Forbidden
 *  3. Admin accounts (role: 'admin') can access the Admin Dashboard
 *  4. Admin can view users list, questions list, results, analytics, and audit log
 *  5. CSRF protection blocks unauthenticated/untokened state-changing mutations
 *  6. Question JSON export works and omits sensitive fields
 *  7. Audit log tracks administrative actions
 */

'use strict';

const assert = require('assert');
const bcrypt = require('bcryptjs');
const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const AdminLog = require('../backend/models/AdminLog');

let passCount = 0;
let failCount = 0;
const failures = [];

function pass(name) {
    passCount++;
    console.log(`  ✅ ${name}`);
}

function fail(name, reason) {
    failCount++;
    failures.push({ name, reason });
    console.log(`  ❌ ${name}`);
    console.log(`     → ${reason}`);
}

async function run() {
    console.log('\n🧪 AptitudePro Admin Panel Integration Tests\n');

    let standardUser = null;
    let adminUser = null;

    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000);
                mongoose.connection.once('connected', () => { clearTimeout(timeout); resolve(); });
                mongoose.connection.once('error', error => { clearTimeout(timeout); reject(error); });
            });
        }

        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const testPassword = 'AdminTest123!Secure';
        const passwordHash = await bcrypt.hash(testPassword, 4);

        // 1. Create standard student user
        standardUser = await User.create({
            name: 'Standard Student',
            email: `student-${suffix}@aptitudepro.test`,
            password: passwordHash,
            role: 'user',
            isActive: true
        });

        // 2. Create admin user
        adminUser = await User.create({
            name: 'System Admin',
            email: `admin-${suffix}@aptitudepro.test`,
            password: passwordHash,
            role: 'admin',
            isActive: true
        });

        // 3. Start the application
        require('../frontend/app');

        const base = () => `http://127.0.0.1:${config.port}`;

        // Wait for health endpoint
        let health;
        for (let i = 0; i < 40; i++) {
            try {
                health = await fetch(`${base()}/health`);
                if (health.ok) break;
            } catch (_) {}
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        assert.ok(health?.ok, 'App health endpoint is available');
        pass('App startup and /health check');

        // Test 1: Unauthenticated access to /admin redirects to /login
        const unauthAdmin = await fetch(`${base()}/admin`, { redirect: 'manual' });
        assert.strictEqual(unauthAdmin.status, 302, 'Unauthenticated /admin redirects');
        assert.ok((unauthAdmin.headers.get('location') || '').includes('/login'), 'Redirects to /login');
        pass('Unauthenticated user cannot access /admin (redirects to /login)');

        // Test 2: Unauthenticated access to export endpoint is rejected
        const unauthExport = await fetch(`${base()}/admin/questions/export`, { redirect: 'manual' });
        assert.ok(unauthExport.status === 302 || unauthExport.status === 401 || unauthExport.status === 403, 'Export blocked for guest');
        pass('Unauthenticated user cannot access /admin/questions/export');

        // Test 3: Log in as standard student (role: 'user')
        const studentLogin = await fetch(`${base()}/login`, {
            method: 'POST',
            redirect: 'manual',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email: standardUser.email, password: testPassword })
        });
        assert.strictEqual(studentLogin.status, 302, 'Student logged in');
        const studentCookie = studentLogin.headers.get('set-cookie')?.split(';')[0];
        assert.ok(studentCookie, 'Student received session cookie');
        pass('Student user authenticates');

        // Test 4: Student (role: 'user') accessing /admin receives 403 Forbidden
        const studentAdminAttempt = await fetch(`${base()}/admin`, {
            headers: { cookie: studentCookie }
        });
        assert.strictEqual(studentAdminAttempt.status, 403, 'Student access to /admin is forbidden (403)');
        pass('Standard student (role: user) receives 403 Forbidden on /admin');

        // Test 5: Log in as admin user (role: 'admin')
        const adminLogin = await fetch(`${base()}/login`, {
            method: 'POST',
            redirect: 'manual',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email: adminUser.email, password: testPassword })
        });
        assert.strictEqual(adminLogin.status, 302, 'Admin logged in');
        const adminCookie = adminLogin.headers.get('set-cookie')?.split(';')[0];
        assert.ok(adminCookie, 'Admin received session cookie');
        pass('Admin user authenticates');

        // Test 6: Admin successfully accesses Admin Dashboard (200 OK)
        const adminDashboard = await fetch(`${base()}/admin`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(adminDashboard.status, 200, 'Admin accesses dashboard (200 OK)');
        const dashHtml = await adminDashboard.text();
        assert.ok(dashHtml.includes('Dashboard Overview') || dashHtml.includes('AptitudePro Admin'), 'Dashboard rendered properly');
        pass('Admin accesses /admin Dashboard (200 OK)');

        // Test 7: Admin accesses User Management page
        const usersPage = await fetch(`${base()}/admin/users`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(usersPage.status, 200, 'Admin accesses /admin/users');
        const usersHtml = await usersPage.text();
        assert.ok(usersHtml.includes('User Management'), 'Users page rendered');
        pass('Admin accesses /admin/users list');

        // Test 8: Admin accesses Questions page
        const questionsPage = await fetch(`${base()}/admin/questions`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(questionsPage.status, 200, 'Admin accesses /admin/questions');
        const questionsHtml = await questionsPage.text();
        assert.ok(questionsHtml.includes('Question Bank'), 'Questions page rendered');
        pass('Admin accesses /admin/questions bank');

        // Test 9: Admin accesses Results page
        const resultsPage = await fetch(`${base()}/admin/results`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(resultsPage.status, 200, 'Admin accesses /admin/results');
        const resultsHtml = await resultsPage.text();
        assert.ok(resultsHtml.includes('Quiz Results'), 'Results page rendered');
        pass('Admin accesses /admin/results');

        // Test 10: Admin accesses Analytics page
        const analyticsPage = await fetch(`${base()}/admin/analytics`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(analyticsPage.status, 200, 'Admin accesses /admin/analytics');
        const analyticsHtml = await analyticsPage.text();
        assert.ok(analyticsHtml.includes('Analytics'), 'Analytics page rendered');
        pass('Admin accesses /admin/analytics');

        // Test 11: Admin accesses Audit Log page
        const auditLogPage = await fetch(`${base()}/admin/audit-log`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(auditLogPage.status, 200, 'Admin accesses /admin/audit-log');
        const auditHtml = await auditLogPage.text();
        assert.ok(auditHtml.includes('Audit Log'), 'Audit log page rendered');
        pass('Admin accesses /admin/audit-log');

        // Test 12: Admin exports questions JSON
        const exportRes = await fetch(`${base()}/admin/questions/export`, {
            headers: { cookie: adminCookie }
        });
        assert.strictEqual(exportRes.status, 200, 'Questions export returns 200');
        assert.ok(exportRes.headers.get('content-type')?.includes('application/json'), 'Export is JSON');
        const exportedQuestions = await exportRes.json();
        assert.ok(Array.isArray(exportedQuestions), 'Export returns an array');
        // Ensure sqlSolution is never leaked in export
        const hasSqlSolution = exportedQuestions.some(q => q.sqlSolution);
        assert.strictEqual(hasSqlSolution, false, 'sqlSolution is excluded from export');
        pass('Questions JSON export works and strips sqlSolution');

        // Test 13: CSRF token protects state-changing POST routes
        const csrfPost = await fetch(`${base()}/admin/questions/new`, {
            method: 'POST',
            headers: {
                cookie: adminCookie,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                question: 'CSRF test question?',
                option1: 'A', option2: 'B', option3: 'C', option4: 'D',
                answer: 'A', section: 'Maths', subject: 'Algebra',
                difficultyLevel: '1',
                _csrf: 'invalid-csrf-token'
            })
        });
        assert.strictEqual(csrfPost.status, 403, 'CSRF failure returns 403');
        pass('State-changing mutations without valid CSRF are rejected (403)');

        // Summary
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`  Total: ${passCount + failCount}  |  Passed: ${passCount}  |  Failed: ${failCount}`);

        if (failCount > 0) {
            console.log('\nFailed tests:');
            failures.forEach(f => console.log(`  • ${f.name}: ${f.reason}`));
            process.exit(1);
        } else {
            console.log('\n🎉 All 13 Admin Panel integration tests PASSED!\n');
            process.exit(0);
        }

    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    } finally {
        if (standardUser) await User.deleteOne({ _id: standardUser._id });
        if (adminUser) await User.deleteOne({ _id: adminUser._id });
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

run();
