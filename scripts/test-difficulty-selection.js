// scripts/test-difficulty-selection.js

const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const gameService = require('../backend/services/GameService');
const { parseDifficultyLevel, getGameConfig } = require('../backend/config/gameConfig');

async function testDifficultySelection() {
    console.log('🧪 Testing Gaming Hub Difficulty Selection Backend & Logic...\n');

    await connectDB();

    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    let user = await User.findOne({ email: 'test_game_user@aptitudepro.com' });
    if (!user) {
        user = await User.create({
            name: 'Test Gamer',
            username: 'TestGamer',
            email: 'test_game_user@aptitudepro.com',
            password: 'Password123!',
            xp: 100,
            level: 2
        });
    }

    const userId = user._id;

    console.log('--- TEST 1: SPEED CHALLENGE INTERMEDIATE (difficulty = "2") ---');
    const speedInt = await gameService.createSession(userId, 'speedChallenge', '2');
    console.log(`Speed Intermediate Session: QCount=${speedInt.questions.length}, TimeLimit=${speedInt.timeLimitSec}s, DiffName=${speedInt.difficultyName}`);
    if (speedInt.questions.length === 15 && speedInt.timeLimitSec === 450 && speedInt.difficulty === 2) {
        console.log('✅ TEST 1 PASSED: Speed Challenge Intermediate correctly configured!\n');
    } else {
        console.error('❌ TEST 1 FAILED!');
        process.exit(1);
    }

    console.log('--- TEST 2: SPEED CHALLENGE ADVANCED (difficulty = "3") ---');
    const speedAdv = await gameService.createSession(userId, 'speedChallenge', '3');
    console.log(`Speed Advanced Session: QCount=${speedAdv.questions.length}, TimeLimit=${speedAdv.timeLimitSec}s, DiffName=${speedAdv.difficultyName}`);
    if (speedAdv.questions.length === 20 && speedAdv.timeLimitSec === 500 && speedAdv.difficulty === 3) {
        console.log('✅ TEST 2 PASSED: Speed Challenge Advanced correctly configured!\n');
    } else {
        console.error('❌ TEST 2 FAILED!');
        process.exit(1);
    }

    console.log('--- TEST 3: ACCURACY RUSH INTERMEDIATE (difficulty = "intermediate") ---');
    const accInt = await gameService.createSession(userId, 'accuracyRush', 'intermediate');
    console.log(`Accuracy Intermediate Session: QCount=${accInt.questions.length}, TimeLimit=${accInt.timeLimitSec}s, DiffName=${accInt.difficultyName}`);
    if (accInt.questions.length === 15 && accInt.timeLimitSec === 600 && accInt.difficulty === 2) {
        console.log('✅ TEST 3 PASSED: Accuracy Rush Intermediate correctly configured!\n');
    } else {
        console.error('❌ TEST 3 FAILED!');
        process.exit(1);
    }

    console.log('--- TEST 4: ACCURACY RUSH ADVANCED (difficulty = "advanced") ---');
    const accAdv = await gameService.createSession(userId, 'accuracyRush', 'advanced');
    console.log(`Accuracy Advanced Session: QCount=${accAdv.questions.length}, TimeLimit=${accAdv.timeLimitSec}s, DiffName=${accAdv.difficultyName}`);
    if (accAdv.questions.length === 20 && accAdv.timeLimitSec === 700 && accAdv.difficulty === 3) {
        console.log('✅ TEST 4 PASSED: Accuracy Rush Advanced correctly configured!\n');
    } else {
        console.error('❌ TEST 4 FAILED!');
        process.exit(1);
    }

    console.log('🎉 ALL DIFFICULTY SELECTION TESTS PASSED SUCCESSFULLY!');
    await mongoose.connection.close();
    process.exit(0);
}

testDifficultySelection().catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
