// scripts/clean-tcs-question-text.js
//
// Safe Question Text Cleaning Script for TCS Question Bank.
// Takes a pre-cleaning snapshot backup, then strips generated prefixes
// like [TCS Practice], [TCS Foundation Practice #21], [TCS Quant Pattern]
// from stored question statements in MongoDB.

const { connectDB, mongoose } = require('../backend/config/database');
const Question = require('../backend/models/Question');
const backupQuestionBank = require('./backup-question-bank');

function cleanQuestionText(text) {
    if (!text || typeof text !== 'string') return text || '';
    return text.replace(/^\s*\[(?:TCS|Infosys|Wipro|Accenture|Cognizant|Capgemini|HCL|Mindtree|Tech Mahindra|Placement|Foundation|Advanced|Intermediate|Practice|Pattern|#\d+|[A-Z0-9_\s#]+)[^\]]*\]\s*/i, '').trim();
}

async function runCleaner() {
    console.log('🧹 Starting TCS Question Text Cleaning Process...');

    await connectDB();
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    console.log('🛡️ Creating pre-clean question bank backup snapshot...');
    await backupQuestionBank();

    const tcsDocs = await Question.find({ company: 'TCS' });
    console.log(`📊 Found ${tcsDocs.length} TCS questions in database.`);

    let cleanedCount = 0;
    for (const doc of tcsDocs) {
        const cleaned = cleanQuestionText(doc.question);
        if (cleaned !== doc.question) {
            doc.question = cleaned;
            await doc.save();
            cleanedCount++;
        }
    }

    console.log(`====================================================`);
    console.log(`✅ TCS QUESTION TEXT CLEANING COMPLETE`);
    console.log(`====================================================`);
    console.log(`🔢 Total TCS Questions: ${tcsDocs.length}`);
    console.log(`✨ Questions Cleaned:   ${cleanedCount}`);
    console.log(`====================================================\n`);

    if (require.main === module) {
        await mongoose.connection.close();
    }

    return { total: tcsDocs.length, cleaned: cleanedCount };
}

if (require.main === module) {
    runCleaner().catch(err => {
        console.error('❌ Question cleaning error:', err);
        process.exit(1);
    });
}

module.exports = {
    cleanQuestionText,
    runCleaner
};
