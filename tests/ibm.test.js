const assert = require('assert');
const bcrypt = require('bcryptjs');
const net = require('net');
const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const Activity = require('../backend/models/CapgeminiAttempt');
const CodingSubmission = require('../backend/models/CodingSubmission');
const SectionProgress = require('../backend/models/SectionProgress');
const UserStats = require('../backend/models/UserStats');
const XPHistory = require('../backend/models/XPHistory');
const { IBM_SECTIONS, IBM_GROUP_TOPICS, IBM_TECHNICAL_QUESTIONS, IBM_HR_QUESTIONS } = require('../backend/config/ibmConfig');
const { mcqs, codingProblems } = require('../scripts/seed-ibm');

async function run() {
  let user;
  try {
    assert.strictEqual(mcqs.length, IBM_SECTIONS.english.count);
    assert.strictEqual(codingProblems.length, IBM_SECTIONS.coding.count);
    for (const item of mcqs) {
      const options = [item.option1, item.option2, item.option3, item.option4];
      assert.strictEqual(new Set(options).size, 4, 'English choices are distinct');
      assert.ok(options.includes(item.answer), 'English answer key matches an option');
      assert.ok(item.explanation, 'English item includes an explanation');
    }
    assert.strictEqual(IBM_GROUP_TOPICS.length, IBM_SECTIONS.groupDiscussion.count);
    assert.strictEqual(IBM_TECHNICAL_QUESTIONS.length, IBM_SECTIONS.technicalInterview.count);
    assert.strictEqual(IBM_HR_QUESTIONS.length, IBM_SECTIONS.hrInterview.count);
    assert.strictEqual(codingProblems[0].difficulty, 'Medium');
    assert.strictEqual(codingProblems[1].difficulty, 'Hard');
    assert.ok(codingProblems.every(p => p.testCases.some(t => !t.isHidden) && p.testCases.some(t => t.isHidden)));
    const intervalLines = codingProblems[0].sampleInput.split('\n'), intervalCount = Number(intervalLines[0]);
    const merged = intervalLines.slice(1, intervalCount + 1).map(line => line.split(' ').map(Number)).sort((a, b) => a[0] - b[0]).reduce((out, current) => {
      const last = out[out.length - 1]; if (last && current[0] <= last[1]) last[1] = Math.max(last[1], current[1]); else out.push([...current]); return out;
    }, []).map(pair => pair.join(' ')).join('\n');
    assert.strictEqual(merged, codingProblems[0].sampleOutput, 'merged-interval sample output is verified');
    const coinInput = codingProblems[1].sampleInput.split('\n'), coins = coinInput[1].split(' ').map(Number), target = Number(coinInput[2]), dp = Array(target + 1).fill(Infinity); dp[0] = 0;
    for (let amount = 1; amount <= target; amount++) for (const coin of coins) if (coin <= amount) dp[amount] = Math.min(dp[amount], dp[amount - coin] + 1);
    assert.strictEqual(String(dp[target]), codingProblems[1].sampleOutput, 'minimum-coins sample output is verified');

    await connectDB();
    const seededEnglish = await Question.countDocuments({ company: 'IBM', category: IBM_SECTIONS.english.category, active: { $ne: false } });
    const seededCoding = await Question.countDocuments({ company: 'IBM', category: IBM_SECTIONS.coding.category, questionType: 'coding', active: { $ne: false } });
    assert.strictEqual(seededEnglish, 10, 'the dedicated English pool is isolated and complete');
    assert.strictEqual(seededCoding, 2, 'the dedicated coding pool is isolated and complete');

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`, password = 'IBMModuleTest123!';
    user = await User.create({ name: 'IBM Module Test', email: `ibm-${suffix}@aptitudepro.test`, password: await bcrypt.hash(password, 4) });
    const portProbe = net.createServer();
    await new Promise((resolve, reject) => portProbe.once('error', reject).listen(0, '127.0.0.1', resolve));
    const testPort = portProbe.address().port;
    await new Promise((resolve, reject) => portProbe.close(error => error ? reject(error) : resolve()));
    config.port = testPort;
    require('../frontend/app');
    const base = () => `http://127.0.0.1:${testPort}`;
    let health;
    for (let n = 0; n < 50; n++) { try { health = await fetch(`${base()}/health`); if (health.ok) break; } catch (_) {} await new Promise(r => setTimeout(r, 250)); }
    assert.ok(health?.ok, 'app starts');
    const login = await fetch(`${base()}/login`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: user.email, password }) });
    const cookie = login.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie, 'test user can log in');
    const page = async path => { const response = await fetch(`${base()}${path}`, { headers: { cookie } }); return { response, html: await response.text() }; };
    const directory = await page('/placement/college/company'); assert.match(directory.html, /IBM/);
    const dashboard = await page('/placement/college/company/ibm'); assert.strictEqual(dashboard.response.status, 200); assert.ok(dashboard.html.includes('English Language Test') && dashboard.html.includes('Group Discussion Practice'));
    const coding = await page('/ibm/coding'); assert.strictEqual(coding.response.status, 200); assert.ok(coding.html.includes('Merge Overlapping Intervals') && coding.html.includes('Minimum Coin Count'));
    assert.ok(!coding.html.includes('4\n1 4\n4 7') && !coding.html.includes('2\n2 4\n7'), 'hidden test data stays on server');
    const codingAttempt = coding.html.match(/attempt='([^']+)'/)?.[1];
    const codingIds = [...coding.html.matchAll(/class="qid" value="([^"]+)"/g)].map(m => m[1]);
    assert.ok(codingAttempt && codingIds.length === 2, 'coding attempt has two separate problems');
    for (let i = 0; i < codingIds.length; i++) {
      const draftCode = `// IBM draft ${i + 1}`;
      const draftResponse = await fetch(`${base()}/ibm/coding/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: codingAttempt, questionId: codingIds[i], language: 'C++', code: draftCode }) });
      assert.strictEqual(draftResponse.status, 200, `problem ${i + 1} draft saves`);
    }
    const resumedCoding = await page('/ibm/coding');
    assert.ok(resumedCoding.html.includes('// IBM draft 1') && resumedCoding.html.includes('// IBM draft 2'), 'drafts persist separately across the two problems and page refresh');
    const gd = await page('/ibm/group-discussion'); assert.strictEqual(gd.response.status, 200); assert.ok(gd.html.includes('Supporting points') && gd.html.includes('Opposing considerations') && gd.html.includes('Topic category'));
    const gdAttempt = gd.html.match(/id="attemptId" value="([^"]+)"/)?.[1], gdTopic = gd.html.match(/data-topic="([^"]+)"/)?.[1]; assert.ok(gdAttempt && gdTopic);
    const gdDraft = await fetch(`${base()}/ibm/activity/groupDiscussion/draft`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: gdAttempt, responses: { [gdTopic]: 'My opening statement and supporting example.', __selfReview: ['Relevant to the topic'] } }) });
    assert.strictEqual(gdDraft.status, 200, 'group discussion response can be saved');
    const gdResume = await page('/ibm/group-discussion'); assert.ok(gdResume.html.includes('My opening statement and supporting example.'), 'group discussion draft resumes after refresh');
    const gdSubmit = await fetch(`${base()}/ibm/activity/groupDiscussion/submit`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ attemptId: gdAttempt, responses: { [gdTopic]: 'My opening statement and supporting example.', __selfReview: ['Relevant to the topic'] } }) });
    const gdSaved = await gdSubmit.json(); assert.ok(gdSaved.ok && gdSaved.redirect, 'group discussion is saved without an objective grade');
    const gdReview = await page(gdSaved.redirect); assert.strictEqual(gdReview.response.status, 200); assert.ok(gdReview.html.includes('No subjective score was generated'));
    const technical = await page('/ibm/interview/technical'); assert.strictEqual(technical.response.status, 200); assert.ok(technical.html.includes('Reveal suggested answer structure'));
    const hr = await page('/ibm/interview/hr'); assert.strictEqual(hr.response.status, 200); assert.ok(hr.html.includes('Tell me about yourself') && hr.html.includes('Self-review'));

    const quiz = await page('/quiz?learningPath=college&placementType=company&company=ibm&mode=ibm&sectionKey=english');
    assert.strictEqual(quiz.response.status, 200); assert.ok(quiz.html.includes('10') && quiz.html.includes('No negative marking'));
    const ids = JSON.parse(quiz.html.match(/data-question-ids='([^']+)'/)?.[1] || '[]'); assert.strictEqual(ids.length, 10);
    assert.ok(!quiz.html.includes('data-correct='), 'correct answers are not exposed in the quiz page');
    const submitted = await fetch(`${base()}/quiz/submit-quiz`, { method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ section: 'English', learningPath: 'college', placementType: 'company', company: 'IBM', testTitle: 'IBM English Language Test', questionIds: JSON.stringify(ids), selectedOptions: JSON.stringify(Array(ids.length).fill('SKIPPED')), timeTaken: '15', essayTexts: '[]' }) });
    assert.strictEqual(submitted.status, 302, 'server accepts a valid IBM quiz attempt');
    const saved = await Result.findOne({ userId: user._id, company: 'IBM', assessmentId: 'Company-ibm-english' }).lean();
    assert.ok(saved && saved.totalQuestions === 10 && saved.skipped === 10 && saved.xpLost === 0, 'objective result is stored with company and section identifiers and no skip penalty');
    const review = await page('/ibm/history'); assert.strictEqual(review.response.status, 200);
    console.log('PASS: IBM bank validation, company dashboard, 10-question English quiz and server scoring, independent coding drafts/privacy, discussion drafts/review, interview pages and history.');
  } finally {
    if (user) await Promise.all([
      Result.deleteMany({ userId: user._id, company: 'IBM' }), CodingSubmission.deleteMany({ userId: user._id, company: 'IBM' }),
      Activity.deleteMany({ userId: user._id, company: 'IBM' }), SectionProgress.deleteMany({ userId: user._id, section: /^Company-ibm-/ }),
      XPHistory.deleteMany({ userId: user._id }), UserStats.deleteOne({ userId: user._id }), User.deleteOne({ _id: user._id })
    ]);
    mongoose.connection.removeAllListeners('disconnected'); await mongoose.disconnect();
  }
}
run().then(() => process.exit(0)).catch(error => { console.error('IBM module test failed:', error); process.exit(1); });
