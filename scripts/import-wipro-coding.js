/**
 * scripts/import-wipro-coding.js
 *
 * Imports Wipro coding problems from wipro_coding.json into MongoDB.
 *
 * Usage:
 *   node scripts/import-wipro-coding.js           # live import (upsert)
 *   node scripts/import-wipro-coding.js --dry-run # preview only, no writes
 *   node scripts/import-wipro-coding.js --replace  # deactivate old questions first
 */

const path = require('path');
const fs   = require('fs');
const { connectDB } = require('../backend/config/database');
const Question      = require('../backend/models/Question');

const DATA_FILE = path.join(__dirname, '../backend/data/wipro/wipro_coding.json');
const DRY_RUN   = process.argv.includes('--dry-run');
const REPLACE   = process.argv.includes('--replace'); // deactivate old before import

const VALID_TOPICS = [
    'Arrays','Strings','Number manipulation','Mathematics','Searching','Sorting',
    'Hashing','Two pointers','Sliding window','Prefix sums','Recursion','Stacks',
    'Queues','Linked list simulation','Matrices','Greedy','Dynamic programming',
    'Bit manipulation','Pattern printing','Mathematical sequences','Basic data structures'
];

function validateDoc(raw, idx) {
    const errors = [];

    if (!raw.problemTitle || !raw.problemTitle.trim()) errors.push('Missing problemTitle');
    if (!raw.question || raw.question.trim().length < 30) errors.push('question too short (<30 chars)');
    if (!raw.inputFormat || !raw.inputFormat.trim()) errors.push('Missing inputFormat');
    if (!raw.outputFormat || !raw.outputFormat.trim()) errors.push('Missing outputFormat');
    if (!raw.constraints || !raw.constraints.trim()) errors.push('Missing constraints');
    if (!raw.sampleInput || !raw.sampleInput.trim()) errors.push('Missing sampleInput');
    if (!raw.sampleOutput || !raw.sampleOutput.trim()) errors.push('Missing sampleOutput');
    if (!Array.isArray(raw.testCases) || raw.testCases.length < 2) errors.push('Need at least 2 testCases');
    if (![1,2,3].includes(raw.difficultyLevel)) errors.push(`Invalid difficultyLevel: ${raw.difficultyLevel}`);

    const topic = String(raw.topic || raw.subject || '').trim();

    const doc = {
        company:      'Wipro',
        exam:         'Wipro_Elite_NTH',
        section:      'Programming',
        subject:      topic || 'Coding',
        topic:        topic || 'Coding',
        category:     raw.category || 'Coding',
        sourceType:   'practice',
        sourceRef:    raw.sourceRef || 'Wipro Placement Practice',
        question:     String(raw.question || '').trim(),
        problemTitle: String(raw.problemTitle || '').trim(),
        inputFormat:  String(raw.inputFormat || '').trim(),
        outputFormat: String(raw.outputFormat || '').trim(),
        constraints:  String(raw.constraints || '').trim(),
        sampleInput:  String(raw.sampleInput || '').trim(),
        sampleOutput: String(raw.sampleOutput || '').trim(),
        explanation:  String(raw.explanation || '').trim(),
        // MCQ stubs required by schema
        option1: 'Write your solution in the editor above.',
        option2: 'N/A',
        option3: 'N/A',
        option4: 'N/A',
        answer:  'Write your solution in the editor above.',
        difficultyLevel: Number(raw.difficultyLevel) || 2,
        difficulty:      String(raw.difficulty || 'Medium').trim(),
        level:           String(raw.level || 'Intermediate').trim(),
        questionType:    'coding',
        supportedLanguages: Array.isArray(raw.supportedLanguages)
            ? raw.supportedLanguages
            : ['C','C++','Java','Python'],
        active: raw.active !== false,
        testCases: (Array.isArray(raw.testCases) ? raw.testCases : []).map(tc => ({
            input:       String(tc.input  ?? ''),
            output:      String(tc.output ?? ''),
            isHidden:    tc.isHidden !== false,
            explanation: String(tc.explanation || '')
        })),
        timeLimitMs:   raw.timeLimitMs   || null,
        memoryLimitMb: raw.memoryLimitMb || null,
        comparisonStrategy: raw.comparisonStrategy || null
    };

    return { isValid: errors.length === 0, errors, doc };
}

async function main() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`File not found: ${DATA_FILE}`);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const rows    = Array.isArray(rawData) ? rawData : (rawData.questions || []);

    console.log(`\n=== Wipro Coding Importer ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'} ===`);
    console.log(`Found ${rows.length} problems in ${path.basename(DATA_FILE)}\n`);

    await connectDB();

    // Report current state
    const before = await Question.countDocuments({ company: 'Wipro', questionType: 'coding' });
    console.log(`Current coding questions in DB: ${before}`);

    if (REPLACE && !DRY_RUN) {
        console.log('--replace: deactivating existing Wipro coding questions...');
        await Question.updateMany(
            { company: 'Wipro', questionType: 'coding' },
            { $set: { active: false } }
        );
        console.log('Deactivated', before, 'existing questions.\n');
    }

    let imported = 0, skipped = 0, invalid = 0, duplicate = 0;
    const byDiff  = { Easy: 0, Medium: 0, Hard: 0 };
    const byTopic = {};

    for (let i = 0; i < rows.length; i++) {
        const { isValid, errors, doc } = validateDoc(rows[i], i + 1);

        if (!isValid) {
            console.warn(`  [${i+1}/${rows.length}] INVALID (${doc.problemTitle || '?'}): ${errors.join('; ')}`);
            invalid++;
            continue;
        }

        // Duplicate check: same title and company
        const exists = await Question.exists({
            company: 'Wipro',
            questionType: 'coding',
            problemTitle: doc.problemTitle
        });

        if (exists && !REPLACE) {
            duplicate++;
            continue;
        }

        if (!DRY_RUN) {
            await Question.findOneAndUpdate(
                { company: 'Wipro', questionType: 'coding', problemTitle: doc.problemTitle },
                { $set: doc },
                { upsert: true }
            );
        }

        imported++;
        byDiff[doc.difficulty] = (byDiff[doc.difficulty] || 0) + 1;
        byTopic[doc.topic] = (byTopic[doc.topic] || 0) + 1;

        if (i % 10 === 0 || i === rows.length - 1) {
            process.stdout.write(`  Progress: ${i+1}/${rows.length}\r`);
        }
    }

    const after = DRY_RUN ? before : await Question.countDocuments({ company: 'Wipro', questionType: 'coding', active: true });

    console.log(`\n\n========================================`);
    console.log(`Imported:   ${imported}`);
    console.log(`Duplicates: ${duplicate} (skipped)`);
    console.log(`Invalid:    ${invalid}`);
    console.log(`\nBy difficulty:`);
    Object.entries(byDiff).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
    console.log(`\nBy topic:`);
    Object.entries(byTopic).sort(([,a],[,b])=>b-a).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
    console.log(`\nActive coding questions in DB: ${before} → ${after}`);
    if (DRY_RUN) console.log('(DRY RUN — no changes saved)');

    process.exit(0);
}

main().catch(err => {
    console.error('Import error:', err.message);
    process.exit(1);
});
