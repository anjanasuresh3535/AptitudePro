// Idempotently seed original AptitudePro IBM-style practice content only.
// Legacy IBM categories are intentionally untouched.
const { connectDB, closeDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const english = require('../backend/data/ibmEnglishQuestionBank');
const { IBM_SECTIONS } = require('../backend/config/ibmConfig');
const COMPANY = 'IBM', SOURCE = 'AptitudePro original IBM-style practice';
const mcqs = english.map(item => ({
  learningPath: 'college', placementType: 'company', company: COMPANY, active: true,
  sourceType: 'original-practice', sourceReference: SOURCE, questionType: 'mcq',
  section: 'English', subject: item.topic, topic: item.topic, category: IBM_SECTIONS.english.category,
  difficultyLevel: 1 + (item.id.endsWith('10') ? 1 : 0), difficulty: item.id.endsWith('10') ? 'Medium' : 'Easy',
  question: item.question, option1: item.options[0], option2: item.options[1], option3: item.options[2], option4: item.options[3],
  answer: item.options[item.answerIndex], explanation: item.explanation
}));
const langs = IBM_SECTIONS.coding.languages;
const codingProblems = [
  {
    problemTitle: 'Merge Overlapping Intervals', topic: 'Arrays and sorting', difficulty: 'Medium', difficultyLevel: 2,
    problemStatement: 'Given a list of closed intervals, merge every pair that overlaps and print the resulting intervals in increasing order.',
    inputFormat: 'First line: n. The next n lines each contain two integers, start and end.',
    outputFormat: 'Print each merged interval as “start end” on its own line.',
    constraints: '1 <= n <= 200000; -10^9 <= start <= end <= 10^9.',
    sampleInput: '5\n1 3\n2 6\n8 10\n15 18\n17 20', sampleOutput: '1 6\n8 10\n15 20',
    testCases: [
      { input: '5\n1 3\n2 6\n8 10\n15 18\n17 20', output: '1 6\n8 10\n15 20', isHidden: false },
      { input: '1\n4 4', output: '4 4', isHidden: true },
      { input: '4\n1 4\n4 7\n10 12\n13 15', output: '1 7\n10 12\n13 15', isHidden: true }
    ]
  },
  {
    problemTitle: 'Minimum Coin Count', topic: 'Dynamic programming', difficulty: 'Hard', difficultyLevel: 3,
    problemStatement: 'Given coin denominations and a target amount, print the minimum number of coins needed to make that amount. Each denomination may be used any number of times. Print -1 if the amount cannot be formed.',
    inputFormat: 'First line: n. Second line: n distinct positive coin values. Third line: target amount.',
    outputFormat: 'Print the minimum number of coins, or -1 when no combination forms the target.',
    constraints: '1 <= n <= 100; 1 <= coin value <= 100000; 0 <= target <= 100000.',
    sampleInput: '3\n1 2 5\n11', sampleOutput: '3',
    testCases: [
      { input: '3\n1 2 5\n11', output: '3', isHidden: false },
      { input: '3\n1 3 4\n6', output: '2', isHidden: true },
      { input: '2\n2 4\n7', output: '-1', isHidden: true },
      { input: '1\n7\n0', output: '0', isHidden: true }
    ]
  }
].map(problem => ({
  learningPath: 'college', placementType: 'company', company: COMPANY, active: true,
  sourceType: 'original-practice', sourceReference: SOURCE, questionType: 'coding',
  section: 'Programming', subject: problem.topic, category: IBM_SECTIONS.coding.category,
  question: problem.problemStatement, supportedLanguages: langs, timeLimitMs: 5000, memoryLimitMb: 256,
  comparisonStrategy: 'token', ...problem
}));
async function seed() {
  if (mcqs.length !== 10 || mcqs.some(q => new Set([q.option1,q.option2,q.option3,q.option4]).size !== 4 || ![q.option1,q.option2,q.option3,q.option4].includes(q.answer))) throw new Error('IBM English content validation failed.');
  const keys = [...mcqs.map(q => q.question), ...codingProblems.map(q => q.problemTitle)];
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate IBM seed keys.');
  await connectDB();
  try {
    for (const q of [...mcqs, ...codingProblems]) {
      const filter = q.questionType === 'coding'
        ? { company: COMPANY, questionType: 'coding', problemTitle: q.problemTitle }
        : { company: COMPANY, questionType: 'mcq', category: IBM_SECTIONS.english.category, question: q.question };
      await Question.updateOne(filter, { $set: q }, { upsert: true, runValidators: true });
    }
    await Question.updateMany({ company: COMPANY, sourceReference: SOURCE, category: { $in: [IBM_SECTIONS.english.category, IBM_SECTIONS.coding.category] }, question: { $nin: [...mcqs.map(q => q.question), ...codingProblems.map(q => q.question)] } }, { $set: { active: false } });
    console.log(`IBM seed ready: ${mcqs.length} English items and ${codingProblems.length} coding problems.`);
  } finally { await closeDB(); }
}
if (require.main === module) seed().catch(error => { console.error('IBM seed failed:', error.message); process.exitCode = 1; });
module.exports = { seed, mcqs, codingProblems };
