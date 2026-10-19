const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema({
    key: { type: String, required: true },
    correct: { type: Boolean, default: false },
    response: { type: String, default: '' },
    expectedAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' }
}, { _id: false });
const cognizantGameAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, enum: ['Cognizant'], default: 'Cognizant', required: true },
    attemptId: { type: String, required: true },
    score: { type: Number, required: true },
    totalGames: { type: Number, required: true },
    completed: { type: Boolean, default: true },
    games: { type: [gameResultSchema], default: [] },
    timeTaken: { type: Number, default: 0 }
}, { timestamps: true });
cognizantGameAttemptSchema.index({ userId: 1, attemptId: 1 }, { unique: true });
module.exports = mongoose.models.CognizantGameAttempt || mongoose.model('CognizantGameAttempt', cognizantGameAttemptSchema);
