// Idempotently seed Capgemini Technical MCQ questions into the question bank.
const { connectDB } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const technicalBank = require('../backend/data/capgeminiTechnicalBank');

const COMPANY = 'Capgemini';
const sourceReference = 'AptitudePro original Capgemini technical practice';

const records = technicalBank.map(([topic, subject, question, options, answer, explanation, difficultyLevel]) => {
    if (options.length !== 4 || new Set(options).size !== 4 || !options.includes(answer)) {
        throw new Error(`Invalid options or answer for question: ${question}`);
    }
    return {
        learningPath: 'college',
        placementType: 'company',
        company: COMPANY,
        active: true,
        sourceType: 'original-practice',
        sourceReference,
        questionType: 'mcq',
        section: 'Programming',
        subject,
        topic,
        category: 'Capgemini Technical Pattern',
        difficultyLevel,
        difficulty: difficultyLevel === 1 ? 'Easy' : difficultyLevel === 3 ? 'Hard' : 'Medium',
        question,
        option1: options[0],
        option2: options[1],
        option3: options[2],
        option4: options[3],
        answer,
        explanation
    };
});

async function seed() {
    await connectDB();
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
        const res = await Question.updateOne(
            { company: COMPANY, questionType: 'mcq', question: record.question },
            { $set: record },
            { upsert: true, runValidators: true }
        );
        if (res.upsertedCount > 0) inserted++;
        else updated++;
    }

    const total = await Question.countDocuments({
        company: COMPANY,
        active: { $ne: false },
        subject: { $in: ['Pseudocode', 'Pseudo Code & Quant', 'Programming Fundamentals', 'C Programming', 'C++ Programming', 'Object Oriented Programming', 'Data Structures', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks'] }
    });

    console.log(`Capgemini technical seed complete. Inserted: ${inserted}, Updated: ${updated}. Total active technical questions: ${total}.`);
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(err => {
        console.error('Capgemini technical seed failed:', err);
        process.exit(1);
    });
}

module.exports = { records, seed };
