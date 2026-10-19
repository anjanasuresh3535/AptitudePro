// scripts/seed-questions.js
//
// AptitudePro - Production Question Bank Seeding Script (1,950 Questions Total)
// Safe & Repeatable: Uses upsert matching on (question + learningPath + placementType + company + difficultyLevel).
// NEVER drops databases or deletes existing user records, results, or history.

const path = require('path');
const mongoose = require('mongoose');
const config = require('../backend/config/env');
const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');

const schoolData = require('../backend/data/schoolQuestionsData');
const generalData = require('../backend/data/generalPlacementQuestionsData');
const companyData = require('../backend/data/companyQuestionsData');

function validateQuestion(q) {
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        return 'Missing question text';
    }
    if (!q.option1 || !q.option2 || !q.option3 || !q.option4) {
        return 'Must have 4 non-empty options';
    }
    const opts = [q.option1.toString().trim(), q.option2.toString().trim(), q.option3.toString().trim(), q.option4.toString().trim()];
    const uniqueOpts = new Set(opts);
    if (uniqueOpts.size !== 4) {
        return `Duplicate options in question: "${q.question}"`;
    }
    const ans = (q.answer || '').toString().trim();
    if (!opts.includes(ans) && !['A', 'B', 'C', 'D'].includes(ans)) {
        return `Answer "${ans}" does not match any of the 4 options`;
    }
    if (![1, 2, 3].includes(Number(q.difficultyLevel))) {
        return 'Invalid difficulty level (must be 1, 2, or 3)';
    }
    if (!q.learningPath || !['school', 'college'].includes(q.learningPath)) {
        return 'Invalid learningPath (must be school or college)';
    }
    return null;
}

async function seedAllQuestions() {
    console.log('🌱 Starting AptitudePro Comprehensive Question Seeding (1,950 Target)...\n');
    await connectDB();

    const allItems = [...schoolData, ...generalData, ...companyData];
    console.log(`📦 Loaded ${allItems.length} raw questions from data files.`);
    console.log(`   - School: ${schoolData.length}`);
    console.log(`   - General Placement: ${generalData.length}`);
    console.log(`   - Company Practice: ${companyData.length}\n`);

    let inserted = 0;
    let updated = 0;
    let invalid = 0;

    for (const q of allItems) {
        const errorMsg = validateQuestion(q);
        if (errorMsg) {
            console.error(`❌ Skipped invalid question: "${q.question}" - ${errorMsg}`);
            invalid++;
            continue;
        }

        const filter = {
            question: q.question.trim(),
            learningPath: q.learningPath,
            placementType: q.placementType || 'general',
            company: q.company || null,
            difficultyLevel: Number(q.difficultyLevel)
        };

        const updateDoc = {
            $set: {
                section: q.section || 'Mixed',
                subject: q.subject || q.section || 'General Aptitude',
                category: q.category || 'General',
                option1: q.option1.toString().trim(),
                option2: q.option2.toString().trim(),
                option3: q.option3.toString().trim(),
                option4: q.option4.toString().trim(),
                answer: q.answer.toString().trim(),
                explanation: q.explanation || `The correct answer is ${q.answer}.`,
                stepSolution: q.stepSolution || '',
                formulaUsed: q.formulaUsed || '',
                quickTrick: q.quickTrick || '',
                commonMistake: q.commonMistake || ''
            }
        };

        const res = await Question.updateOne(filter, updateDoc, { upsert: true });
        if (res.upsertedCount > 0) {
            inserted++;
        } else if (res.modifiedCount > 0) {
            updated++;
        }
    }

    console.log('\n====================================================');
    console.log('            SEEDING EXECUTION RESULTS SUMMARY        ');
    console.log('====================================================');
    console.log(`✅ Newly Upserted: ${inserted}`);
    console.log(`🔄 Updated Existing: ${updated}`);
    console.log(`❌ Invalid Skipped: ${invalid}`);

    const grandTotal = await Question.countDocuments();
    console.log(`\n🎉 GRAND TOTAL QUESTIONS IN MONGODB: ${grandTotal}\n`);

    await mongoose.connection.close();
    process.exit(invalid === 0 ? 0 : 1);
}

if (require.main === module) {
    seedAllQuestions().catch(err => {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    });
}

module.exports = seedAllQuestions;
