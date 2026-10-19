// Opt-in live integration check for the hosted Accenture executor.
// Sends only generated smoke-test code and one public sample input to Judge0.
process.env.ACCENTURE_CODING_BACKEND = 'judge0';
process.env.PORT = process.env.PORT || '3112';

const assert = require('assert');
const http = require('http');
const bcrypt = require('bcryptjs');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const CodingSubmission = require('../backend/models/CodingSubmission');
const UserStats = require('../backend/models/UserStats');
const XPHistory = require('../backend/models/XPHistory');

function request(port, cookie, method, url, body) {
    return new Promise((resolve, reject) => {
        const headers = {};
        if (cookie) headers.Cookie = cookie;
        let payload;
        if (body) {
            payload = new URLSearchParams(body).toString();
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            headers['Content-Length'] = Buffer.byteLength(payload);
        }
        const req = http.request({ host: '127.0.0.1', port, method, path: url, headers }, res => {
            let text = '';
            res.on('data', chunk => { text += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, text }));
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function run() {
    let user;
    const suffix = Date.now().toString(36);
    const port = Number(process.env.PORT);
    let cookie = '';
    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('MongoDB connection timed out.')), 15000);
                mongoose.connection.once('connected', () => { clearTimeout(timeout); resolve(); });
                mongoose.connection.once('error', error => { clearTimeout(timeout); reject(error); });
            });
        }

        user = await User.create({
            name: 'Judge0 smoke test',
            email: `judge0-smoke-${suffix}@aptitudepro.test`,
            password: await bcrypt.hash('Judge0Smoke123!', 4)
        });
        require('../frontend/app');

        let health;
        for (let i = 0; i < 30; i++) {
            try { health = await request(port, '', 'GET', '/health'); if (health.status === 200) break; } catch (_) {}
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        assert.strictEqual(health && health.status, 200, 'AptitudePro starts for the integration check');

        const login = await request(port, '', 'POST', '/login', { email: user.email, password: 'Judge0Smoke123!' });
        assert.strictEqual(login.status, 302, 'temporary test user can log in');
        cookie = (login.headers['set-cookie'] || []).map(value => value.split(';')[0]).join('; ');
        assert.ok(cookie, 'login creates an authenticated session');

        const page = await request(port, cookie, 'GET', '/accenture/coding');
        assert.strictEqual(page.status, 200, 'Accenture coding assessment renders');
        const questionId = page.text.match(/class="qid" value="([a-f\d]{24})"/i)?.[1];
        const attemptId = page.text.match(/attempt='(cod_[^']+)'/)?.[1];
        assert.ok(questionId && attemptId, 'assessment provides an active question and attempt');

        const question = await Question.findOne({ _id: questionId, company: 'Accenture', questionType: 'coding' }).lean();
        assert.ok(question, 'sample problem exists');
        const sample = (question.testCases || []).find(testCase => !testCase.isHidden) || {
            input: question.sampleInput || '', output: question.sampleOutput || ''
        };
        const source = `print(${JSON.stringify(String(sample.output || '').trimEnd())})`;
        const beforeXP = (await UserStats.findOne({ userId: user._id }).lean())?.xp || 0;
        const runResult = await request(port, cookie, 'POST', '/accenture/coding/run', {
            attemptId,
            questionId,
            language: 'Python',
            code: source
        });
        assert.strictEqual(runResult.status, 200, 'sample run route responds');
        const result = JSON.parse(runResult.text);
        assert.strictEqual(String(result.status).toLowerCase(), 'accepted', `Judge0 sample execution passes: ${result.message}`);
        assert.strictEqual(result.passed, result.total, 'sample output is checked by the application');
        assert.ok(Array.isArray(result.outputs) && result.outputs.length > 0, 'safe sample output returns to the page');
        assert.strictEqual((await UserStats.findOne({ userId: user._id }).lean())?.xp || 0, beforeXP, 'Run Code does not award XP');
        assert.strictEqual(await Result.countDocuments({ userId: user._id, section: 'Company-accenture-coding' }), 0, 'Run Code does not create a final result');
        assert.strictEqual(await CodingSubmission.countDocuments({ userId: user._id, company: 'Accenture' }), 0, 'Run Code does not create a final submission');
        console.log('PASS: Accenture Run Code route executed and checked a sample through Judge0 without Docker.');
    } finally {
        if (cookie) await request(port, cookie, 'GET', '/logout').catch(() => {});
        if (user) {
            await Promise.all([
                Result.deleteMany({ userId: user._id }),
                CodingSubmission.deleteMany({ userId: user._id }),
                UserStats.deleteMany({ userId: user._id }),
                XPHistory.deleteMany({ userId: user._id }),
                User.deleteOne({ _id: user._id })
            ]);
        }
        if (mongoose.connection.readyState) await mongoose.disconnect();
    }
}

if (require.main === module) run().then(() => process.exit(0)).catch(error => { console.error('Judge0 smoke test failed:', error.message); process.exit(1); });

module.exports = run;
