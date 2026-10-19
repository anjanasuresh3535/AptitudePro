// scripts/repair-xp.js
//
// One-time repair for XP/level data corrupted by the bug where negative
// XP fell through LevelService.getLevelFromXP() and was reported as
// Level 195 ("GOAT 100") instead of Level 1.
//
// This script does NOT touch Result documents, XPHistory documents, or
// any quiz/result history. It only clamps negative XP to 0 and
// recalculates the derived level, on exactly these collections:
//
//   - User            (xp, level)
//   - UserStats       (xp)              [level is derived live, not stored]
//   - SectionProgress (xp, level)
//
// Safe to run more than once - once XP is clamped to 0, running it again
// finds nothing left to fix.
//
// Usage:
//   node scripts/repair-xp.js

const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');

const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const SectionProgress = require('../backend/models/SectionProgress');

const levelService = require('../backend/services/LevelService');

async function repairUsers() {
    const cursor = User.find({ xp: { $lt: 0 } }).cursor();
    let fixed = 0;

    for await (const user of cursor) {
        const newXP = 0; // any negative XP clamps to exactly 0, per spec
        const newLevel = levelService.getLevelFromXP(newXP); // = 1

        console.log(`  User ${user._id} (${user.email}): xp ${user.xp} -> ${newXP}, level ${user.level} -> ${newLevel}`);

        await User.updateOne(
            { _id: user._id },
            { $set: { xp: newXP, level: newLevel } }
        );
        fixed++;
    }

    return fixed;
}

async function repairUserStats() {
    const cursor = UserStats.find({ xp: { $lt: 0 } }).cursor();
    let fixed = 0;

    for await (const stats of cursor) {
        console.log(`  UserStats ${stats._id} (user ${stats.userId}): xp ${stats.xp} -> 0`);

        await UserStats.updateOne(
            { _id: stats._id },
            { $set: { xp: 0 } }
        );
        fixed++;
    }

    return fixed;
}

async function repairSectionProgress() {
    const cursor = SectionProgress.find({ xp: { $lt: 0 } }).cursor();
    let fixed = 0;

    for await (const sp of cursor) {
        const newXP = 0;
        const newLevel = levelService.getLevelFromXP(newXP);

        console.log(`  SectionProgress ${sp._id} (user ${sp.userId}, ${sp.section}): xp ${sp.xp} -> ${newXP}, level ${sp.level} -> ${newLevel}`);

        await SectionProgress.updateOne(
            { _id: sp._id },
            { $set: { xp: newXP, level: newLevel } }
        );
        fixed++;
    }

    return fixed;
}

async function run() {
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    console.log('🔧 Starting XP/level repair...\n');

    console.log('Checking User documents...');
    const usersFixed = await repairUsers();
    console.log(`  -> ${usersFixed} User document(s) repaired.\n`);

    console.log('Checking UserStats documents...');
    const statsFixed = await repairUserStats();
    console.log(`  -> ${statsFixed} UserStats document(s) repaired.\n`);

    console.log('Checking SectionProgress documents...');
    const sectionsFixed = await repairSectionProgress();
    console.log(`  -> ${sectionsFixed} SectionProgress document(s) repaired.\n`);

    console.log('✅ Repair complete. Result and XPHistory documents were not modified.');

    await mongoose.connection.close();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Repair script failed:', err);
    process.exit(1);
});