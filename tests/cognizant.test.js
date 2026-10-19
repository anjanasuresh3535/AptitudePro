const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const placement = require('../backend/services/PlacementService');
const sqlEngine = require('../backend/services/sqlEngine');
const { COGNIZANT_SECTIONS } = require('../backend/config/cognizantConfig');

async function run() {
    try {
        await connectDB();
        if (mongoose.connection.readyState !== 1) await new Promise((resolve, reject) => {
            mongoose.connection.once('connected', resolve);
            setTimeout(() => reject(new Error('MongoDB connection timed out')), 15000);
        });

        const expectedTypes = {
            'communication-objective': 'mcq', communication: 'free_response', aptitude: 'mcq',
            coding: 'coding', sql: 'sql', technical: 'mcq', interview: 'interview_prompt'
        };
        const counts = {};
        for (const [key, questionType] of Object.entries(expectedTypes)) {
            const count = await placement.countCognizantQuestions(key);
            counts[key] = count;
            assert.ok(count > 0, `${key} content is seeded`);
            const selected = await placement.getCognizantQuestions({ sectionKey: key, count: 1000 });
            assert.strictEqual(selected.questions.length, count, `${key} small pool is returned without looping`);
            assert.strictEqual(new Set(selected.questions.map(q => String(q._id))).size, count, `${key} has no duplicate question IDs in one selection`);
            assert.ok(selected.questions.every(q => q.company === 'Cognizant' && q.questionType === questionType), `${key} remains isolated by company and type`);
        }

        const mcqs = await Question.find({ company: 'Cognizant', questionType: 'mcq', active: { $ne: false } }).lean();
        for (const q of mcqs) {
            const options = [q.option1, q.option2, q.option3, q.option4];
            assert.strictEqual(new Set(options.map(x => String(x).trim().toLowerCase())).size, 4, `four distinct options: ${q._id}`);
            assert.strictEqual(options.filter(x => String(x).trim().toLowerCase() === String(q.answer).trim().toLowerCase()).length, 1, `one keyed answer: ${q._id}`);
        }

        const sql = await Question.findOne({ company: 'Cognizant', questionType: 'sql', active: { $ne: false } }).lean();
        assert.ok(sql.sqlSchema && sql.sqlSeed && sql.sqlSolution, 'SQL challenge includes private evaluator configuration');
        const sqlCheck = await sqlEngine.evaluate({ schemaSql: sql.sqlSchema, seedSql: sql.sqlSeed, solutionSql: sql.sqlSolution, query: sql.sqlSolution });
        assert.strictEqual(sqlCheck.status, 'accepted', 'read-only isolated SQL engine accepts the server reference query');
        assert.strictEqual(sqlEngine.assertReadOnly('DELETE FROM employees').ok, false, 'SQL write statements are blocked');

        const templates = ['placement.ejs', 'cognizant-response.ejs', 'cognizant-response-result.ejs', 'cognizant-history.ejs', 'cognizant-coding.ejs', 'cognizant-coding-result.ejs', 'cognizant-sql.ejs', 'cognizant-sql-result.ejs', 'cognizant-games.ejs'];
        for (const file of templates) ejs.compile(fs.readFileSync(path.join(__dirname, '../frontend/views', file), 'utf8'), { filename: file });
        const rounds = COGNIZANT_SECTIONS;
        assert.strictEqual(rounds['communication-objective'].minutes + rounds.communication.minutes, 60, 'communication round configuration totals 60 minutes');
        assert.strictEqual(rounds.aptitude.minutes + rounds.games.minutes, 80, 'aptitude and games configuration totals 80 minutes');
        assert.ok(rounds.coding.minutes + rounds.sql.minutes + rounds.technical.minutes >= 105 && rounds.coding.minutes + rounds.sql.minutes + rounds.technical.minutes <= 120, 'technical duration is within configured target');
        console.log('Cognizant active question counts:', JSON.stringify(counts));
        console.log('PASS: question type/company isolation, random selection size and uniqueness, MCQ keys, SQL read-only evaluation, EJS compilation and round timing configuration');
    } finally {
        mongoose.connection.removeAllListeners('disconnected');
        await mongoose.disconnect();
    }
}

if (require.main === module) run().catch(error => { console.error('Cognizant test failed:', error); process.exit(1); });
module.exports = run;
