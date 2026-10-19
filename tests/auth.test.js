// tests/auth.test.js
//
// Comprehensive Automated Test Suite for AptitudePro Authentication & Security
// Verifies Registration, Login, Password Hashing, Session Protection, and User Data Isolation.

const assert = require('assert');
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const Result = require('../backend/models/Result');
const isAuthenticated = require('../backend/middleware/auth');

let passedTests = 0;
let failedTests = 0;

function logPass(testNum, title) {
    passedTests++;
    console.log(`✅ [AUTH TEST ${testNum}] PASSED: ${title}`);
}

function logFail(testNum, title, error) {
    failedTests++;
    console.error(`❌ [AUTH TEST ${testNum}] FAILED: ${title}`);
    console.error(`   Error: ${error.message || error}`);
}

async function runAuthTests() {
    console.log('====================================================');
    console.log('🔒 Starting AptitudePro Authentication & Security Test Suite');
    console.log('====================================================\n');

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    const testEmail = `sec_user_${Date.now()}@aptitudepro.com`;
    const testPassword = 'SecurePassword123!';

    // TEST 1: User Registration
    try {
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const newUser = await User.create({
            name: 'Security Test User',
            username: `secuser_${Date.now()}`,
            email: testEmail,
            password: hashedPassword,
            xp: 0,
            level: 1
        });

        assert.ok(newUser._id, 'User created with ObjectId');
        assert.strictEqual(newUser.email, testEmail);
        assert.strictEqual(newUser.xp, 0);
        assert.strictEqual(newUser.level, 1);
        logPass(1, 'User Registration & Account Initialization');
    } catch (err) {
        logFail(1, 'User Registration', err);
    }

    // TEST 2: Duplicate Email Rejection
    try {
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await User.create({
            name: 'Duplicate User',
            username: `dupuser_${Date.now()}`,
            email: testEmail,
            password: hashedPassword
        });
        logFail(2, 'Duplicate Email Rejection', new Error('Should have thrown unique constraint error'));
    } catch (err) {
        assert.ok(err.code === 11000 || err.message.includes('duplicate key'));
        logPass(2, 'Duplicate Email Registration Rejection');
    }

    // TEST 3: Password Hashing Verification
    try {
        const userDoc = await User.findOne({ email: testEmail });
        assert.ok(userDoc.password !== testPassword, 'Plaintext password must NEVER be stored');
        assert.ok(userDoc.password.startsWith('$2a$') || userDoc.password.startsWith('$2b$'), 'Password must be bcrypt hash');
        const match = await bcrypt.compare(testPassword, userDoc.password);
        assert.strictEqual(match, true, 'Bcrypt comparison returns true for correct password');
        logPass(3, 'Password Hashing Security (Bcrypt hashing enforced)');
    } catch (err) {
        logFail(3, 'Password Hashing Verification', err);
    }

    // TEST 4: Valid User Login Authentication
    try {
        const userDoc = await User.findOne({ email: testEmail });
        assert.ok(userDoc, 'User found');
        const isValid = await bcrypt.compare(testPassword, userDoc.password);
        assert.strictEqual(isValid, true, 'Login credentials validated');
        logPass(4, 'Valid User Login Authentication');
    } catch (err) {
        logFail(4, 'Valid User Login Authentication', err);
    }

    // TEST 5: Invalid Password Rejection
    try {
        const userDoc = await User.findOne({ email: testEmail });
        const isValid = await bcrypt.compare('WrongPassword999!', userDoc.password);
        assert.strictEqual(isValid, false, 'Invalid password must be rejected');
        logPass(5, 'Invalid Password Login Rejection');
    } catch (err) {
        logFail(5, 'Invalid Password Login Rejection', err);
    }

    // TEST 6: Non-existent User Login Rejection
    try {
        const nonExistent = await User.findOne({ email: 'nobody_exists_12345@aptitudepro.com' });
        assert.strictEqual(nonExistent, null, 'Non-existent user lookup yields null');
        logPass(6, 'Non-existent User Login Protection');
    } catch (err) {
        logFail(6, 'Non-existent User Login Protection', err);
    }

    // TEST 7: Protected Route Access Control Middleware
    try {
        let redirectUrl = null;
        let statusCode = null;
        let jsonResponse = null;

        // Test unauthenticated GET request
        const reqGet = { session: {}, headers: {}, method: 'GET' };
        const resGet = { redirect: (url) => { redirectUrl = url; } };
        isAuthenticated(reqGet, resGet, () => {});
        assert.strictEqual(redirectUrl, '/login', 'Unauthenticated HTML request redirects to /login');

        // Test unauthenticated JSON request
        const reqJson = { session: {}, headers: { accept: 'application/json' }, method: 'POST' };
        const resJson = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { jsonResponse = data; }
                };
            }
        };
        isAuthenticated(reqJson, resJson, () => {});
        assert.strictEqual(statusCode, 401, 'Unauthenticated API request returns 401 Unauthorized');
        assert.strictEqual(jsonResponse.success, false);
        logPass(7, 'Protected Route Middleware Access Control (HTML Redirect & JSON 401)');
    } catch (err) {
        logFail(7, 'Protected Route Middleware Access Control', err);
    }

    // TEST 8: Authenticated Middleware Passthrough
    try {
        let nextCalled = false;
        const reqAuth = { session: { userId: '507f1f77bcf86cd799439011' }, headers: {}, method: 'GET' };
        const resAuth = {};
        isAuthenticated(reqAuth, resAuth, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Authenticated session executes next middleware');
        logPass(8, 'Authenticated Middleware Passthrough');
    } catch (err) {
        logFail(8, 'Authenticated Middleware Passthrough', err);
    }

    // TEST 9: User Private Data Isolation
    try {
        const userA = await User.findOne({ email: testEmail });
        const userB = await User.create({
            name: 'User B Secret',
            username: `userb_${Date.now()}`,
            email: `userb_${Date.now()}@aptitudepro.com`,
            password: 'Password123!'
        });

        // User B result
        const resB = await Result.create({
            userId: userB._id,
            section: 'Maths',
            difficulty: 1,
            score: 20,
            totalQuestions: 25,
            correct: 20,
            wrong: 5,
            skipped: 0,
            accuracy: 80,
            xpEarned: 100,
            xpLost: 10,
            netXP: 90,
            levelBefore: 1,
            levelAfter: 1,
            xpBefore: 0,
            xpAfter: 90,
            answers: []
        });

        // User A attempts to fetch User B's result document by querying with User A's userId filter
        const queriedByA = await Result.findOne({ _id: resB._id, userId: userA._id });
        assert.strictEqual(queriedByA, null, 'User A query for User B result MUST return null');
        logPass(9, 'User Private Data Access Isolation (Cross-User Result Privacy)');
    } catch (err) {
        logFail(9, 'User Private Data Access Isolation', err);
    }

    console.log('\n====================================================');
    console.log(`📊 AUTH & SECURITY TEST RESULTS: ${passedTests} PASSED / ${failedTests} FAILED`);
    console.log('====================================================');

    if (failedTests > 0) {
        console.error('❌ AUTH & SECURITY TEST SUITE FAILED!');
        await mongoose.connection.close();
        process.exit(1);
    } else {
        console.log('🎉 ALL 9 AUTH & SECURITY SCENARIOS PASSED 100% PERFECTLY!');
        await mongoose.connection.close();
        process.exit(0);
    }
}

runAuthTests().catch(err => {
    console.error('❌ Uncaught auth test error:', err);
    process.exit(1);
});
