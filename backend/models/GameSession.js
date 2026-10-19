const mongoose = require('mongoose');

const gameAnswerSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    questionText: { type: String, required: true },
    options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, required: true },
        d: { type: String, required: true }
    },
    selectedAnswer: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
    selectedAnswerText: { type: String, default: null },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    correctAnswerText: { type: String, required: true },
    explanation: { type: String, default: '' },
    fullExplanation: { type: String, default: '' },
    formulaUsed: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    quickTrick: { type: String, default: '' },
    commonMistake: { type: String, default: '' },
    subject: { type: String, default: '' },
    category: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    isSkipped: { type: Boolean, default: true },
    timeSpentSec: { type: Number, default: 0 },
    streakAtAnswer: { type: Number, default: 0 },
    xpEarnedForQuestion: { type: Number, default: 0 }
}, { _id: false });

const gameSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    gameSection: { type: String, required: true, enum: ['speedChallenge', 'accuracyRush'] },
    gameSectionName: { type: String, required: true },
    difficulty: { type: Number, required: true, enum: [2, 3] }, // 2 = Intermediate, 3 = Advanced
    difficultyName: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    timeLimitSec: { type: Number, required: true },
    
    // Server snapshot of questions assigned to this game session
    questions: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        questionText: { type: String, required: true },
        options: {
            a: { type: String, required: true },
            b: { type: String, required: true },
            c: { type: String, required: true },
            d: { type: String, required: true }
        },
        correctAnswerLetter: { type: String, required: true },
        correctAnswerText: { type: String, required: true },
        subject: { type: String, default: '' },
        category: { type: String, default: '' },
        explanation: { type: String, default: '' },
        fullExplanation: { type: String, default: '' },
        formulaUsed: { type: String, default: '' },
        stepSolution: { type: String, default: '' },
        quickTrick: { type: String, default: '' },
        commonMistake: { type: String, default: '' }
    }],

    answers: [gameAnswerSchema],

    score: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    
    earnedXP: { type: Number, default: 0 },
    lostXP: { type: Number, default: 0 },
    netXP: { type: Number, default: 0 },
    
    levelBefore: { type: Number, default: 1 },
    levelAfter: { type: Number, default: 1 },
    xpBefore: { type: Number, default: 0 },
    xpAfter: { type: Number, default: 0 },
    
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'EXPIRED'], default: 'ACTIVE' },
    startTime: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    timeTakenSec: { type: Number, default: 0 }
}, {
    timestamps: true
});

gameSessionSchema.index({ userId: 1, createdAt: -1 });
gameSessionSchema.index({ userId: 1, gameSection: 1, status: 1 });

module.exports = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
