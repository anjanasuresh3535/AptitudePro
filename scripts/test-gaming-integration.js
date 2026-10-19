// scripts/test-gaming-integration.js

const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const Question = require('../backend/models/Question');
const GameSession = require('../backend/models/GameSession');
const XPHistory = require('../backend/models/XPHistory');
const placementConfig = require('../backend/config/placementConfig');
const gameConfig = require('../backend/config/gameConfig');
const gameService = require('../backend/services/GameService');
const placementService = require('../backend/services/PlacementService');

async function runTests() {
    console.log('🧪 Starting AptitudePro Gaming & Quiz System Verification Tests...\n');

    await connectDB();

    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    let testUser = await User.findOne({ email: 'test_game_user@aptitudepro.com' });
    if (!testUser) {
        testUser = await User.create({
            name: 'Test Gamer',
            username: 'TestGamer',
            email: 'test_game_user@aptitudepro.com',
            password: 'Password123!',
            xp: 100,
            level: 2
        });
    }

    await User.updateOne({ _id: testUser._id }, { $set: { xp: 100, level: 2 } });
    await UserStats.updateOne(
        { userId: testUser._id },
        { $set: { xp: 100, totalQuizzes: 0, totalQuestions: 0 } },
        { upsert: true }
    );

    const userId = testUser._id;

    console.log('--- TEST 1: VERIFY NORMAL QUIZ QUESTION COUNTS & CONFIG ---');
    console.log('School Foundation qCount:', placementConfig.getQuestionCount('school', null, 1));
    console.log('School Intermediate qCount:', placementConfig.getQuestionCount('school', null, 2));
    console.log('School Advanced qCount:', placementConfig.getQuestionCount('school', null, 3));
    console.log('General Placement Foundation qCount:', placementConfig.getQuestionCount('college', 'general', 1));
    console.log('General Placement Intermediate qCount:', placementConfig.getQuestionCount('college', 'general', 2));
    console.log('General Placement Advanced qCount:', placementConfig.getQuestionCount('college', 'general', 3));
    console.log('Company Foundation qCount:', placementConfig.getQuestionCount('college', 'company', 1));
    console.log('Company Intermediate qCount:', placementConfig.getQuestionCount('college', 'company', 2));
    console.log('Company Advanced qCount:', placementConfig.getQuestionCount('college', 'company', 3));

    if (
        placementConfig.getQuestionCount('school', null, 1) === 25 &&
        placementConfig.getQuestionCount('school', null, 2) === 25 &&
        placementConfig.getQuestionCount('school', null, 3) === 25 &&
        placementConfig.getQuestionCount('college', 'general', 1) === 20 &&
        placementConfig.getQuestionCount('college', 'general', 2) === 25 &&
        placementConfig.getQuestionCount('college', 'general', 3) === 30 &&
        placementConfig.getQuestionCount('college', 'company', 1) === 15 &&
        placementConfig.getQuestionCount('college', 'company', 2) === 20 &&
        placementConfig.getQuestionCount('college', 'company', 3) === 25
    ) {
        console.log('✅ TEST 1 PASSED: All Normal Quiz question counts match specifications!\n');
    } else {
        console.error('❌ TEST 1 FAILED: Question count mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 2: CREATE GAMING SESSION (Speed Challenge - Intermediate) ---');
    const speedSession = await gameService.createSession(userId, 'speedChallenge', 2);
    console.log('Session Created:', speedSession.sessionId);
    console.log('Question Count:', speedSession.questions.length);
    console.log('Time Limit Sec:', speedSession.timeLimitSec);

    if (speedSession.questions.length === 15 && speedSession.timeLimitSec === 450) {
        console.log('✅ TEST 2 PASSED: Speed Challenge Intermediate session initialized correctly!\n');
    } else {
        console.error('❌ TEST 2 FAILED: Speed session initialization mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 3: SUBMIT GAMING SESSION & VERIFY XP & PREVENT DUPLICATE XP ---');
    const answersToSubmit = speedSession.questions.map((q, idx) => ({
        questionId: q.questionId,
        selectedOption: idx % 2 === 0 ? 'A' : 'B',
        timeSpentSec: 10
    }));

    const initialUserXP = (await User.findById(userId)).xp;
    console.log('User XP before game submission:', initialUserXP);

    const result1 = await gameService.submitSession(userId, speedSession.sessionId, answersToSubmit, 150);
    const postUserXP = (await User.findById(userId)).xp;
    console.log('User XP after game submission:', postUserXP);
    console.log('Earned Net XP:', result1.netXP);

    if (postUserXP === initialUserXP + result1.netXP && result1.status === 'COMPLETED') {
        console.log('✅ TEST 3A PASSED: XP correctly updated and session marked COMPLETED!');
    } else {
        console.error('❌ TEST 3A FAILED: XP update mismatch!');
        process.exit(1);
    }

    // Idempotency Test: Submit the same session again (Simulating Refresh)
    console.log('Re-submitting same session to verify idempotency (no duplicate XP)...');
    const result2 = await gameService.submitSession(userId, speedSession.sessionId, answersToSubmit, 150);
    const rePostUserXP = (await User.findById(userId)).xp;
    console.log('User XP after second submission:', rePostUserXP);

    if (rePostUserXP === postUserXP) {
        console.log('✅ TEST 3B PASSED: Idempotency verified! Refreshing did NOT award duplicate XP.\n');
    } else {
        console.error('❌ TEST 3B FAILED: Duplicate XP awarded on re-submission!');
        process.exit(1);
    }

    console.log('--- TEST 4: CREATE GAMING SESSION (Accuracy Rush - Advanced) ---');
    const accuracySession = await gameService.createSession(userId, 'accuracyRush', 3);
    console.log('Session Created:', accuracySession.sessionId);
    console.log('Question Count:', accuracySession.questions.length);
    console.log('Time Limit Sec:', accuracySession.timeLimitSec);

    if (accuracySession.questions.length === 20 && accuracySession.timeLimitSec === 700) {
        console.log('✅ TEST 4 PASSED: Accuracy Rush Advanced session initialized correctly!\n');
    } else {
        console.error('❌ TEST 4 FAILED: Accuracy session initialization mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 5: VERIFY XP HISTORY ENTRIES ---');
    const historyEntries = await XPHistory.find({ userId }).sort({ createdAt: -1 });
    console.log(`Found ${historyEntries.length} XP history entries for user.`);
    console.log('Latest entry reason:', historyEntries[0]?.reason);

    if (historyEntries.length > 0 && historyEntries[0].reason.includes('[Gaming -')) {
        console.log('✅ TEST 5 PASSED: XP history logged correctly!\n');
    } else {
        console.error('❌ TEST 5 FAILED: XP history logging issue!');
        process.exit(1);
    }

    console.log('🎉 ALL GAMING INTEGRATION TESTS PASSED SUCCESSFULLY!');
    await mongoose.connection.close();
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test execution error:', err);
    process.exit(1);
});
