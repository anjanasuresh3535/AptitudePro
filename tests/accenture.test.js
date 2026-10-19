const assert = require('assert');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const User = require('../backend/models/User');
const Result = require('../backend/models/Result');
const CodingSubmission = require('../backend/models/CodingSubmission');
const AccentureResponse = require('../backend/models/AccentureResponse');
const placement = require('../backend/services/PlacementService');
const { ACCENTURE_SECTIONS } = require('../backend/config/accentureConfig');

async function run() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => { mongoose.connection.once('connected', resolve); setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000); });
    const runId = Date.now().toString(36);
    let user;
    try {
        const companies = {};
        for (const company of ['Accenture', 'TCS', 'Infosys', 'Wipro']) companies[company] = await Question.countDocuments({ company });
        const counts = {};
        for (const key of ['cognitive', 'technical', 'coding', 'communication', 'interview']) counts[key] = await placement.countAccentureQuestions(key);
        assert.ok(counts.cognitive >= 10, 'cognitive pool exists');
        assert.ok(counts.technical >= 10, 'technical pool exists');
        assert.ok(counts.coding >= 2, 'coding pool exists');
        assert.ok(counts.communication >= 1, 'communication pool exists');
        assert.ok(counts.interview >= 1, 'interview pool exists');

        const tech = await placement.getAccentureQuestions({ sectionKey: 'technical', count: 50 });
        assert.ok(tech.questions.every(q => q.company === 'Accenture'), 'technical company isolation');
        assert.ok(tech.questions.some(q => q.subject === 'Pseudocode' && /\n/.test(q.question)), 'multiline pseudocode available');
        assert.ok(tech.questions.some(q => q.topic === 'DBMS'), 'DBMS question available');
        assert.ok(tech.questions.some(q => q.topic === 'Computer Networks'), 'network question available');
        assert.ok(tech.questions.some(q => q.topic === 'Cloud Computing'), 'cloud question available');
        assert.ok(tech.questions.some(q => q.topic === 'Cybersecurity'), 'security question available');

        const coding = await placement.getAccentureQuestions({ sectionKey: 'coding', count: 2 });
        assert.strictEqual(coding.questions.length, 2);
        assert.ok(coding.questions.every(q => q.company === 'Accenture' && q.questionType === 'coding' && q.testCases?.length >= 2));
        const codingBank = await Question.find({ company: 'Accenture', questionType: 'coding', active: { $ne: false } }).lean();
        assert.ok(codingBank.length >= 2 && codingBank.every(q => q._id && q.problemStatement && q.supportedLanguages?.length));
        assert.ok(codingBank.every(q => q.testCases?.some(tc => !tc.isHidden) && q.testCases?.some(tc => tc.isHidden)), 'each coding problem has sample and hidden test cases');
        assert.ok(codingBank.every(q => q.supportedLanguages.every(lang => q.starterCodeByLanguage?.[lang]?.trim())), 'each supported language has a database-backed starter template');
        assert.ok(codingBank.some(q => q.problemTitle === 'Largest Row and Column Sum'));
        assert.deepStrictEqual(ACCENTURE_SECTIONS.coding.languages, ['C', 'C++', 'Java', 'Python']);
        const communication = await placement.getAccentureQuestions({ sectionKey: 'communication', count: 50 });
        assert.ok(communication.questions.every(q => q.questionType === 'free_response' && q.prompt && q.evaluationCriteria?.length));
        const interview = await placement.getAccentureQuestions({ sectionKey: 'interview', count: 50 });
        assert.ok(interview.questions.every(q => q.questionType === 'interview_prompt' && q.prompt));

        user = await User.create({ name: 'Accenture Test ' + runId, email: `accenture-test-${runId}@aptitudepro.test`, password: 'test-only-hash' });
        const first = await placement.getAccentureQuestions({ userId: user._id, sectionKey: 'cognitive', count: 10 });
        const mkAnswer = q => ({ questionId: q._id, questionText: q.question, options: { a: q.option1, b: q.option2, c: q.option3, d: q.option4 }, correctAnswer: 'A', correctAnswerText: q.option1, selectedAnswer: 'SKIPPED', isCorrect: false, isSkipped: true });
        await Result.create({ userId: user._id, company: 'Accenture', section: 'Company-accenture-cognitive', assessmentId: 'Company-accenture-cognitive', attemptId: 'test-' + runId + '-1', learningPath: 'college', placementType: 'company', testTitle: 'Test attempt 1', score: 0, totalQuestions: first.questions.length, correct: 0, wrong: 0, skipped: first.questions.length, accuracy: 0, xpEarned: 0, xpLost: 0, netXP: 0, levelBefore: 1, levelAfter: 1, xpBefore: 0, xpAfter: 0, answers: first.questions.map(mkAnswer) });
        const second = await placement.getAccentureQuestions({ userId: user._id, sectionKey: 'cognitive', count: 10 });
        const firstIds = new Set(first.questions.map(q => String(q._id)));
        assert.ok(second.questions.every(q => !firstIds.has(String(q._id))), 'recent cognitive questions avoided');
        assert.ok(second.questions.every(q => q.company === 'Accenture'), 'no cross-company leakage');

        const smallPool = await placement.getAccentureQuestions({ userId: user._id, sectionKey: 'coding', count: 100 });
        assert.strictEqual(smallPool.questions.length, counts.coding, 'small pool returns all available without hanging');
        await CodingSubmission.create({ userId: user._id, company: 'Accenture', attemptId: 'test-' + runId + '-coding', problems: smallPool.questions.map(q => ({ questionId: q._id, attempted: true })) });
        const afterExhaustion = await placement.getAccentureQuestions({ userId: user._id, sectionKey: 'coding', count: 2 });
        assert.strictEqual(afterExhaustion.questions.length, 2, 'exhausted pool safely allows reuse');

        const bad = await Question.find({ company: 'Accenture' }).lean();
        assert.ok(bad.every(q => q.company === 'Accenture' && q.question && q.answer !== undefined));
        const countsByDiff = await Question.aggregate([{ $match: { company: 'Accenture', questionType: 'coding' } }, { $group: { _id: '$difficulty', count: { $sum: 1 } } }]);
        console.log('Accenture database counts:', JSON.stringify(counts));
        console.log('Accenture coding difficulty:', JSON.stringify(countsByDiff));
        console.log('Other-company baseline counts:', JSON.stringify({ TCS: companies.TCS, Infosys: companies.Infosys, Wipro: companies.Wipro }));
        console.log('PASS: company isolation, pool metadata, pseudocode formatting, random selection, repeat prevention, exhausted-pool reuse, coding metadata and communication/interview task types');
    } finally {
        if (user) {
            await Promise.all([
                Result.deleteMany({ userId: user._id }), CodingSubmission.deleteMany({ userId: user._id }),
                AccentureResponse.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id })
            ]);
        }
        await mongoose.disconnect();
    }
}

if (require.main === module) run().catch(error => { console.error('Accenture test failed:', error); process.exit(1); });
module.exports = run;
