const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const sectionProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    section: {
        type: String,
        required: true,
        trim: true
    },
    quizzesAttempted: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    wrong: { type: Number, default: 0, min: 0 },
    skipped: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    lastAttempt: { type: Date, default: null }
}, {
    timestamps: true
});

// One progress document per user per section - the MongoDB equivalent
// of the composite UNIQUE(userid, section) key from the old MySQL table.
sectionProgressSchema.index({ userId: 1, section: 1 }, { unique: true });

module.exports = mongoose.models.SectionProgress || mongoose.model('SectionProgress', sectionProgressSchema);
