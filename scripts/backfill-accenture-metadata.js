// Additive metadata repair for legacy Accenture practice records. No question
// text, answers, or records are deleted or replaced.
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

async function backfill() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => { mongoose.connection.once('connected', resolve); setTimeout(() => reject(new Error('Database connection timed out')), 15000); });
    const legacy = await Question.find({ company: 'Accenture' }).lean();
    const ops = legacy.map(q => {
        const set = {};
        if (!q.topic) set.topic = q.subject || q.category || 'General Reasoning';
        if (!q.difficulty) set.difficulty = ({ 1: 'Easy', 2: 'Medium', 3: 'Hard' })[q.difficultyLevel] || 'Medium';
        if (!q.questionType) set.questionType = 'mcq';
        if (!q.sourceType) set.sourceType = 'original-practice';
        if (!q.sourceReference) set.sourceReference = 'AptitudePro legacy generated practice bank; question-specific provenance was not recorded.';
        if (q.active === undefined || q.active === null) set.active = true;
        return Object.keys(set).length ? { updateOne: { filter: { _id: q._id, company: 'Accenture' }, update: { $set: set } } } : null;
    }).filter(Boolean);
    if (ops.length) await Question.bulkWrite(ops, { ordered: false });
    console.log(`Accenture metadata backfill complete: ${ops.length} legacy records updated; no records deleted.`);
    await mongoose.disconnect();
    process.exit(0);
}
if (require.main === module) backfill().catch(error => { console.error('Accenture metadata backfill failed:', error.message); process.exit(1); });
module.exports = backfill;
