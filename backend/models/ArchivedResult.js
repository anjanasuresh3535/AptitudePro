const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed'];

// Same snapshot shape as Result.js's embedded answers - duplicated
// (not imported) on purpose: an archived document must keep rendering
// correctly even if Result's schema evolves later, since these are
// frozen historical records.
const answerSchema = new mongoose.Schema({
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
    formula: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    quickTrick: { type: String, default: '' },
    commonMistake: { type: String, default: '' },
    subject: { type: String, default: '' },
    category: { type: String, default: '' },
    difficulty: { type: Number, enum: [1, 2, 3] },
    isCorrect: { type: Boolean, required: true },
    isSkipped: { type: Boolean, required: true },
    timeSpent: { type: Number, default: 0 }
}, { _id: false });

const archivedResultSchema = new mongoose.Schema({
    originalResultId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
        // The _id this document had while it lived in the Result
        // collection - kept so any link made before archiving still resolves.
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    section: { type: String, required: true, enum: SECTIONS },
    score: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    xp: { type: Number, required: true }, // netXP from the original result
    level: { type: Number, required: true }, // levelAfter from the original result
    testDate: { type: Date, required: true },
    archivedAt: { type: Date, default: Date.now },
    summary: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // Condensed stat snapshot (e.g. { totalQuestions, correct, wrong,
        // skipped }) for quick display without reading the full answers[].
    },
    answers: [answerSchema]
});

archivedResultSchema.index({ userId: 1, testDate: -1 });

module.exports = mongoose.models.ArchivedResult || mongoose.model('ArchivedResult', archivedResultSchema);
