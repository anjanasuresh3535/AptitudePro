const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const xpHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        default: null
        // Not required - a future admin XP adjustment wouldn't trace
        // back to a specific quiz result.
    },
    section: {
        type: String,
        trim: true,
        default: null
    },
    xpEarned: { type: Number, required: true, default: 0 },
    xpLost: { type: Number, required: true, default: 0 },
    netXP: { type: Number, required: true },
    reason: {
        type: String,
        required: true // e.g. "[Maths] Quiz: 5/20 correct (25%)"
    },
    levelBefore: { type: Number, required: true },
    levelAfter: { type: Number, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false }
    // Append-only log - entries are never edited, so no updatedAt.
});

xpHistorySchema.index({ userId: 1, createdAt: -1 });
xpHistorySchema.index({ section: 1 });

module.exports = mongoose.models.XPHistory || mongoose.model('XPHistory', xpHistorySchema);
