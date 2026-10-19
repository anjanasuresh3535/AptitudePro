const mongoose = require('mongoose');

const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const PLACEMENT_CATEGORIES = ['it-software', 'core-engineering', 'general'];

// Full snapshot per answered question - does NOT rely on the live
// Question collection, so a result still displays correctly even if
// that question is later edited or deleted.
const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    questionText: { type: String, required: true },
    options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, required: true },
        d: { type: String, required: true }
    },
    selectedAnswer: {
        type: String,
        // 'A'–'D' = MCQ choice, null = unanswered/skipped,
        // 'WRITING_SUBMITTED' = essay submitted, 'SKIPPED' = explicitly skipped
        enum: ['A', 'B', 'C', 'D', 'WRITING_SUBMITTED', 'SKIPPED', null],
        default: null
    },
    selectedAnswerText: {
        type: String,
        default: null
    },
    correctAnswer: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true
    },
    correctAnswerText: {
        type: String,
        required: true
    },
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
    timeSpent: { type: Number, default: 0 } // seconds
}, { _id: false });

const resultSchema = new mongoose.Schema({
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
    difficulty: {
        type: Number,
        enum: [1, 2, 3]
    },
    // Optional snapshot metadata for placement redesign
    learningPath: {
        type: String,
        enum: ['school', 'college', null],
        default: 'college'
    },
    placementType: {
        type: String,
        default: 'general'
    },
    company: {
        type: String,
        default: null
    },
    assessmentId: { type: String, default: null },
    attemptId: { type: String, default: null },
    evaluationStatus: { type: String, enum: ['evaluated', 'execution-unavailable'], default: 'evaluated' },
    testTitle: {
        type: String,
        default: null
    },
    placementCategory: {
        type: String,
        enum: [...PLACEMENT_CATEGORIES, null],
        default: null
    },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correct: { type: Number, required: true },
    wrong: { type: Number, required: true },
    skipped: { type: Number, required: true },
    accuracy: { type: Number, required: true }, // 0-100
    xpEarned: { type: Number, required: true },
    xpLost: { type: Number, required: true },
    netXP: { type: Number, required: true },
    levelBefore: { type: Number, required: true },
    levelAfter: { type: Number, required: true },
    xpBefore: { type: Number, required: true },
    xpAfter: { type: Number, required: true },
    timeTaken: { type: Number, default: 0 }, // seconds
    testDate: { type: Date, default: Date.now },
    answers: [answerSchema]
}, {
    timestamps: true
});

resultSchema.index({ userId: 1, testDate: -1 });
resultSchema.index({ userId: 1, section: 1 });
resultSchema.index({ accuracy: 1 });

module.exports = mongoose.models.Result || mongoose.model('Result', resultSchema);
