const mongoose = require('mongoose');

// Stores a SQL-round submission and its server-side evaluation. Mirrors the
// CodingSubmission pattern: a generic model with a `company` field plus a
// per-company partial unique index used as a one-shot idempotency guard.
//
// Security/evaluation model:
//   The candidate's query is untrusted. It is executed only inside an isolated
//   in-memory SQLite database built from the task's own schema + seed, with a
//   strict read-only guard (single SELECT/WITH statement, no writes/DDL/ATTACH).
//   The reference solution is used to derive the expected rows; it is never
//   stored here or sent to the client. When the SQL engine is unavailable the
//   submission is still stored with status 'not_executed' — a pass/fail result
//   is NEVER invented.
const sqlTaskResultSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    title: { type: String, default: '' },
    query: { type: String, default: '' },
    attempted: { type: Boolean, default: false },
    // 'accepted' | 'wrong_answer' | 'error' | 'not_executed' | 'skipped'
    evaluationStatus: { type: String, default: 'not_executed' },
    message: { type: String, default: '' },
    rowsReturned: { type: Number, default: 0 },
    rowsExpected: { type: Number, default: 0 }
}, { _id: false });

const sqlSubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, default: 'Cognizant' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', default: null },
    attemptId: { type: String, default: '' },
    section: { type: String, default: 'Company-cognizant-sql' },
    learningPath: { type: String, default: 'college' },
    placementType: { type: String, default: 'company' },
    testTitle: { type: String, default: 'Cognizant SQL Assessment' },

    totalTasks: { type: Number, default: 0 },
    attemptedTasks: { type: Number, default: 0 },
    solvedTasks: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // 0-100 overall, server-derived
    xpEarned: { type: Number, default: 0 },
    overallStatus: { type: String, default: 'not_attempted' }, // 'accepted' | 'partial' | 'not_attempted'

    timeTaken: { type: Number, default: 0 }, // seconds
    expired: { type: Boolean, default: false },
    executionAvailable: { type: Boolean, default: false },
    evaluationNote: { type: String, default: '' },
    xpGranted: { type: Boolean, default: false },
    tasks: [sqlTaskResultSchema],
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

sqlSubmissionSchema.index({ userId: 1, submittedAt: -1 });
sqlSubmissionSchema.index({ attemptId: 1, xpGranted: 1 });
sqlSubmissionSchema.index(
    { userId: 1, company: 1, attemptId: 1 },
    { unique: true, partialFilterExpression: { company: 'Cognizant' } }
);

module.exports = mongoose.models.SqlSubmission || mongoose.model('SqlSubmission', sqlSubmissionSchema);
