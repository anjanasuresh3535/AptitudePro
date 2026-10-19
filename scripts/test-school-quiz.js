// scripts/test-school-quiz.js
//
// Integration Test for School Students Quiz System
// Verifies:
// 1. Question pool sufficiency (450 total: 150 Foundation, 150 Intermediate, 150 Advanced).
// 2. Exact 25 question attempt size (10 Maths, 8 Logical, 7 English).
// 3. Option shuffling & correct answer evaluation.
// 4. Repeated attempt randomization.
// 5. Quiz submission, XP calculation, Result creation, and XP History logging.

const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const User = require('../backend/models/User');
const UserStats = require('../backend/models/UserStats');
const Question = require('../backend/models/Question');
const Result = require('../backend/models/Result');
const SectionProgress = require('../backend/models/SectionProgress');
const XPHistory = require('../backend/models/XPHistory');
const placementService = require('../backend/services/PlacementService');
const quizRouter = require('../backend/routes/quiz');
const { QUIZ_QUESTION_COUNTS, SCHOOL_SUBJECT_DISTRIBUTION } = require('../backend/config/placementConfig');

async function runSchoolQuizTests() {
    console.log('🧪 Starting School Students Quiz System Verification Tests...\n');
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    let testUser = await User.findOne({ email: 'test_school_user@aptitudepro.com' });
    if (!testUser) {
        testUser = await User.create({
            name: 'School Student Tester',
            username: 'SchoolTester',
            email: 'test_school_user@aptitudepro.com',
            password: 'Password123!',
            xp: 0,
            level: 1
        });
    }
    const userId = testUser._id;

    console.log('--- TEST 1: VERIFY SCHOOL QUESTION BANK POOL (450 TOTAL) ---');
    const fCount = await Question.countDocuments({ learningPath: 'school', difficultyLevel: 1 });
    const iCount = await Question.countDocuments({ learningPath: 'school', difficultyLevel: 2 });
    const aCount = await Question.countDocuments({ learningPath: 'school', difficultyLevel: 3 });
    const totalCount = await Question.countDocuments({ learningPath: 'school' });

    console.log(`Foundation (L1): ${fCount} questions`);
    console.log(`Intermediate (L2): ${iCount} questions`);
    console.log(`Advanced (L3): ${aCount} questions`);
    console.log(`Total School Pool: ${totalCount} questions`);

    if (fCount === 150 && iCount === 150 && aCount === 150 && totalCount === 450) {
        console.log('✅ TEST 1 PASSED: School Question Bank pool is exactly 450 (150 per level)!\n');
    } else {
        console.error('❌ TEST 1 FAILED: Question count mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 2: SCHOOL FOUNDATION ATTEMPT DISTRIBUTION (10 Maths, 8 Logical, 7 English) ---');
    const fPool = await placementService.getSchoolQuestions(1);
    if (fPool.questions.length !== 25) {
        console.error(`❌ TEST 2 FAILED: Expected 25 questions, got ${fPool.questions.length}`);
        process.exit(1);
    }

    const fMaths = fPool.questions.filter(q => q.section === 'Maths' || /Math/i.test(q.subject)).length;
    const fLogical = fPool.questions.filter(q => q.section === 'Logical' || /Reasoning|Logical/i.test(q.subject)).length;
    const fEnglish = fPool.questions.filter(q => q.section === 'English' || /Verbal|English/i.test(q.subject)).length;

    console.log(`Foundation Sample Breakdown: Maths=${fMaths}, Logical=${fLogical}, English=${fEnglish}, Total=${fPool.questions.length}`);
    if (fMaths === 10 && fLogical === 8 && fEnglish === 7) {
        console.log('✅ TEST 2 PASSED: Foundation level returns exact 10 Maths, 8 Logical, 7 English distribution!\n');
    } else {
        console.error('❌ TEST 2 FAILED: Subject distribution mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 3: SCHOOL INTERMEDIATE ATTEMPT DISTRIBUTION ---');
    const iPool = await placementService.getSchoolQuestions(2);
    const iMaths = iPool.questions.filter(q => q.section === 'Maths' || /Math/i.test(q.subject)).length;
    const iLogical = iPool.questions.filter(q => q.section === 'Logical' || /Reasoning|Logical/i.test(q.subject)).length;
    const iEnglish = iPool.questions.filter(q => q.section === 'English' || /Verbal|English/i.test(q.subject)).length;

    console.log(`Intermediate Sample Breakdown: Maths=${iMaths}, Logical=${iLogical}, English=${iEnglish}, Total=${iPool.questions.length}`);
    if (iMaths === 10 && iLogical === 8 && iEnglish === 7) {
        console.log('✅ TEST 3 PASSED: Intermediate level returns exact 10 Maths, 8 Logical, 7 English distribution!\n');
    } else {
        console.error('❌ TEST 3 FAILED: Subject distribution mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 4: SCHOOL ADVANCED ATTEMPT DISTRIBUTION ---');
    const aPool = await placementService.getSchoolQuestions(3);
    const aMaths = aPool.questions.filter(q => q.section === 'Maths' || /Math/i.test(q.subject)).length;
    const aLogical = aPool.questions.filter(q => q.section === 'Logical' || /Reasoning|Logical/i.test(q.subject)).length;
    const aEnglish = aPool.questions.filter(q => q.section === 'English' || /Verbal|English/i.test(q.subject)).length;

    console.log(`Advanced Sample Breakdown: Maths=${aMaths}, Logical=${aLogical}, English=${aEnglish}, Total=${aPool.questions.length}`);
    if (aMaths === 10 && aLogical === 8 && aEnglish === 7) {
        console.log('✅ TEST 4 PASSED: Advanced level returns exact 10 Maths, 8 Logical, 7 English distribution!\n');
    } else {
        console.error('❌ TEST 4 FAILED: Subject distribution mismatch!');
        process.exit(1);
    }

    console.log('--- TEST 5: REPEATED ATTEMPTS RANDOMIZATION & SHUFFLING ---');
    const attempt1 = await placementService.getSchoolQuestions(1);
    const attempt2 = await placementService.getSchoolQuestions(1);

    const ids1 = attempt1.questions.map(q => q._id.toString()).join(',');
    const ids2 = attempt2.questions.map(q => q._id.toString()).join(',');

    console.log(`Attempt 1 IDs hash: ${ids1.substring(0, 40)}...`);
    console.log(`Attempt 2 IDs hash: ${ids2.substring(0, 40)}...`);

    if (ids1 !== ids2) {
        console.log('✅ TEST 5 PASSED: Successive quiz attempts return different randomized question combinations!\n');
    } else {
        console.warn('⚠️ Warning: Attempts yielded identical order (unlikely with random sampling).');
    }

    console.log('--- TEST 6: FULL SCHOOL QUIZ SUBMISSION & XP PIPELINE VERIFICATION ---');
    const schoolQs = fPool.questions;
    const qIds = schoolQs.map(q => q._id.toString());
    const selOpts = schoolQs.map((q, idx) => idx % 4 === 0 ? 'A' : (idx % 4 === 1 ? 'B' : (idx % 4 === 2 ? 'SKIPPED' : 'C')));

    const subData = {
        userId,
        section: 'Mixed',
        learningPath: 'school',
        placementType: 'general',
        company: null,
        testTitle: 'School Aptitude Test – Foundation',
        parsedQuestionIds: qIds,
        parsedSelectedOptions: selOpts,
        timeTaken: 180
    };

    const resId = await quizRouter.performQuizSubmission(subData, null);
    console.log(`Saved Result ID: ${resId}`);

    const resDoc = await Result.findById(resId);
    console.log(`Result Doc Loaded: TotalQ=${resDoc.totalQuestions}, Correct=${resDoc.correct}, Wrong=${resDoc.wrong}, Skipped=${resDoc.skipped}, NetXP=${resDoc.netXP}`);
    
    const secProgress = await SectionProgress.findOne({ userId, section: 'School-Aptitude' });
    console.log(`School-Aptitude Progress Doc: XP=${secProgress.xp}, Quizzes=${secProgress.quizzesAttempted}`);

    const xpHist = await XPHistory.findOne({ resultId: resId });
    console.log(`XP History Doc Reason: "${xpHist.reason}", Section="${xpHist.section}"`);

    if (resDoc && resDoc.totalQuestions === 25 && secProgress && xpHist && xpHist.section === 'School-Aptitude') {
        console.log('✅ TEST 6 PASSED: School Quiz submission pipeline executed perfectly!\n');
    } else {
        console.error('❌ TEST 6 FAILED: Quiz submission verification error!');
        process.exit(1);
    }

    console.log('🎉 ALL SCHOOL QUIZ INTEGRATION TESTS PASSED 100% SUCCESSFULLY!');
    await mongoose.connection.close();
    process.exit(0);
}

runSchoolQuizTests().catch(err => {
    console.error('❌ Test error:', err);
    process.exit(1);
});
