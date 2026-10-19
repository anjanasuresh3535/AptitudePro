// scripts/backup-question-bank.js
//
// Safe Backup Utility for AptitudePro Question Bank
// Exports complete MongoDB Question documents into a timestamped JSON file.

const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');

async function backupQuestionBank() {
    console.log('📦 Starting AptitudePro Question Bank Backup Process...\n');

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    const backupDir = path.join(__dirname, '../backend/data/backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `question_bank_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    const questions = await Question.find({}).lean();
    console.log(`📊 Found ${questions.length} question documents in database.`);

    const backupPayload = {
        meta: {
            backupDate: new Date().toISOString(),
            totalQuestions: questions.length,
            collections: ['questions'],
            database: mongoose.connection.name || 'aptitudepro'
        },
        questions
    };

    fs.writeFileSync(filepath, JSON.stringify(backupPayload, null, 2), 'utf8');

    console.log(`\n====================================================`);
    console.log(`✅ QUESTION BANK BACKUP SUCCESSFUL!`);
    console.log(`====================================================`);
    console.log(`📁 Backup Filename: ${filename}`);
    console.log(`📂 Full Filepath:   ${filepath}`);
    console.log(`🔢 Questions Saved: ${questions.length}`);
    console.log(`====================================================\n`);

    if (require.main === module) {
        await mongoose.connection.close();
    }
    return {
        success: true,
        count: questions.length,
        filename,
        filepath
    };
}

if (require.main === module) {
    backupQuestionBank().catch(err => {
        console.error('❌ Backup process failed:', err);
        process.exit(1);
    });
}

module.exports = backupQuestionBank;
