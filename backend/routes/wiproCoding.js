const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/auth');
const mongoose = require('mongoose');

const User = require('../models/User');
const Result = require('../models/Result');
const Question = require('../models/Question');
const CodingSubmission = require('../models/CodingSubmission');
const UserStats = require('../models/UserStats');
const SectionProgress = require('../models/SectionProgress');
const XPHistory = require('../models/XPHistory');
const levelService = require('../services/LevelService');
const placementService = require('../services/PlacementService');
const codingService = require('../services/coding');
const { getExecutionStatus } = require('../services/coding/availability');
const { WIPRO_CODING_MOCK_CONFIG } = require('../config/wiproConfig');
const { DISCLAIMER_TEXT } = require('../config/placementConfig');
const { LANGUAGES } = require('../services/coding/languages');

const CODING_TIME_LIMIT_SEC = WIPRO_CODING_MOCK_CONFIG.timeLimitSec; // 60 minutes
const CODING_SECTION = 'Company-wipro-coding';

/**
 * Strip hidden test cases before anything is sent to the browser.
 * Only the visible sample case is ever exposed.
 */
function toPublicProblem(q) {
    const sampleCases = (q.testCases || []).filter(tc => !tc.isHidden).map(tc => ({
        input: tc.input,
        output: tc.output,
        explanation: tc.explanation
    }));

    return {
        id: q._id.toString(),
        title: q.problemTitle || q.question,
        statement: q.question,
        inputFormat: q.inputFormat || '',
        outputFormat: q.outputFormat || '',
        constraints: q.constraints || '',
        sampleInput: q.sampleInput || (sampleCases[0] ? sampleCases[0].input : ''),
        sampleOutput: q.sampleOutput || (sampleCases[0] ? sampleCases[0].output : ''),
        explanation: q.explanation || '',
        topic: q.topic || '',
        difficulty: q.difficulty || '',
        difficultyLevel: q.difficultyLevel || 1,
        languages: (q.supportedLanguages && q.supportedLanguages.length)
            ? q.supportedLanguages
            : WIPRO_CODING_MOCK_CONFIG.languages,
        allowedLanguages: (q.supportedLanguages && q.supportedLanguages.length)
            ? q.supportedLanguages
            : WIPRO_CODING_MOCK_CONFIG.languages,
        samples: sampleCases,
        hiddenCaseCount: (q.testCases || []).filter(tc => tc.isHidden).length,
        timeLimitMs: q.timeLimitMs || codingService.config.limits.perCaseTimeoutSec * 1000,
        memoryLimitMb: q.memoryLimitMb || codingService.config.limits.memoryMb
    };
}

// ============================================
// GET /wipro/coding - coding assessment page
// ============================================
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.redirect('/login');
        const pool = await placementService.getWiproCodingMockQuestions(userId);

        const now = Date.now();
        if (req.query.new === '1') {
            req.session.wiproCodingAttempt = null;
        }
        let attempt = req.session.wiproCodingAttempt;

        // A live attempt is resumed whenever its stored question set can still
        // be loaded in full. The set is read back from the database by the stored
        // ids, so a page refresh can never reshuffle it.
        let resume = attempt &&
            attempt.userId === userId &&
            Array.isArray(attempt.questionIds) &&
            attempt.questionIds.length > 0 &&
            attempt.deadline > now;

        let questions;

        if (resume) {
            const docs = await Question.find({
                _id: { $in: attempt.questionIds },
                company: 'Wipro',
                active: { $ne: false }
            });
            const byId = new Map(docs.map(d => [d._id.toString(), d]));
            const ordered = attempt.questionIds.map(id => (byId.has(id) ? toPublicProblem(byId.get(id)) : null)).filter(Boolean);
            questions = ordered;
            if (questions.length !== attempt.questionIds.length) {
                // The stored set is no longer fully available - fall through to a new attempt.
                resume = false;
            }
        }

        if (!resume) {
            const poolQuestions = pool.questions || [];
            attempt = {
                attemptId: 'cod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                userId,
                questionIds: poolQuestions.map(q => q._id.toString()),
                startTime: now,
                deadline: now + (CODING_TIME_LIMIT_SEC * 1000)
            };
            req.session.wiproCodingAttempt = attempt;
            questions = poolQuestions.map(toPublicProblem);
        }

        if (questions.length === 0) {
            return res.render('error', {
                title: 'Coding Practice',
                message: 'Wipro coding practice is not available right now',
                error: pool.errorMessage || 'No coding problems are currently available. Please try again later.',
                user: req.session.user || null
            });
        }

        const stats = await mongoose.model('UserStats').findOne({ userId }).lean().catch(() => null);
        const xp = (stats && stats.xp) || user.xp || 0;
        const levelNum = levelService.getLevelFromXP(xp);
        const levelInfo = levelService.getLevelInfo(levelNum);

        const execStatus = await getExecutionStatus();
        const starters = {};
        Object.keys(LANGUAGES).forEach(id => { starters[id] = LANGUAGES[id].starter || ''; });
        const languageAvailability = {};
        WIPRO_CODING_MOCK_CONFIG.languages.forEach(id => {
            const info = execStatus.languages && execStatus.languages[id];
            languageAvailability[id] = execStatus.available !== true || !info || info.available !== false;
        });

        res.render('wipro-coding', {
            title: WIPRO_CODING_MOCK_CONFIG.name,
            testTitle: WIPRO_CODING_MOCK_CONFIG.name,
            problems: questions,
            totalQ: questions.length,
            timeLimitSec: CODING_TIME_LIMIT_SEC,
            remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)),
            deadline: attempt.deadline,
            attemptId: attempt.attemptId,
            languages: WIPRO_CODING_MOCK_CONFIG.languages,
            languageAvailability,
            startersJson: JSON.stringify(starters).replace(/</g, '\\u003c'),
            executionAvailable: execStatus.available === true,
            executionReason: execStatus.reason || '',
            comparisonStrategy: codingService.config.comparison.defaultStrategy,
            disclaimer: DISCLAIMER_TEXT,
            xp,
            levelNum,
            levelInfo,
            user: req.session.user || null,
            userId
        });
    } catch (error) {
        console.error('Wipro coding load error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load coding practice',
            error: 'Something went wrong. Please try again.',
            user: req.session.user || null
        });
    }
});

function publicEvaluation(evaluated, language, code) {
    return {
        questionId: evaluated.questionId,
        language: evaluated.language || language,
        status: evaluated.status,
        message: evaluated.message || '',
        passedTests: evaluated.passedTests || 0,
        totalTests: evaluated.totalTests || 0,
        passedSampleTests: evaluated.passedSampleTests || 0,
        sampleTests: evaluated.sampleTests || 0,
        runtimeMs: evaluated.runtimeMs || 0
    };
}

// ============================================
// POST /wipro/coding/run - Sample tests only (does not end the mock)
// Hidden cases are never executed on this path.
// ============================================
router.post('/run', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const attempt = req.session.wiproCodingAttempt;
        if (!attempt || attempt.userId !== userId) {
            return res.status(400).json({ ok: false, message: 'No active coding attempt. Please start the test again.' });
        }

        const now = Date.now();
        if (now > attempt.deadline) {
            return res.status(400).json({ ok: false, expired: true, message: 'The time limit has ended. Submit the test to save your code.' });
        }

        const questionId = String((req.body && req.body.questionId) || '');
        if (!attempt.questionIds.includes(questionId)) {
            return res.status(400).json({ ok: false, message: 'That problem is not part of this test.' });
        }

        const q = await Question.findOne({ _id: questionId, company: 'Wipro', active: { $ne: false } });
        if (!q) {
            return res.status(404).json({ ok: false, message: 'Problem not found.' });
        }

        const execStatus = await getExecutionStatus();
        const evaluated = await codingService.evaluateSubmission({
            question: q,
            language: String((req.body && req.body.language) || '').trim(),
            source: typeof req.body.code === 'string' ? req.body.code : '',
            executionAvailable: execStatus.available === true,
            sampleOnly: true
        });

        return res.json({
            ok: true,
            executionAvailable: execStatus.available === true,
            result: publicEvaluation(evaluated, req.body.language, req.body.code)
        });
    } catch (error) {
        console.error('Wipro coding run error:', error);
        return res.status(500).json({ ok: false, message: 'Could not run the sample tests. Please try again.' });
    }
});

// ============================================
// POST /wipro/coding/submit - Evaluate and store submitted code
//
// SECURITY / TRUST MODEL (Phase 11)
//   * userId comes from the authenticated session, never the request body
//   * the problem set comes from the server-side session attempt
//   * verdict, score, XP and every test result are computed here, server-side
//   * a client-supplied score / status / userId is never read
// ============================================
router.post('/submit', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;               // trusted: authenticated session
        const attempt = req.session.wiproCodingAttempt;  // trusted: server-side attempt
        if (!attempt || attempt.userId !== userId) {
            return res.status(400).send('No active coding attempt. Please start the test again.');
        }

        // ---- Phase 13: the SERVER decides whether the test is still live.
        const now = Date.now();
        const expired = now > attempt.deadline;
        const timeTaken = Math.max(0, Math.min(
            Math.floor((now - attempt.startTime) / 1000),
            CODING_TIME_LIMIT_SEC
        ));

        let payloads = req.body.submissions;
        if (typeof payloads === 'string') {
            try { payloads = JSON.parse(payloads); } catch (e) { payloads = []; }
        }
        if (!Array.isArray(payloads)) payloads = [];

        // Only problems belonging to THIS attempt are ever eligible.
        const questions = await Question.find({
            _id: { $in: attempt.questionIds },
            company: 'Wipro'
        });
        const qMap = new Map(questions.map(q => [q._id.toString(), q]));

        const execStatus = await getExecutionStatus();
        // An expired attempt is still recorded, but it is never executed.
        const executionAvailable = execStatus.available === true && !expired;

        const problems = [];
        for (const id of attempt.questionIds) {
            const q = qMap.get(id);
            if (!q) continue;

            const entry = (payloads.find(p => p && p.questionId === id)) || {};
            const code = typeof entry.code === 'string' ? entry.code : '';
            const language = String(entry.language || '').trim();

            const evaluated = await codingService.evaluateSubmission({
                question: q,
                language,
                source: code,
                executionAvailable
            });

            problems.push({
                questionId: q._id,
                problemTitle: q.problemTitle || q.question,
                language: evaluated.language || language,
                code,
                attempted: code.trim().length > 0,
                evaluationStatus: evaluated.status,
                message: evaluated.message || '',
                passedTests: evaluated.passedTests || 0,
                totalTests: evaluated.totalTests || 0,
                sampleTests: evaluated.sampleTests || 0,
                hiddenTests: evaluated.hiddenTests || 0,
                passedSampleTests: evaluated.passedSampleTests || 0,
                passedHiddenTests: evaluated.passedHiddenTests || 0,
                runtimeMs: evaluated.runtimeMs || 0,
                score: evaluated.score || 0,
                caseResults: evaluated.caseResults || []
            });
        }

// ---- Aggregate results (all values server-derived) ----
        const totalProblems = problems.length;
        const attempted = problems.filter(p => p.attempted).length;
        const solved = problems.filter(p => p.evaluationStatus === codingService.STATUS.ACCEPTED).length;
        const passedTests = problems.reduce((s, p) => s + p.passedTests, 0);
        const totalTests = problems.reduce((s, p) => s + p.totalTests, 0);
        const passedHidden = problems.reduce((s, p) => s + p.passedHiddenTests, 0);
        const totalHidden = problems.reduce((s, p) => s + p.hiddenTests, 0);
        const compileErrors = problems.filter(p => p.evaluationStatus === codingService.STATUS.COMPILE_ERROR).length;
        const runtimeErrors = problems.filter(p => p.evaluationStatus === codingService.STATUS.RUNTIME_ERROR).length;
        const timeouts = problems.filter(p => p.evaluationStatus === codingService.STATUS.TIME_LIMIT_EXCEEDED).length;
        const overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const overallStatus = solved === totalProblems && totalProblems > 0
            ? 'accepted'
            : (attempted > 0 ? 'partial' : 'not_attempted');

        // ---- Phase 16: XP is derived here and granted AT MOST ONCE per attempt.
        const stats = await UserStats.findOne({ userId });
        const currentXP = stats ? (stats.xp || 0) : 0;
        const currentLevel = levelService.getLevelFromXP(currentXP);

        const alreadyGranted = await XPHistory.exists({
            userId,
            reason: new RegExp(`\\[Wipro Coding\\] attempt ${attempt.attemptId}\\b`)
        });

        // XP is only meaningful when the code was actually executed.
        const earnedXP = (executionAvailable && !alreadyGranted)
            ? codingService.calculateCodingXp({ problems })
            : 0;
        const netXP = Math.max(0, earnedXP);
        const newUserXP = currentXP + netXP;
        const newUserLevel = levelService.getLevelFromXP(newUserXP);
// Record in the shared Result collection so it appears in history/dashboards.
        const resultDoc = await Result.create({
            userId,
            section: CODING_SECTION,
            learningPath: 'college',
            placementType: 'company',
            company: 'Wipro',
            testTitle: WIPRO_CODING_MOCK_CONFIG.name,
            difficulty: 1,
            score: solved,
            totalQuestions: totalProblems,
            correct: solved,
            wrong: attempted - solved,
            skipped: totalProblems - attempted,
            accuracy: overallScore,
            xpEarned: netXP,
            xpLost: 0,
            netXP,
            levelBefore: currentLevel,
            levelAfter: newUserLevel,
            xpBefore: currentXP,
            xpAfter: newUserXP,
            timeTaken,
            answers: []
        });

        const evaluationNote = executionAvailable
            ? 'Your code was compiled and run inside an isolated sandbox against the sample and hidden test cases.'
            : (expired
                ? 'The time limit had expired, so this submission was recorded but not executed.'
                : 'Code execution is currently unavailable, so this submission was stored but not run. No pass or fail result was produced.');

        const submission = await CodingSubmission.create({
            userId,
            company: 'Wipro',
            exam: 'Wipro_Elite_NTH',
            resultId: resultDoc._id,
            attemptId: attempt.attemptId,
            section: CODING_SECTION,
            testTitle: WIPRO_CODING_MOCK_CONFIG.name,
            totalProblems,
            attemptedProblems: attempted,
            solvedProblems: solved,
            passedTests,
            totalTests,
            passedHiddenTests: passedHidden,
            totalHiddenTests: totalHidden,
            compileErrors,
            runtimeErrors,
            timeouts,
            score: overallScore,
            xpEarned: netXP,
            overallStatus,
            timeTaken,
            expired,
            executionAvailable,
            evaluationNote,
            xpGranted: netXP > 0,
            problems
        });
// ---- Phase 16: apply XP through the EXISTING xp pipeline ----
        if (netXP > 0) {
            await User.updateOne({ _id: userId }, { $set: { xp: newUserXP, level: newUserLevel } });
            await UserStats.updateOne({ userId }, { $set: { xp: newUserXP }, $inc: { totalQuizzes: 1, totalQuestions: totalProblems } }, { upsert: true });
            await XPHistory.create({
                userId,
                resultId: resultDoc._id,
                section: CODING_SECTION,
                xpEarned: netXP,
                xpLost: 0,
                netXP,
                reason: `[Wipro Coding] attempt ${attempt.attemptId}: ${solved}/${totalProblems} solved, ${passedTests}/${totalTests} tests passed`,
                levelBefore: currentLevel,
                levelAfter: newUserLevel
            });
            await SectionProgress.updateOne(
                { userId, section: CODING_SECTION },
                {
                    $set: { xp: netXP, level: newUserLevel, lastAttempt: new Date() },
                    $inc: { correct: solved, wrong: attempted - solved, skipped: totalProblems - attempted, quizzesAttempted: 1, totalQuestions: totalProblems }
                },
                { upsert: true }
            );
        } else {
            await UserStats.updateOne({ userId }, { $inc: { totalQuizzes: 1, totalQuestions: totalProblems } }, { upsert: true });
            await SectionProgress.updateOne(
                { userId, section: CODING_SECTION },
                { $set: { lastAttempt: new Date() }, $inc: { quizzesAttempted: 1, totalQuestions: totalProblems } },
                { upsert: true }
            );
        }

        req.session.wiproCodingAttempt = null;
        res.redirect(`/wipro/coding/result/${submission._id}`);

    } catch (error) {
        console.error('Wipro coding submit error:', error);
        res.status(500).send('Failed to store your coding submission. Please try again.');
    }
});

// ============================================
// GET /wipro/coding/result/:id - Submission review
// ============================================
router.get('/result/:id', isAuthenticated, async (req, res) => {
    try {
        const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId });
        if (!submission) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Coding submission not found',
                error: 'This coding submission does not exist or is not yours.',
                user: req.session.user || null
            });
        }

        const questionIds = submission.problems.map(p => p.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });
        const qMap = new Map(questions.map(q => [q._id.toString(), q]));

        const problems = submission.problems.map(p => {
            const q = qMap.get(p.questionId.toString());
            return {
                title: p.problemTitle,
                language: p.language,
                code: p.code,
                attempted: p.attempted,
                evaluationStatus: p.evaluationStatus,
                message: p.message || '',
                passedTests: p.passedTests || 0,
                totalTests: p.totalTests || 0,
                sampleTests: p.sampleTests || 0,
                hiddenTests: p.hiddenTests || 0,
                passedSampleTests: p.passedSampleTests || 0,
                passedHiddenTests: p.passedHiddenTests || 0,
                runtimeMs: p.runtimeMs || 0,
                score: p.score || 0,
                // Only pass/fail flags - never hidden inputs or expected outputs.
                caseResults: (p.caseResults || []).map(c => ({ passed: !!c.passed, isHidden: !!c.isHidden })),
                statement: q ? q.question : '',
                inputFormat: q ? q.inputFormat : '',
                outputFormat: q ? q.outputFormat : '',
                constraints: q ? q.constraints : '',
                sampleInput: q ? q.sampleInput : '',
                sampleOutput: q ? q.sampleOutput : '',
                explanation: q ? q.explanation : ''
            };
        });

        res.render('wipro-coding-result', {
            title: 'Wipro Coding Mock Result',
            submission,
            problems,
            executionAvailable: submission.executionAvailable,
            evaluationNote: submission.evaluationNote,
            // Re-rendering this page must never award XP again; the award already
            // happened (at most once) inside POST /submit.
            xpAwardedAlready: submission.xpEarned > 0,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Wipro coding result error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load coding submission',
            error: 'Something went wrong. Please try again.',
            user: req.session.user || null
        });
    }
});

module.exports = router;
// Exported for automated testing of the hidden-test-case filter.
module.exports.toPublicProblem = toPublicProblem;
