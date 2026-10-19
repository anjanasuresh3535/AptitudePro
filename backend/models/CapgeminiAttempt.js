const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
    promptId: { type: String, required: true },
    prompt: { type: String, default: '' },
    response: { type: String, default: '', maxlength: 20000 },
    correct: { type: Boolean, default: null },
    expectedAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    score: { type: Number, default: null },
    passageTitle: { type: String, default: '' },
    audioUrl: { type: String, default: '' }
}, { _id: false });

const capgeminiAttemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, enum: ['Capgemini', 'Tech Mahindra', 'IBM'], default: 'Capgemini', required: true },
    sectionKey: { type: String, enum: ['writing', 'behavioral', 'games', 'listening', 'essay', 'psychometric', 'communication', 'technicalInterview', 'hrInterview', 'groupDiscussion'], required: true },
    attemptId: { type: String, required: true },
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    responses: { type: [responseSchema], default: [] },
    score: { type: Number, default: null },
    total: { type: Number, default: null },
    timeTaken: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null }
}, { timestamps: true });

capgeminiAttemptSchema.index({ userId: 1, attemptId: 1 }, { unique: true });
capgeminiAttemptSchema.index({ userId: 1, company: 1, sectionKey: 1, submittedAt: -1 });

module.exports = mongoose.models.CapgeminiAttempt || mongoose.model('CapgeminiAttempt', capgeminiAttemptSchema);
