// Idempotently add original Capgemini coding practice. Existing records remain untouched.
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

const base = {
    learningPath: 'college', placementType: 'company', company: 'Capgemini', active: true,
    sourceType: 'original-practice', sourceReference: 'AptitudePro original practice material',
    section: 'Programming', subject: 'Coding', category: 'Capgemini Coding Practice',
    questionType: 'coding', supportedLanguages: ['C', 'C++', 'Java'],
    option1: 'Code response', option2: 'Code response', option3: 'Code response', option4: 'Code response', answer: 'Code response'
};

const questions = [
    {
        ...base, topic: 'Arrays', difficultyLevel: 1, difficulty: 'Easy', problemTitle: 'Longest Increasing Run',
        problemStatement: 'Given an integer array, find the length of its longest contiguous strictly increasing run.',
        question: 'Given an integer array, find the length of its longest contiguous strictly increasing run.',
        inputFormat: 'First line: n. Second line: n space-separated integers.', outputFormat: 'Print the length of the longest contiguous strictly increasing run.',
        constraints: '1 <= n <= 200000; -10^9 <= a[i] <= 10^9.', sampleInput: '8\n1 2 2 3 4 1 5 6', sampleOutput: '3',
        testCases: [
            { input: '8\n1 2 2 3 4 1 5 6', output: '3', isHidden: false },
            { input: '5\n5 4 3 2 1', output: '1', isHidden: true },
            { input: '6\n-3 -2 -1 0 1 2', output: '6', isHidden: true },
            { input: '4\n7 7 8 9', output: '3', isHidden: true }
        ], explanation: 'Scan once, extending the current run when each value is greater than its predecessor, and track the maximum length.'
    },
    {
        ...base, topic: 'Stacks', difficultyLevel: 2, difficulty: 'Medium', problemTitle: 'Balanced Brackets',
        problemStatement: 'Given a string containing only parentheses, square brackets and braces, determine whether every opening bracket is closed in the correct order.',
        question: 'Given a string containing only parentheses, square brackets and braces, determine whether every opening bracket is closed in the correct order.',
        inputFormat: 'One line containing a bracket string.', outputFormat: 'Print YES if the brackets are balanced; otherwise print NO.',
        constraints: '1 <= string length <= 200000.', sampleInput: '{[()]}', sampleOutput: 'YES',
        testCases: [
            { input: '{[()]}', output: 'YES', isHidden: false },
            { input: '([)]', output: 'NO', isHidden: true },
            { input: '(((())))', output: 'YES', isHidden: true },
            { input: '{[}', output: 'NO', isHidden: true }
        ], explanation: 'Push each opening bracket onto a stack. Every closing bracket must match the most recent unmatched opening bracket, and the stack must be empty at the end.'
    }
];

async function seed() {
    await connectDB();
    for (const question of questions) {
        await Question.updateOne(
            { company: 'Capgemini', questionType: 'coding', problemTitle: question.problemTitle },
            { $setOnInsert: question },
            { upsert: true, runValidators: true }
        );
    }
    const count = await Question.countDocuments({ company: 'Capgemini', questionType: 'coding', active: { $ne: false } });
    console.log(`Capgemini coding seed complete: ${count} active original practice problems.`);
}

if (require.main === module) seed().then(() => process.exit(0)).catch(error => { console.error('Capgemini coding seed failed:', error.message); process.exit(1); });
module.exports = { questions };
