/**
 * scripts/clean-wipro-legacy.js
 *
 * The original Wipro bank was auto-generated from templates and contained
 * broken arithmetic and internal labels such as "[Wipro Practice #14]".
 * This maintenance script SAFELY DEACTIVATES (never deletes) those legacy
 * records so they are excluded from practice sets, while preserving the data
 * for auditing. The curated bank imported by import-wipro-questions.js takes
 * their place.
 *
 * Usage:
 *   node scripts/clean-wipro-legacy.js --dry-run
 *   node scripts/clean-wipro-legacy.js
 */

const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

const LEGACY_CATEGORIES = [
    'Wipro Quant Pattern',
    'Wipro Logical Pattern',
    'Wipro Verbal Pattern',
    'Wipro DI & Reasoning',
    'Wipro NLTH Pattern'
];

async function run() {
    const dryRun = process.argv.includes('--dry-run');
    await connectDB();

    const filter = {
        company: 'Wipro',
        active: { $ne: false },
        $or: [
            { category: { $in: LEGACY_CATEGORIES } },
            { question: /\[Wipro/i },
            { subject: 'Quantitative Aptitude', category: { $exists: false } }
        ]
    };

    const matches = await Question.find(filter).select('_id category question').lean();
    console.log(`\n=== Wipro Legacy Cleanup ${dryRun ? '(DRY RUN)' : '(LIVE)'} ===`);
    console.log(`Legacy Wipro questions found: ${matches.length}`);

    const byCat = {};
    matches.forEach(m => { byCat[m.category || '(none)'] = (byCat[m.category || '(none)'] || 0) + 1; });
    console.log('By category:', JSON.stringify(byCat, null, 2));

    if (!dryRun && matches.length > 0) {
        const ids = matches.map(m => m._id);
        const res = await Question.updateMany({ _id: { $in: ids } }, { $set: { active: false } });
        console.log(`Deactivated ${res.modifiedCount} legacy Wipro questions.`);
    } else if (dryRun) {
        console.log('(DRY RUN — no changes saved)');
    }

    const remaining = await Question.countDocuments({ company: 'Wipro', active: { $ne: false } });
    console.log(`Active Wipro questions remaining: ${remaining}\n`);

    await mongoose.connection.close();
    process.exit(0);
}

run().catch(err => { console.error('Cleanup error:', err.message); process.exit(1); });
