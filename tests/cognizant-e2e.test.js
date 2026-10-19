const assert = require('assert');
const bcrypt = require('bcryptjs');
process.env.PORT = '3108';
process.env.COGNIZANT_CODING_BACKEND = 'docker';
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const SectionProgress = require('../backend/models/SectionProgress');
const XPHistory = require('../backend/models/XPHistory');
const CognizantResponse = require('../backend/models/CognizantResponse');
const CognizantGameAttempt = require('../backend/models/CognizantGameAttempt');
const SqlSubmission = require('../backend/models/SqlSubmission');

async function run() {
    let user;
    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => { mongoose.connection.once('connected', resolve); setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000); });
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        user = await User.create({ name: 'Cognizant E2E', email: `cognizant-e2e-${suffix}@aptitudepro.test`, password: await bcrypt.hash('TestUser!234', 4) });
        require('../frontend/app'); // Starts the real app on the dedicated test port.
        const base = 'http://127.0.0.1:3108';
        let health;
        for (let i = 0; i < 40; i++) {
            try { health = await fetch(`${base}/health`); if (health.ok) break; } catch (_) {}
            await new Promise(r => setTimeout(r, 250));
        }
        assert.ok(health?.ok, 'application starts and serves health check');
        const login = await fetch(`${base}/login`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: user.email, password: 'TestUser!234' }) });
        assert.strictEqual(login.status, 302, 'test user can authenticate');
        const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
        assert.ok(cookie, 'session cookie is created');
        async function page(route) { const response = await fetch(`${base}${route}`, { headers: { cookie } }); const text = await response.text(); assert.strictEqual(response.status, 200, `${route} responds`); return text; }
        const dashboard = await page('/placement/college/company/cognizant');
        assert.ok(dashboard.includes('Cognizant Placement Practice') && dashboard.includes('Communication Assessment'), 'company dashboard renders Cognizant rounds');
        const quiz = await page('/quiz?learningPath=college&placementType=company&company=cognizant&mode=cognizant&sectionKey=aptitude');
        assert.ok(quiz.includes('Cognizant Aptitude Assessment') && !quiz.includes('Accenture'), 'Cognizant quiz uses its own question pool');
        const questionIds = JSON.parse(quiz.match(/data-question-ids='([^']+)'/)?.[1] || '[]');
        assert.strictEqual(questionIds.length, 30, 'configured Cognizant aptitude session has 30 questions');
        const quizSubmit = await fetch(`${base}/quiz/submit-quiz`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ section: 'Maths', learningPath: 'college', placementType: 'company', company: 'Cognizant', testTitle: 'Cognizant Aptitude Assessment', questionIds: JSON.stringify(questionIds), selectedOptions: JSON.stringify(Array(questionIds.length).fill('SKIPPED')), timeTaken: '0', essayTexts: '[]' }) });
        assert.strictEqual(quizSubmit.status, 302, 'Cognizant quiz submission validates and stores via the shared result flow');
        const quizResultPath = quizSubmit.headers.get('location');
        assert.ok(quizResultPath && (await page(quizResultPath)).includes('Cognizant Aptitude Assessment'), 'Cognizant quiz result is private and reviewable');
        const response = await page('/cognizant/communication/task');
        assert.ok(response.includes('YOUR RESPONSE'), 'communication task has a text-entry interface');
        const responseAttemptId = response.match(/cognizant-response-([^']+)'/)?.[1];
        assert.ok(responseAttemptId, 'communication attempt is server assigned');
        const responseSave = await fetch(`${base}/cognizant/response/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: responseAttemptId, responseText: 'A concise professional practice response.', submit: 'true' }) });
        const responseData = await responseSave.json();
        assert.ok(responseSave.ok && responseData.submitted, 'written response is saved and submitted without an invented score');
        assert.ok((await page(`/cognizant/submission/${responseData.id}`)).includes('Automated evaluation is not enabled'), 'private response review renders honestly');
        const coding = await page('/cognizant/coding');
        assert.ok(coding.includes('Run sample') && coding.includes('Submit assessment'), 'coding workflow renders');
        assert.ok(!coding.includes('isHidden') && !coding.includes('hiddenTests'), 'coding page does not expose hidden test metadata');
        const codingAttemptId = coding.match(/const attemptId='([^']+)'/)?.[1];
        const codingProblems = JSON.parse(coding.match(/const problems=(\[.*?\]);const serverState=/s)?.[1] || '[]');
        const codingProblem = codingProblems[0], language = codingProblem.languages[0], draftCode = codingProblem.starters[language];
        const draftSave = await fetch(`${base}/cognizant/coding/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: codingAttemptId, questionId: codingProblem.id, language, code: draftCode }) });
        assert.ok(draftSave.ok && (await draftSave.json()).ok, 'coding draft saves for the selected problem and language');
        const sampleRun = await fetch(`${base}/cognizant/coding/run`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: codingAttemptId, questionId: codingProblem.id, language, code: draftCode }) });
        const sampleRunData = await sampleRun.json();
        assert.ok(sampleRun.ok && sampleRunData.ok && typeof sampleRunData.status === 'string', 'sample run returns the actual sandbox status without leaking hidden tests');
        const sql = await page('/cognizant/sql');
        assert.ok(sql.includes('Run query') && sql.includes('Submit all tasks'), 'SQL workflow renders');
        assert.ok(!sql.includes('solutionSql'), 'SQL page does not expose the reference evaluator query');
        const sqlAttemptId = sql.match(/const attemptId='([^']+)'/)?.[1];
        const sqlIds = [...sql.matchAll(/data-task-id="([a-f\d]{24})"/g)].map(m => m[1]);
        const sqlQuestions = await Question.find({ _id: { $in: sqlIds }, company: 'Cognizant', questionType: 'sql' }).lean();
        const sqlSubmit = await fetch(`${base}/cognizant/sql/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: sqlAttemptId, queries: sqlQuestions.map(q => ({ taskId: String(q._id), query: q.sqlSolution })) }) });
        const sqlData = await sqlSubmit.json();
        assert.ok(sqlSubmit.ok && sqlData.ok, 'SQL tasks submit through the server evaluator');
        const savedSql = await SqlSubmission.findById(sqlData.submissionId).lean();
        assert.strictEqual(savedSql.solvedTasks, sqlQuestions.length, 'SQL results are evaluated and persisted per task');
        assert.ok(savedSql.xpEarned > 0 && savedSql.xpGranted, 'evaluated SQL answers award XP through the shared progression rules');
        const xpBeforeRetry = await XPHistory.countDocuments({ userId: user._id, resultId: savedSql.resultId });
        await fetch(`${base}/cognizant/sql/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: sqlAttemptId, queries: sqlQuestions.map(q => ({ taskId: String(q._id), query: q.sqlSolution })) }) });
        assert.strictEqual(await XPHistory.countDocuments({ userId: user._id, resultId: savedSql.resultId }), xpBeforeRetry, 'duplicate SQL submission does not award XP twice');
        assert.ok((await page(sqlData.redirect)).includes('Cognizant SQL assessment result'), 'SQL attempt details are accessible to the owner');
        const games = await page('/cognizant/games');
        assert.ok(['Motion target', 'Digit recall', 'Switch tracker', 'Pattern completion', 'Logic grid'].every(s => games.includes(s)), 'five interactive game activities render');
        const gameAttemptId = games.match(/const attemptId\s*=\s*'([^']+)'/)?.[1];
        const target = games.match(/Tap the only tile containing <strong>([●▲■◆])<\/strong>/)?.[1];
        const tiles = [...games.matchAll(/class="tile" data-index="(\d+)"[^>]*>([●▲■◆])<\/button>/g)];
        const motion = tiles.find(m => m[2] === target)?.[1];
        const digits = games.match(/id="digits" class="digits">(\d+)<\/div>/)?.[1];
        const switchText = games.match(/id="switch">[\s\S]*?<p class="digits">([^<]+)<\/p>/)?.[1];
        const switchAnswer = switchText.split('·').map((value, i) => { const n = Number(value.trim()); return i % 2 === 0 ? (n % 2 ? 'odd' : 'even') : (n >= 11 ? 'high' : 'low'); }).join(',');
        const gameSave = await fetch(`${base}/cognizant/games/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: gameAttemptId, answers: { motion, digitRecall: digits, switchTracker: switchAnswer, patternMatrix: '48', logicGrid: 'Ada:dog,Bert:cat,Cleo:bird' } }) });
        const gameData = await gameSave.json();
        assert.ok(gameSave.ok && gameData.score === 5, `game results are verified and stored server-side (${gameSave.status}: ${JSON.stringify(gameData)})`);
        const history = await page('/cognizant/history');
        assert.ok(history.includes('Cognizant practice history'), 'user history is protected and renders');
        console.log('PASS: authenticated dashboard, quiz, response, coding, SQL, games and history routes render with company-isolated public data');
    } finally {
        if (user) {
            await Promise.all([
                CognizantResponse.deleteMany({ userId: user._id }), CognizantGameAttempt.deleteMany({ userId: user._id }),
                SqlSubmission.deleteMany({ userId: user._id }), Result.deleteMany({ userId: user._id }),
                SectionProgress.deleteMany({ userId: user._id }), XPHistory.deleteMany({ userId: user._id })
            ]);
            await UserStats.deleteOne({ userId: user._id });
            await User.deleteOne({ _id: user._id });
            try { await mongoose.connection.collection('sessions').deleteMany({ session: { $regex: String(user._id) } }); } catch (_) {}
        }
        mongoose.connection.removeAllListeners('disconnected');
        await mongoose.disconnect();
    }
}

run().then(() => process.exit(0)).catch(error => { console.error('Cognizant E2E failed:', error); process.exit(1); });
