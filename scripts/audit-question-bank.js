// scripts/audit-question-bank.js
//
// Comprehensive Audit Tool for AptitudePro Question Bank (33 Pools)
// Verifies exact DB counts, option uniqueness, valid answer alignment, explanations, and metadata.

const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const { COMPANY_LIST } = require('../backend/config/placementConfig');

async function auditQuestionBank() {
    console.log('🔍 Starting AptitudePro Comprehensive Question Bank Audit...\n');
    await connectDB();

    const allQuestions = await Question.find({});
    console.log(`📊 Total Question Documents in DB: ${allQuestions.length}\n`);

    let duplicateCount = 0;
    let missingAnswerCount = 0;
    let duplicateOptionsCount = 0;
    let invalidDifficultyCount = 0;
    let missingExplanationCount = 0;
    let incompleteMetadataCount = 0;
    let insufficientPoolsCount = 0;

    const seenTextMap = new Map();

    for (const q of allQuestions) {
        const isMCQ = !q.questionType || q.questionType === 'mcq';
        const norm = (q.question || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const opts = [q.option1, q.option2, q.option3, q.option4].map(o => (o || '').toString().trim());
        const normOpts = isMCQ ? opts.map(o => o.toLowerCase().replace(/[^a-z0-9]/g, '')).sort().join('_') : '';
        const key = `${q.learningPath}_${q.placementType}_${q.company}_${q.difficultyLevel}_${norm}_${normOpts}`;
        if (seenTextMap.has(key)) {
            duplicateCount++;
            console.warn(`⚠️ Duplicate question found (ID ${q._id}): "${q.question.substring(0, 60)}..."`);
        } else {
            seenTextMap.set(key, q._id);
        }

        if (isMCQ) {
            const uniqueOpts = new Set(opts);
            if (uniqueOpts.size < 4) {
                duplicateOptionsCount++;
                console.warn(`⚠️ MCQ has duplicate options (ID ${q._id}): "${q.question.substring(0, 60)}..."`);
            }

            const ans = (q.answer || '').toString().trim();
            if (!ans || (!opts.includes(ans) && !['A', 'B', 'C', 'D'].includes(ans))) {
                missingAnswerCount++;
            }
        } else {
            if (q.questionType === 'coding' && (!q.testCases || q.testCases.length === 0)) {
                missingAnswerCount++;
            }
        }

        if (![1, 2, 3].includes(Number(q.difficultyLevel))) {
            invalidDifficultyCount++;
        }

        if (!q.explanation || !q.explanation.trim()) {
            missingExplanationCount++;
        }

        if (!q.learningPath || !q.placementType) {
            incompleteMetadataCount++;
        }
    }

    console.log('====================================================');
    console.log('               ACTUAL POOL BREAKDOWN AUDIT          ');
    console.log('====================================================\n');

    // 1. School Pools (Target: 150 per level)
    console.log('--- 1. SCHOOL APTITUDE POOLS ---');
    for (const diff of [1, 2, 3]) {
        const diffName = diff === 1 ? 'Foundation' : (diff === 2 ? 'Intermediate' : 'Advanced');
        const count = await Question.countDocuments({ learningPath: 'school', difficultyLevel: diff });
        const target = 150;
        const pass = count >= target;
        if (!pass) insufficientPoolsCount++;
        console.log(`School Level ${diff} (${diffName}): Actual = ${count} / Target = ${target} [${pass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
    }

    // 2. General College Placement Pools (Target: 50 per level)
    console.log('\n--- 2. GENERAL COLLEGE PLACEMENT POOLS ---');
    for (const diff of [1, 2, 3]) {
        const diffName = diff === 1 ? 'Foundation' : (diff === 2 ? 'Intermediate' : 'Advanced');
        const count = await Question.countDocuments({ learningPath: 'college', placementType: 'general', difficultyLevel: diff });
        const target = 50;
        const pass = count >= target;
        if (!pass) insufficientPoolsCount++;
        console.log(`General Placement Level ${diff} (${diffName}): Actual = ${count} / Target = ${target} [${pass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
    }

    // 3. Company Practice Pools (Target: 50 per company level for standard companies; section targets for TCS NQT)
    console.log('\n--- 3. COMPANY PRACTICE POOLS ---');
    for (const comp of COMPANY_LIST) {
        if (comp.slug === 'tcs' || comp.name === 'TCS') {
            const numCount = await Question.countDocuments({ company: 'TCS', active: { $ne: false }, $or: [{ section: 'Maths' }, { subject: /Math|Numerical/i }, { topic: /Math|Numerical/i }] });
            const verbCount = await Question.countDocuments({ company: 'TCS', active: { $ne: false }, $or: [{ section: 'English' }, { subject: /Verbal|English/i }, { topic: /Verbal|English/i }] });
            const reasCount = await Question.countDocuments({ company: 'TCS', active: { $ne: false }, $or: [{ section: 'Logical' }, { subject: /Reasoning|Logical/i }, { topic: /Reasoning|Logical/i }] });
            const advQuantCount = await Question.countDocuments({ company: 'TCS', active: { $ne: false }, difficultyLevel: { $in: [2, 3] }, $or: [{ topic: /Advanced/i }, { section: 'Maths' }, { section: 'Logical' }] });
            const codingCount = await Question.countDocuments({ company: 'TCS', active: { $ne: false }, $or: [{ questionType: 'coding' }, { section: 'Programming' }, { topic: /Coding/i }] });

            const numPass = numCount >= 20;
            const verbPass = verbCount >= 25;
            const reasPass = reasCount >= 20;
            const advQuantPass = advQuantCount >= 15;
            const codingPass = codingCount >= 2;

            if (!numPass) insufficientPoolsCount++;
            if (!verbPass) insufficientPoolsCount++;
            if (!reasPass) insufficientPoolsCount++;
            if (!advQuantPass) insufficientPoolsCount++;
            if (!codingPass) insufficientPoolsCount++;

            console.log(`TCS NQT Numerical Ability: Actual = ${numCount} / Target = 20 [${numPass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
            console.log(`TCS NQT Verbal Ability: Actual = ${verbCount} / Target = 25 [${verbPass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
            console.log(`TCS NQT Reasoning Ability: Actual = ${reasCount} / Target = 20 [${reasPass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
            console.log(`TCS NQT Advanced Quant & Reasoning: Actual = ${advQuantCount} / Target = 15 [${advQuantPass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
            console.log(`TCS NQT Advanced Coding: Actual = ${codingCount} / Target = 2 [${codingPass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
        } else {
            for (const diff of [1, 2, 3]) {
                const diffName = diff === 1 ? 'Foundation' : (diff === 2 ? 'Intermediate' : 'Advanced');
                const count = await Question.countDocuments({
                    learningPath: 'college',
                    placementType: 'company',
                    company: comp.name,
                    difficultyLevel: diff
                });
                const target = 50;
                const pass = count >= target;
                if (!pass) insufficientPoolsCount++;
                console.log(`${comp.name} Level ${diff} (${diffName}): Actual = ${count} / Target = ${target} [${pass ? '✅ OK' : '❌ INSUFFICIENT'}]`);
            }
        }
    }

    console.log('\n---------------- DATA QUALITY & INTEGRITY METRICS ----------------');
    console.log(`Duplicate Questions in Same Pool: ${duplicateCount}`);
    console.log(`Missing or Unmatched Answers: ${missingAnswerCount}`);
    console.log(`Duplicate Options within Question: ${duplicateOptionsCount}`);
    console.log(`Invalid Difficulty Levels: ${invalidDifficultyCount}`);
    console.log(`Missing Explanations: ${missingExplanationCount}`);
    console.log(`Incomplete Metadata: ${incompleteMetadataCount}`);
    console.log(`Insufficient Question Pools: ${insufficientPoolsCount}`);
    console.log('------------------------------------------------------------------\n');

    const isSuccess = (
        allQuestions.length >= 1950 &&
        duplicateCount === 0 &&
        missingAnswerCount === 0 &&
        duplicateOptionsCount === 0 &&
        invalidDifficultyCount === 0 &&
        missingExplanationCount === 0 &&
        incompleteMetadataCount === 0 &&
        insufficientPoolsCount === 0
    );

    if (isSuccess) {
        console.log('✅ COMPREHENSIVE QUESTION BANK AUDIT PASSED 100% PERFECTLY!');
    } else {
        console.error('❌ QUESTION BANK AUDIT DETECTED DEFICIENCIES OR INCOMPLETE POOLS!');
    }

    const { closeDB } = require('../backend/config/database');
    await closeDB();
    process.exit(isSuccess ? 0 : 1);
}

if (require.main === module) {
    auditQuestionBank().catch(err => {
        console.error('Audit execution error:', err);
        process.exit(1);
    });
}

module.exports = auditQuestionBank;
