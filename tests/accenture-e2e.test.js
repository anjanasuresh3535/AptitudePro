// Keep the general Accenture HTTP flow deterministic; Judge0 has its own
// isolated integration smoke test using a harmless sample program.
process.env.ACCENTURE_CODING_BACKEND = 'docker';

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const env = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const Result = require('../backend/models/Result');
const XPHistory = require('../backend/models/XPHistory');
const CodingSubmission = require('../backend/models/CodingSubmission');
const AccentureResponse = require('../backend/models/AccentureResponse');
const SectionProgress = require('../backend/models/SectionProgress');
const Question = require('../backend/models/Question');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function request(port, jar, method, path, body, json = false) {
    return new Promise((resolve, reject) => {
        const headers = {};
        if (jar.cookie) headers.Cookie = jar.cookie;
        let payload = null;
        if (body) {
            payload = json ? JSON.stringify(body) : new URLSearchParams(body).toString();
            headers['Content-Type'] = json ? 'application/json' : 'application/x-www-form-urlencoded';
            headers['Content-Length'] = Buffer.byteLength(payload);
        }
        const req = http.request({ host: '127.0.0.1', port, method, path, headers }, res => {
            const cookies = res.headers['set-cookie'];
            if (cookies) jar.cookie = cookies.map(c => c.split(';')[0]).join('; ');
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location || '', headers: res.headers, body: data, json: () => JSON.parse(data) }));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}
function extractQuiz(html) {
    const form = html.match(/data-question-ids='([^']*)'/);
    const ids = form ? JSON.parse(form[1]) : [];
    const answers = [...html.matchAll(/data-correct="([A-D])"/g)].map(m => m[1]);
    return { ids, answers };
}

async function run() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await new Promise(resolve => mongoose.connection.once('connected', resolve));
    const tag = Date.now().toString(36);
    const password = 'AccentTest123!';
    const users = [];
    try {
        const hash = await bcrypt.hash(password, 4);
        const first = await User.create({ name: 'Accenture E2E ' + tag, email: `accenture-e2e-${tag}@aptitudepro.test`, password: hash });
        const second = await User.create({ name: 'Accenture E2E Other ' + tag, email: `accenture-other-${tag}@aptitudepro.test`, password: hash });
        users.push(first._id, second._id);
        require('../frontend/app');
        const port = env.port;
        let healthy = false;
        for (let i = 0; i < 30; i++) { try { if ((await request(port, {}, 'GET', '/health')).status === 200) { healthy = true; break; } } catch (_) {} await sleep(300); }
        assert.ok(healthy, 'application starts and health route responds');
        const jar = {}, otherJar = {};
        assert.strictEqual((await request(port, {}, 'GET', '/accenture/coding')).status, 302, 'unauthenticated coding page redirects');
        let res = await request(port, jar, 'POST', '/login', { email: `accenture-e2e-${tag}@aptitudepro.test`, password });
        assert.strictEqual(res.status, 302, 'test user login');
        res = await request(port, otherJar, 'POST', '/login', { email: `accenture-other-${tag}@aptitudepro.test`, password });
        assert.strictEqual(res.status, 302, 'second user login');

        res = await request(port, jar, 'GET', '/placement/college/company');
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('Practice Accenture Patterns'));
        res = await request(port, jar, 'GET', '/placement/college/company/accenture');
        assert.strictEqual(res.status, 200); ['Cognitive Assessment', 'Technical Assessment', 'Coding Assessment', 'Communication Assessment', 'Interview Preparation'].forEach(label => assert.ok(res.body.includes(label)));
        assert.ok(res.body.includes('<strong>200</strong> questions in bank') && /<strong>20<\/strong> per practice session/.test(res.body), 'dashboard shows the expanded cognitive bank and session size');
        ['60','8'].forEach(count => assert.ok(res.body.includes(count), `dashboard includes database count ${count}`));
        for (const slug of ['tcs', 'infosys', 'wipro']) {
            const page = await request(port, jar, 'GET', `/placement/college/company/${slug}`);
            assert.strictEqual(page.status, 200, `${slug} dashboard opens`);
        }
        for (const slug of ['tcs', 'infosys', 'wipro']) {
            const quiz = await request(port, jar, 'GET', `/quiz?learningPath=college&placementType=company&company=${slug}&difficulty=1`);
            assert.strictEqual(quiz.status, 200, `${slug} questions load`);
            assert.ok(extractQuiz(quiz.body).ids.length > 0, `${slug} practice has questions`);
        }
        const wiproCoding = await request(port, jar, 'GET', '/wipro/coding');
        assert.strictEqual(wiproCoding.status, 200); assert.ok(wiproCoding.body.includes('cmEditorHost'), 'Wipro coding editor view still renders');

        const cognitivePath = '/quiz?learningPath=college&placementType=company&company=accenture&mode=accenture&sectionKey=cognitive';
        res = await request(port, jar, 'GET', cognitivePath);
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('data-total-questions="20"'));
        let selected = extractQuiz(res.body); assert.strictEqual(selected.ids.length, 20);
        res = await request(port, jar, 'POST', '/quiz/submit-quiz', { section: 'Mixed', learningPath: 'college', placementType: 'company', company: 'Accenture', testTitle: 'Accenture Cognitive Assessment', questionIds: JSON.stringify(selected.ids), selectedOptions: JSON.stringify(selected.answers), timeTaken: '42', essayTexts: '[]' });
        assert.strictEqual(res.status, 302, 'cognitive assessment submits');
        const resultPath = res.location; assert.ok(resultPath.startsWith('/results/'));
        const objectiveResult = await Result.findOne({ userId: first._id, company: 'Accenture', testTitle: 'Accenture Cognitive Assessment' }).lean();
        assert.ok(objectiveResult && objectiveResult.assessmentId === 'Company-accenture-cognitive' && objectiveResult.attemptId);
        const xpAfter = (await UserStats.findOne({ userId: first._id }).lean())?.xp || 0;
        assert.strictEqual((await request(port, jar, 'GET', resultPath)).status, 200);
        await request(port, jar, 'GET', resultPath);
        assert.strictEqual((await UserStats.findOne({ userId: first._id }).lean()).xp, xpAfter, 'result refresh does not award XP again');
        const xpEntries = await XPHistory.countDocuments({ userId: first._id, resultId: objectiveResult._id });
        assert.ok(xpEntries <= 1, 'one XP history entry per quiz result');
        assert.strictEqual((await request(port, otherJar, 'GET', resultPath)).status, 404, 'other user cannot access result');

        res = await request(port, jar, 'GET', cognitivePath); selected = extractQuiz(res.body); assert.strictEqual(selected.ids.length, 20);
        const priorIds = new Set(objectiveResult.answers.map(a => String(a.questionId)));
        assert.ok(selected.ids.every(id => !priorIds.has(id)), 'second cognitive attempt excludes recently seen questions');

        const technicalPath = '/quiz?learningPath=college&placementType=company&company=accenture&mode=accenture&sectionKey=technical';
        res = await request(port, jar, 'GET', technicalPath);
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('data-total-questions="20"')); assert.ok(res.body.includes('Pseudocode') || res.body.includes('SET total'));
        assert.ok(res.body.includes('code-block-body'), 'pseudocode renders as a formatted code block');
        const firstTechnical = extractQuiz(res.body); assert.strictEqual(firstTechnical.ids.length, 20);
        res = await request(port, jar, 'POST', '/quiz/submit-quiz', { section: 'Mixed', learningPath: 'college', placementType: 'company', company: 'Accenture', testTitle: 'Accenture Technical Assessment', questionIds: JSON.stringify(firstTechnical.ids), selectedOptions: JSON.stringify(firstTechnical.answers), timeTaken: '42', essayTexts: '[]' });
        assert.strictEqual(res.status, 302, 'technical assessment submits');
        res = await request(port, jar, 'GET', technicalPath);
        const nextTechnical = extractQuiz(res.body), firstTechnicalIds = new Set(firstTechnical.ids);
        assert.strictEqual(nextTechnical.ids.length, 20); assert.ok(nextTechnical.ids.every(id => !firstTechnicalIds.has(id)), 'a new technical session selects unseen questions');

        res = await request(port, jar, 'GET', '/accenture/coding');
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('Run Code') && res.body.includes('Submit Code')); assert.ok(res.body.includes('Load Starter') && res.body.includes('saved drafts restore automatically'), 'blank editor offers starter templates and preserves saved drafts');
        const cspNonce = res.headers['content-security-policy']?.match(/nonce-([^';]+)/)?.[1];
        assert.ok(cspNonce && res.body.includes(`nonce="${cspNonce}"`), 'the assessment script is permitted by a per-response CSP nonce');
        for (const language of ['C', 'C++', 'Java', 'Python']) assert.ok(res.body.includes(`>${language}</option>`));
        assert.ok(!res.body.includes('hiddenCaseCount') && !res.body.includes('sandbox path'));
        const qids = [...res.body.matchAll(/class="qid" value="([a-f\d]{24})"/gi)].map(m => m[1]); assert.strictEqual(qids.length, 2, 'two problems are loaded for the coding attempt');
        const codingAttemptId = res.body.match(/attempt='(cod_[^']+)'/)?.[1]; assert.ok(codingAttemptId, 'attempt ID is present in the assessment');
        const taskTitles = await Question.find({ _id: { $in: qids } }).select('company problemTitle').lean();
        assert.strictEqual(taskTitles.length, 2); assert.ok(taskTitles.every(q => q.company === 'Accenture' && q.problemTitle));
        const saveCode = '# problem-two-draft';
        const draftSaved = await request(port, jar, 'POST', '/accenture/coding/draft', { attemptId: codingAttemptId, questionId: qids[1], language: 'Python', code: saveCode }, true);
        assert.strictEqual(draftSaved.status, 200); assert.ok(draftSaved.json().ok);
        const foreignDraft = await request(port, otherJar, 'POST', '/accenture/coding/draft', { attemptId: codingAttemptId, questionId: qids[1], language: 'Python', code: 'private' }, true);
        assert.strictEqual(foreignDraft.status, 400, 'another user cannot save into this coding attempt');
        res = await request(port, jar, 'GET', '/accenture/coding');
        assert.ok(res.body.includes(saveCode) && res.body.includes('"currentProblem":1'), 'problem 2 and its server-side code state survive refresh');
        const run = await request(port, jar, 'POST', '/accenture/coding/run', { attemptId: codingAttemptId, questionId: qids[1], language: 'Python', code: saveCode }, true);
        assert.strictEqual(run.status, 200); assert.ok(run.json().ok); assert.ok(Array.isArray(run.json().outputs)); if (run.json().status === 'not_executed') assert.ok(run.json().message.includes('Your saved draft is safe'), 'execution unavailable response confirms drafts are safe');
        const codingPage = await request(port, jar, 'GET', '/accenture/coding');
        const ids = [...codingPage.body.matchAll(/class="qid" value="([a-f\d]{24})"/gi)].map(m => m[1]);
        const submissions = ids.map(id => ({ questionId: id, language: 'Python', code: id === qids[1] ? saveCode : '' }));
        const submitted = await request(port, jar, 'POST', '/accenture/coding/submit', { attemptId: codingAttemptId, submissions }, true);
        assert.strictEqual(submitted.status, 200); assert.ok(submitted.json().ok);
        const duplicateCodingSubmit = await request(port, jar, 'POST', '/accenture/coding/submit', { attemptId: codingAttemptId, submissions }, true);
        assert.strictEqual(duplicateCodingSubmit.status, 200); assert.strictEqual(duplicateCodingSubmit.json().redirect, submitted.json().redirect, 'repeated submit resolves to the same saved result');
        assert.strictEqual((await request(port, jar, 'GET', submitted.json().redirect)).status, 200, 'coding result is viewable');
        const codingResult = await CodingSubmission.findOne({ userId: first._id, company: 'Accenture' }).lean();
        assert.ok(codingResult && codingResult.resultId);
        const sharedCodingResult = await Result.findById(codingResult.resultId).lean();
        assert.strictEqual(sharedCodingResult.evaluationStatus, 'execution-unavailable');
        const sharedResultPage = await request(port, jar, 'GET', `/results/${codingResult.resultId}`);
        assert.ok(sharedResultPage.body.includes('Not evaluated') && sharedResultPage.body.includes('no score was assigned'));
        assert.ok(!/class="val"[^>]*>\s*0\s*\/\s*2\s*<\/div>/.test(sharedResultPage.body), 'unexecuted code is not presented as a zero score');
        assert.strictEqual((await request(port, otherJar, 'GET', submitted.json().redirect)).status, 404, 'coding result is owner protected');
        const xpAfterCoding = (await UserStats.findOne({ userId: first._id }).lean()).xp;
        await request(port, jar, 'GET', submitted.json().redirect);
        assert.strictEqual((await UserStats.findOne({ userId: first._id }).lean()).xp, xpAfterCoding, 'coding result refresh does not re-award XP');

        res = await request(port, jar, 'GET', '/accenture/communication/task');
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('YOUR RESPONSE') && res.body.includes('<textarea'));
        const attemptId = res.body.match(/attemptId:'(acc_[^']+)'/)?.[1]; assert.ok(attemptId);
        const draftText = 'Hello team, I will complete the review by Friday and share the status.';
        let response = await request(port, jar, 'POST', '/accenture/response/draft', { attemptId, responseText: draftText, submit: 'false' }, true);
        assert.strictEqual(response.status, 200); assert.ok(response.json().ok);
        res = await request(port, jar, 'GET', '/accenture/communication/task'); assert.ok(res.body.includes(draftText), 'draft survives page refresh');
        response = await request(port, jar, 'POST', '/accenture/response/draft', { attemptId, responseText: draftText, submit: 'true' }, true);
        assert.strictEqual(response.status, 200); assert.ok(response.json().submitted);
        const responsePath = '/accenture/submission/' + response.json().id;
        assert.strictEqual((await request(port, jar, 'GET', responsePath)).status, 200);
        assert.strictEqual((await request(port, otherJar, 'GET', responsePath)).status, 404, 'writing response is owner protected');
        assert.strictEqual((await request(port, jar, 'GET', '/results/history')).status, 200);
        const history = await request(port, jar, 'GET', '/results/history');
        assert.ok(history.body.includes('Accenture Writing &amp; Interview Responses') || history.body.includes('Accenture Writing & Interview Responses'));

        res = await request(port, jar, 'GET', '/accenture/interview/task');
        assert.strictEqual(res.status, 200); assert.ok(res.body.includes('YOUR RESPONSE'));
        assert.ok(res.body.includes('Interview Preparation'));
        console.log('PASS: Accenture authenticated dashboard, cognitive/technical quiz, pseudocode rendering, coding run/submit/result, writing draft/submit/history, interview prompt, authorization and refresh-safe XP');
    } finally {
        if (users.length) {
            const ids = users.map(id => new mongoose.Types.ObjectId(id));
            await Promise.all([
                User.deleteMany({ _id: { $in: ids } }), UserStats.deleteMany({ userId: { $in: ids } }), Result.deleteMany({ userId: { $in: ids } }),
                XPHistory.deleteMany({ userId: { $in: ids } }), CodingSubmission.deleteMany({ userId: { $in: ids } }),
                AccentureResponse.deleteMany({ userId: { $in: ids } }), SectionProgress.deleteMany({ userId: { $in: ids } })
            ]);
        }
        await mongoose.disconnect();
    }
}

if (require.main === module) run().then(() => process.exit(0)).catch(error => { console.error('Accenture E2E test failed:', error); process.exit(1); });
module.exports = run;
