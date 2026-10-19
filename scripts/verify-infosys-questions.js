// scripts/verify-infosys-questions.js
//
// Verification script for the Infosys question bank.
// Checks DB counts per section, mock assembly, and section practice returns.
// Run after importing all question files.
//
// Usage: node scripts/verify-infosys-questions.js

const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const { INFOSYS_SECTIONS, INFOSYS_MOCK_CONFIG, INFOSYS_DEVELOPMENT_TARGETS } = require('../backend/config/infosysConfig');
const placementService = require('../backend/services/PlacementService');

async function runVerification() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    console.log('====================================================');
    console.log('🔍 INFOSYS QUESTION BANK VERIFICATION');
    console.log('====================================================\n');

    let allPassed = true;

    // 1. Per-section DB counts
    console.log('--- SECTION DB COUNTS ---');
    for (const [key, secConfig] of Object.entries(INFOSYS_SECTIONS)) {
        const target = INFOSYS_DEVELOPMENT_TARGETS[key] || secConfig.questionCount;
        const mockNeeded = INFOSYS_MOCK_CONFIG.distribution[key] || 0;

        const count = await Question.countDocuments({
            company: 'Infosys',
            active: { $ne: false },
            $or: [
                { section: secConfig.sectionRegex },
                { subject: secConfig.sectionRegex },
                { topic:   secConfig.sectionRegex },
                { category:secConfig.sectionRegex }
            ]
        });

        const dbOk   = count >= mockNeeded;
        const dbIcon = dbOk ? '✅' : '❌';
        if (!dbOk) allPassed = false;

        console.log(`${dbIcon} ${secConfig.name.padEnd(20)} DB: ${count} (mock needs: ${mockNeeded}, bank target: ${target})`);
    }

    // 2. Full mock assembly
    console.log('\n--- FULL MOCK ASSEMBLY ---');
    try {
        const mockResult = await placementService.getInfosysMockQuestions(null);
        const mockQ = mockResult.questions ? mockResult.questions.length : 0;
        const mockNeeded = INFOSYS_MOCK_CONFIG.totalQuestions;
        const mockOk = mockQ === mockNeeded;
        if (!mockOk) allPassed = false;
        console.log(`${mockOk ? '✅' : '❌'} Full Mock returned: ${mockQ} / ${mockNeeded} expected  (insufficient: ${!!mockResult.insufficient})`);
    } catch (err) {
        allPassed = false;
        console.log(`❌ Full Mock failed with error: ${err.message}`);
    }

    // 3. Section practice per section
    console.log('\n--- SECTION PRACTICE RETURNS ---');
    for (const [key, secConfig] of Object.entries(INFOSYS_SECTIONS)) {
        const needed = secConfig.questionCount;
        try {
            const res = await placementService.getInfosysSectionPracticeQuestions(null, key);
            const got = res.questions ? res.questions.length : 0;
            const ok = got === needed;
            if (!ok) allPassed = false;
            console.log(`${ok ? '✅' : '❌'} ${secConfig.name.padEnd(20)} Practice: ${got} / ${needed}`);
        } catch (err) {
            allPassed = false;
            console.log(`❌ ${secConfig.name} practice failed: ${err.message}`);
        }
    }

    // 4. Difficulty distribution
    console.log('\n--- DIFFICULTY DISTRIBUTION (all Infosys) ---');
    const distAgg = await Question.aggregate([
        { $match: { company: 'Infosys', active: { $ne: false } } },
        { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    distAgg.forEach(d => {
        const label = d._id === 1 ? 'Foundation' : (d._id === 2 ? 'Intermediate' : 'Advanced');
        console.log(`   Level ${d._id} (${label}): ${d.count} questions`);
    });

    // 5. Total count
    const total = await Question.countDocuments({ company: 'Infosys', active: { $ne: false } });
    console.log(`\n📊 Total active Infosys questions: ${total} / ${INFOSYS_DEVELOPMENT_TARGETS.total} target`);

    console.log('\n====================================================');
    if (allPassed) {
        console.log('✅ ALL INFOSYS VERIFICATION CHECKS PASSED!');
    } else {
        console.log('❌ SOME VERIFICATION CHECKS FAILED — see above for details.');
    }
    console.log('====================================================');

    await mongoose.connection.close();
    process.exit(allPassed ? 0 : 1);
}

runVerification().catch(err => {
    console.error('❌ Verification error:', err);
    process.exit(1);
});
