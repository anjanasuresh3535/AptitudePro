const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed'];

const rankHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rank: { type: Number, required: true },
    previousRank: { type: Number, default: null },
    section: {
        type: String,
        enum: SECTIONS,
        default: null // null = overall/global rank, not section-specific
    },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, min: 0, max: 100, default: 0 },
    xp: { type: Number, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

rankHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.RankHistory || mongoose.model('RankHistory', rankHistorySchema);
