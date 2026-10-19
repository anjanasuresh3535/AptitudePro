/**
 * scripts/import-wipro-questions.js
 *
 * Safe bulk importer for the Wipro question bank.
 * Supports JSON and CSV input, with validation, duplicate detection,
 * dry-run mode, company isolation and an automatic backup before any
 * live change.
 *
 * Usage:
 *   node scripts/import-wipro-questions.js --dry-run            # preview all
 *   node scripts/import-wipro-questions.js                      # live import all
 *   node scripts/import-wipro-questions.js --file=wipro_coding  # one file
 *   node scripts/import-wipro-questions.js --csv=backend/data/templates/wipro_quant_sample.csv
 */

const path    = require('path');
const fs      = require('fs');
const { connectDB, mongoose } = require('../backend/config/database');
const Question      = require('../backend/models/Question');
const backupQuestionBank = require('./backup-question-bank');

const DATA_DIR = path.join(__dirname, '../backend/data/wipro');

const FILES = [
    'wipro_quantitative',
    'wipro_logical',
    'wipro_verbal',
    'wipro_coding',
    'wipro_writing'
];

function parseArgs() {
    const args = process.argv.slice(2);
    const options = { file: null, csv: null, dryRun: false, update: false, skipBackup: false };
    args.forEach(arg => {
        if (arg.startsWith('--file=')) options.file = arg.split('=')[1];
        else if (arg.startsWith('--csv=')) options.csv = arg.split('=')[1];
        else if (arg === '--dry-run') options.dryRun = true;
        else if (arg === '--update') options.update = true;
        else if (arg === '--skip-backup') options.skipBackup = true;
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
        headers.forEach((h, idx) => { obj[h] = values[idx] !== undefined ? values[idx] : ''; });
        records.push(obj);
    }
    return records;
}

function normalizeBoolean(v, fallback) {
    if (v === undefined || v === null || v === '') return fallback;
    return !(v === false || String(v).toLowerCase() === 'false');
}


/**
 * Normalize incoming record keys so that CSV-style ("question_type"),
 * camelCase ("questionType") and spaced ("Question Type") headers all resolve
 * to the same lowercase alphanumeric lookup key.
 */
const VALID_SECTION_ENUM = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const VALID_SOURCE_TYPES = ['Original AptitudePro', 'Official Sample', 'Practice Question', 'Candidate Recalled'];

function normalizeSourceType(value) {
    const v = String(value || '').trim();
    if (!v) return 'Practice Question';
    const match = VALID_SOURCE_TYPES.find(t => t.toLowerCase() === v.toLowerCase());
    if (match) return match;
    if (/practice/i.test(v)) return 'Practice Question';
    if (/official|sample/i.test(v)) return 'Official Sample';
    if (/recalled|candidate/i.test(v)) return 'Candidate Recalled';
    if (/original|aptitudepro/i.test(v)) return 'Original AptitudePro';
    return 'Practice Question';
}

function normalizeKeys(raw) {
    const norm = {};
    Object.keys(raw || {}).forEach(k => {
        norm[String(k).toLowerCase().replace(/[^a-z0-9]/g, '')] = raw[k];
    });
    return norm;
}

/**
 * Validate one raw record and produce a Question-ready document.
 * Returns { isValid, errors, doc }.
 */
function validateQuestionRecord(raw, recordIndex) {
    const errors = [];
    const rec = normalizeKeys(raw);
    const get = (...keys) => {
        for (const k of keys) {
            if (rec[k] !== undefined && rec[k] !== null && String(rec[k]).trim() !== '') {
                return String(rec[k]).trim();
            }
        }
        return '';
    };

    const questionText = get('question', 'questiontext', 'question_text');
    if (!questionText) errors.push('Question text is missing or empty.');

    const company = get('company') || 'Wipro';
    if (company !== 'Wipro') errors.push(`company must be 'Wipro', got '${company}'`);

    const questionType = (get('questiontype', 'question_type') || 'mcq').toLowerCase();
    if (!['mcq', 'coding', 'fill_in_blank'].includes(questionType)) {
        errors.push(`Invalid questionType: ${questionType}`);
    }

    const section = get('section') || 'Mixed';
    const VALID_SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
    if (!VALID_SECTIONS.includes(section)) errors.push(`Invalid section: ${section}`);

    const opt1 = get('option1', 'option_a', 'optiona') || 'Option A';
    const opt2 = get('option2', 'option_b', 'optionb') || 'Option B';
    const opt3 = get('option3', 'option_c', 'optionc') || 'Option C';
    const opt4 = get('option4', 'option_d', 'optiond') || 'Option D';

    let ans = get('answer', 'correctanswer', 'correct_answer');
    if (!ans) {
        errors.push('Correct answer is missing.');
    } else {
        const optsList = [opt1, opt2, opt3, opt4];
        if (['A', 'B', 'C', 'D'].includes(ans.toUpperCase())) {
            ans = optsList['ABCD'.indexOf(ans.toUpperCase())];
        } else {
            const matched = optsList.find(o => o.toLowerCase() === ans.toLowerCase());
            if (matched) ans = matched;
            else if (questionType === 'mcq') errors.push(`Correct answer "${ans}" does not match any option.`);
        }
    }

    if (questionType === 'mcq') {
        const uniqueOpts = new Set([opt1, opt2, opt3, opt4]);
        if (uniqueOpts.size < 4) errors.push('All four options must be distinct for MCQ.');
    }

    const explanation = get('explanation', 'fullexplanation');
    if (!explanation) errors.push('Explanation is missing or empty.');

    let diffLevel = parseInt(get('difficultylevel', 'difficulty_level', 'difficulty'), 10);
    if (![1, 2, 3].includes(diffLevel)) {
        const diffStr = (get('difficulty', 'level') || '').toLowerCase();
        if (diffStr.includes('foundation') || diffStr.includes('easy')) diffLevel = 1;
        else if (diffStr.includes('intermediate') || diffStr.includes('medium')) diffLevel = 2;
        else if (diffStr.includes('advanced') || diffStr.includes('hard')) diffLevel = 3;
        else diffLevel = 1;
    }

    let testCases = [];
    if (questionType === 'coding') {
        if (Array.isArray(rec.testcases)) testCases = rec.testcases;
        else if (rec.sampleinput && rec.sampleoutput) {
            testCases.push({ input: rec.sampleinput, output: rec.sampleoutput, isHidden: false, explanation: 'Sample case' });
        }
    }

    const supportedLanguages = Array.isArray(rec.supportedlanguages)
        ? rec.supportedlanguages
        : (get('supportedlanguages', 'supported_languages')
            ? get('supportedlanguages', 'supported_languages').split(';').map(s => s.trim()).filter(Boolean)
            : []);

    const doc = {
        company: 'Wipro',
        exam: get('exam') || 'Wipro_Elite_NTH',
        section,
        subject: get('subject', 'topic') || 'General',
        topic: get('topic', 'subject') || 'General',
        category: get('category') || 'General',
        sourceType: normalizeSourceType(get('sourcetype')),
        sourceRef: get('sourceref', 'sourcetitle') || 'Wipro Placement Practice',
        sourceURL: get('sourceurl') || 'https://prepinsta.com/wipro-quantitative-aptitude-questions/',
        question: questionText,
        option1: opt1, option2: opt2, option3: opt3, option4: opt4,
        answer: ans || opt1,
        explanation,
        difficultyLevel: diffLevel,
        difficulty: { 1: 'Easy', 2: 'Medium', 3: 'Hard' }[diffLevel],
        level: { 1: 'Foundation', 2: 'Intermediate', 3: 'Advanced' }[diffLevel],
        questionType,
        active: normalizeBoolean(rec.active, true),
        problemTitle: get('problemtitle', 'problem_title') || '',
        inputFormat: get('inputformat', 'input_format') || '',
        outputFormat: get('outputformat', 'output_format') || '',
        constraints: get('constraints') || '',
        sampleInput: get('sampleinput', 'sample_input') || '',
        sampleOutput: get('sampleoutput', 'sample_output') || '',
        supportedLanguages,
        testCases
    };

    return { isValid: errors.length === 0, errors, recordIndex, doc };
}

module.exports = { validateQuestionRecord, parseCSV, FILES };


async function importRecords(rows, label, options) {
    console.log(`\n  ${label} — ${rows.length} records`);
    let imported = 0, duplicate = 0, invalid = 0;
    for (let i = 0; i < rows.length; i++) {
        const { isValid, errors, doc } = validateQuestionRecord(rows[i], i + 1);
        if (!isValid) {
            console.warn(`  [${i + 1}] INVALID: ${errors.join('; ')}`);
            invalid++;
            continue;
        }
        const exists = await Question.exists({ company: doc.company, question: doc.question });
        if (exists && !options.update) { duplicate++; continue; }
        if (!options.dryRun) {
            if (exists && options.update) {
                await Question.updateOne({ company: doc.company, question: doc.question }, { $set: doc });
            } else {
                await Question.create(doc);
            }
        }
        imported++;
    }
    console.log(`  ${imported} imported, ${duplicate} duplicates, ${invalid} invalid`);
    return { imported, duplicate, invalid };
}

async function main() {
    const options = parseArgs();
    await connectDB();

    console.log(`\n=== Wipro Question Importer ${options.dryRun ? '(DRY RUN)' : '(LIVE)'} ===`);

    if (!options.dryRun && !options.skipBackup) {
        console.log('\nTaking a safety backup of the question bank before importing...');
        const backup = await backupQuestionBank();
        console.log(`Backup saved: ${backup.filename} (${backup.count} questions)`);
    }

    let totalImported = 0, totalDuplicate = 0, totalInvalid = 0;

    if (options.csv) {
        const csvPath = path.isAbsolute(options.csv) ? options.csv : path.join(__dirname, '..', options.csv);
        const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
        const res = await importRecords(rows, path.basename(csvPath), options);
        totalImported += res.imported; totalDuplicate += res.duplicate; totalInvalid += res.invalid;
    } else {
        const filesToProcess = options.file ? [options.file] : FILES;
        for (const fileName of filesToProcess) {
            const filePath = path.join(DATA_DIR, fileName + '.json');
            if (!fs.existsSync(filePath)) { console.warn(`  File not found: ${filePath}`); continue; }
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const rows = Array.isArray(raw) ? raw : (raw.questions || []);
            const res = await importRecords(rows, fileName + '.json', options);
            totalImported += res.imported; totalDuplicate += res.duplicate; totalInvalid += res.invalid;
        }
    }

    console.log('\n==============================');
    console.log(`Total imported:   ${totalImported}`);
    console.log(`Total duplicates: ${totalDuplicate}`);
    console.log(`Total invalid:    ${totalInvalid}`);
    if (options.dryRun) console.log('(DRY RUN — no changes saved)');
    console.log('==============================\n');

    await mongoose.connection.close();
    process.exit(0);
}

if (require.main === module) {
    main().catch(err => { console.error('Import error:', err.message); process.exit(1); });
}
