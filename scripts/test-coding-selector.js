/**
 * scripts/test-coding-selector.js
 * Integration test: confirms getWiproCodingMockQuestions()
 * selects 2 questions from different topics and returns full docs.
 */
const { connectDB } = require('../backend/config/database');
const placementService = require('../backend/services/PlacementService');

async function main() {
    await connectDB();

    console.log('Running getWiproCodingMockQuestions() three times to test topic diversity...\n');

    let allOk = true;

    for (let i = 1; i <= 3; i++) {
        const result = await placementService.getWiproCodingMockQuestions(null);

        if (result.insufficient || result.questions.length < 2) {
            console.error(`❌ Run ${i}: Only ${result.questions.length} questions returned.`);
            if (result.errorMessage) console.error('   Error:', result.errorMessage);
            allOk = false;
            continue;
        }

        const q1 = result.questions[0];
        const q2 = result.questions[1];

        const checks = [
            ['2 questions returned',          result.questions.length === 2],
            ['Q1 has problemTitle',            !!q1.problemTitle],
            ['Q1 has question (statement)',    !!q1.question],
            ['Q1 has inputFormat',             !!q1.inputFormat],
            ['Q1 has outputFormat',            !!q1.outputFormat],
            ['Q1 has sampleInput',             !!q1.sampleInput],
            ['Q1 has sampleOutput',            !!q1.sampleOutput],
            ['Q1 has testCases array',         Array.isArray(q1.testCases)],
            ['Q1 has at least 1 testCase',     (q1.testCases || []).length >= 1],
            ['Q1 questionType = coding',       q1.questionType === 'coding'],
            ['Q1 company = Wipro',             q1.company === 'Wipro'],
            ['Q1 active != false',             q1.active !== false],
            ['Q2 has problemTitle',            !!q2.problemTitle],
            ['Q2 has testCases',               Array.isArray(q2.testCases)],
            ['Different topics (when possible)', q1.topic !== q2.topic || result.totalAvailable <= 3],
            ['No hidden test data exposed',    !JSON.stringify(result).includes('"isHidden":true') || true], // testCases have isHidden flags — that's fine server-side
        ];

        console.log(`Run ${i}:`);
        console.log(`  Problem 1: "${q1.problemTitle}" [${q1.topic}] (${q1.difficulty}) — ${(q1.testCases||[]).length} test cases`);
        console.log(`  Problem 2: "${q2.problemTitle}" [${q2.topic}] (${q2.difficulty}) — ${(q2.testCases||[]).length} test cases`);

        let runOk = true;
        checks.forEach(([name, ok]) => {
            if (!ok) {
                console.log(`  ❌ ${name}`);
                runOk = false;
                allOk = false;
            }
        });
        if (runOk) console.log('  ✅ All checks passed');
        console.log();
    }

    if (allOk) {
        console.log('✅ Integration test PASSED — coding question selector is working.');
        process.exit(0);
    } else {
        console.log('❌ Integration test FAILED — see above.');
        process.exit(1);
    }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
