const mongoose = require('mongoose');

/**
 * Stores a Wipro coding-practice submission AND its server-side evaluation.
 *
 * Execution model:
 *   Student code is untrusted and is executed only inside an isolated Docker
 *   sandbox (see backend/services/coding). When that sandbox is unavailable the
 *   submission is still stored, but with status 'not_executed' and no score -
 *   a pass/fail result is NEVER invented.
 *
 * Hidden test-case inputs and expected outputs are never persisted here: only
 * aggregate counters and per-test boolean flags are kept.
 */

// Per-test outcome. Deliberately stores only booleans + which side was hidden.
const testCaseResultSchema = new mongoose.Schema({
    passed: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false }
}, { _id: false });

const codingProblemSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    problemTitle: { type: String, default: '' },
    language: { type: String, default: '' },
    code: { type: String, default: '' },
    attempted: { type: Boolean, default: false },

    // Verdict, derived server-side only:
    // 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error'
    // | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'output_limit_exceeded'
    // | 'not_executed' | 'unsupported_language' | 'skipped'
    evaluationStatus: { type: String, default: 'not_executed' },
    message: { type: String, default: '' },

    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    sampleTests: { type: Number, default: 0 },
    hiddenTests: { type: Number, default: 0 },
    passedSampleTests: { type: Number, default: 0 },
    passedHiddenTests: { type: Number, default: 0 },
    runtimeMs: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // 0-100, server-derived
    caseResults: [testCaseResultSchema]
}, { _id: false });

const codingSubmissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: { type: String, default: 'Wipro' },
    exam: { type: String, default: 'Wipro_Elite_NTH' },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        default: null
    },
    attemptId: { type: String, default: '' },
    section: { type: String, default: 'Company-wipro-coding' },
    learningPath: { type: String, default: 'college' },
    placementType: { type: String, default: 'company' },
    testTitle: { type: String, default: 'Wipro Coding Mock Test' },

    totalProblems: { type: Number, default: 0 },
    attemptedProblems: { type: Number, default: 0 },
    solvedProblems: { type: Number, default: 0 },
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    passedHiddenTests: { type: Number, default: 0 },
    totalHiddenTests: { type: Number, default: 0 },
    compileErrors: { type: Number, default: 0 },
    runtimeErrors: { type: Number, default: 0 },
    timeouts: { type: Number, default: 0 },
    score: { type: Number, default: 0 },   // 0-100 overall
    xpEarned: { type: Number, default: 0 },
    // 'accepted' | 'partial' | 'not_attempted'
    overallStatus: { type: String, default: 'not_attempted' },

    timeTaken: { type: Number, default: 0 }, // seconds
    expired: { type: Boolean, default: false }, // submitted after the deadline
    executionAvailable: { type: Boolean, default: false },
    evaluationNote: { type: String, default: '' },
    // Idempotency guard: XP for this attemptId is granted at most once.
    xpGranted: { type: Boolean, default: false },
    problems: [codingProblemSchema],
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true, autoIndex: false });

codingSubmissionSchema.index({ userId: 1, submittedAt: -1 });
// NOTE: deliberately NOT unique on attemptId - Phase 12 requires every
// submission to be recorded for review. Multiple submissions per attempt are
// allowed; only the first one funds XP.
codingSubmissionSchema.index({ attemptId: 1, xpGranted: 1 });
// One index covers coding assessment submissions across companies. The v3
// index adds the newer company modules while startup preserves legacy coverage.
codingSubmissionSchema.index(
    { userId: 1, company: 1, attemptId: 1 },
    {
        name: 'company_attempt_idempotency_v3',
        unique: true,
        partialFilterExpression: {
            company: { $in: ['Accenture', 'Cognizant', 'Capgemini', 'HCLTech'] },
            attemptId: { $gt: '' }
        }
    }
);
codingSubmissionSchema.index(
    { userId: 1, company: 1, attemptId: 1 },
    { name: 'ibm_coding_attempt_unique', unique: true, partialFilterExpression: { company: 'IBM', attemptId: { $gt: '' } } }
);

module.exports = mongoose.models.CodingSubmission
    || mongoose.model('CodingSubmission', codingSubmissionSchema);
