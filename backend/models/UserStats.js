const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // one stats document per user
    },
    // --- Fields routes/auth.js directly reads/writes ---
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    streak: {
        type: Number,
        default: 0,
        min: 0
    },
    lastLogin: {
        type: Date
    },
    // --- Additional lifetime analytics (not yet written by any route -
    //     will be populated starting in the quiz submission module) ---
    totalQuizzes: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    totalCorrect: { type: Number, default: 0, min: 0 },
    totalWrong: { type: Number, default: 0, min: 0 },
    totalSkipped: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 }, // overall
    averageAccuracy: { type: Number, default: 0, min: 0, max: 100 },
    bestScore: { type: Number, default: 0, min: 0 },
    bestAccuracy: { type: Number, default: 0, min: 0, max: 100 }
}, {
    timestamps: true
});

module.exports = mongoose.models.UserStats || mongoose.model('UserStats', userStatsSchema);
