// Idempotently add curated AptitudePro HCLTech practice questions. Existing records are preserved.
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const { HCLTECH_SECTIONS } = require('../backend/config/hcltechConfig');
const { sections } = require('../backend/data/hcltechQuestionBank');

const base = {
    learningPath: 'college', placementType: 'company', company: 'HCLTech', active: true,
    sourceType: 'original-practice', sourceReference: 'AptitudePro original HCLTech-style practice',
    questionType: 'mcq', option1: 'A', option2: 'B', option3: 'C', option4: 'D', answer: 'A'
};
const records = [];
for (const [key, items] of Object.entries(sections)) {
    const cfg = HCLTECH_SECTIONS[key];
    for (let index = 0; index < items.length; index++) {
        const [topic, question, options, answerIndex, explanation] = items[index];
        if (new Set(options).size !== 4 || !options[answerIndex]) throw new Error(`Invalid key/options for HCLTech ${key} item ${index + 1}`);
        records.push({
            ...base, section: cfg.section, subject: topic, topic, category: cfg.category,
            difficultyLevel: index < Math.ceil(items.length / 3) ? 1 : index < Math.ceil(items.length * 2 / 3) ? 2 : 3,
            difficulty: index < Math.ceil(items.length / 3) ? 'Easy' : index < Math.ceil(items.length * 2 / 3) ? 'Medium' : 'Hard',
            question,
            option1: options[0], option2: options[1], option3: options[2], option4: options[3], answer: options[answerIndex], explanation
        });
    }
}

const codingProblems = [
    {
        ...base, questionType: 'coding', section: 'Programming', subject: 'Algorithms', topic: 'Arrays', category: 'HCLTech Coding Practice', difficultyLevel: 1, difficulty: 'Easy',
        problemTitle: 'Longest Increasing Run', problemStatement: 'Given an integer array, find the length of its longest contiguous strictly increasing run.', question: 'Given an integer array, find the length of its longest contiguous strictly increasing run.',
        inputFormat: 'First line: n. Second line: n space-separated integers.', outputFormat: 'Print the length of the longest contiguous strictly increasing run.', constraints: '1 <= n <= 200000; -10^9 <= a[i] <= 10^9.', sampleInput: '8\n1 2 2 3 4 1 5 6', sampleOutput: '3', supportedLanguages: HCLTECH_SECTIONS.coding.languages,
        testCases: [{ input: '8\n1 2 2 3 4 1 5 6', output: '3', isHidden: false }, { input: '5\n5 4 3 2 1', output: '1', isHidden: true }, { input: '6\n-3 -2 -1 0 1 2', output: '6', isHidden: true }], explanation: 'Scan once, extending the current run when each value is greater than its predecessor; keep the maximum length.'
    },
    {
        ...base, questionType: 'coding', section: 'Programming', subject: 'Data Structures', topic: 'Stacks', category: 'HCLTech Coding Practice', difficultyLevel: 2, difficulty: 'Medium',
        problemTitle: 'Balanced Brackets', problemStatement: 'Given a string containing parentheses, square brackets and braces, determine whether every opening bracket is closed in the correct order.', question: 'Given a string containing parentheses, square brackets and braces, determine whether every opening bracket is closed in the correct order.',
        inputFormat: 'One line containing a bracket string.', outputFormat: 'Print YES if the string is balanced; otherwise print NO.', constraints: '1 <= string length <= 200000.', sampleInput: '{[()]}', sampleOutput: 'YES', supportedLanguages: HCLTECH_SECTIONS.coding.languages,
        testCases: [{ input: '{[()]}', output: 'YES', isHidden: false }, { input: '([)]', output: 'NO', isHidden: true }, { input: '(((())))', output: 'YES', isHidden: true }, { input: '{[}', output: 'NO', isHidden: true }], explanation: 'Push opening brackets on a stack; each closer must match the most recent opener, and the stack must be empty at the end.'
    }
];

async function seed() {
    const normalized = records.map(item => item.question.replace(/^\[[^\]]+\]\s*/, '').trim().toLowerCase());
    if (new Set(normalized).size !== records.length) throw new Error('Duplicate objective prompts found in HCLTech seed data.');
    await connectDB();
    for (const question of [...records, ...codingProblems]) {
        const lookup = question.questionType === 'coding'
            ? { company: 'HCLTech', questionType: 'coding', problemTitle: question.problemTitle }
            : { company: 'HCLTech', questionType: 'mcq', question: question.question };
        await Question.updateOne(lookup, { $setOnInsert: question }, { upsert: true, runValidators: true });
        // Refresh only AptitudePro-authored rows so corrections to this curated bank take effect;
        // imported or user-authored HCLTech rows remain untouched.
        if (question.sourceReference === base.sourceReference) {
            const { sourceReference, ...curatedFields } = question;
            await Question.updateOne({ ...lookup, sourceReference }, { $set: curatedFields }, { runValidators: true });
        }
    }
    const counts = await Question.aggregate([
        { $match: { company: 'HCLTech', active: true, questionType: { $in: ['mcq', 'coding'] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }
    ]);
    console.log(`HCLTech seed complete: ${records.length} curated objective prompts, ${codingProblems.length} coding problems.`);
    console.log(counts.map(row => `${row._id}: ${row.count}`).join('\n'));
}

if (require.main === module) seed().then(() => process.exit(0)).catch(error => { console.error('HCLTech seed failed:', error.message); process.exit(1); });
module.exports = { records, codingProblems };
