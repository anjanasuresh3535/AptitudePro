const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed'];

const sectionResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        required: true
        // Points back at the full Result document (with answers) if a
        // caller needs the complete detail.
    },
    section: {
        type: String,
        required: true,
        enum: SECTIONS
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    skipped: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    xpEarned: { type: Number, required: true },
    xpLost: { type: Number, required: true },
    netXP: { type: Number, required: true },
    levelBefore: { type: Number, required: true },
    levelAfter: { type: Number, required: true },
    testDate: { type: Date, default: Date.now }
}, {
    timestamps: true
});

sectionResultSchema.index({ userId: 1, section: 1, testDate: -1 });

module.exports = mongoose.models.SectionResult || mongoose.model('SectionResult', sectionResultSchema);
