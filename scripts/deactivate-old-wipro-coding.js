/**
 * scripts/deactivate-old-wipro-coding.js
 * Backs up and deactivates the old trivial Wipro coding questions
 * before importing the new professional question bank.
 */
const path = require('path');
const fs   = require('fs');
const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');

async function main() {
    await connectDB();
    const existing = await Question.find({ company: 'Wipro', questionType: 'coding' }).lean();
    const bname = path.join(__dirname, '../backend/data/wipro/wipro_coding_backup_pre_rebuild_' + Date.now() + '.json');
    fs.writeFileSync(bname, JSON.stringify(existing, null, 2));
    console.log('Backed up', existing.length, 'existing coding questions to', path.basename(bname));

    const result = await Question.updateMany(
        { company: 'Wipro', questionType: 'coding' },
        { $set: { active: false } }
    );
    console.log('Deactivated', result.modifiedCount, 'old coding questions');
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
