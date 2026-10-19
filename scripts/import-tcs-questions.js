// scripts/import-tcs-questions.js
//
// Safe Bulk Import Utility for TCS NQT Question Bank
// Supports JSON and CSV input formats with comprehensive validation, dry-run mode, and reporting.

const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const backupQuestionBank = require('./backup-question-bank');

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        file: null,
        dryRun: false,
        update: false,
        skipBackup: false
    };

    args.forEach(arg => {
        if (arg.startsWith('--file=')) {
            options.file = arg.split('=')[1];
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--update') {
            options.update = true;
        } else if (arg === '--skip-backup') {
            options.skipBackup = true;
        }
    });

    return options;
}

function parseCSV(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;

        const obj = {};
        headers.forEach((h, idx) => {
            obj[h] = values[idx] !== undefined ? values[idx] : '';
        });
        records.push(obj);
    }

    return records;
}

function validateQuestionRecord(raw, recordIndex) {
    const errors = [];
    const questionText = (raw.question || raw.questiontext || raw.question_text || '').toString().trim();
    if (!questionText) {
        errors.push('Question text is missing or empty.');
    }

    const questionType = (raw.questiontype || raw.question_type || 'mcq').toString().toLowerCase().trim();
    let opt1 = (raw.option1 || raw.option_a || raw.optiona || '').toString().trim();
    let opt2 = (raw.option2 || raw.option_b || raw.optionb || '').toString().trim();
    let opt3 = (raw.option3 || raw.option_c || raw.optionc || '').toString().trim();
    let opt4 = (raw.option4 || raw.option_d || raw.optiond || '').toString().trim();

    let ans = (raw.answer || raw.correctanswer || raw.correct_answer || '').toString().trim();

    if (questionType === 'mcq') {
        if (!opt1 || !opt2 || !opt3 || !opt4) {
            errors.push('MCQ question must provide four non-empty options (option1, option2, option3, option4).');
        }

        const uniqueOpts = new Set([opt1, opt2, opt3, opt4]);
        if (uniqueOpts.size < 4) {
            errors.push('All four options must be distinct. Duplicate options found.');
        }

        if (!ans) {
            errors.push('Correct answer is missing.');
        } else {
            const optsList = [opt1, opt2, opt3, opt4];
            if (['A', 'B', 'C', 'D'].includes(ans.toUpperCase())) {
                const idx = ['A', 'B', 'C', 'D'].indexOf(ans.toUpperCase());
                ans = optsList[idx];
            } else {
                const matched = optsList.find(o => o.toLowerCase() === ans.toLowerCase());
                if (matched) {
                    ans = matched;
                } else {
                    errors.push(`Correct answer "${ans}" does not match any of the four options.`);
                }
            }
        }
    }

    let diffLevel = parseInt(raw.difficultylevel || raw.difficulty_level || raw.difficulty);
    if (![1, 2, 3].includes(diffLevel)) {
        const diffStr = (raw.difficulty || raw.level || '').toString().toLowerCase();
        if (diffStr.includes('foundation') || diffStr.includes('easy') || diffStr === '1') diffLevel = 1;
        else if (diffStr.includes('intermediate') || diffStr.includes('medium') || diffStr === '2') diffLevel = 2;
        else if (diffStr.includes('advanced') || diffStr.includes('hard') || diffStr === '3') diffLevel = 3;
        else diffLevel = 1;
    }

    const explanation = (raw.explanation || raw.fullexplanation || '').toString().trim();
    if (!explanation) {
        errors.push('Explanation is missing or empty.');
    }

    const company = (raw.company || 'TCS').toString().trim();
    const exam = (raw.exam || 'TCS_NQT').toString().trim();
    const level = (raw.level || (diffLevel === 1 ? 'Foundation' : (diffLevel === 2 ? 'Intermediate' : 'Advanced'))).toString().trim();
    const section = (raw.section || 'Mixed').toString().trim();
    const subject = (raw.subject || raw.topic || 'General').toString().trim();
    const category = (raw.category || raw.subtopic || subject).toString().trim();
    const topic = (raw.topic || subject).toString().trim();
    const subtopic = (raw.subtopic || category).toString().trim();

    let testCases = [];
    if (questionType === 'coding') {
        if (Array.isArray(raw.testCases)) {
            testCases = raw.testCases;
        } else if (raw.sampleinput && raw.sampleoutput) {
            testCases.push({
                input: raw.sampleinput,
                output: raw.sampleoutput,
                isHidden: false,
                explanation: 'Sample Case'
            });
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors, recordIndex };
    }

    return {
        isValid: true,
        recordIndex,
        doc: {
            question: questionText,
            option1: opt1 || 'Option A',
            option2: opt2 || 'Option B',
            option3: opt3 || 'Option C',
            option4: opt4 || 'Option D',
            answer: ans,
            section: ['Maths', 'Logical', 'English', 'Mixed', 'Programming'].includes(section) ? section : 'Mixed',
            subject,
            category,
            difficultyLevel: diffLevel,
            explanation,
            quickTrick: (raw.quicktrick || raw.quick_trick || '').toString(),
            formulaUsed: (raw.formulaused || raw.formula_used || raw.formula || '').toString(),
            stepSolution: (raw.stepsolution || raw.step_solution || '').toString(),
            commonMistake: (raw.commonmistake || raw.common_mistake || '').toString(),
            fullExplanation: explanation,
            learningPath: 'college',
            placementType: 'company',
            company: 'TCS',
            exam,
            level,
            topic,
            subtopic,
            difficulty: diffLevel === 1 ? 'Easy' : (diffLevel === 2 ? 'Medium' : 'Hard'),
            questionType,
            sourceType: (raw.sourcetype || 'Original AptitudePro').toString(),
            sourceTitle: (raw.sourcetitle || '').toString(),
            sourceURL: (raw.sourceurl || '').toString(),
            sourceYear: (raw.sourceyear || '').toString(),
            active: raw.active !== false,
            testCases
        }
    };
}

async function runImporter() {
    const opts = parseArgs();
    if (!opts.file) {
        console.error('❌ Error: Please specify target file using --file=<path>');
        console.log('Usage: node scripts/import-tcs-questions.js --file=backend/data/templates/tcs_foundation.json [--dry-run] [--update]');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), opts.file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found at path: ${filePath}`);
        process.exit(1);
    }

    console.log(`📥 Reading import file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    let rawRecords = [];
    if (filePath.endsWith('.json')) {
        const parsed = JSON.parse(fileContent);
        rawRecords = Array.isArray(parsed) ? parsed : (parsed.questions || []);
    } else if (filePath.endsWith('.csv')) {
        rawRecords = parseCSV(fileContent);
    } else {
        console.error('❌ Unsupported file format. Please provide a .json or .csv file.');
        process.exit(1);
    }

    console.log(`📊 Loaded ${rawRecords.length} records from input file.\n`);

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    // Auto backup before writing to DB unless skipped or dry-run
    if (!opts.dryRun && !opts.skipBackup) {
        console.log('🛡️ Creating pre-import snapshot backup...');
        await backupQuestionBank();
    }

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    const rejections = [];

    const existingDocs = await Question.find({ company: 'TCS' }).lean();
    const existingKeySet = new Set(existingDocs.map(d => {
        const norm = (d.question || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        return `${d.company}_${d.difficultyLevel}_${norm}`;
    }));

    for (let i = 0; i < rawRecords.length; i++) {
        const validated = validateQuestionRecord(rawRecords[i], i + 1);

        if (!validated.isValid) {
            invalidCount++;
            rejections.push({ row: i + 1, errors: validated.errors });
            continue;
        }

        validCount++;
        const doc = validated.doc;
        const norm = doc.question.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const dupKey = `${doc.company}_${doc.difficultyLevel}_${norm}`;

        if (existingKeySet.has(dupKey)) {
            duplicateCount++;
            if (opts.update && !opts.dryRun) {
                await Question.updateOne(
                    { company: 'TCS', difficultyLevel: doc.difficultyLevel, question: doc.question },
                    { $set: doc }
                );
                updatedCount++;
            }
            continue;
        }

        if (!opts.dryRun) {
            await Question.create(doc);
            existingKeySet.add(dupKey);
            insertedCount++;
        }
    }

    console.log(`====================================================`);
    console.log(`📋 BULK TCS QUESTION IMPORT SUMMARY REPORT`);
    console.log(`====================================================`);
    console.log(`📄 Mode:             ${opts.dryRun ? 'DRY RUN (No DB changes)' : 'LIVE IMPORT'}`);
    console.log(`🔢 Total Records:    ${rawRecords.length}`);
    console.log(`✅ Valid Records:    ${validCount}`);
    console.log(`❌ Invalid Records:  ${invalidCount}`);
    console.log(`⚠️ Duplicates Found: ${duplicateCount}`);
    console.log(`📥 New Inserted:     ${opts.dryRun ? validCount - duplicateCount : insertedCount}`);
    console.log(`🔄 Updated Records:  ${opts.update ? (opts.dryRun ? duplicateCount : updatedCount) : 0}`);
    console.log(`====================================================\n`);

    if (rejections.length > 0) {
        console.log(`⚠️ REJECTED RECORDS (${rejections.length}):`);
        rejections.slice(0, 10).forEach(r => {
            console.log(`   - Row/Record #${r.row}: ${r.errors.join(' | ')}`);
        });
        if (rejections.length > 10) {
            console.log(`   ... and ${rejections.length - 10} more invalid rows.`);
        }
        console.log('');
    }

    if (require.main === module) {
        await mongoose.connection.close();
    }
    return {
        total: rawRecords.length,
        valid: validCount,
        invalid: invalidCount,
        duplicates: duplicateCount,
        inserted: insertedCount,
        updated: updatedCount,
        dryRun: opts.dryRun
    };
}

if (require.main === module) {
    runImporter().catch(err => {
        console.error('❌ Importer execution error:', err);
        process.exit(1);
    });
}

module.exports = {
    validateQuestionRecord,
    parseCSV,
    runImporter
};
