const assert = require('assert');
const bcrypt = require('bcryptjs');
const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const CodingSubmission = require('../backend/models/CodingSubmission');
const SectionProgress = require('../backend/models/SectionProgress');
const UserStats = require('../backend/models/UserStats');
const XPHistory = require('../backend/models/XPHistory');
const { HCLTECH_SECTIONS, HCLTECH_ASSESSMENT } = require('../backend/config/hcltechConfig');
const { records, codingProblems } = require('../scripts/seed-hcltech');

async function run() {
    let user;
    try {
        for (const [key, cfg] of Object.entries(HCLTECH_SECTIONS)) {
            if (key === 'coding') continue;
            assert.strictEqual(records.filter(record => record.category === cfg.category).length, cfg.targetCount, `${key} seed meets configured target`);
        }
        assert.strictEqual(records.length, HCLTECH_ASSESSMENT.objectiveQuestions);
        assert.strictEqual(codingProblems.length, HCLTECH_SECTIONS.coding.targetCount);
        assert.strictEqual(HCLTECH_ASSESSMENT.objectiveQuestions + codingProblems.length, HCLTECH_ASSESSMENT.totalItems);
        for (const question of records) {
            const options = [question.option1, question.option2, question.option3, question.option4];
            assert.strictEqual(new Set(options).size, 4, `options are distinct: ${question.question}`);
            assert.ok(options.includes(question.answer), `answer key matches an option: ${question.question}`);
        }

        await connectDB();
        if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000);
            mongoose.connection.once('connected', () => { clearTimeout(timeout); resolve(); });
            mongoose.connection.once('error', error => { clearTimeout(timeout); reject(error); });
        });
        const counts = await Promise.all(Object.keys(HCLTECH_SECTIONS).map(key => require('../backend/services/PlacementService').countHCLTechQuestions(key)));
        assert.deepStrictEqual(counts, [15, 15, 15, 30, 2], 'live HCLTech bank has all configured section sizes');
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`, password = 'HCLTechTest123!';
        user = await User.create({ name: 'HCLTech E2E', email: `hcltech-e2e-${suffix}@aptitudepro.test`, password: await bcrypt.hash(password, 4) });
        require('../frontend/app');
        const base = () => `http://127.0.0.1:${config.port}`;
        let health;
        for (let index = 0; index < 40; index++) { try { health = await fetch(`${base()}/health`); if (health.ok) break; } catch (_) {} await new Promise(resolve => setTimeout(resolve, 250)); }
        assert.ok(health?.ok, 'application starts');
        const login = await fetch(`${base()}/login`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: user.email, password }) });
        const cookie = login.headers.get('set-cookie')?.split(';')[0];
        assert.ok(cookie, 'authenticated session is created');
        const page = async path => { const response = await fetch(`${base()}${path}`, { headers: { cookie } }); return { response, html: await response.text() }; };
        const directory = await page('/placement/college/company');
        assert.ok(directory.html.includes('HCLTech') && /<strong>77<\/strong> practice items/.test(directory.html), `HCLTech company card shows the live item count: ${directory.html.match(/<a href="\/placement\/college\/company\/hcltech"[\s\S]*?<\/a>/)?.[0] || 'HCLTech tile snippet not found'}`);
        const dashboard = await page('/placement/college/company/hcltech');
        assert.strictEqual(dashboard.response.status, 200);
        assert.ok(dashboard.html.includes('HCLTech Placement Practice') && /<strong>95<\/strong> total configured minutes/.test(dashboard.html) && dashboard.html.includes('no negative marking'), 'HCLTech dashboard shows configured assessment overview');
        for (const key of ['quantitative', 'verbal', 'logical', 'computer']) {
            const quiz = await page(`/quiz?learningPath=college&placementType=company&company=hcltech&mode=hcltech&sectionKey=${key}`);
            assert.strictEqual(quiz.response.status, 200, `${key} assessment renders`);
            const ids = JSON.parse(quiz.html.match(/data-question-ids='([^']+)'/)?.[1] || '[]');
            assert.strictEqual(ids.length, HCLTECH_SECTIONS[key].targetCount, `${key} renders the target count`);
            assert.ok(quiz.html.includes('data-negative-marking="false"') && quiz.html.includes('Mark for review'), `${key} uses no-negative-marking and review controls`);
            assert.ok(!quiz.html.includes('data-correct='), `${key} does not expose answer keys`);
            if (key === 'quantitative') {
                const submission = await fetch(`${base()}/quiz/submit-quiz`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ section: 'Maths', learningPath: 'college', placementType: 'company', company: 'HCLTech', testTitle: 'HCLTech Quantitative / Numerical Ability', questionIds: JSON.stringify(ids), selectedOptions: JSON.stringify(Array(ids.length).fill('SKIPPED')), timeTaken: '10', essayTexts: '[]' }) });
                assert.strictEqual(submission.status, 302, 'objective assessment saves through shared scoring');
                const savedResult = await Result.findOne({ userId: user._id, company: 'HCLTech', assessmentId: 'Company-hcltech-quantitative' }).lean();
                assert.ok(savedResult && savedResult.totalQuestions === 15 && savedResult.skipped === 15 && savedResult.xpLost === 0, 'result persists with the correct count and no skip penalty');
                const review = await page(submission.headers.get('location'));
                assert.strictEqual(review.response.status, 200, 'saved assessment review opens after submission');
            }
        }
        const codingPage = await page('/hcltech/coding');
        assert.strictEqual(codingPage.response.status, 200, 'coding round renders');
        assert.ok(codingPage.html.includes('Longest Increasing Run') && codingPage.html.includes('Balanced Brackets') && codingPage.html.includes('20 minutes'), 'coding round includes both configured problems and time limit');
        assert.ok(!codingPage.html.includes('([)]') && !codingPage.html.includes('isHidden'), 'hidden coding inputs and keys are not exposed');
        const attemptId = codingPage.html.match(/attempt='([^']+)'/)?.[1], problemId = codingPage.html.match(/class="qid" value="([a-f\d]{24})"/)?.[1];
        assert.ok(attemptId && problemId, 'coding round has session and problem IDs');
        const savedDraft = await fetch(`${base()}/hcltech/coding/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId, questionId: problemId, language: 'Python', code: 'print(1)' }) });
        assert.ok(savedDraft.ok && (await savedDraft.json()).ok, 'coding draft saves for its owner');
        console.log('PASS: HCLTech question-bank checks, dashboard, four fixed-timed objective sections, server-scored no-negative-marking result, coding session and draft persistence');
    } finally {
        if (user) {
            await Promise.all([Result.deleteMany({ userId: user._id, company: 'HCLTech' }), CodingSubmission.deleteMany({ userId: user._id, company: 'HCLTech' }), SectionProgress.deleteMany({ userId: user._id, section: /^Company-hcltech-/ }), XPHistory.deleteMany({ userId: user._id }), UserStats.deleteOne({ userId: user._id }), User.deleteOne({ _id: user._id })]);
        }
        mongoose.connection.removeAllListeners('disconnected');
        await mongoose.disconnect();
    }
}

run().then(() => process.exit(0)).catch(error => { console.error('HCLTech test failed:', error); process.exit(1); });
