// tests/coding.test.js
//
// Automated tests for the Wipro Coding Mock Test.
//
// Coverage:
//  1. Output comparison strategies (token / exact, CRLF, trailing newline)
//  2. Docker sandbox argument construction - asserts the SECURITY FLAGS
//     (network none, read-only, cap-drop, no-new-privileges, memory, pids)
//     WITHOUT needing a running Docker daemon
//  3. Runner script: only integers interpolated, rejects bad input
//  4. Message sanitisation (no host paths, no secrets)
//  5. Language resolution (C, C++, Java, Python) + rejection of unknown
//  6. Availability detection (daemon vs CLI)
//  7. Evaluation pipeline verdicts with an injected fake sandbox
//  8. Hidden test cases never projected to the browser
//  9. HTTP: coding page renders, exactly 2 problems, 60 minutes, languages,
//     no raw HTML tags leaked into the output
// 10. HTTP: submit -> stored, XP idempotent, hidden data still hidden

const assert = require('assert');
const http = require('http');

const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const XPHistory = require('../backend/models/XPHistory');
const Question = require('../backend/models/Question');
const CodingSubmission = require('../backend/models/CodingSubmission');

const compare = require('../backend/services/coding/compare');
const languages = require('../backend/services/coding/languages');
const executor = require('../backend/services/coding/dockerExecutor');
const availability = require('../backend/services/coding/availability');
const codingConfig = require('../backend/config/codingExecutionConfig');
const codingRouter = require('../backend/routes/wiproCoding');

let passed = 0;
let failed = 0;
function logPass(n, t) { passed++; console.log(`PASS [CODING ${n}] ${t}`); }
function logFail(n, t, e) { failed++; console.error(`FAIL [CODING ${n}] ${t}`); console.error(`      ${e && e.message ? e.message : e}`); }

async function run() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(r => mongoose.connection.once('connected', r));
    }
    console.log('====================================================');
    console.log('WIPRO CODING MOCK TEST SUITE');
    console.log('====================================================\n');

    // ---- 1. Output comparison ----
    try {
        assert.strictEqual(compare.compareOutput('10\n', '10', 'token'), true, 'trailing newline ignored');
        assert.strictEqual(compare.compareOutput('10', '10\n', 'token'), true, 'missing trailing newline ignored');
        assert.strictEqual(compare.compareOutput('10\r\n', '10\n', 'token'), true, 'CRLF vs LF handled');
        assert.strictEqual(compare.compareOutput('10   \n', '10\n', 'token'), true, 'trailing spaces trimmed');
        assert.strictEqual(compare.compareOutput('10\n\n', '10\n', 'token'), true, 'extra trailing blank lines ignored');
        assert.strictEqual(compare.compareOutput('10', '11', 'token'), false, 'different values must fail');
        assert.strictEqual(compare.compareOutput('1 0', '1 0', 'token'), true, 'internal spacing preserved');
        assert.strictEqual(compare.compareOutput('1  0', '1 0', 'token'), false, 'internal spacing matters in token mode');
        assert.strictEqual(compare.compareOutput('10\n', '10', 'exact'), false, 'exact rejects trailing newline diff');
        assert.strictEqual(compare.compareOutput('10', '10', 'exact'), true, 'exact match');
        assert.strictEqual(compare.compareOutput('1\n\n2', '1\n2', 'token'), false, 'internal blank line matters');
        logPass(1, 'Output comparison: trailing newline/space, CRLF, blank lines, exact vs token');
    } catch (e) { logFail(1, 'Output comparison', e); }

    // ---- 2. Docker sandbox SECURITY FLAGS ----
    try {
        const argv = executor.buildDockerArgs({
            image: 'gcc:13', workdir: 'C:\\Temp\\aptitudepro-coding\\run-abc',
            runnerScript: 'echo hi', limits: codingConfig.limits, network: 'none'
        });
        const args = argv.join(' ');

        assert.ok(args.includes('--network none'), 'network must be disabled');
        assert.ok(args.includes('--read-only'), 'root filesystem must be read-only');
        assert.ok(args.includes('--cap-drop ALL'), 'all capabilities must be dropped');
        assert.ok(args.includes('--security-opt no-new-privileges:true'), 'privilege escalation blocked');
        assert.ok(args.includes('--pids-limit ' + codingConfig.limits.pids), 'PID limit enforced');
        assert.ok(args.includes(`--memory ${codingConfig.limits.memoryMb}m`), 'memory limit enforced');
        assert.ok(args.includes(`--memory-swap ${codingConfig.limits.memoryMb}m`), 'swap capped');
        assert.ok(args.includes('--cpus ' + String(codingConfig.limits.cpus)), 'CPU quota enforced');
        assert.ok(args.includes('--tmpfs /tmp'), 'scratch tmpfs required');
        assert.ok(args.includes('--rm'), 'container auto-removed');
        assert.ok(!args.includes('--privileged'), 'must never be privileged');
        assert.ok(!args.includes('--network host'), 'must never use host network');

        const mounts = argv.filter((a, i, arr) => arr[i - 1] === '-v');
        assert.strictEqual(mounts.length, 1, 'exactly one volume mount allowed');
        // Windows paths are normalised to POSIX form for the container.
        assert.strictEqual(mounts[0], 'C:/Temp/aptitudepro-coding/run-abc:/app', 'only the workdir is mounted');

        // A POSIX host path must survive unchanged.
        const posixArgs = executor.buildDockerArgs({
            image: 'gcc:13', workdir: '/tmp/run-x', runnerScript: 'x',
            limits: codingConfig.limits, network: 'none'
        });
        const posixMount = posixArgs.filter((a, i, arr) => arr[i - 1] === '-v');
        assert.deepStrictEqual(posixMount, ['/tmp/run-x:/app'], 'posix workdir mounted as-is');
        logPass(2, 'Sandbox security flags asserted (no daemon required)');
    } catch (e) { logFail(2, 'Sandbox security flags', e); }
// ---- 3. Runner script safety ----
    try {
        const script = executor.buildRunnerScript(languages.LANGUAGES.Python, 3, 5);
        assert.ok(script.includes('python3 -m py_compile'), 'python syntax check present');
        assert.ok(script.includes('timeout 5 python3 main.py'), 'runs with a timeout');
        assert.ok(script.includes('$i -le 3'), 'case count interpolated as integer');
        assert.throws(() => executor.buildRunnerScript(languages.LANGUAGES.C, 0, 5), /invalid case count/, 'zero cases rejected');
        assert.throws(() => executor.buildRunnerScript(languages.LANGUAGES.C, 1.5, 5), /invalid case count/, 'non-integer cases rejected');
        assert.throws(() => executor.buildRunnerScript(languages.LANGUAGES.C, 1, 0), /invalid timeout/, 'zero timeout rejected');
        logPass(3, 'Runner script interpolates only integers, compiles then runs with per-case timeout');
    } catch (e) { logFail(3, 'Runner script safety', e); }

    // ---- 4. Message sanitisation ----
    try {
        const dirty = 'error in C:\\Users\\admin\\project\\main.c:12\nmongodb://user:pass@host/db\nAPI_KEY=abcdef123';
        const clean = executor.sanitizeMessage(dirty);
        assert.ok(!clean.includes('C:\\Users'), 'windows host path leaked');
        assert.ok(!clean.includes('mongodb://'), 'mongo uri leaked');
        assert.ok(!clean.includes('abcdef123'), 'api key leaked');
        assert.strictEqual(executor.sanitizeMessage(''), '', 'empty input');
        logPass(4, 'Compiler/runtime output sanitised: no host paths, no credentials');
    } catch (e) { logFail(4, 'Message sanitisation', e); }

    // ---- 5. Language resolution ----
    try {
        ['C', 'C++', 'Java', 'Python'].forEach(l => {
            const r = languages.resolveLanguage(l);
            assert.ok(r, `${l} must resolve`);
            assert.ok(r.sourceFile && r.run, `${l} must declare sourceFile and run`);
        });
        assert.strictEqual(languages.resolveLanguage('c'), languages.LANGUAGES.C, 'case-insensitive C');
        assert.strictEqual(languages.resolveLanguage('python'), languages.LANGUAGES.Python, 'case-insensitive Python');
        assert.strictEqual(languages.resolveLanguage('COBOL'), null, 'unknown language rejected');
        assert.strictEqual(languages.resolveLanguage('rm -rf /'), null, 'shell injection rejected');
        assert.strictEqual(languages.resolveLanguage(''), null, 'empty language rejected');
        assert.strictEqual(languages.supportedLanguageIds().length, 4, 'exactly 4 languages');
        logPass(5, 'Languages C, C++, Java, Python resolve; unknown/injection strings rejected');
    } catch (e) { logFail(5, 'Language resolution', e); }
// ---- 6. Availability detection (daemon, not just CLI) ----
    try {
        const status = await availability.getExecutionStatus({ force: true });
        assert.strictEqual(typeof status.available, 'boolean', 'available must be boolean');
        if (!status.available) {
            assert.ok(status.reason && status.reason.length > 10, 'unavailable must explain why');
            console.log(`      [info] execution unavailable: ${status.reason}`);
        } else {
            console.log(`      [info] Docker daemon reachable: ${status.docker && status.docker.version}`);
        }
        logPass(6, `Availability detection returned a defined state (available=${status.available})`);
    } catch (e) { logFail(6, 'Availability detection', e); }

    // ---- 7. Evaluation verdicts with an injected fake sandbox ----
    try {
        const codingService = require('../backend/services/coding');
        const dockerPath = require.resolve('../backend/services/coding/dockerExecutor');
        const realExecute = require.cache[dockerPath].exports.executeInSandbox;
        const fake = (caseResults) => async () => ({
            status: 'not_executed', message: 'Executed.', durationMs: 10, caseResults
        });

        const question = {
            testCases: [
                { input: '1234', output: '10', isHidden: false },
                { input: '9', output: '9', isHidden: true },
                { input: '5', output: '999', isHidden: true }
            ]
        };

        // 7a: sandbox down -> honest not_executed, nothing invented
        let r = await codingService.evaluateSubmission({ question, language: 'Python', source: 'print(1)', executionAvailable: false });
        assert.strictEqual(r.status, 'not_executed', 'not_executed when sandbox down');
        assert.strictEqual(r.passedTests, 0, 'no tests pass without execution');
        assert.strictEqual(r.score, 0, 'no score invented');

        // 7b/7c: blank code, unsupported language
        r = await codingService.evaluateSubmission({ question, language: 'Python', source: '   ', executionAvailable: true });
        assert.strictEqual(r.status, 'skipped', 'blank submission skipped');
        r = await codingService.evaluateSubmission({ question, language: 'COBOL', source: 'x', executionAvailable: true });
        assert.strictEqual(r.status, 'unsupported_language', 'unsupported language rejected');
// 7d: partial match -> wrong_answer, correct counters
        require.cache[dockerPath].exports.executeInSandbox = fake([
            { exitCode: 0, truncated: false, stdout: '10\n', stderr: '' },
            { exitCode: 0, truncated: false, stdout: '9\n', stderr: '' },
            { exitCode: 0, truncated: false, stdout: '5\n', stderr: '' }
        ]);
        r = await codingService.evaluateSubmission({ question, language: 'Python', source: 'x', executionAvailable: true });
        assert.strictEqual(r.passedTests, 2, 'two of three match');
        assert.strictEqual(r.passedSampleTests, 1, 'sample passed');
        assert.strictEqual(r.passedHiddenTests, 1, 'one hidden passed');
        assert.strictEqual(r.status, 'wrong_answer', 'partial -> wrong_answer');
        assert.strictEqual(r.score, 67, 'score 2/3 rounded');
        assert.ok(!r.caseResults.some(c => 'output' in c || 'input' in c), 'case results carry no test data');
        assert.ok(r.caseResults.every(c => typeof c.passed === 'boolean'), 'case results are booleans');

        // 7e: all correct -> accepted
        require.cache[dockerPath].exports.executeInSandbox = fake([
            { exitCode: 0, truncated: false, stdout: '10\n', stderr: '' },
            { exitCode: 0, truncated: false, stdout: '9\n', stderr: '' },
            { exitCode: 0, truncated: false, stdout: '999\n', stderr: '' }
        ]);
        r = await codingService.evaluateSubmission({ question, language: 'Python', source: 'x', executionAvailable: true });
        assert.strictEqual(r.status, 'accepted', 'all match -> accepted');
        assert.strictEqual(r.passedTests, 3, 'all passed');

        // 7f: timeout never passes
        require.cache[dockerPath].exports.executeInSandbox = fake([
            { exitCode: 124, truncated: false, stdout: '', stderr: '' },
            { exitCode: 124, truncated: false, stdout: '', stderr: '' },
            { exitCode: 124, truncated: false, stdout: '', stderr: '' }
        ]);
        r = await codingService.evaluateSubmission({ question, language: 'Python', source: 'x', executionAvailable: true });
        assert.strictEqual(r.status, 'time_limit_exceeded', 'timeout detected');
        assert.strictEqual(r.passedTests, 0, 'timeout never passes');

        // 7g: runtime error
        require.cache[dockerPath].exports.executeInSandbox = fake([
            { exitCode: 1, truncated: false, stdout: '', stderr: 'boom' },
            { exitCode: 1, truncated: false, stdout: '', stderr: 'boom' },
            { exitCode: 1, truncated: false, stdout: '', stderr: 'boom' }
        ]);
        r = await codingService.evaluateSubmission({ question, language: 'Python', source: 'x', executionAvailable: true });
        assert.strictEqual(r.status, 'runtime_error', 'runtime error detected');

        // 7h: compile error short-circuits
        require.cache[dockerPath].exports.executeInSandbox = async () => ({
            status: 'compile_error', message: "error: expected ';'",
            passedTests: 0, totalTests: 3, durationMs: 300
        });
        r = await codingService.evaluateSubmission({ question, language: 'C', source: 'x', executionAvailable: true });
        assert.strictEqual(r.status, 'compile_error', 'compile error surfaced');
        assert.strictEqual(r.passedTests, 0, 'compile error passes nothing');

        // 7i: XP maths
        const xp = codingService.calculateCodingXp({ problems: [{ status: 'accepted', passedHiddenTests: 2, passedSampleTests: 1 }] });
        assert.ok(xp > 0, 'accepted problem earns XP');
        assert.strictEqual(codingService.calculateCodingXp({ problems: [{ status: 'not_executed' }] }), 0, 'not_executed earns no XP');

        require.cache[dockerPath].exports.executeInSandbox = realExecute;
        logPass(7, 'Verdicts: not_executed, skipped, unsupported, wrong_answer, accepted, timeout, runtime_error, compile_error + XP maths');
    } catch (e) { logFail(7, 'Evaluation verdicts', e); }
// ---- 8. Hidden test cases never projected ----
    try {
        const docs = await Question.find({ company: 'Wipro', questionType: 'coding' }).lean();
        assert.ok(docs.length >= 2, 'need coding questions');
        for (const d of docs) {
            const pub = codingRouter.toPublicProblem(d);
            assert.ok(!('testCases' in pub), `${d.problemTitle}: testCases leaked`);
            assert.strictEqual(typeof pub.hiddenCaseCount, 'number', 'hiddenCaseCount must be a number');
            const visible = (d.testCases || []).filter(tc => !tc.isHidden);
            assert.strictEqual((pub.samples || []).length, visible.length, 'only visible cases are projected');
            (pub.samples || []).forEach(s => {
                assert.ok(visible.some(tc => tc.input === s.input && tc.output === s.output), 'projected sample must be visible');
            });
        }
        logPass(8, `Hidden test cases stay server-side for all ${docs.length} coding problems`);
    } catch (e) { logFail(8, 'Hidden test-case projection', e); }
// Shared HTTP client so tests 9 and 10 can run independently.
    let req = null;
    let email = null;
    let res = null;

    // ---- 9. HTTP: coding page rendering + Phase 2 regression ----
    try {
        const envConfig = require('../backend/config/env');
        require('../frontend/app');
        await new Promise(r => setTimeout(r, 1500));

        let cookie = '';
        req = function (method, path, body) {
            return new Promise((resolve, reject) => {
                const headers = {};
                if (cookie) headers.Cookie = cookie;
                let payload = null;
                if (body) {
                    payload = new URLSearchParams(body).toString();
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    headers['Content-Length'] = Buffer.byteLength(payload);
                }
                const r = http.request({ host: '127.0.0.1', port: envConfig.port, method, path, headers }, rq => {
                    const sc = rq.headers['set-cookie'];
                    if (sc) cookie = sc.map(c => c.split(';')[0]).join('; ');
                    let d = '';
                    rq.on('data', c => { d += c; });
                    rq.on('end', () => resolve({ status: rq.statusCode, location: rq.headers.location || '', body: d }));
                });
                r.on('error', reject);
                if (payload) r.write(payload);
                r.end();
            });
        };

        email = `coding_e2e_${Date.now()}@aptitudepro.com`;
        await req('POST', '/register', { name: 'Coding E2E', email, password: 'Password123!', confirm: 'Password123!' });
        res = await req('POST', '/login', { email, password: 'Password123!' });
        assert.strictEqual(res.status, 302, 'login must work');

        res = await req('GET', '/wipro/coding');
        assert.strictEqual(res.status, 200, 'coding page status');
        assert.ok(res.body.includes('Wipro Coding Mock Test'), 'title missing');
        assert.ok(res.body.includes('data-limit="3600"'), 'must be a 60 minute test');
        assert.ok(res.body.includes('data-deadline='), 'server deadline embedded (Phase 13)');

        const panelCount = (res.body.match(/class="card problem-panel"/g) || []).length;
        const editorCount = (res.body.match(/class="code-editor"/g) || []).length;
        assert.strictEqual(panelCount, 2, 'exactly 2 problem panels');
        assert.strictEqual(editorCount, 2, 'exactly 2 editors');
        assert.ok(!res.body.includes('Problem 3'), 'must not show a third problem');

        ['C', 'C++', 'Java', 'Python'].forEach(l => {
            assert.ok(res.body.includes(`data-lang="${l}"`), `language button missing: ${l}`);
        });
        ['Problem Statement', 'Input Format', 'Output Format', 'Constraints', 'Sample Input', 'Sample Output', 'Explanation']
            .forEach(s => assert.ok(res.body.includes(s), `missing spec section: ${s}`));

        // PHASE 2 REGRESSION: no HTML tags rendered as literal text
        ['&lt;u&gt;', '&lt;strong&gt;', '&lt;div', '&lt;span', '&lt;br'].forEach(tag => {
            assert.ok(!res.body.includes(tag), `raw HTML tag rendered as text: ${tag}`);
        });
        assert.ok(!res.body.includes('<u>not</u>'), 'the original <u>not</u> literal must never appear');

        // Editor quality
        assert.ok(res.body.includes('JetBrains Mono'), 'monospace font required');
        assert.ok(res.body.includes('white-space: pre'), 'code must not wrap');
        assert.ok(res.body.includes('min-height: 420px'), 'editor needs real height');

        // Hidden data must not reach the browser. A hidden case's input may legitimately
        // coincide with a number published in the problem text (e.g. the constraint
        // "1 <= N <= 1000000000"), so the check is scoped to the published text.
        const qidMatches = res.body.match(/data-qid="([a-f0-9]{24})"/g) || [];
        const renderedIds = qidMatches.map(m => m.split('"')[1]);
        const codingDocs = await Question.find({ _id: { $in: renderedIds } }).lean();
        const allPublished = codingDocs.map(d => [
            d.question, d.inputFormat, d.outputFormat, d.constraints, d.sampleInput, d.explanation
        ].filter(Boolean).join('\n')).join('\n');
        codingDocs.forEach(d => {
            (d.testCases || []).filter(tc => tc.isHidden).forEach(tc => {
                const input = (tc.input || '').trim();
                if (input.length >= 3 && !allPublished.includes(input)) {
                    assert.ok(!res.body.includes(input), `hidden input leaked: ${input}`);
                }
            });
        });
        assert.ok(!res.body.includes('isHidden'), 'hidden flag must not be serialised');

        logPass(9, 'HTTP: 2 problems, 60 minutes, 4 languages, all spec sections, no raw HTML tags, hidden tests absent');
    } catch (e) { logFail(9, 'HTTP coding page', e); }

    // ---- 10. Submit -> stored, result page, XP idempotency ----
    try {
        assert.ok(req && res && email, 'HTTP context available from test 9');

        const qids = (res.body.match(/data-qid="([a-f0-9]{24})"/g) || [])
            .map(m => m.match(/data-qid="([a-f0-9]{24})"/)[1]);
            assert.strictEqual(qids.length, 2, 'two problem ids on the page');

            // A malicious client also posts a fake score and a fake userId.
            const submissions = JSON.stringify([
                { questionId: qids[0], language: 'Python', code: 'n=int(input())\nprint(sum(int(d) for d in str(n)))' },
                { questionId: qids[1], language: 'C', code: '' }
            ]);
            const user = await User.findOne({ email });
            const xpBeforeSubmit = (await UserStats.findOne({ userId: user._id }))?.xp || 0;

            const post = await req('POST', '/wipro/coding/submit', {
                submissions,
                userId: '000000000000000000000000',
                score: '100',
                status: 'accepted'
            });
            assert.strictEqual(post.status, 302, `submit must redirect, got ${post.status}`);
            assert.ok(post.location.startsWith('/wipro/coding/result/'), 'redirect to result page');

            const subId = post.location.split('/').pop();
            const stored = await CodingSubmission.findById(subId).lean();
            assert.ok(stored, 'submission persisted');
            assert.strictEqual(stored.userId.toString(), user._id.toString(), 'userId taken from session, not the body');
            assert.strictEqual(stored.totalProblems, 2, 'both problems recorded');
            assert.strictEqual(stored.problems[0].code.length > 0, true, 'code stored verbatim');
            assert.strictEqual(stored.problems[1].attempted, false, 'blank submission marked not attempted');

            // Verdict must reflect REAL execution state, never the client's claim.
            const execUp = await availability.getExecutionStatus();
            if (execUp.available) {
                assert.notStrictEqual(stored.problems[0].evaluationStatus, 'skipped', 'executed code cannot be skipped');
            } else {
                assert.strictEqual(stored.problems[0].evaluationStatus, 'not_executed',
                    'with no sandbox the verdict must be not_executed');
                assert.strictEqual(stored.problems[0].score, 0, 'no score may be invented');
                assert.strictEqual(stored.xpEarned, 0, 'no XP without execution');
            }

            // XP must not be duplicated by reloading the result page.
            const historyBefore = await XPHistory.countDocuments({ userId: user._id });
            const xpAfterSubmit = (await UserStats.findOne({ userId: user._id }))?.xp || 0;
            const r1 = await req('GET', `/wipro/coding/result/${subId}`);
            const r2 = await req('GET', `/wipro/coding/result/${subId}`);
            assert.strictEqual(r1.status, 200, 'result page renders');
            assert.strictEqual(r2.status, 200, 'result page reloads');
            const historyAfter = await XPHistory.countDocuments({ userId: user._id });
            const xpAfterReload = (await UserStats.findOne({ userId: user._id }))?.xp || 0;

            assert.strictEqual(historyAfter, historyBefore, 'refreshing the result must not add XP history');
            assert.strictEqual(xpAfterReload, xpAfterSubmit, 'refreshing the result must not change XP');
            assert.ok(xpAfterSubmit >= xpBeforeSubmit, 'XP must never decrease');

            // Result page must not leak hidden data.
            assert.ok(!r1.body.includes('isHidden'), 'hidden flag not serialised on the result page');
            const q = await Question.findById(stored.problems[0].questionId).lean();
            const published = [
                q.question, q.inputFormat, q.outputFormat, q.constraints, q.sampleInput, q.sampleOutput, q.explanation
            ].filter(Boolean).join('\n');
            (q.testCases || []).filter(tc => tc.isHidden).forEach(tc => {
                const out = (tc.output || '').trim();
                if (out.length >= 6 && !published.includes(out)) {
                    assert.ok(!r1.body.includes(out), `hidden expected output leaked: ${out}`);
                }
            });

            // Cleanup
            await CodingSubmission.deleteMany({ userId: user._id });
            await User.deleteOne({ _id: user._id });

            logPass(10, 'HTTP submit: session userId, client score ignored, honest verdict, no duplicate XP on refresh, hidden data absent');
    } catch (e) { logFail(10, 'HTTP submit + XP idempotency', e); }

    console.log('\n====================================================');
    console.log(`CODING TEST SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('====================================================\n');
    return { passed, failed };
}

module.exports = run;
module.exports.runAsync = run;

if (require.main === module) {
    run().then(r => process.exit(r.failed > 0 ? 1 : 0))
        .catch(e => { console.error('Fatal:', e); process.exit(1); });
}