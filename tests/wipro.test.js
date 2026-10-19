// tests/wipro.test.js
//
// Automated test suite for the AptitudePro Wipro placement module.
// Covers: assessment configuration, question-bank integrity, section/mock
// question counts, randomization and repeat prevention, importer validation,
// coding-problem structure, writing-task structure, and an HTTP smoke test of
// the Wipro pages (including a TCS/Infosys regression check).

const assert = require('assert');
const http = require('http');

const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const CodingSubmission = require('../backend/models/CodingSubmission');
const UserStats = require('../backend/models/UserStats');
const placementService = require('../backend/services/PlacementService');
const { validateQuestionRecord, parseCSV } = require('../scripts/import-wipro-questions');
const cfg = require('../backend/config/wiproConfig');

let passedTests = 0;
let failedTests = 0;

function logPass(n, title) { passedTests++; console.log(`PASS [WIPRO ${n}] ${title}`); }
function logFail(n, title, error) {
    failedTests++;
    console.error(`FAIL [WIPRO ${n}] ${title}`);
    console.error(`      ${error && error.message ? error.message : error}`);
}

async function runWiproTests() {
    console.log('====================================================');
    console.log('WIPRO PLACEMENT MODULE TEST SUITE');
    console.log('====================================================\n');

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(r => mongoose.connection.once('connected', r));
    }

    // ---- TEST 1: Assessment configuration integrity ----
    try {
        const a = cfg.WIPRO_SECTIONS.quantitativeAptitude;
        const l = cfg.WIPRO_SECTIONS.logicalReasoning;
        const v = cfg.WIPRO_SECTIONS.verbalAbility;
        const w = cfg.WIPRO_SECTIONS.writtenCommunication;
        const c = cfg.WIPRO_SECTIONS.codingPractice;

        assert.strictEqual(a.questionCount, 16, 'Quant count');
        assert.strictEqual(l.questionCount, 14, 'Logical count');
        assert.strictEqual(v.questionCount, 20, 'Verbal count');
        assert.strictEqual(cfg.WIPRO_APTITUDE_MOCK_CONFIG.totalQuestions, 50, 'Aptitude total');
        assert.strictEqual(cfg.WIPRO_APTITUDE_MOCK_CONFIG.timeLimitSec, 2880, '48 min aptitude timer');

        // The 48 minutes is ONE combined aptitude timer, not a per-section timer.
        [a, l, v].forEach(s => assert.strictEqual(s.timeLimitSec, 2880, 'shared aptitude timer'));

        assert.strictEqual(c.questionCount, 2, 'Coding problems');
        assert.strictEqual(c.timeLimitSec, 3600, 'Coding 60 min timer');
        assert.deepStrictEqual(c.languages, ['C', 'C++', 'Java', 'Python'], 'Coding languages');

        assert.strictEqual(w.questionCount, 1, 'One writing task');
        assert.strictEqual(w.timeLimitSec, 1200, 'Writing 20 min timer');
        assert.strictEqual(w.minWords, 200, 'Min words');
        assert.strictEqual(w.maxWords, 400, 'Max words');
        assert.strictEqual(w.isWritingSection, true, 'Writing flag');

        assert.strictEqual(cfg.WIPRO_FULL_MOCK_CONFIG.totalTasks, 53, 'Full mock = 53 tasks');
        assert.strictEqual(cfg.WIPRO_FULL_MOCK_CONFIG.totalTimeLimitSec, 7680, 'Full mock = 128 min');
        assert.strictEqual(cfg.WIPRO_FULL_MOCK_CONFIG.components.length, 3, 'Three components');

        assert.strictEqual(cfg.WIPRO_ASSESSMENT_META.status, 'reported_practice_pattern');
        assert.strictEqual(cfg.WIPRO_ASSESSMENT_META.verified, false);
        // Dynamic: resolved by the execution service at render time.
        assert.ok(cfg.WIPRO_CODING_MOCK_CONFIG.executionAvailable === undefined,
            'execution availability must be resolved at runtime, not hard-coded');
        logPass(1, 'Config integrity (48 min aptitude / 60 min coding / 20 min writing / 53 tasks / 128 min, pattern marked reported)');
    } catch (err) { logFail(1, 'Assessment configuration integrity', err); }

    // ---- TEST 2: Question bank composition ----
    try {
        const total = await Question.countDocuments({ company: 'Wipro', active: { $ne: false } });
        const q = await Question.countDocuments({ company: 'Wipro', active: { $ne: false }, section: 'Maths', questionType: 'mcq' });
        const l = await Question.countDocuments({ company: 'Wipro', active: { $ne: false }, section: 'Logical', questionType: 'mcq' });
        const v = await Question.countDocuments({ company: 'Wipro', active: { $ne: false }, section: 'English', questionType: 'mcq' });
        const w = await Question.countDocuments({ company: 'Wipro', active: { $ne: false }, section: 'English', questionType: 'fill_in_blank' });
        const c = await Question.countDocuments({ company: 'Wipro', active: { $ne: false }, section: 'Programming', questionType: 'coding' });

        assert.ok(total >= 131, `expected >=131 active Wipro questions, got ${total}`);
        assert.ok(q >= 16, `quant pool too small: ${q}`);
        assert.ok(l >= 14, `logical pool too small: ${l}`);
        assert.ok(v >= 20, `verbal pool too small: ${v}`);
        assert.ok(w >= 1, 'no writing tasks');
        assert.ok(c >= 2, 'no coding problems');
        logPass(2, `Bank composition (total ${total}: quant ${q}, logical ${l}, verbal ${v}, writing ${w}, coding ${c})`);
    } catch (err) { logFail(2, 'Question bank composition', err); }

    // ---- TEST 3: MCQ data integrity ----
    try {
        const mcqs = await Question.find({ company: 'Wipro', active: { $ne: false }, questionType: 'mcq' }).lean();
        assert.ok(mcqs.length > 0, 'no MCQs found');
        for (const q of mcqs) {
            const opts = [q.option1, q.option2, q.option3, q.option4].map(o => (o || '').trim());
            assert.ok(opts.every(o => o.length > 0), `empty option in ${q._id}`);
            assert.strictEqual(new Set(opts).size, 4, `duplicate options in ${q._id}`);
            assert.ok(opts.includes((q.answer || '').trim()), `answer not among options in ${q._id}`);
            assert.ok((q.explanation || '').trim().length > 0, `missing explanation in ${q._id}`);
            assert.ok([1, 2, 3].includes(q.difficultyLevel), `bad difficulty in ${q._id}`);
            assert.ok(!/\[Wipro/i.test(q.question), `internal label leaked into question text: ${q.question}`);
        }
        logPass(3, `MCQ integrity for ${mcqs.length} questions (one correct option, distinct options, explanation present, no internal labels)`);
    } catch (err) { logFail(3, 'MCQ data integrity', err); }

    // ---- TEST 4: Section practice counts ----
    try {
        const expected = { quantitativeAptitude: 16, logicalReasoning: 14, verbalAbility: 20, writtenCommunication: 1, codingPractice: 2 };
        for (const [key, want] of Object.entries(expected)) {
            const res = await placementService.getWiproSectionPracticeQuestions(null, key);
            assert.strictEqual(res.insufficient, false, `${key} flagged insufficient`);
            assert.strictEqual(res.questions.length, want, `${key} returned ${res.questions.length}, expected ${want}`);
        }
        logPass(4, 'Section practice returns exactly 16 / 14 / 20 / 1 / 2 questions');
    } catch (err) { logFail(4, 'Section practice counts', err); }

    // ---- TEST 5: Full 50-question aptitude mock composition ----
    try {
        const mock = await placementService.getWiproAptitudeMockQuestions(null);
        assert.strictEqual(mock.insufficient, false, 'mock flagged insufficient');
        assert.strictEqual(mock.questions.length, 50, 'mock size');

        const ids = mock.questions.map(q => q._id.toString());
        assert.strictEqual(new Set(ids).size, 50, 'duplicate question inside the same attempt');

        const bySection = {};
        mock.questions.forEach(q => { bySection[q.section] = (bySection[q.section] || 0) + 1; });
        assert.strictEqual(bySection.Maths, 16, 'quant portion');
        assert.strictEqual(bySection.Logical, 14, 'logical portion');
        assert.strictEqual(bySection.English, 20, 'verbal portion');

        // No coding problems and no essay tasks may leak into the aptitude mock.
        mock.questions.forEach(q => {
            assert.strictEqual(q.questionType, 'mcq', `non-MCQ question leaked: ${q.questionType}`);
        });
        logPass(5, 'Aptitude mock = 50 unique MCQs, exact 16 / 14 / 20 split, no coding or writing leakage');
    } catch (err) { logFail(5, 'Aptitude mock composition', err); }

    // ---- TEST 6: Randomization across attempts ----
    try {
        const sets = [];
        for (let i = 0; i < 6; i++) {
            const r = await placementService.getWiproSectionPracticeQuestions(null, 'quantitativeAptitude');
            sets.push(r.questions.map(q => q._id.toString()).sort().join(','));
        }
        assert.ok(new Set(sets).size > 1, 'quantitative practice is identical on every attempt (no randomization)');
        logPass(6, 'Server-side randomization produces different question sets across attempts');
    } catch (err) { logFail(6, 'Randomization across attempts', err); }

    // ---- TEST 7: Repeat prevention against a real user history ----
    try {
        // A dedicated, brand-new user per run so the pool is never pre-exhausted.
        const freshEmail = `wipro_repeat_${Date.now()}@aptitudepro.com`;
        const tester = await User.create({
            name: 'Wipro Repeat Tester',
            email: freshEmail,
            password: 'Password123!'
        });
        await UserStats.create({ userId: tester._id, xp: 0, streak: 0, lastLogin: new Date() });

        const first = await placementService.getWiproSectionPracticeQuestions(tester._id.toString(), 'quantitativeAptitude');
        assert.strictEqual(first.questions.length, 16, 'first selection size');
        const firstIds = first.questions.map(q => q._id.toString());

        // Simulate a completed attempt by writing a Result snapshot for those questions.
        await Result.create({
            userId: tester._id,
            section: 'Company-wipro', learningPath: 'college', placementType: 'company',
            company: 'Wipro', testTitle: 'Wipro Repeat-Prevention Attempt',
            difficulty: 1, score: 16, totalQuestions: 16, correct: 16, wrong: 0, skipped: 0,
            accuracy: 100, xpEarned: 0, xpLost: 0, netXP: 0,
            levelBefore: 1, levelAfter: 1, xpBefore: 0, xpAfter: 0, timeTaken: 60,
            answers: first.questions.map(q => ({
                questionId: q._id,
                questionText: q.question,
                options: { a: q.option1, b: q.option2, c: q.option3, d: q.option4 },
                selectedAnswer: 'A', selectedAnswerText: q.option1,
                correctAnswer: 'A', correctAnswerText: q.option1,
                isCorrect: true, isSkipped: false, timeSpent: 0
            }))
        });

        const second = await placementService.getWiproSectionPracticeQuestions(tester._id.toString(), 'quantitativeAptitude');
        const secondIds = second.questions.map(q => q._id.toString());
        const overlap = secondIds.filter(id => firstIds.includes(id));
        assert.strictEqual(overlap.length, 0, `repeat avoidance failed: ${overlap.length} previously-seen questions returned`);
        assert.strictEqual(new Set(secondIds).size, 16, 'no duplicates in second attempt');

        // When the unseen pool cannot satisfy the requested count the service must
        // still return a full set (never silently fewer) and flag it.
        const huge = await placementService.getWiproQuestions({ dbSection: 'Maths', questionType: 'mcq', count: 500 });
        assert.strictEqual(huge.questions.length, 48, 'must return the whole pool rather than silently fewer');
        assert.strictEqual(huge.insufficient, true, 'exhausted pool must be flagged as insufficient');

        await User.deleteOne({ _id: tester._id });
        await Result.deleteMany({ userId: tester._id });
        logPass(7, 'Repeat prevention excludes previously attempted questions; exhaustion is flagged instead of silently shortening the paper');
    } catch (err) { logFail(7, 'Repeat prevention', err); }

    // ---- TEST 8: Writing tasks accept a free-text response ----
    try {
        const tasks = await Question.find({ company: 'Wipro', active: { $ne: false }, questionType: 'fill_in_blank' }).lean();
        assert.ok(tasks.length >= 1, 'no writing tasks');

        const forbidden = ['relevance and content', 'grammar and vocabulary', 'clarity and coherence'];
        const topics = new Set();

        for (const t of tasks) {
            assert.strictEqual(t.section, 'English', 'writing section');
            assert.ok(/200-400 words/i.test(t.question), `writing task missing 200-400 word range: ${t.question.slice(0, 60)}`);
            // Evaluation criteria must never be stored as answer options.
            [t.option1, t.option2, t.option3, t.option4].forEach(o => {
                assert.ok(!forbidden.includes((o || '').toLowerCase()), `evaluation criterion used as an option: ${o}`);
            });
            assert.ok((t.explanation || '').toLowerCase().includes('rubric'), 'writing task has no rubric');
            topics.add(t.question.split('\n')[0]);
        }

        assert.strictEqual(topics.size, tasks.length, `duplicate essay topics reused: ${tasks.length - topics.size} duplicates`);
        logPass(8, `Writing tasks accept free text, keep criteria out of options, use ${topics.size} distinct topics`);
    } catch (err) { logFail(8, 'Writing task structure', err); }

    // ---- TEST 9: Coding problem specification completeness ----
    try {
        const problems = await Question.find({ company: 'Wipro', active: { $ne: false }, questionType: 'coding' }).lean();
        assert.ok(problems.length >= 2, 'fewer than 2 coding problems');

        for (const p of problems) {
            assert.ok((p.problemTitle || '').trim().length > 0, `missing problemTitle in ${p._id}`);
            assert.ok((p.question || '').trim().length > 30, `weak statement in ${p._id}`);
            assert.ok((p.inputFormat || '').trim().length > 0, `missing inputFormat in ${p._id}`);
            assert.ok((p.outputFormat || '').trim().length > 0, `missing outputFormat in ${p._id}`);
            assert.ok((p.constraints || '').trim().length > 0, `missing constraints in ${p._id}`);
            assert.ok((p.sampleInput || '').trim().length > 0, `missing sampleInput in ${p._id}`);
            assert.ok((p.sampleOutput || '').trim().length > 0, `missing sampleOutput in ${p._id}`);
            assert.ok((p.explanation || '').trim().length > 0, `missing explanation in ${p._id}`);
            assert.deepStrictEqual([...(p.supportedLanguages || [])].sort(), ['C', 'C++', 'Java', 'Python'], 'languages');
            const cases = p.testCases || [];
            assert.ok(cases.some(c => c.isHidden === true), `no hidden test cases in ${p._id}`);
            assert.ok(cases.some(c => c.isHidden === false), `no visible sample case in ${p._id}`);
        }
        logPass(9, `Coding problems (${problems.length}) carry title, statement, I/O format, constraints, samples, explanation, languages and test cases`);
    } catch (err) { logFail(9, 'Coding problem specification', err); }

    // ---- TEST 10: Coding submission persistence ----
    try {
        const tester = await User.findOne({ email: 'wipro_tester@aptitudepro.com' });
        const problem = await Question.findOne({ company: 'Wipro', active: { $ne: false }, questionType: 'coding' });
        assert.ok(tester && problem, 'fixtures missing');

        const code = 'n = int(input())\nprint(sum(int(d) for d in str(n)))';
        const before = await CodingSubmission.countDocuments({ userId: tester._id });
        const sub = await CodingSubmission.create({
            userId: tester._id, company: 'Wipro', exam: 'Wipro_Elite_NTH',
            attemptId: 'cod_test_' + Date.now(), section: 'Company-wipro-coding',
            testTitle: 'Wipro Coding Mock Test', totalProblems: 1, attemptedProblems: 1,
            timeTaken: 120, executionAvailable: false,
            evaluationNote: 'Stored only; not executed.',
            problems: [{
                questionId: problem._id, problemTitle: problem.problemTitle,
                language: 'Python', code, attempted: true, evaluationStatus: 'not_executed'
            }]
        });
        const after = await CodingSubmission.countDocuments({ userId: tester._id });

        assert.strictEqual(after, before + 1, 'submission not stored');
        const loaded = await CodingSubmission.findById(sub._id).lean();
        assert.strictEqual(loaded.problems[0].code, code, 'code not stored verbatim');
        assert.strictEqual(loaded.problems[0].language, 'Python', 'language not stored');
        assert.strictEqual(loaded.executionAvailable, false, 'must report no execution service');

        await CodingSubmission.deleteOne({ _id: sub._id });
        logPass(10, 'Coding submissions persist code and language verbatim with an honest "not executed" status');
    } catch (err) { logFail(10, 'Coding submission persistence', err); }

    // ---- TEST 11: Importer validation, duplicate detection and CSV support ----
    try {
        const good = {
            company: 'Wipro', exam: 'Wipro_Elite_NTH', section: 'Maths', subject: 'Percentages',
            topic: 'Percentages', category: 'Quantitative Aptitude',
            question: 'Find 25% of 800.',
            option1: '100', option2: '200', option3: '300', option4: '400',
            answer: '200', explanation: '25% of 800 = 200.',
            difficultyLevel: 1, questionType: 'mcq'
        };
        const okRes = validateQuestionRecord(good, 1);
        assert.strictEqual(okRes.isValid, true, 'valid record rejected: ' + okRes.errors.join('; '));
        assert.strictEqual(okRes.doc.answer, '200', 'answer normalisation');
        assert.strictEqual(okRes.doc.company, 'Wipro', 'company isolation');
        assert.strictEqual(okRes.doc.sourceType, 'Practice Question', 'sourceType must map onto the schema enum');

        assert.strictEqual(validateQuestionRecord({ ...good, company: 'TCS' }, 2).isValid, false, 'non-Wipro record accepted');
        assert.strictEqual(validateQuestionRecord({ ...good, explanation: '' }, 3).isValid, false, 'record without explanation accepted');
        assert.strictEqual(validateQuestionRecord({ ...good, option2: '100' }, 4).isValid, false, 'duplicate-option MCQ accepted');
        assert.strictEqual(validateQuestionRecord({ ...good, answer: '999' }, 5).isValid, false, 'unmatched answer accepted');

        // camelCase coding record must be recognised as coding (not MCQ).
        const codingRec = validateQuestionRecord({
            company: 'Wipro', section: 'Programming', question: 'Print the sum of digits of N.',
            option1: 'A', option2: 'B', option3: 'C', option4: 'D', answer: 'A',
            explanation: 'Loop over digits.', questionType: 'coding',
            problemTitle: 'Sum of Digits', inputFormat: 'N', outputFormat: 'sum',
            constraints: '1<=N<=10^9', sampleInput: '1234', sampleOutput: '10',
            supportedLanguages: ['C', 'Python'],
            testCases: [{ input: '9', output: '9', isHidden: true }]
        }, 6);
        assert.strictEqual(codingRec.isValid, true, 'coding record rejected: ' + codingRec.errors.join('; '));
        assert.strictEqual(codingRec.doc.questionType, 'coding', 'camelCase questionType not honoured');
        assert.strictEqual(codingRec.doc.problemTitle, 'Sum of Digits', 'problemTitle not mapped');
        assert.strictEqual(codingRec.doc.testCases.length, 1, 'test cases not mapped');

        const rows = parseCSV('company,section,question,option1,option2,option3,option4,answer,explanation,question_type\n'
            + 'Wipro,Maths,"A, tricky question",1,2,3,4,2,Because two.,mcq\n');
        assert.strictEqual(rows.length, 1, 'CSV row count');
        assert.strictEqual(rows[0].question, 'A, tricky question', 'quoted comma mishandled');
        // parseCSV normalises headers to lowercase alphanumeric, so
        // "question_type" becomes the lookup key "questiontype".
        assert.strictEqual(rows[0].questiontype, 'mcq', 'csv header mapping');

        logPass(11, 'Importer validation, company isolation, duplicate detection, coding records and CSV parsing');
    } catch (err) { logFail(11, 'Importer validation', err); }

    // ---- TEST 12: HTTP end-to-end (navigation, rendering, regression) ----
    try {
        const envConfig = require('../backend/config/env');
        const port = envConfig.port;
        require('../frontend/app'); // boots the express app and listens
        await new Promise(r => setTimeout(r, 1500));

        let cookie = '';
        function request(method, path, body) {
            return new Promise((resolve, reject) => {
                const headers = {};
                if (cookie) headers.Cookie = cookie;
                let payload = null;
                if (body) {
                    payload = new URLSearchParams(body).toString();
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    headers['Content-Length'] = Buffer.byteLength(payload);
                }
                const req = http.request({ host: '127.0.0.1', port, method, path, headers }, res => {
                    const setCookie = res.headers['set-cookie'];
                    if (setCookie) cookie = setCookie.map(c => c.split(';')[0]).join('; ');
                    let data = '';
                    res.on('data', c => { data += c; });
                    res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location || '', body: data }));
                });
                req.on('error', reject);
                if (payload) req.write(payload);
                req.end();
            });
        }

        const email = `wipro_e2e_${Date.now()}@aptitudepro.com`;
        let res = await request('POST', '/register', {
            name: 'Wipro E2E', email, password: 'Password123!', confirm: 'Password123!'
        });
        assert.ok([302, 200].includes(res.status), `register returned ${res.status}`);

        res = await request('POST', '/login', { email, password: 'Password123!' });
        assert.strictEqual(res.status, 302, `login returned ${res.status} (auth broken?)`);

        res = await request('GET', '/placement/college/company/wipro');
        assert.strictEqual(res.status, 200, 'wipro company page status');
        ['Wipro Placement Practice', 'Wipro Assessment Preparation',
         'Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability',
         'Coding Practice', 'Written Communication', 'Full Wipro Mock',
         '53 Tasks', '128 Minutes'].forEach(marker => {
            assert.ok(res.body.includes(marker), `Wipro landing page missing: ${marker}`);
        });
        assert.ok(res.body.includes('/wipro/coding'), 'coding entry point missing');

        // Every tcs-* class used on the page must have a CSS rule, otherwise the
        // module silently falls back to unstyled raw HTML.
        const styleBlock = (res.body.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
        assert.ok(styleBlock.length > 500, 'inline stylesheet not found on the company page');

        const definedClasses = new Set();
        for (const m of styleBlock.matchAll(/\.([a-zA-Z0-9_-]+)/g)) definedClasses.add(m[1]);

        const usedClasses = new Set();
        for (const m of res.body.matchAll(/class="([^"]*)"/g)) {
            m[1].trim().split(/\s+/).forEach(c => { if (c.startsWith('tcs-')) usedClasses.add(c); });
        }

        const undefinedClasses = [...usedClasses].filter(c => !definedClasses.has(c));
        assert.deepStrictEqual(undefinedClasses, [],
            `these classes have no CSS rule and render unstyled: ${undefinedClasses.join(', ')}`);
        assert.ok(usedClasses.size >= 10, `expected a styled component set, found only ${usedClasses.size}`);

        res = await request('GET', '/quiz?learningPath=college&placementType=company&company=wipro&mode=mock-aptitude');
        assert.strictEqual(res.status, 200, 'aptitude mock status');
        assert.ok(res.body.includes('data-total-questions="50"'), 'aptitude mock is not 50 questions');
        assert.ok(res.body.includes('data-time-limit="2880"'), 'aptitude timer is not 2880s (48 min)');

        res = await request('GET', '/quiz?learningPath=college&placementType=company&company=wipro&mode=mock-writing');
        assert.strictEqual(res.status, 200, 'writing mock status');
        assert.ok(res.body.includes('writing-textarea'), 'essay editor not rendered');
        assert.ok(res.body.includes('data-time-limit="1200"'), 'writing timer is not 1200s (20 min)');
        // The essay must be a free-text editor: evaluation criteria must never
        // be rendered as selectable multiple-choice options.
        const writingCard = res.body.split('data-qtype="writing"')[1] || '';
        assert.ok(!writingCard.includes('option-letter'), 'essay question rendered selectable options');
        assert.ok(!writingCard.includes('data-value="A"'), 'essay question rendered selectable options');
        assert.ok(!res.body.includes('Relevance and Content'), 'evaluation criterion used as an answer choice');
        assert.ok(res.body.includes('Relevance to the topic'), 'rubric not shown for self-review');
        assert.ok(res.body.includes('data-wc-min="200"'), 'word range not supplied to the editor');

        logPass(12, 'HTTP: Wipro landing page, 50-question aptitude mock (48 min) and 20-minute writing mock with essay editor render correctly');
    } catch (err) { logFail(12, 'HTTP end-to-end (part 1)', err); }

    // ---- TEST 13: Coding page, hidden-case safety and attempt stability ----
    try {
        const envConfig = require('../backend/config/env');
        let cookie = '';
        function request(method, path) {
            return new Promise((resolve, reject) => {
                const headers = cookie ? { Cookie: cookie } : {};
                const req = http.request({ host: '127.0.0.1', port: envConfig.port, method, path, headers }, res => {
                    const sc = res.headers['set-cookie'];
                    if (sc) cookie = sc.map(c => c.split(';')[0]).join('; ');
                    let data = '';
                    res.on('data', c => { data += c; });
                    res.on('end', () => resolve({ status: res.statusCode, body: data }));
                });
                req.on('error', reject);
                req.end();
            });
        }

        // Log in as the test user created in test 12 (re-register if the run is fresh).
        const users = await User.find({ email: /wipro_e2e_/ }).sort({ createdAt: -1 }).limit(1);
        if (!users.length) throw new Error('no e2e user available');
        const email = users[0].email;
        await request('POST', '/login');
        // login needs a body, so do it explicitly:
        await new Promise((resolve, reject) => {
            const payload = new URLSearchParams({ email, password: 'Password123!' }).toString();
            const req = http.request({
                host: '127.0.0.1', port: envConfig.port, method: 'POST', path: '/login',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload), ...(cookie ? { Cookie: cookie } : {}) }
            }, res => {
                const sc = res.headers['set-cookie'];
                if (sc) cookie = sc.map(c => c.split(';')[0]).join('; ');
                res.resume();
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });

        let res = await request('GET', '/wipro/coding');
        assert.strictEqual(res.status, 200, 'coding page status');
        assert.ok(res.body.includes('code-editor'), 'code editor not rendered');
        ['C', 'C++', 'Java', 'Python'].forEach(l => {
            assert.ok(res.body.includes(`data-lang="${l}"`), `language missing: ${l}`);
        });
        ['Problem Statement', 'Input Format', 'Output Format', 'Constraints', 'Sample Input', 'Sample Output']
            .forEach(marker => assert.ok(res.body.includes(marker), `coding page missing section: ${marker}`));
        assert.ok(res.body.includes('data-time-limit="3600"') || res.body.includes('data-limit="3600"'), 'coding timer is not 3600s (60 min)');

        // Precise check: the server-side projection must drop every hidden test case.
        // (A raw substring probe on the HTML is unreliable because short values
        // such as "100" also occur in CSS such as `height:100vh`.)
        const toPublicProblem = require('../backend/routes/wiproCoding').toPublicProblem;
        const codingDocs = await Question.find({ company: 'Wipro', questionType: 'coding' }).lean();
        codingDocs.forEach(p => {
            const pub = toPublicProblem(p);
            const hidden = (p.testCases || []).filter(tc => tc.isHidden);
            assert.ok(hidden.length > 0, `${p.problemTitle} has no hidden cases to protect`);

            // The projection must not carry the test-case array at all, and every
            // projected sample must be a genuinely visible case (identity match
            // on both input and output). Substring checks are deliberately not
            // used here: a sample input can legitimately contain the same
            // characters as a hidden case, which produces false positives.
            assert.ok(!('testCases' in pub), `${p.problemTitle} projection leaks the testCases array`);
            assert.strictEqual(typeof pub.hiddenCaseCount, 'number', `${p.problemTitle} hiddenCaseCount is not a number`);
            assert.ok(pub.hiddenCaseCount >= 1, `${p.problemTitle} hidden case count not reported`);

            (pub.samples || []).forEach(s => {
                const isVisible = (p.testCases || []).some(tc =>
                    !tc.isHidden && tc.output === s.output && tc.input === s.input);
                assert.ok(isVisible, `projected sample is not a visible test case in ${p.problemTitle}`);
            });

            // The number of projected samples must equal the number of visible cases.
            const visibleCount = (p.testCases || []).filter(tc => !tc.isHidden).length;
            assert.strictEqual((pub.samples || []).length, visibleCount,
                `${p.problemTitle} projected a different number of samples than there are visible cases`);
        });

        // And nothing hidden should be serialised into the rendered page either
        // (checked with a distinctive multi-character token to avoid CSS noise).
        let res2 = res;
        assert.ok(!/isHidden.*true/i.test(res2.body), 'hidden flag rendered to the browser');

        // Attempt must survive a refresh with the same question set.
        const firstSet = (res.body.match(/data-qid="([a-f0-9]{24})"/g) || []).join(',');
        assert.ok(firstSet.length > 0, 'no question ids rendered on the coding page');
        res = await request('GET', '/wipro/coding');
        const secondSet = (res.body.match(/data-qid="([a-f0-9]{24})"/g) || []).join(',');
        assert.strictEqual(firstSet, secondSet, 'coding question set changed on refresh');

        // Regression: TCS / Infosys / full company list
        res = await request('GET', '/placement/company-list-check'); // placeholder to keep cookie alive
        res = await request('GET', '/placement/college/company/tcs');
        assert.strictEqual(res.status, 200, 'TCS company page broken');
        assert.ok(res.body.includes('TCS'), 'TCS page content missing');

        res = await request('GET', '/placement/college/company/infosys');
        assert.strictEqual(res.status, 200, 'Infosys company page broken');
        assert.ok(res.body.includes('Infosys'), 'Infosys page content missing');

        res = await request('GET', '/placement/college/company');
        assert.strictEqual(res.status, 200, 'company list broken');
        ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini', 'HCLTech', 'Tech Mahindra', 'IBM']
            .forEach(c => assert.ok(res.body.includes(c), `company card missing: ${c}`));

        // No company page may fall back to unstyled raw HTML: every tcs-*
        // component class in the markup must have a CSS rule.
        for (const slug of ['wipro', 'tcs', 'infosys']) {
            const p = await request('GET', `/placement/college/company/${slug}`);
            assert.strictEqual(p.status, 200, `${slug} company page status`);
            const st = (p.body.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
            const def = new Set([...st.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(x => x[1]));
            const us = new Set();
            for (const m of p.body.matchAll(/class="([^"]*)"/g)) {
                m[1].trim().split(/\s+/).forEach(c => { if (c.startsWith('tcs-')) us.add(c); });
            }
            const missing = [...us].filter(c => !def.has(c));
            assert.deepStrictEqual(missing, [], `${slug} has unstyled component classes: ${missing.join(', ')}`);
        }

        logPass(13, 'HTTP: coding page renders with languages, spec sections and a 60-minute timer; hidden test cases stay server-side; refresh keeps the same problem set; Wipro/TCS/Infosys pages are fully styled');
    } catch (err) { logFail(13, 'HTTP end-to-end (coding + regression)', err); }

    // ---- TEST 14: Result + XP integration (awarded once per completed attempt) ----
    try {
        const tester = await User.findOne({ email: 'wipro_tester@aptitudepro.com' });
        const UserStats = mongoose.model('UserStats');
        const XPHistory = mongoose.model('XPHistory');
        const quizRouter = require('../backend/routes/quiz');

        const questionDocs = await Question.find({ company: 'Wipro', active: { $ne: false }, questionType: 'mcq' }).limit(5);
        assert.ok(questionDocs.length === 5, 'need 5 Wipro MCQs for the probe');

        const before = await UserStats.findOne({ userId: tester._id }).lean();
        assert.ok(before, 'tester has no UserStats document');

        // Seed a known XP balance so the XP delta is always observable.
        const SEED_XP = 500;
        await UserStats.updateOne({ userId: tester._id }, { $set: { xp: SEED_XP } });
        const xpBefore = SEED_XP;
        const historyBefore = await XPHistory.countDocuments({ userId: tester._id });

        const resultId = await quizRouter.performQuizSubmission({
            userId: tester._id.toString(),
            section: 'Mixed',
            learningPath: 'college',
            placementType: 'company',
            company: 'Wipro',
            testTitle: 'Wipro XP Probe',
            parsedQuestionIds: questionDocs.map(q => q._id.toString()),
            parsedSelectedOptions: questionDocs.map(() => 'A'),
            parsedEssayTexts: [],
            timeTaken: 30,
            shuffledOptions: null
        }, null);

        assert.ok(resultId, 'no result id returned');

        const after = await UserStats.findOne({ userId: tester._id }).lean();
        const historyAfter = await XPHistory.countDocuments({ userId: tester._id });
        const stored = await Result.findById(resultId).lean();

        assert.ok(after && after.xp !== xpBefore, 'XP was not updated by the completed attempt');
        assert.strictEqual(historyAfter, historyBefore + 1, 'exactly one XPHistory entry per completed attempt');
        assert.strictEqual(stored.company, 'Wipro', 'company not stored on result');
        assert.strictEqual(stored.totalQuestions, 5, 'totalQuestions not stored');
        assert.strictEqual(stored.answers.length, 5, 'answer snapshots not stored');
        assert.strictEqual(stored.testDate instanceof Date, true, 'attempt date missing');

        logPass(14, 'Result + XP stored once per completed attempt (one XPHistory entry, level/XP updated)');
    } catch (err) { logFail(14, 'Result and XP integration', err); }

    // ---- TEST 15: Writing essay is persisted with the result ----
    try {
        const tester = await User.findOne({ email: 'wipro_tester@aptitudepro.com' });
        const quizRouter = require('../backend/routes/quiz');
        const task = await Question.findOne({ company: 'Wipro', active: { $ne: false }, questionType: 'fill_in_blank' });

        const essay = 'Technology has changed the way we work and learn. It saves time and improves access, '
            + 'but it also creates new challenges that society must manage carefully. In conclusion, '
            + 'a balanced approach is needed for a sustainable future.';

        const resultId = await quizRouter.performQuizSubmission({
            userId: tester._id.toString(),
            section: 'English',
            learningPath: 'college',
            placementType: 'company',
            company: 'Wipro',
            testTitle: 'Wipro Writing Probe',
            parsedQuestionIds: [task._id.toString()],
            parsedSelectedOptions: ['WRITING_SUBMITTED'],
            parsedEssayTexts: [essay],
            timeTaken: 300,
            shuffledOptions: null
        }, null);

        const stored = await Result.findById(resultId).lean();
        assert.strictEqual(stored.answers.length, 1, 'writing result not stored');
        assert.strictEqual(stored.answers[0].selectedAnswer, 'WRITING_SUBMITTED', 'writing marker missing');
        assert.strictEqual(stored.answers[0].selectedAnswerText, essay, 'essay text not persisted');
        logPass(15, 'Written responses are stored verbatim alongside the result for later review');
    } catch (err) { logFail(15, 'Writing essay persistence', err); }

    // ---- TEST 16: Legacy bank is deactivated, not deleted ----
    try {
        const totalDocs = await Question.countDocuments({ company: 'Wipro' });
        const activeDocs = await Question.countDocuments({ company: 'Wipro', active: { $ne: false } });
        assert.ok(totalDocs > activeDocs, 'legacy questions appear to have been deleted rather than deactivated');
        assert.ok(activeDocs >= 150, `expected at least 150 active Wipro questions, found ${activeDocs}`);
        assert.strictEqual(activeDocs, 235, `expected 235 active Wipro questions matching TEST 2 bank composition, found ${activeDocs}`);
        logPass(16, `Legacy bank preserved but deactivated (${totalDocs} documents stored, ${activeDocs} active)`);
    } catch (err) { logFail(16, 'Legacy bank handling', err); }

    console.log('\n====================================================');
    console.log(`WIPRO TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
    console.log('====================================================\n');

    return { passedTests, failedTests };
}

// Allow both `node tests/wipro.test.js` and `require()` from the master runner.
if (require.main === module) {
    runWiproTests()
        .then(res => process.exit(res.failedTests > 0 ? 1 : 0))
        .catch(err => { console.error('Fatal error in Wipro test suite:', err); process.exit(1); });
}

module.exports = runWiproTests;