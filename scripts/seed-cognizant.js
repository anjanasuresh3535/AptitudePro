// Idempotently add original Cognizant (CTS) practice material into the shared
// AptitudePro question collection, isolated by company:'Cognizant'. Existing
// records are never deleted or rewritten by this script (mirrors seed-accenture).
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

const aptitudeBank = require('../backend/data/cognizantAptitudeBank');
const communicationBank = require('../backend/data/cognizantCommunicationBank');
const technicalBank = require('../backend/data/cognizantTechnicalBank');
const codingBank = require('../backend/data/cognizantCodingBank');
const sqlBank = require('../backend/data/cognizantSqlBank');
const writingBank = require('../backend/data/cognizantWritingBank');

const base = {
    learningPath: 'college',
    placementType: 'company',
    company: 'Cognizant',
    active: true,
    sourceType: 'original-practice',
    sourceReference: 'AptitudePro original practice material'
};

// Non-MCQ documents still need option1..4 + answer (schema requires them); use a
// neutral placeholder that can never be mistaken for a real answer.
function placeholder(label) {
    return { option1: label, option2: label, option3: label, option4: label, answer: label };
}

function difficultyWord(level) {
    return level === 1 ? 'Easy' : level === 3 ? 'Hard' : 'Medium';
}

function mcq(section, category) {
    return ([topic, subject, question, options, answer, explanation, difficultyLevel]) => ({
        ...base, section, subject, topic, category, questionType: 'mcq',
        difficultyLevel, difficulty: difficultyWord(difficultyLevel), question,
        option1: options[0], option2: options[1], option3: options[2], option4: options[3],
        answer, explanation
    });
}

const questions = [
    // Round 2: aptitude MCQ
    ...aptitudeBank.map(mcq('Maths', 'Cognizant Aptitude')),
    // Round 1: objective communication MCQ
    ...communicationBank.map(mcq('English', 'Cognizant Communication')),
    // Round 3: technical core MCQ
    ...technicalBank.map(mcq('Mixed', 'Cognizant Technical')),

    // Round 3: coding problems
    ...codingBank.map(c => ({
        ...base, ...placeholder('Code response'),
        section: 'Programming', subject: 'Coding', topic: c.topic, category: 'Cognizant Coding Practice',
        questionType: 'coding', difficultyLevel: c.difficultyLevel, difficulty: c.difficulty,
        problemTitle: c.title, problemStatement: c.statement, question: c.statement,
        inputFormat: c.inputFormat, outputFormat: c.outputFormat, constraints: c.constraints,
        sampleInput: c.publicTests[0] ? c.publicTests[0].input : '',
        sampleOutput: c.publicTests[0] ? c.publicTests[0].output : '',
        supportedLanguages: ['C', 'C++', 'Java', 'Python'],
        starterCodeByLanguage: c.starterCode,
        starterCode: c.starterCode.Python || '',
        testCases: [
            ...c.publicTests.map(t => ({ input: t.input, output: t.output, isHidden: false })),
            ...c.hiddenTests.map(t => ({ input: t.input, output: t.output, isHidden: true }))
        ],
        explanation: c.explanation
    })),

    // Round 3: SQL tasks
    ...sqlBank.tasks.map(t => ({
        ...base, ...placeholder('Query response'),
        section: 'Programming', subject: 'SQL', topic: t.topic, category: 'Cognizant SQL Practice',
        questionType: 'sql', difficultyLevel: t.difficultyLevel, difficulty: t.difficulty,
        problemTitle: t.title, question: t.prompt, prompt: t.prompt,
        sqlSchemaDescription: sqlBank.schemaDescription,
        sqlSchema: sqlBank.schemaSql,
        sqlSeed: sqlBank.seedSql,
        sqlStarter: t.starterSql,
        sqlSolution: t.solutionSql,
        sqlSampleOutput: t.sampleOutput,
        explanation: t.explanation
    })),

    // Round 1: written communication tasks
    ...writingBank.communication.map(w => ({
        ...base, ...placeholder('Written response'),
        section: 'English', subject: 'Communication', topic: w.topic, category: 'Cognizant Communication Practice',
        questionType: 'free_response', difficultyLevel: 2, difficulty: 'Medium',
        question: w.question, prompt: w.prompt, responseType: w.responseType,
        minWords: w.minWords, maxWords: w.maxWords,
        evaluationCriteria: writingBank.evaluationCriteriaWriting,
        explanation: 'Review the response for audience, purpose, clear organisation and a professional tone.'
    })),

    // Round 4: interview prompts
    ...writingBank.interview.map(([category, text, guidance, followUps]) => ({
        ...base, ...placeholder('Spoken response'),
        section: 'English', subject: 'Interview Preparation', topic: category, category,
        questionType: 'interview_prompt', difficultyLevel: 2, difficulty: 'Medium',
        question: text, prompt: text, responseType: 'text',
        evaluationCriteria: writingBank.evaluationCriteriaInterview,
        explanation: guidance,
        fullExplanation: (followUps && followUps.length) ? ('Possible follow-ups: ' + followUps.join(' ')) : ''
    }))
];

async function seed() {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise((resolve, reject) => {
            mongoose.connection.once('connected', resolve);
            setTimeout(() => reject(new Error('Database connection timed out')), 15000);
        });
    }
    let inserted = 0;
    for (const question of questions) {
        const exists = await Question.exists({ company: 'Cognizant', question: question.question, topic: question.topic });
        if (!exists) { await Question.create(question); inserted++; }
    }
    console.log(`Cognizant seed complete: ${inserted} inserted, ${questions.length - inserted} already present.`);
    await mongoose.disconnect();
    process.exit(0);
}

if (require.main === module) {
    seed().catch(error => { console.error('Cognizant seed failed:', error.message); process.exit(1); });
}

module.exports = { questions };
