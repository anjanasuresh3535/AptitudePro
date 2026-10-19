/**
 * Audit Infosys Puzzle Solving questions.
 * - Queries all active questions that the PlacementService returns for Puzzle Solving
 * - Classifies each as genuine puzzle or non-puzzle
 * - Reports counts and lists non-puzzle questions
 * - Deactivates non-puzzle questions
 * - Does NOT touch any other company/section
 */

const { connectDB } = require('../backend/config/database');
const Question      = require('../backend/models/Question');
const fs            = require('fs');

// Same regex used in infosysConfig.js sectionRegex for Puzzle Solving
// (copy from infosysConfig.js)
const PUZZLE_REGEX = /puzzle|grid|pattern|constraint|sequence|missing.?number|number.?grid|multi.?step.?reason|arithmetic.?constraint/i;

// Keywords that identify genuine puzzle questions
const GENUINE_PUZZLE_KEYWORDS = [
    /missing\s*(number|term|value|digit)/i,
    /find\s*the\s*(next|missing|pattern|rule)/i,
    /number\s*(grid|pattern|series|sequence)/i,
    /what\s*(comes|number)\s*next/i,
    /pattern\s*(is|follows|rule)/i,
    /puzzle/i,
    /arrange\s*(the|digits|numbers)/i,
    /grid/i,
    /constraint/i,
    /complete\s*the\s*(series|pattern|sequence)/i,
    /\d+\s*[,;]\s*\d+\s*[,;]\s*\d+/,   // number sequences like "2, 4, 8, ?"
    /\?\s*=|=\s*\?/,                      // x = ? style
    /what\s*is\s*(the\s*)?(value|number|term|next)/i,
];

// Keywords that suggest NON-puzzle questions (aptitude/reasoning)
const NON_PUZZLE_KEYWORDS = [
    /profit|loss|discount|marked\s*price/i,
    /speed\s*and\s*time|time\s*and\s*work|boats?\s*and\s*streams?/i,
    /train|platform|relative\s*speed/i,
    /probability|permutation|combination/i,
    /simple\s*interest|compound\s*interest/i,
    /ages?\s*(of|problem)/i,
    /alligation|mixture/i,
    /pipes?\s*and\s*cistern/i,
    /data\s*interpretation/i,
    /bar\s*(graph|chart)|pie\s*chart|table/i,
    /seating\s*arrangement|sitting\s*arrangement/i,
    /syllogism|conclusion\s*follows/i,
    /coding[- ]decoding/i,
    /blood\s*relation/i,
    /direction\s*sense/i,
];

function classifyQuestion(q) {
    const text = (q.question + ' ' + (q.topic || '') + ' ' + (q.subject || '')).toLowerCase();

    const nonPuzzleHit = NON_PUZZLE_KEYWORDS.find(r => r.test(text));
    if (nonPuzzleHit) return 'NON_PUZZLE';

    const genuineHit = GENUINE_PUZZLE_KEYWORDS.find(r => r.test(text));
    if (genuineHit) return 'GENUINE';

    // Default: keep it — when in doubt, preserve
    return 'UNCERTAIN';
}

connectDB().then(async () => {
    console.log('=== Infosys Puzzle Solving Audit ===\n');

    // Find ALL infosys questions that currently sit in the Puzzle Solving pool
    // Based on PlacementService: section='Maths', company='Infosys',
    // subject/topic/category matching PUZZLE_REGEX
    const allPuzzleQ = await Question.find({
        company: 'Infosys',
        section:  'Maths',
        active:   { $ne: false },
        $or: [
            { subject:  PUZZLE_REGEX },
            { topic:    PUZZLE_REGEX },
            { category: PUZZLE_REGEX },
        ]
    }).lean();

    console.log(`Total Puzzle Solving questions (active, matching regex): ${allPuzzleQ.length}\n`);

    const genuine   = [];
    const nonPuzzle = [];
    const uncertain = [];

    for (const q of allPuzzleQ) {
        const cls = classifyQuestion(q);
        if (cls === 'GENUINE')    genuine.push(q);
        else if (cls === 'NON_PUZZLE') nonPuzzle.push(q);
        else                      uncertain.push(q);
    }

    console.log(`  ✅ Genuine puzzles:     ${genuine.length}`);
    console.log(`  ❌ Non-puzzle (remove): ${nonPuzzle.length}`);
    console.log(`  ⚠️  Uncertain (keep):   ${uncertain.length}`);

    if (nonPuzzle.length > 0) {
        console.log('\n--- Non-puzzle questions to deactivate ---');
        nonPuzzle.forEach((q, i) => {
            console.log(`${i+1}. [${q._id}] ${(q.topic||q.subject||'?').padEnd(30)} | ${q.question.substring(0, 80)}`);
        });
    }

    // Backup before any changes
    const backup = { date: new Date().toISOString(), removed: nonPuzzle };
    const backupPath = 'backend/data/infosys/backup_puzzle_audit_' + Date.now() + '.json';
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(`\nBackup saved: ${backupPath}`);

    // Deactivate non-puzzle questions
    if (nonPuzzle.length > 0) {
        const ids = nonPuzzle.map(q => q._id);
        const result = await Question.updateMany(
            { _id: { $in: ids } },
            { $set: { active: false } }
        );
        console.log(`\n✅ Deactivated ${result.modifiedCount} non-puzzle questions.`);
    }

    // Final count
    const remaining = await Question.countDocuments({
        company: 'Infosys',
        section:  'Maths',
        active:   { $ne: false },
        $or: [
            { subject:  PUZZLE_REGEX },
            { topic:    PUZZLE_REGEX },
            { category: PUZZLE_REGEX },
        ]
    });
    console.log(`\nActive Puzzle Solving questions after audit: ${remaining}`);

    if (remaining >= 4) {
        console.log('✅ Sufficient for mock (needs 4)');
    } else {
        console.log(`⚠️  Only ${remaining} left — need at least 4 for mock. Consider adding more.`);
    }

    process.exit(0);
}).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
