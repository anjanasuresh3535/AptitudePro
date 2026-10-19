const assert = require('assert');
const bcrypt = require('bcryptjs');
const config = require('../backend/config/env');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const CodingSubmission = require('../backend/models/CodingSubmission');
const Activity = require('../backend/models/CapgeminiAttempt');
const SectionProgress = require('../backend/models/SectionProgress');
const UserStats = require('../backend/models/UserStats');
const XPHistory = require('../backend/models/XPHistory');
const { TECH_MAHINDRA_SECTIONS, PSYCHOMETRIC_QUESTIONS, COMMUNICATION_ACTIVITIES } = require('../backend/config/techMahindraConfig');
const { records, codingProblems } = require('../scripts/seed-tech-mahindra');

async function run() {
    let user;
    try {
        const expected = { logical: 12, quantitative: 12, verbal: 15, programming: 12, cs: 12 };
        for (const [key, count] of Object.entries(expected)) {
            const section = TECH_MAHINDRA_SECTIONS[key];
            const items = records.filter(item => item.category === section.category);
            assert.strictEqual(items.length, count, `${key} seed has configured count`);
            for (const item of items) assert.strictEqual(new Set([item.option1,item.option2,item.option3,item.option4]).size, 4, `distinct options: ${item.question}`);
            for (const item of items) assert.ok([item.option1,item.option2,item.option3,item.option4].includes(item.answer), `valid answer key: ${item.question}`);
        }
        assert.strictEqual(PSYCHOMETRIC_QUESTIONS.length, 72);
        assert.strictEqual(COMMUNICATION_ACTIVITIES.length, 18);
        assert.strictEqual(codingProblems.length, 2);
        await connectDB();
        const count = await Question.countDocuments({ company: 'Tech Mahindra', category: { $regex: /^Tech Mahindra / }, questionType: { $in: ['mcq','coding'] }, active: { $ne: false } });
        assert.strictEqual(count, records.length + codingProblems.length, 'seeded bank is present in the database');
        const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`, password = 'TechMahindraTest123!';
        user = await User.create({ name: 'Tech Mahindra E2E', email: `tech-mahindra-${suffix}@aptitudepro.test`, password: await bcrypt.hash(password, 4) });
        require('../frontend/app');
        const base = () => `http://127.0.0.1:${config.port}`;
        let health; for (let n=0;n<40;n++) { try { health=await fetch(`${base()}/health`); if(health.ok)break; } catch(_){} await new Promise(r=>setTimeout(r,250)); }
        assert.ok(health?.ok, 'app starts');
        const login = await fetch(`${base()}/login`, { method:'POST', redirect:'manual', headers:{'content-type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({email:user.email,password}) });
        const cookie=login.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie,'user login works');
        const page=async path=>{const response=await fetch(`${base()}${path}`,{headers:{cookie}});return{response,html:await response.text()};};
        const directory=await page('/placement/college/company'); assert.match(directory.html,/<strong>65<\/strong> objective and coding questions/);
        const dashboard=await page('/placement/college/company/tech-mahindra'); assert.strictEqual(dashboard.response.status,200);
        assert.ok(dashboard.html.includes('Configurable AptitudePro practice defaults') && dashboard.html.includes('Communication Practice') && dashboard.html.includes('HR Interview Preparation'));
        for(const key of Object.keys(expected)){
            const quiz=await page(`/quiz?learningPath=college&placementType=company&company=tech-mahindra&mode=tech-mahindra&sectionKey=${key}`);
            assert.strictEqual(quiz.response.status,200,`${key} route works`);
            const ids=JSON.parse(quiz.html.match(/data-question-ids='([^']+)'/)?.[1]||'[]'); assert.strictEqual(ids.length,expected[key]);
            assert.ok(!quiz.html.includes('data-correct='),'answer key is not client-visible');
            if(key==='logical'){
                const submit=await fetch(`${base()}/quiz/submit-quiz`,{method:'POST',redirect:'manual',headers:{cookie,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({section:'Logical',learningPath:'college',placementType:'company',company:'Tech Mahindra',testTitle:'Tech Mahindra Logical Ability',questionIds:JSON.stringify(ids),selectedOptions:JSON.stringify(Array(ids.length).fill('SKIPPED')),timeTaken:'10',essayTexts:'[]'})});
                assert.strictEqual(submit.status,302,'shared server-scored result accepts Tech Mahindra assessment');
                const saved=await Result.findOne({userId:user._id,company:'Tech Mahindra',assessmentId:'Company-tech-mahindra-logical'}).lean(); assert.ok(saved&&saved.totalQuestions===12&&saved.skipped===12,'objective result is persisted with company and section');
            }
        }
        const essay=await page('/tech-mahindra/essay'); assert.strictEqual(essay.response.status,200); assert.ok(essay.html.includes('200–400 words')&&essay.html.includes('wordcount'));
        const essayAttempt=essay.html.match(/id="attemptId" value="([^"]+)"/)?.[1], essayId=essay.html.match(/data-id="([^"]+)"/)?.[1]; assert.ok(essayAttempt&&essayId);
        const draft=await fetch(`${base()}/tech-mahindra/activity/essay/draft`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({attemptId:essayAttempt,responses:{[essayId]:'A saved draft for the test.'}})}); assert.ok(draft.ok);
        const resumed=await page('/tech-mahindra/essay'); assert.ok(resumed.html.includes('A saved draft for the test.'),'essay draft resumes');
        const finish=await fetch(`${base()}/tech-mahindra/activity/essay/submit`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({attemptId:essayAttempt,responses:{[essayId]:'A saved draft for the test.',__selfReview:['Relevant to the topic']}})});
        const finished=await finish.json(); assert.ok(finished.ok&&finished.redirect,'essay submission is saved');
        const review=await page(finished.redirect); assert.strictEqual(review.response.status,200); assert.ok(review.html.includes('A saved draft for the test.')&&review.html.includes('No subjective score was generated'));
        const psych=await page('/tech-mahindra/psychometric'); assert.strictEqual(new Set([...psych.html.matchAll(/name="(tm-psych-[^"]+)"/g)].map(match=>match[1])).size,72); assert.ok(psych.html.includes('not scored'));
        const comm=await page('/tech-mahindra/communication'); assert.strictEqual(comm.response.status,200); assert.ok(comm.html.includes('text practice alternative')&&comm.html.includes('Start local recording'));
        const ti=await page('/tech-mahindra/interview/technical'); assert.ok(ti.response.ok&&ti.html.includes('Reveal suggested answer'));
        const hr=await page('/tech-mahindra/interview/hr'); assert.ok(hr.response.ok&&hr.html.includes('Why this role?'));
        const coding=await page('/tech-mahindra/coding'); assert.strictEqual(coding.response.status,200); assert.ok(coding.html.includes('Longest Increasing Run')&&coding.html.includes('Balanced Brackets'));
        assert.ok(!coding.html.includes('([)]')&&!coding.html.includes('isHidden'),'hidden tests remain private');
        console.log('PASS: Tech Mahindra content, dashboard, five scored quiz sections, essay draft resume, psychometric/communication/interview activities, coding view and hidden-test privacy');
    } finally {
        if(user) await Promise.all([Result.deleteMany({userId:user._id,company:'Tech Mahindra'}),CodingSubmission.deleteMany({userId:user._id,company:'Tech Mahindra'}),Activity.deleteMany({userId:user._id,company:'Tech Mahindra'}),SectionProgress.deleteMany({userId:user._id,section:/^Company-tech-mahindra-/}),XPHistory.deleteMany({userId:user._id}),UserStats.deleteOne({userId:user._id}),User.deleteOne({_id:user._id})]);
        mongoose.connection.removeAllListeners('disconnected'); await mongoose.disconnect();
    }
}
run().then(()=>process.exit(0)).catch(error=>{console.error('Tech Mahindra test failed:',error);process.exit(1);});
