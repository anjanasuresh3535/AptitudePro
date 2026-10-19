const assert = require('assert');
const bcrypt = require('bcryptjs');
const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const CapgeminiAttempt = require('../backend/models/CapgeminiAttempt');
const CodingSubmission = require('../backend/models/CodingSubmission');
const Result = require('../backend/models/Result');
const SectionProgress = require('../backend/models/SectionProgress');
const XPHistory = require('../backend/models/XPHistory');
const UserStats = require('../backend/models/UserStats');
const { LISTENING_PASSAGES } = require('../backend/config/capgeminiListening');

async function run() {
    let user;
    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000);
            mongoose.connection.once('connected', () => { clearTimeout(timeout); resolve(); });
            mongoose.connection.once('error', error => { clearTimeout(timeout); reject(error); });
        });
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const password = 'CapgeminiTest123!';
        user = await User.create({ name: 'Capgemini E2E', email: `capgemini-e2e-${suffix}@aptitudepro.test`, password: await bcrypt.hash(password, 4) });
        require('../frontend/app');

        const base = () => `http://127.0.0.1:${config.port}`;
        let health;
        for (let i = 0; i < 40; i++) {
            try { health = await fetch(`${base()}/health`); if (health.ok) break; } catch (_) {}
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        assert.ok(health?.ok, 'app starts and exposes health endpoint');
        const login = await fetch(`${base()}/login`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: user.email, password }) });
        assert.strictEqual(login.status, 302, 'test user authenticates');
        const cookie = login.headers.get('set-cookie')?.split(';')[0];
        assert.ok(cookie, 'login creates a session cookie');
        const page = async path => {
            const response = await fetch(`${base()}${path}`, { headers: { cookie } });
            return { response, html: await response.text() };
        };
        const directory = await page('/placement/college/company');
        assert.ok(directory.html.includes('Capgemini') && directory.html.includes('/placement/college/company/capgemini'), 'company directory shows the Capgemini placement module');
        const dashboard = await page('/placement/college/company/capgemini');
        assert.ok(dashboard.html.includes('Capgemini Assessment Practice'), 'Capgemini dashboard renders');
        assert.ok(dashboard.html.includes('Listening Comprehension') && /audio questions/.test(dashboard.html), 'listening card reports the original audio questions');
        assert.ok(dashboard.html.includes('locally synthesized voice') && dashboard.html.includes('href="/capgemini/listening"'), 'listening card discloses the generated voice and links to practice');
        assert.ok(dashboard.html.includes('Optional Coding Round'), 'dashboard reports section availability');
        assert.ok(/2 questions · 45 min/.test(dashboard.html) && dashboard.html.includes('href="/capgemini/coding"'), 'coding card reports two problems and links to the practice session');
        const technical = await page('/quiz?learningPath=college&placementType=company&company=capgemini&mode=capgemini&sectionKey=technical');
        assert.strictEqual(technical.response.status, 200, 'technical assessment route renders');
        assert.ok(!technical.html.includes('data-correct='), 'objective answer keys are not sent to the browser');
        const english = await page('/quiz?learningPath=college&placementType=company&company=capgemini&mode=capgemini&sectionKey=english');
        assert.strictEqual(english.response.status, 200, 'English objective assessment route renders');
        assert.ok(!english.html.includes('data-correct='), 'English answer keys are not sent to the browser');
        const quizIds = JSON.parse(english.html.match(/data-question-ids='([^']+)'/)?.[1] || '[]');
        assert.strictEqual(quizIds.length, 30, 'objective practice uses 30 questions when the bank supports it');
        const quizPayload = new URLSearchParams({ section: 'English', learningPath: 'college', placementType: 'company', company: 'Capgemini', testTitle: 'Capgemini English Communication', questionIds: JSON.stringify(quizIds), selectedOptions: JSON.stringify(Array(quizIds.length).fill('SKIPPED')), timeTaken: '5', essayTexts: '[]' });
        const objectiveSubmit = await fetch(`${base()}/quiz/submit-quiz`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: quizPayload });
        assert.strictEqual(objectiveSubmit.status, 302, 'objective attempt is submitted through shared scoring');
        const resultPath = objectiveSubmit.headers.get('location');
        const objectiveReview = await page(resultPath);
        assert.strictEqual(objectiveReview.response.status, 200, 'saved objective result is available to its owner');
        const objectiveDoc = await Result.findOne({ userId: user._id, company: 'Capgemini', testTitle: 'Capgemini English Communication' }).lean();
        assert.strictEqual(objectiveDoc.totalQuestions, 30, 'objective result persists with the actual question total');
        const duplicateSubmit = await fetch(`${base()}/quiz/submit-quiz`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: quizPayload });
        assert.strictEqual(duplicateSubmit.status, 400, 'completed objective attempt cannot be submitted twice');

        const games = await page('/capgemini/games');
        assert.strictEqual(games.response.status, 200, 'four games page renders');
        const gameAttemptId = games.html.match(/const attemptId='([^']+)'/)?.[1];
        const digits = games.html.match(/id="digitSequence">(\d+)</)?.[1];
        assert.ok(gameAttemptId && digits, 'game has a session ID and generated memory sequence');
        const gameSubmit = await fetch(`${base()}/capgemini/games/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: gameAttemptId, answers: { motion: '→', digits, switches: 'a,d', deduction: 'ada:dog,bert:cat,cleo:bird' } }) });
        const gameResult = await gameSubmit.json();
        assert.ok(gameSubmit.ok && gameResult.score === 4, 'game solutions are checked and score is saved server-side');
        assert.strictEqual((await page(`/capgemini/result/${gameResult.id}`)).response.status, 200, 'owner can open game review');

        const listening = await page('/capgemini/listening');
        assert.strictEqual(listening.response.status, 200, 'listening practice page renders');
        assert.ok(listening.html.includes('Finish and review') && listening.html.includes('locally synthesized voice'), 'listening session provides submit control and synthesized-audio disclosure');
        assert.strictEqual((listening.html.match(/type="radio"/g) || []).length, 36, 'listening session renders four options for each of nine questions');
        assert.ok(!listening.html.includes('Harbor Street Library began') && !listening.html.includes('correct":"B'), 'listening transcript and answer keys remain server-side before submission');
        const listeningId = listening.html.match(/const attemptId='([^']+)'/)?.[1];
        assert.ok(listeningId, 'listening session has an attempt ID');
        const listeningAnswers = Object.fromEntries(LISTENING_PASSAGES.flatMap(passage => passage.questions.map(question => [question.id, question.correct])));
        const listeningSubmit = await fetch(`${base()}/capgemini/listening/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: listeningId, answers: listeningAnswers }) });
        const listeningResult = await listeningSubmit.json();
        assert.ok(listeningSubmit.ok && listeningResult.score === 9 && listeningResult.total === 9, 'listening answers are checked against the server key and scored');
        const listeningReview = await page(`/capgemini/result/${listeningResult.id}`);
        assert.strictEqual(listeningReview.response.status, 200, 'saved listening review is available to its owner');
        assert.ok(listeningReview.html.includes('Listening comprehension review') && (listeningReview.html.match(/<audio controls/g) || []).length === 3, 'listening review includes replay controls for all passages');
        const listeningAudio = await fetch(`${base()}${LISTENING_PASSAGES[0].audioUrl}`, { headers: { cookie } });
        assert.ok(listeningAudio.ok && listeningAudio.headers.get('content-type')?.includes('audio/wav'), 'generated listening audio is served as WAV');

        const codingPage = await page('/capgemini/coding');
        assert.strictEqual(codingPage.response.status, 200, 'Capgemini coding assessment page renders');
        assert.ok(codingPage.html.includes('Longest Increasing Run') && codingPage.html.includes('Balanced Brackets'), 'both original Capgemini coding problems are available');
        assert.ok(codingPage.html.includes('Run Code') && codingPage.html.includes('Submit Code') && codingPage.html.includes('Judge0'), 'coding page exposes run/submit controls and explains the isolated hosted runner');
        assert.ok(!codingPage.html.includes('([)]') && !codingPage.html.includes('isHidden'), 'hidden coding tests are not sent to the browser');
        const codingAttemptId = codingPage.html.match(/attempt='([^']+)'/)?.[1];
        const problemId = codingPage.html.match(/class="qid" value="([a-f\d]{24})"/)?.[1];
        assert.ok(codingAttemptId && problemId, 'coding assessment has an attempt and problem ID');
        const draftSave = await fetch(`${base()}/capgemini/coding/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: codingAttemptId, questionId: problemId, language: 'C++', code: '#include <iostream>\nint main(){return 0;}' }) });
        assert.ok(draftSave.ok && (await draftSave.json()).ok, 'coding draft is saved for the authenticated attempt');

        const behavior = await page('/capgemini/behavioral');
        const behaviorId = behavior.html.match(/const attemptId='([^']+)'/)?.[1];
        const behaviorSave = await fetch(`${base()}/capgemini/behavioral/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: behaviorId, responses: { bg1: 'Ask them privately', bg3: 'Agree' } }) });
        const behaviorResult = await behaviorSave.json();
        assert.ok(behaviorSave.ok && behaviorResult.id, 'behavioral answers persist without score assignment');
        const behaviorDoc = await CapgeminiAttempt.findById(behaviorResult.id).lean();
        assert.strictEqual(behaviorDoc.score, null, 'behavioral practice does not invent a score');

        const writing = await page('/capgemini/writing');
        const writingId = writing.html.match(/const attemptId='([^']+)'/)?.[1];
        const writingSave = await fetch(`${base()}/capgemini/writing/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: writingId, responses: { 'email-delay': 'Subject: Dependency update\nThe dependency is delayed; I propose we revise the delivery plan.', 'short-update': 'Task is complete. One risk remains. Please review the deployment configuration.' } }) });
        const writingResult = await writingSave.json();
        assert.ok(writingSave.ok && writingResult.id, 'writing responses persist');
        assert.strictEqual((await page(writingResult.redirect)).response.status, 200, 'writing review route renders for owner');
        console.log('PASS: Capgemini directory, dashboard, objective routes, coding practice, four server-scored games, playable listening with saved replay review, behavioral persistence and writing review');
    } finally {
        if (user) {
            await Promise.all([
                CapgeminiAttempt.deleteMany({ userId: user._id }), Result.deleteMany({ userId: user._id, company: 'Capgemini' }),
                CodingSubmission.deleteMany({ userId: user._id, company: 'Capgemini' }),
                SectionProgress.deleteMany({ userId: user._id, section: /^Company-capgemini-/ }),
                XPHistory.deleteMany({ userId: user._id }), User.deleteOne({ _id: user._id })
            ]);
            await UserStats.deleteOne({ userId: user._id });
            await User.deleteOne({ _id: user._id });
        }
        mongoose.connection.removeAllListeners('disconnected');
        await mongoose.disconnect();
    }
}

run().then(() => process.exit(0)).catch(error => { console.error('Capgemini test failed:', error); process.exit(1); });
