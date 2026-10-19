// scripts/seed-school-questions.js
//
// Comprehensive Seed Script for School Students Question Bank (450 Questions Total)
// Foundation (L1): 50 Maths, 50 Logical, 50 English = 150
// Intermediate (L2): 50 Maths, 50 Logical, 50 English = 150
// Advanced (L3): 50 Maths, 50 Logical, 50 English = 150

const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const schoolQuestionsData = require('../backend/data/schoolQuestionsData');

// Normalize question text for duplication check
function normalizeText(text) {
    return (text || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Validate single question doc
function validateQuestion(q) {
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) return 'Missing question text';
    if (!q.option1 || !q.option2 || !q.option3 || !q.option4) return 'Must have 4 non-empty options';
    const opts = [q.option1.trim(), q.option2.trim(), q.option3.trim(), q.option4.trim()];
    const uniqueOpts = new Set(opts);
    if (uniqueOpts.size !== 4) return 'Options must be unique';
    
    const ans = (q.answer || '').trim();
    const isAnswerInOpts = opts.includes(ans) || ['A', 'B', 'C', 'D'].includes(ans);
    if (!isAnswerInOpts) return `Answer "${ans}" does not match any of the 4 options`;
    
    if (![1, 2, 3].includes(q.difficultyLevel)) return 'Invalid difficulty level (must be 1, 2, or 3)';
    if (!['Maths', 'Logical', 'English'].includes(q.section)) return 'Invalid section';
    return null;
}

async function seedSchoolQuestions() {
    console.log('🌱 Starting School Question Bank Seeding (450 Questions)...\n');
    await connectDB();

    console.log(`Loaded ${schoolQuestionsData.length} questions from data bank.`);

    // Clear existing school questions to ensure clean 450 pool
    const deletedResult = await Question.deleteMany({ learningPath: 'school' });
    console.log(`Cleaned existing school questions: ${deletedResult.deletedCount} removed.`);

    let insertedCount = 0;
    let invalidCount = 0;

    for (const qData of schoolQuestionsData) {
        const errorMsg = validateQuestion(qData);
        if (errorMsg) {
            console.error(`❌ Invalid question skipped: "${qData.question}" - ${errorMsg}`);
            invalidCount++;
            continue;
        }

        await Question.create(qData);
        insertedCount++;
    }

    console.log('\n--- SEEDING RESULTS SUMMARY ---');
    console.log(`✅ Newly Inserted: ${insertedCount}`);
    console.log(`❌ Invalid Skipped: ${invalidCount}`);

    // Verify current DB breakdown
    console.log('\n--- CURRENT SCHOOL QUESTION BANK STATUS ---');
    for (const diff of [1, 2, 3]) {
        const diffName = diff === 1 ? 'Foundation' : (diff === 2 ? 'Intermediate' : 'Advanced');
        const m = await Question.countDocuments({ learningPath: 'school', difficultyLevel: diff, $or: [{ section: 'Maths' }, { subject: /Math/i }] });
        const l = await Question.countDocuments({ learningPath: 'school', difficultyLevel: diff, $or: [{ section: 'Logical' }, { subject: /Reasoning|Logical/i }] });
        const e = await Question.countDocuments({ learningPath: 'school', difficultyLevel: diff, $or: [{ section: 'English' }, { subject: /Verbal|English/i }] });
        const tot = await Question.countDocuments({ learningPath: 'school', difficultyLevel: diff });
        console.log(`Level ${diff} (${diffName}): Total = ${tot} [Maths: ${m}, Logical: ${l}, English: ${e}]`);
    }

    const grandTotal = await Question.countDocuments({ learningPath: 'school' });
    console.log(`\n🎉 TOTAL SCHOOL QUESTIONS IN DB: ${grandTotal}`);

    await mongoose.connection.close();
    process.exit(0);
}

if (require.main === module) {
    seedSchoolQuestions().catch(err => {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    });
}

module.exports = seedSchoolQuestions;
