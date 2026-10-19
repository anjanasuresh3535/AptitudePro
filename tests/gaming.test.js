// tests/gaming.test.js
//
// Comprehensive Automated Test Suite for AptitudePro Gaming Hub
// Verifies Speed Challenge, Accuracy Rush, Difficulty Levels, Bonus XP, and Idempotency.

const assert = require('assert');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const GameSession = require('../backend/models/GameSession');
const XPHistory = require('../backend/models/XPHistory');
const gameService = require('../backend/services/GameService');
const levelService = require('../backend/services/LevelService');

let passedTests = 0;
let failedTests = 0;

function logPass(testNum, title) {
    passedTests++;
    console.log(`✅ [GAMING TEST ${testNum}] PASSED: ${title}`);
}

function logFail(testNum, title, error) {
    failedTests++;
    console.error(`❌ [GAMING TEST ${testNum}] FAILED: ${title}`);
    console.error(`   Error: ${error.message || error}`);
}

async function runGamingTests() {
    console.log('====================================================');
    console.log('🎮 Starting AptitudePro Gaming Hub Test Suite (10 Scenarios)');
    console.log('====================================================\n');

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    let gamerUser = await User.findOne({ email: 'test_gamer_user@aptitudepro.com' });
    if (!gamerUser) {
        gamerUser = await User.create({
            name: 'Test Gamer Pro',
            username: 'GamerPro',
            email: 'test_gamer_user@aptitudepro.com',
            password: 'Password123!',
            xp: 50,
            level: 1
        });
    }
    const userId = gamerUser._id;

    // TEST 1: Speed Challenge Intermediate Session Creation
    try {
        const session = await gameService.createSession(userId, 'speedChallenge', '2');
        assert.strictEqual(session.gameSection, 'speedChallenge');
        assert.strictEqual(session.difficulty, 2);
        assert.strictEqual(session.totalQuestions, 15);
        assert.strictEqual(session.timeLimitSec, 450);
        assert.ok(session.sessionId.startsWith('game_'));
        logPass(1, 'Speed Challenge Intermediate Session Creation (15 Qs, 450s)');
    } catch (err) {
        logFail(1, 'Speed Challenge Intermediate Creation', err);
    }

    // TEST 2: Speed Challenge Advanced Session Creation
    try {
        const session = await gameService.createSession(userId, 'speedChallenge', '3');
        assert.strictEqual(session.gameSection, 'speedChallenge');
        assert.strictEqual(session.difficulty, 3);
        assert.strictEqual(session.totalQuestions, 20);
        assert.strictEqual(session.timeLimitSec, 500);
        logPass(2, 'Speed Challenge Advanced Session Creation (20 Qs, 500s)');
    } catch (err) {
        logFail(2, 'Speed Challenge Advanced Creation', err);
    }

    // TEST 3: Accuracy Rush Intermediate Session Creation
    try {
        const session = await gameService.createSession(userId, 'accuracyRush', 'intermediate');
        assert.strictEqual(session.gameSection, 'accuracyRush');
        assert.strictEqual(session.difficulty, 2);
        assert.strictEqual(session.totalQuestions, 15);
        assert.strictEqual(session.timeLimitSec, 600);
        logPass(3, 'Accuracy Rush Intermediate Session Creation (15 Qs, 600s)');
    } catch (err) {
        logFail(3, 'Accuracy Rush Intermediate Creation', err);
    }

    // TEST 4: Accuracy Rush Advanced Session Creation
    try {
        const session = await gameService.createSession(userId, 'accuracyRush', 'advanced');
        assert.strictEqual(session.gameSection, 'accuracyRush');
        assert.strictEqual(session.difficulty, 3);
        assert.strictEqual(session.totalQuestions, 20);
        assert.strictEqual(session.timeLimitSec, 700);
        logPass(4, 'Accuracy Rush Advanced Session Creation (20 Qs, 700s)');
    } catch (err) {
        logFail(4, 'Accuracy Rush Advanced Creation', err);
    }

    // TEST 5: Invalid Game Section Rejection
    try {
        await gameService.createSession(userId, 'invalidMode', '2');
        logFail(5, 'Invalid Game Section Rejection', new Error('Should have thrown an error'));
    } catch (err) {
        assert.ok(err.message.includes('Invalid game section'));
        logPass(5, 'Invalid Game Section Validation & Rejection');
    }

    // TEST 6: Invalid Difficulty Level Rejection
    try {
        await gameService.createSession(userId, 'speedChallenge', '99');
        logFail(6, 'Invalid Difficulty Level Rejection', new Error('Should have thrown an error'));
    } catch (err) {
        assert.ok(err.message.includes('Invalid difficulty level'));
        logPass(6, 'Invalid Difficulty Level Validation & Rejection');
    }

    // TEST 7: Speed Challenge Submission & Speed Bonus Evaluation
    try {
        const sessionPayload = await gameService.createSession(userId, 'speedChallenge', 2);
        const dbSession = await GameSession.findOne({ sessionId: sessionPayload.sessionId });

        // Answer all questions correctly with 10s timeSpent (under 30s limit for speed bonus)
        const userAnswers = dbSession.questions.map(q => ({
            questionId: q.questionId,
            selectedOption: q.correctAnswerLetter,
            timeSpentSec: 10
        }));

        const completed = await gameService.submitSession(userId, dbSession.sessionId, userAnswers, 150);
        assert.strictEqual(completed.status, 'COMPLETED');
        assert.strictEqual(completed.correctCount, 15);
        assert.strictEqual(completed.accuracy, 100);
        assert.ok(completed.netXP > 15 * 15, 'Net XP should include speed bonus XP');
        logPass(7, 'Speed Challenge Submission & Speed Bonus XP Calculation');
    } catch (err) {
        logFail(7, 'Speed Challenge Submission & Speed Bonus', err);
    }

    // TEST 8: Accuracy Rush Submission & Streak Bonus Evaluation
    try {
        const sessionPayload = await gameService.createSession(userId, 'accuracyRush', 2);
        const dbSession = await GameSession.findOne({ sessionId: sessionPayload.sessionId });

        // Answer questions 1 to 9 correctly (3 streaks of 3), skip rest
        const userAnswers = dbSession.questions.map((q, idx) => {
            if (idx < 9) {
                return {
                    questionId: q.questionId,
                    selectedOption: q.correctAnswerLetter,
                    timeSpentSec: 20
                };
            }
            return {
                questionId: q.questionId,
                selectedOption: 'SKIPPED',
                timeSpentSec: 0
            };
        });

        const completed = await gameService.submitSession(userId, dbSession.sessionId, userAnswers, 200);
        assert.strictEqual(completed.status, 'COMPLETED');
        assert.strictEqual(completed.correctCount, 9);
        assert.strictEqual(completed.maxStreak, 9);
        assert.ok(completed.netXP > 9 * 15, 'Net XP should include streak bonus XP');
        logPass(8, 'Accuracy Rush Submission & Streak Bonus XP Calculation');
    } catch (err) {
        logFail(8, 'Accuracy Rush Submission & Streak Bonus', err);
    }

    // TEST 9: Idempotent Session Submission (No Double XP)
    try {
        const sessionPayload = await gameService.createSession(userId, 'speedChallenge', 2);
        const dbSession = await GameSession.findOne({ sessionId: sessionPayload.sessionId });

        const userAnswers = dbSession.questions.map(q => ({
            questionId: q.questionId,
            selectedOption: q.correctAnswerLetter,
            timeSpentSec: 15
        }));

        const firstSubmit = await gameService.submitSession(userId, dbSession.sessionId, userAnswers, 120);
        const xpAfterFirst = firstSubmit.xpAfter;

        // Second submission attempt of same completed session
        const secondSubmit = await gameService.submitSession(userId, dbSession.sessionId, userAnswers, 120);

        assert.strictEqual(secondSubmit.xpAfter, xpAfterFirst, 'XP must remain identical on resubmission');
        logPass(9, 'Idempotent Session Submission (Prevents Double XP)');
    } catch (err) {
        logFail(9, 'Idempotent Session Submission', err);
    }

    // TEST 10: Gaming Stats Aggregation & User History
    try {
        const stats = await gameService.getUserGameStats(userId);
        assert.ok(stats.totalGames >= 3, 'At least 3 games logged in stats');
        assert.ok(stats.totalXPEarned > 0, 'Total XP earned is positive');

        const history = await gameService.getUserGameHistory(userId, 5);
        assert.ok(Array.isArray(history));
        assert.ok(history.length >= 3);
        logPass(10, 'Gaming Stats Aggregation & History Retrieval');
    } catch (err) {
        logFail(10, 'Gaming Stats Aggregation & History', err);
    }

    console.log('\n====================================================');
    console.log(`📊 GAMING TEST RESULTS: ${passedTests} PASSED / ${failedTests} FAILED`);
    console.log('====================================================');

    if (failedTests > 0) {
        console.error('❌ GAMING TEST SUITE FAILED!');
        await mongoose.connection.close();
        process.exit(1);
    } else {
        console.log('🎉 ALL 10 GAMING SCENARIOS PASSED 100% PERFECTLY!');
        await mongoose.connection.close();
        process.exit(0);
    }
}

runGamingTests().catch(err => {
    console.error('❌ Uncaught gaming test error:', err);
    process.exit(1);
});
