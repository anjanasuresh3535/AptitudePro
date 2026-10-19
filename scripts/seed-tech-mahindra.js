// Idempotently seeds only AptitudePro-authored Tech Mahindra practice content.
const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const { TECH_MAHINDRA_SECTIONS } = require('../backend/config/techMahindraConfig');
const { bank } = require('../backend/data/techMahindraQuestionBank');
const COMPANY = 'Tech Mahindra', sourceReference = 'AptitudePro original Tech Mahindra-style practice';
const records = Object.entries(bank).flatMap(([key, items]) => {
    const cfg = TECH_MAHINDRA_SECTIONS[key];
    if (!cfg?.category) throw new Error(`No category for ${key}`);
    return items.map(([topic, question, options, answerIndex, explanation], index) => {
        if (options.length !== 4 || new Set(options).size !== 4 || !options[answerIndex]) throw new Error(`Invalid options or answer key in ${key}: ${question}`);
        return { learningPath: 'college', placementType: 'company', company: COMPANY, active: true, sourceType: 'original-practice', sourceReference,
            questionType: 'mcq', section: cfg.section, subject: topic, topic, category: cfg.category, difficultyLevel: index < 4 ? 1 : index < 8 ? 2 : 3,
            difficulty: index < 4 ? 'Easy' : index < 8 ? 'Medium' : 'Hard', question,
            option1: options[0], option2: options[1], option3: options[2], option4: options[3], answer: options[answerIndex], explanation };
    });
});
const codingProblems = [
    { problemTitle: 'Longest Increasing Run', topic: 'Arrays', difficulty: 'Easy', problemStatement: 'Given an integer array, find the length of its longest contiguous strictly increasing run.', inputFormat: 'First line: n. Second line: n space-separated integers.', outputFormat: 'Print the length of the longest contiguous strictly increasing run.', constraints: '1 <= n <= 200000; -10^9 <= a[i] <= 10^9.', sampleInput: '8\n1 2 2 3 4 1 5 6', sampleOutput: '3', testCases: [{ input: '8\n1 2 2 3 4 1 5 6', output: '3', isHidden: false }, { input: '5\n5 4 3 2 1', output: '1', isHidden: true }, { input: '6\n-3 -2 -1 0 1 2', output: '6', isHidden: true }] },
    { problemTitle: 'Balanced Brackets', topic: 'Stacks and strings', difficulty: 'Medium', problemStatement: 'Given a string containing parentheses, square brackets and braces, determine whether every opening bracket is closed in the correct order.', inputFormat: 'One line containing a bracket string.', outputFormat: 'Print YES if balanced; otherwise print NO.', constraints: '1 <= string length <= 200000.', sampleInput: '{[()]}', sampleOutput: 'YES', testCases: [{ input: '{[()]}', output: 'YES', isHidden: false }, { input: '([)]', output: 'NO', isHidden: true }, { input: '(((())))', output: 'YES', isHidden: true }, { input: '{[}', output: 'NO', isHidden: true }] }
].map(problem => ({ learningPath: 'college', placementType: 'company', company: COMPANY, active: true, sourceType: 'original-practice', sourceReference,
    questionType: 'coding', section: 'Programming', subject: problem.topic, category: 'Tech Mahindra Coding Practice', difficultyLevel: problem.difficulty === 'Easy' ? 1 : 2,
    question: problem.problemStatement, supportedLanguages: TECH_MAHINDRA_SECTIONS.coding.languages, ...problem }));

async function seed() {
    const normalized = records.map(item => item.question.trim().toLowerCase());
    if (new Set(normalized).size !== records.length) throw new Error('Duplicate Tech Mahindra question prompts.');
    await connectDB();
    for (const question of [...records, ...codingProblems]) {
        const lookup = question.questionType === 'coding' ? { company: COMPANY, questionType: 'coding', problemTitle: question.problemTitle } : { company: COMPANY, questionType: 'mcq', question: question.question };
        await Question.updateOne(lookup, { $setOnInsert: question }, { upsert: true, runValidators: true });
        await Question.updateOne({ ...lookup, sourceReference }, { $set: question }, { runValidators: true });
    }
    // If a prompt was revised between releases, keep the old AptitudePro-authored row
    // for history but deactivate it so the live question pool has no stale duplicates.
    await Question.updateMany({ company: COMPANY, sourceReference, questionType: 'mcq', category: { $in: Object.values(TECH_MAHINDRA_SECTIONS).map(section => section.category).filter(Boolean) }, question: { $nin: records.map(item => item.question) } }, { $set: { active: false } });
    console.log(`Seeded ${records.length} objective questions and ${codingProblems.length} coding problems for Tech Mahindra.`);
}
if (require.main === module) seed().then(() => process.exit(0)).catch(error => { console.error('Tech Mahindra seed failed:', error.message); process.exit(1); });
module.exports = { records, codingProblems };
