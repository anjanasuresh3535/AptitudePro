const mongoose = require('mongoose');

// Stores a Cognizant written-communication or interview response. Mirrors
// AccentureResponse but is company-isolated (enum locked to 'Cognizant') so the
// two modules never read or overwrite each other's data. Automated scoring is
// not enabled: evaluationStatus stays 'not-configured' and no score is invented.
const cognizantResponseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, enum: ['Cognizant'], default: 'Cognizant', required: true },
    section: { type: String, enum: ['Communication', 'Interview Preparation'], required: true },
    assessmentId: { type: String, required: true },
    attemptId: { type: String, required: true, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    taskTitle: { type: String, required: true },
    topic: { type: String, default: '' },
    difficulty: { type: String, default: 'Medium' },
    responseText: { type: String, default: '', maxlength: 20000 },
    audioData: { type: String, default: '' },
    audioDuration: { type: Number, default: 0 },
    responseMode: { type: String, enum: ['text', 'audio', 'both'], default: 'text' },
    wordCount: { type: Number, required: true },
    evaluationCriteria: { type: [String], default: [] },
    evaluationStatus: { type: String, enum: ['not-configured'], default: 'not-configured' },
    submissionStatus: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

cognizantResponseSchema.index({ userId: 1, submittedAt: -1 });
module.exports = mongoose.models.CognizantResponse || mongoose.model('CognizantResponse', cognizantResponseSchema);
