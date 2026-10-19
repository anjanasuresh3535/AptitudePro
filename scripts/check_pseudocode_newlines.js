const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');

connectDB().then(async () => {
    const q = await Question.findOne({ company: 'Infosys', section: 'Programming', active: { $ne: false } });
    if (!q) {
        console.log('No pseudo-code question found in DB');
        process.exit(0);
    }
    console.log('Topic:', q.topic);
    console.log('Question (first 300 chars raw JSON):', JSON.stringify(q.question.substring(0, 300)));
    const hasLiteralBackslashN = q.question.includes('\\n');
    const hasRealNewline = q.question.includes('\n');
    console.log('Has literal \\\\n (stored as backslash-n):', hasLiteralBackslashN);
    console.log('Has real newline character:', hasRealNewline);
    console.log('Line count when split on real newline:', q.question.split('\n').length);
    process.exit(0);
});
