const mongoose = require('mongoose');

const accentureResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, enum: ['Accenture'], default: 'Accenture', required: true },
    section: { type: String, enum: ['Communication', 'Interview Preparation'], required: true },
    assessmentId: { type: String, required: true },
    attemptId: { type: String, required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    taskTitle: { type: String, required: true },
    topic: { type: String, default: '' },
    difficulty: { type: String, default: 'Medium' },
    responseText: { type: String, default: '', maxlength: 20000 },
    wordCount: { type: Number, required: true },
    evaluationCriteria: { type: [String], default: [] },
    evaluationStatus: { type: String, enum: ['not-configured'], default: 'not-configured' },
    submissionStatus: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

accentureResponseSchema.index({ userId: 1, submittedAt: -1 });
module.exports = mongoose.models.AccentureResponse || mongoose.model('AccentureResponse', accentureResponseSchema);
