// scripts/import-infosys-questions.js
//
// Safe Bulk Import Utility for Infosys InfyTQ Question Bank
// Mirrors import-tcs-questions.js with Infosys-specific defaults and
// optional per-section filtering.
//
// Usage:
//   node scripts/import-infosys-questions.js --file=backend/data/infosys/infosys_technical.json [--dry-run] [--update] [--skip-backup] [--section=technicalAbility]

const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const backupQuestionBank = require('./backup-question-bank');
const { getSectionConfig, getSectionKeys } = require('../backend/config/infosysConfig');

const VALID_SECTIONS_DB = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const VALID_SECTION_KEYS = getSectionKeys();

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        file: null,
        dryRun: false,
        update: false,
        skipBackup: false,
        section: null // optional filter: e.g. 'technicalAbility'
    };

    args.forEach(arg => {
        if (arg.startsWith('--file=')) options.file = arg.split('=')[1];
        else if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--update') options.update = true;
        else if (arg === '--skip-backup') options.skipBackup = true;
        else if (arg.startsWith('--section=')) options.section = arg.split('=')[1];
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
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim()); current = '';
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
        headers.forEach((h, idx) => { obj[h] = values[idx] !== undefined ? values[idx] : ''; });
        records.push(obj);
    }
    return records;
}

function validateAndNormalizeRecord(raw, recordIndex, sectionFilter) {
    const errors = [];

    const questionText = (raw.question || raw.questiontext || raw.question_text || '').toString().trim();
    if (!questionText) errors.push('Question text is missing or empty.');

    const questionType = (raw.questiontype || raw.question_type || raw.questionType || 'mcq').toString().toLowerCase().trim();

    let opt1 = (raw.option1 || raw.option_a || raw.optiona || '').toString().trim();
    let opt2 = (raw.option2 || raw.option_b || raw.optionb || '').toString().trim();
    let opt3 = (raw.option3 || raw.option_c || raw.optionc || '').toString().trim();
    let opt4 = (raw.option4 || raw.option_d || raw.optiond || '').toString().trim();
    let ans  = (raw.answer || raw.correctanswer || raw.correct_answer || '').toString().trim();

    if (questionType === 'mcq') {
        if (!opt1 || !opt2 || !opt3 || !opt4) {
            errors.push('MCQ must have four non-empty options (option1–option4).');
        }
        const uniqueOpts = new Set([opt1, opt2, opt3, opt4]);
        if (uniqueOpts.size < 4) errors.push('All four options must be distinct.');

        if (!ans) {
            errors.push('Correct answer is missing.');
        } else {
            const optsList = [opt1, opt2, opt3, opt4];
            if (['A', 'B', 'C', 'D'].includes(ans.toUpperCase())) {
                ans = optsList[['A', 'B', 'C', 'D'].indexOf(ans.toUpperCase())];
            } else {
                const matched = optsList.find(o => o.toLowerCase() === ans.toLowerCase());
                if (matched) ans = matched;
                else errors.push(`Answer "${ans}" does not match any option.`);
            }
        }
    }

    let diffLevel = parseInt(raw.difficultyLevel || raw.difficultylevel || raw.difficulty_level || raw.difficulty);
    if (![1, 2, 3].includes(diffLevel)) {
        const diffStr = (raw.difficulty || raw.level || '').toString().toLowerCase();
        if (diffStr.includes('foundation') || diffStr.includes('easy') || diffStr === '1') diffLevel = 1;
        else if (diffStr.includes('intermediate') || diffStr.includes('medium') || diffStr === '2') diffLevel = 2;
        else if (diffStr.includes('advanced') || diffStr.includes('hard') || diffStr === '3') diffLevel = 3;
        else diffLevel = 1;
    }

    const explanation = (raw.explanation || raw.fullexplanation || '').toString().trim();
    if (!explanation) errors.push('Explanation is missing or empty.');

    // Resolve section
    let sectionKey = (raw.sectionKey || raw.section_key || '').toString().trim();
    let sectionDb  = (raw.section || 'Mixed').toString().trim();
    let subject    = (raw.subject || raw.topic || 'General').toString().trim();
    let topic      = (raw.topic || subject).toString().trim();
    let category   = (raw.category || raw.subtopic || subject).toString().trim();
    let subtopic   = (raw.subtopic || category).toString().trim();

    // Normalise section to valid DB enum
    if (!VALID_SECTIONS_DB.includes(sectionDb)) sectionDb = 'Mixed';

    // Apply section filter if provided
    if (sectionFilter && VALID_SECTION_KEYS.includes(sectionFilter)) {
        if (sectionKey && sectionKey !== sectionFilter) {
            // Skip records not matching the filter
            return { skip: true };
        }
    }

    if (errors.length > 0) return { isValid: false, errors, recordIndex };

    return {
        isValid: true,
        recordIndex,
        doc: {
            question:       questionText,
            option1:        opt1 || 'Option A',
            option2:        opt2 || 'Option B',
            option3:        opt3 || 'Option C',
            option4:        opt4 || 'Option D',
            answer:         ans,
            section:        sectionDb,
            subject,
            category,
            difficultyLevel: diffLevel,
            explanation,
            quickTrick:     (raw.quickTrick  || raw.quicktrick  || '').toString(),
            formulaUsed:    (raw.formulaUsed || raw.formulaused || '').toString(),
            stepSolution:   (raw.stepSolution|| raw.stepsolution|| '').toString(),
            commonMistake:  (raw.commonMistake||raw.commonmistake||'').toString(),
            fullExplanation: explanation,
            learningPath:   'college',
            placementType:  'company',
            company:        'Infosys',
            exam:           (raw.exam || 'Infosys_InfyTQ').toString().trim(),
            level:          diffLevel === 1 ? 'Foundation' : (diffLevel === 2 ? 'Intermediate' : 'Advanced'),
            topic,
            subtopic,
            difficulty:     diffLevel === 1 ? 'Easy' : (diffLevel === 2 ? 'Medium' : 'Hard'),
            questionType,
            sourceType:     (raw.sourceType || raw.sourcetype || 'Original AptitudePro').toString(),
            sourceTitle:    (raw.sourceTitle || raw.sourcetitle || 'AptitudePro Infosys Practice').toString(),
            sourceURL:      (raw.sourceURL  || raw.sourceurl  || '').toString(),
            sourceYear:     (raw.sourceYear || raw.sourceyear || '2025').toString(),
            active:         raw.active !== false && raw.active !== 'false'
        }
    };
}

async function runImporter() {
    const opts = parseArgs();
    if (!opts.file) {
        console.error('❌ Error: --file=<path> is required.');
        console.log('Usage: node scripts/import-infosys-questions.js --file=backend/data/infosys/infosys_technical.json [--dry-run] [--update] [--skip-backup] [--section=technicalAbility]');
        process.exit(1);
    }

    if (opts.section && !VALID_SECTION_KEYS.includes(opts.section)) {
        console.error(`❌ Invalid --section value. Valid keys: ${VALID_SECTION_KEYS.join(', ')}`);
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), opts.file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
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
        console.error('❌ Unsupported format. Use .json or .csv.');
        process.exit(1);
    }

    console.log(`📊 Loaded ${rawRecords.length} records from file.\n`);

    if (opts.section) {
        console.log(`🔍 Applying section filter: ${opts.section}`);
    }

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    if (!opts.dryRun && !opts.skipBackup) {
        console.log('🛡️  Creating pre-import backup...');
        await backupQuestionBank();
    }

    let validCount   = 0;
    let invalidCount = 0;
    let skippedCount = 0;
    let dupCount     = 0;
    let insertedCount= 0;
    let updatedCount = 0;
    const rejections = [];

    // Load existing Infosys questions for duplicate detection
    const existingDocs = await Question.find({ company: 'Infosys' }).lean();
    const existingKeySet = new Set(existingDocs.map(d => {
        const norm = (d.question || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        return `infosys_${d.difficultyLevel}_${norm}`;
    }));

    for (let i = 0; i < rawRecords.length; i++) {
        const result = validateAndNormalizeRecord(rawRecords[i], i + 1, opts.section);

        if (result.skip) { skippedCount++; continue; }
        if (!result.isValid) {
            invalidCount++;
            rejections.push({ row: i + 1, errors: result.errors });
            continue;
        }

        validCount++;
        const doc  = result.doc;
        const norm = doc.question.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const dupKey = `infosys_${doc.difficultyLevel}_${norm}`;

        if (existingKeySet.has(dupKey)) {
            dupCount++;
            if (opts.update && !opts.dryRun) {
                await Question.updateOne(
                    { company: 'Infosys', difficultyLevel: doc.difficultyLevel, question: doc.question },
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
    console.log(`📋 INFOSYS QUESTION IMPORT SUMMARY REPORT`);
    console.log(`====================================================`);
    console.log(`📄 Mode:                ${opts.dryRun ? 'DRY RUN (no DB changes)' : 'LIVE IMPORT'}`);
    console.log(`🔍 Section filter:      ${opts.section || 'None (all sections)'}`);
    console.log(`🔢 Total Records:       ${rawRecords.length}`);
    console.log(`✅ Valid Records:       ${validCount}`);
    console.log(`❌ Invalid Records:     ${invalidCount}`);
    console.log(`⏭️  Skipped (filter):   ${skippedCount}`);
    console.log(`⚠️  Duplicates Found:   ${dupCount}`);
    console.log(`📥 New Inserted:        ${opts.dryRun ? validCount - dupCount - skippedCount : insertedCount}`);
    console.log(`🔄 Updated Records:     ${opts.update ? (opts.dryRun ? dupCount : updatedCount) : 0}`);
    console.log(`====================================================\n`);

    if (rejections.length > 0) {
        console.log(`⚠️  REJECTED RECORDS (${rejections.length}):`);
        rejections.slice(0, 10).forEach(r => {
            console.log(`   Row #${r.row}: ${r.errors.join(' | ')}`);
        });
        if (rejections.length > 10) {
            console.log(`   ... and ${rejections.length - 10} more.`);
        }
    }

    if (require.main === module) {
        await mongoose.connection.close();
        process.exit(invalidCount > 0 ? 1 : 0);
    }

    return { total: rawRecords.length, valid: validCount, invalid: invalidCount, duplicates: dupCount, inserted: insertedCount, updated: updatedCount };
}

if (require.main === module) {
    runImporter().catch(err => {
        console.error('❌ Importer error:', err);
        process.exit(1);
    });
}

module.exports = { validateAndNormalizeRecord, parseCSV, runImporter };
