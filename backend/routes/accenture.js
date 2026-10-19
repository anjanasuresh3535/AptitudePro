const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const AccentureResponse = require('../models/AccentureResponse');
const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const XPHistory = require('../models/XPHistory');
const SectionProgress = require('../models/SectionProgress');
const placement = require('../services/PlacementService');
const coding = require('../services/coding');
const { getExecutionStatus } = require('../services/coding/availability');
const { LANGUAGES, resolveLanguage } = require('../services/coding/languages');
const { ACCENTURE_SECTIONS } = require('../config/accentureConfig');
const codingExecutionConfig = require('../config/codingExecutionConfig');
const CODING_SECTION = 'Company-accenture-coding';
const CODING_TIME_SEC = 3600;

function wordCount(text) { return String(text || '').trim().split(/\s+/).filter(Boolean).length; }
function safeStatus(status) {
    const map = { accepted: 'Accepted', wrong_answer: 'Wrong Answer', compile_error: 'Compilation Error', runtime_error: 'Needs Review', time_limit_exceeded: 'Needs Review', memory_limit_exceeded: 'Needs Review', not_executed: 'Execution Unavailable', skipped: 'Needs Review', unsupported_language: 'Needs Review' };
    return map[status] || 'Needs Review';
}
function publicProblem(q) {
    const samples = (q.testCases || []).filter(tc => !tc.isHidden).map(tc => ({ input: tc.input, output: tc.output }));
    const rawStarters = q.starterCodeByLanguage instanceof Map ? Object.fromEntries(q.starterCodeByLanguage) : (q.starterCodeByLanguage || {});
    const languages = (q.supportedLanguages || []).filter(lang => resolveLanguage(lang));
    const starters = Object.fromEntries(languages.map(lang => [lang, String(rawStarters[lang] || q.starterCode || LANGUAGES[lang].starter || '')]));
    return { id: String(q._id), title: q.problemTitle || q.question, statement: q.problemStatement || q.question, inputFormat: q.inputFormat || '', outputFormat: q.outputFormat || '', constraints: q.constraints || '', sampleInput: q.sampleInput || samples[0]?.input || '', sampleOutput: q.sampleOutput || samples[0]?.output || '', topic: q.topic || '', difficulty: q.difficulty || 'Medium', languages, starters };
}

router.get('/communication', auth, (req, res) => res.render('accenture-communication-home', { title: 'Accenture Communication Practice', user: req.session.user || null, interview: false }));
router.get('/interview', auth, (req, res) => res.render('accenture-communication-home', { title: 'Accenture Interview Preparation', user: req.session.user || null, interview: true }));

async function renderResponseTask(req, res, sectionKey) {
    const section = sectionKey === 'interview' ? 'Interview Preparation' : 'Communication';
    let attempt = req.session.accentureResponseAttempt;
    let q = null, draftText = '';
    if (attempt && attempt.userId === req.session.userId && attempt.section === section && attempt.deadline > Date.now()) {
        q = await Question.findOne({ _id: attempt.taskId, company: 'Accenture', active: { $ne: false } });
        if (q) {
            const draft = await AccentureResponse.findOne({ userId: req.session.userId, attemptId: attempt.attemptId, taskId: q._id, submissionStatus: 'draft' }).lean();
            draftText = draft?.responseText || '';
        }
    }
    if (!q) {
        const questions = await placement.getAccentureQuestions({ userId: req.session.userId, sectionKey, count: 1 });
        q = questions.questions[0];
    }
    if (!q) return res.status(200).render('accenture-response', { title: section, unavailable: true, section, task: null, attemptId: '', user: req.session.user || null });
    if (!attempt || attempt.userId !== req.session.userId || attempt.section !== section || attempt.taskId !== String(q._id) || attempt.deadline <= Date.now()) {
        const attemptId = 'acc_' + new mongoose.Types.ObjectId().toString();
        const timeLimitSec = sectionKey === 'communication' ? 1200 : 1800;
        attempt = { attemptId, userId: req.session.userId, taskId: String(q._id), section, startTime: Date.now(), deadline: Date.now() + timeLimitSec * 1000 };
        req.session.accentureResponseAttempt = attempt;
    }
    if (!draftText && attempt.attemptId) {
        const draft = await AccentureResponse.findOne({ userId: req.session.userId, attemptId: attempt.attemptId, taskId: q._id, submissionStatus: 'draft' }).lean();
        draftText = draft?.responseText || '';
    }
    res.render('accenture-response', { title: section, unavailable: false, section, task: q.toObject ? q.toObject() : q, attemptId: attempt.attemptId, remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)), draftText, user: req.session.user || null });
}
router.get('/communication/task', auth, (req, res) => renderResponseTask(req, res, 'communication').catch(err => { console.error('Accenture communication load failed:', err.message); res.status(500).render('error', { title: 'Communication Practice', message: 'Practice could not be loaded', error: 'Please try again shortly.', user: req.session.user || null }); }));
router.get('/interview/task', auth, (req, res) => renderResponseTask(req, res, 'interview').catch(err => { console.error('Accenture interview load failed:', err.message); res.status(500).render('error', { title: 'Interview Practice', message: 'Practice could not be loaded', error: 'Please try again shortly.', user: req.session.user || null }); }));

router.post('/response/draft', auth, async (req, res) => {
    try {
        const attempt = req.session.accentureResponseAttempt;
        if (!attempt || attempt.userId !== req.session.userId || attempt.attemptId !== req.body.attemptId) return res.status(400).json({ ok: false, message: 'This practice task has expired. Please open a new task.' });
        const task = await Question.findOne({ _id: attempt.taskId, company: 'Accenture', questionType: { $in: ['free_response', 'interview_prompt'] }, active: { $ne: false } }).lean();
        if (!task) return res.status(404).json({ ok: false, message: 'This task is no longer available.' });
        const responseText = typeof req.body.responseText === 'string' ? req.body.responseText.slice(0, 20000) : '';
        if (req.body.submit === 'true' && !responseText.trim()) return res.status(400).json({ ok: false, message: 'Write a response before submitting.' });
        const doc = await AccentureResponse.findOneAndUpdate(
            { userId: attempt.userId, attemptId: attempt.attemptId, taskId: task._id },
            { $set: { company: 'Accenture', section: attempt.section, assessmentId: attempt.section === 'Communication' ? 'Company-accenture-communication' : 'Company-accenture-interview', taskTitle: task.question, topic: task.topic || '', difficulty: task.difficulty || 'Medium', responseText, wordCount: wordCount(responseText), evaluationCriteria: task.evaluationCriteria || [], submissionStatus: req.body.submit === 'true' ? 'submitted' : 'draft', submittedAt: req.body.submit === 'true' ? new Date() : null } },
            { upsert: true, new: true, runValidators: true }
        );
        if (req.body.submit === 'true') {
            doc.submissionStatus = 'submitted';
            doc.submittedAt = new Date();
            await doc.save();
            req.session.accentureResponseAttempt = null;
        }
        res.json({ ok: true, id: String(doc._id), submitted: doc.submissionStatus === 'submitted', message: doc.submissionStatus === 'submitted' ? 'Response submitted successfully. Evaluation will be available when the evaluation service is enabled.' : 'Draft saved.' });
    } catch (error) {
        console.error('Accenture response save failed:', error.message);
        res.status(500).json({ ok: false, message: 'Your response could not be saved. Please try again.' });
    }
});

router.get('/submission/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Submission not found', message: 'Submission not found', error: 'This submission does not exist or is not yours.', user: req.session.user || null });
    const submission = await AccentureResponse.findOne({ _id: req.params.id, userId: req.session.userId, company: 'Accenture' }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Submission not found', message: 'Submission not found', error: 'This submission does not exist or is not yours.', user: req.session.user || null });
    res.render('accenture-response-result', { submission, user: req.session.user || null });
});

router.get('/coding/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.', user: req.session.user || null });
    const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: 'Accenture' }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.', user: req.session.user || null });
    const problems = submission.problems.map(problem => ({ title: problem.problemTitle, language: problem.language, status: safeStatus(problem.evaluationStatus), code: problem.code, attempted: problem.attempted }));
    res.render('accenture-coding-result', { submission, problems, user: req.session.user || null });
});

router.get('/coding', auth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).lean();
        if (!user) return res.redirect('/login');
        let attempt = req.session.accentureCodingAttempt;
        const now = Date.now();
        let questions = [];
        if (attempt?.userId === userId && attempt.deadline > now && Array.isArray(attempt.questionIds)) {
            questions = await Question.find({ _id: { $in: attempt.questionIds }, company: 'Accenture', questionType: 'coding', active: { $ne: false } });
            const map = new Map(questions.map(q => [String(q._id), q]));
            questions = attempt.questionIds.map(id => map.get(id)).filter(Boolean);
            if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (attempt) {
            attempt.company = 'Accenture';
            attempt.codeState = attempt.codeState || {};
            attempt.selectedLanguages = attempt.selectedLanguages || {};
            attempt.currentProblem = Number.isInteger(attempt.currentProblem) ? attempt.currentProblem : 0;
            attempt.selectedLanguage = attempt.selectedLanguage || ACCENTURE_SECTIONS.coding.languages[0];
            if (!attempt.selectedLanguages[attempt.currentProblem]) attempt.selectedLanguages[attempt.currentProblem] = attempt.selectedLanguage;
        }
        if (!attempt) {
            const pool = await placement.getAccentureQuestions({ userId, sectionKey: 'coding', count: ACCENTURE_SECTIONS.coding.count });
            questions = pool.questions;
            if (!questions.length) return res.status(200).render('accenture-coding', {
                unavailable: true,
                problems: [],
                languages: ACCENTURE_SECTIONS.coding.languages,
                startersJson: '{}',
                remainingSeconds: 0,
                attemptId: '',
                executionAvailable: false,
                user: req.session.user || null
            });
            attempt = { attemptId: 'cod_' + new mongoose.Types.ObjectId().toString(), userId, company: 'Accenture', questionIds: questions.map(q => String(q._id)), codeState: {}, selectedLanguages: {}, currentProblem: 0, selectedLanguage: ACCENTURE_SECTIONS.coding.languages[0], startTime: now, deadline: now + CODING_TIME_SEC * 1000 };
            req.session.accentureCodingAttempt = attempt;
        }
        attempt.codeState = attempt.codeState || {};
        const problemData = questions.map(publicProblem);
        const execution = await getExecutionStatus({ backend: codingExecutionConfig.accentureBackend });
        const languages = [...new Set(problemData.flatMap(problem => problem.languages))];
        res.render('accenture-coding', { unavailable: false, problems: problemData, languages, initialStateJson: JSON.stringify({ codeState: attempt.codeState, currentProblem: attempt.currentProblem || 0, selectedLanguage: attempt.selectedLanguage || languages[0], selectedLanguages: attempt.selectedLanguages }).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), attemptId: attempt.attemptId, executionBackend: codingExecutionConfig.accentureBackend, executionAvailable: execution.available === true, executionMessage: execution.available ? '' : execution.reason, user: req.session.user || null });
    } catch (error) {
        console.error('Accenture coding load failed:', error.message);
        res.status(500).render('error', { title: 'Coding Practice', message: 'Coding practice could not be loaded', error: 'Please try again shortly.', user: req.session.user || null });
    }
});

router.post('/coding/draft', auth, async (req, res) => {
  try {
    const attempt = req.session.accentureCodingAttempt;
    const id = String(req.body.questionId || '');
    const language = String(req.body.language || '');
    const source = typeof req.body.code === 'string' ? req.body.code : '';
    if (!attempt || attempt.userId !== req.session.userId || attempt.attemptId !== req.body.attemptId || attempt.company !== 'Accenture' || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This coding attempt has expired. Please start another.' });
    if (!attempt.questionIds.includes(id) || !resolveLanguage(language) || source.length > 100000) return res.status(400).json({ ok: false, message: 'This code could not be saved.' });
    const q = await Question.findOne({ _id: id, company: 'Accenture', questionType: 'coding', active: { $ne: false } }).select('_id supportedLanguages').lean();
    if (!q || !(q.supportedLanguages || []).includes(language)) return res.status(404).json({ ok: false, message: 'Problem or language is unavailable.' });
    attempt.codeState = attempt.codeState || {};
    attempt.selectedLanguages = attempt.selectedLanguages || {};
    attempt.codeState[`${id}|${language}`] = source;
    attempt.currentProblem = Math.max(0, attempt.questionIds.indexOf(id));
    attempt.selectedLanguages[attempt.currentProblem] = language;
    attempt.selectedLanguage = language;
    req.session.accentureCodingAttempt = attempt;
    res.json({ ok: true });
  } catch (error) {
    console.error('Accenture coding draft save failed:', error.message);
    res.status(500).json({ ok: false, message: 'Your code could not be saved. Please try again.' });
  }
});

router.post('/coding/run', auth, async (req, res) => {
    try {
        const attempt = req.session.accentureCodingAttempt;
        const id = String(req.body.questionId || '');
        if (!attempt || attempt.userId !== req.session.userId || attempt.attemptId !== req.body.attemptId || attempt.company !== 'Accenture' || !attempt.questionIds.includes(id) || attempt.deadline < Date.now()) return res.status(400).json({ ok: false, message: 'This coding attempt has expired. Please start another.' });
        const q = await Question.findOne({ _id: id, company: 'Accenture', questionType: 'coding', active: { $ne: false } });
        if (!q) return res.status(404).json({ ok: false, message: 'Problem not found.' });
        const language = String(req.body.language || '');
        if (!resolveLanguage(language) || !(q.supportedLanguages || []).includes(language)) return res.status(400).json({ ok: false, message: 'Choose a supported language for this problem.' });
        if (typeof req.body.code !== 'string' || !req.body.code.trim()) return res.status(400).json({ ok: false, message: 'Add code before running the sample tests.' });
        attempt.codeState = attempt.codeState || {};
        attempt.codeState[`${id}|${language}`] = req.body.code.slice(0, 100000);
        attempt.currentProblem = attempt.questionIds.indexOf(id);
        attempt.selectedLanguages = attempt.selectedLanguages || {};
        attempt.selectedLanguages[attempt.currentProblem] = language;
        attempt.selectedLanguage = language;
        req.session.accentureCodingAttempt = attempt;
        const backend = codingExecutionConfig.accentureBackend;
        const execution = await getExecutionStatus({ force: true, backend });
        const result = await coding.evaluateSubmission({ question: q, language, source: req.body.code.slice(0, 100000), executionAvailable: execution.available === true, sampleOnly: true, backend });
        const outputs = (result.outputs || []).map((output, index) => ({ sample: index + 1, output }));
        res.json({ ok: true, status: safeStatus(result.status), passed: result.passedSampleTests || 0, total: result.sampleTests || 0, outputs, message: result.status === 'not_executed' ? (execution.reason || 'Code execution is unavailable. Your code was not run.') : result.status === 'accepted' ? 'Sample tests passed.' : result.status === 'wrong_answer' ? 'Some sample tests did not pass.' : result.status === 'compile_error' ? 'There is a compilation issue. Review your code and try again.' : 'The sample run needs review.' });
    } catch (error) { console.error('Accenture sample run failed:', error.message); res.status(500).json({ ok: false, message: 'The sample run could not be completed. Please try again.' }); }
});

router.post('/coding/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.accentureCodingAttempt;
        const requestedAttemptId = String(req.body.attemptId || '');
        if (!attempt || attempt.userId !== req.session.userId || attempt.attemptId !== requestedAttemptId || attempt.company !== 'Accenture') {
            if (requestedAttemptId) {
                const priorSubmission = await CodingSubmission.findOne({ userId: req.session.userId, company: 'Accenture', attemptId: requestedAttemptId }).lean();
                if (priorSubmission) return res.json({ ok: true, redirect: `/accenture/coding/result/${priorSubmission._id}` });
            }
            return res.status(400).json({ ok: false, message: 'This coding attempt has expired. Please start another.' });
        }
        const prior = await CodingSubmission.findOne({ company: 'Accenture', userId: attempt.userId, attemptId: attempt.attemptId }).lean();
        if (prior) return res.json({ ok: true, redirect: `/accenture/coding/result/${prior._id}` });
        let payloads = req.body.submissions;
        if (typeof payloads === 'string') { try { payloads = JSON.parse(payloads); } catch (_) { payloads = []; } }
        if (!Array.isArray(payloads)) payloads = [];
        const questions = await Question.find({ _id: { $in: attempt.questionIds }, company: 'Accenture', questionType: 'coding', active: { $ne: false } });
        const qMap = new Map(questions.map(q => [String(q._id), q]));
        const expired = Date.now() > attempt.deadline;
        const backend = codingExecutionConfig.accentureBackend;
        const execution = await getExecutionStatus({ force: true, backend });
        const executionAvailable = execution.available === true && !expired;
        const problems = [];
        for (const id of attempt.questionIds) {
            const q = qMap.get(id); if (!q) continue;
            const entry = payloads.find(item => item && String(item.questionId) === id) || {};
            const codeText = typeof entry.code === 'string' ? entry.code.slice(0, 100000) : String(attempt.codeState?.[`${id}|${entry.language || attempt.selectedLanguage || 'C'}`] || '').slice(0, 100000);
            const lang = String(entry.language || '');
            if (!resolveLanguage(lang) || !(q.supportedLanguages || []).includes(lang)) return res.status(400).json({ ok: false, message: 'Choose a supported language for every problem.' });
            const evaluation = await coding.evaluateSubmission({ question: q, language: lang, source: codeText, executionAvailable, backend });
            problems.push({ questionId: q._id, problemTitle: q.problemTitle || q.question, language: evaluation.language || lang, code: codeText, attempted: !!codeText.trim(), evaluationStatus: evaluation.status, message: safeStatus(evaluation.status), passedTests: evaluation.passedTests || 0, totalTests: evaluation.totalTests || 0, sampleTests: evaluation.sampleTests || 0, hiddenTests: evaluation.hiddenTests || 0, passedSampleTests: evaluation.passedSampleTests || 0, passedHiddenTests: evaluation.passedHiddenTests || 0, runtimeMs: evaluation.runtimeMs || 0, score: evaluation.score || 0, caseResults: evaluation.caseResults || [] });
        }
        const totalProblems = problems.length;
        const attempted = problems.filter(p => p.attempted).length;
        const solved = problems.filter(p => p.evaluationStatus === coding.STATUS.ACCEPTED).length;
        const passedTests = problems.reduce((sum, p) => sum + p.passedTests, 0);
        const totalTests = problems.reduce((sum, p) => sum + p.totalTests, 0);
        const score = totalTests ? Math.round(100 * passedTests / totalTests) : 0;
        const stats = await UserStats.findOne({ userId: attempt.userId });
        const xpBefore = stats?.xp || 0;
        const levelBefore = require('../services/LevelService').getLevelFromXP(xpBefore);
        const earned = executionAvailable ? coding.calculateCodingXp({ problems }) : 0;
        const netXP = Math.max(0, earned);
        const xpAfter = xpBefore + netXP;
        const levelAfter = require('../services/LevelService').getLevelFromXP(xpAfter);
        const timeTaken = Math.min(CODING_TIME_SEC, Math.max(0, Math.floor((Date.now() - attempt.startTime) / 1000)));
        const result = await Result.create({ userId: attempt.userId, company: 'Accenture', section: CODING_SECTION, assessmentId: CODING_SECTION, attemptId: attempt.attemptId, evaluationStatus: executionAvailable ? 'evaluated' : 'execution-unavailable', learningPath: 'college', placementType: 'company', testTitle: 'Accenture Coding Assessment', difficulty: 2, score: executionAvailable ? solved : 0, totalQuestions: totalProblems, correct: executionAvailable ? solved : 0, wrong: executionAvailable ? attempted - solved : 0, skipped: executionAvailable ? totalProblems - attempted : totalProblems, accuracy: executionAvailable ? score : 0, xpEarned: netXP, xpLost: 0, netXP, levelBefore, levelAfter, xpBefore, xpAfter, timeTaken, answers: [] });
        let saved;
        try {
            saved = await CodingSubmission.create({ userId: attempt.userId, company: 'Accenture', exam: 'Accenture_Configurable_Practice', resultId: result._id, attemptId: attempt.attemptId, section: CODING_SECTION, testTitle: 'Accenture Coding Assessment', totalProblems, attemptedProblems: attempted, solvedProblems: solved, passedTests, totalTests, passedHiddenTests: problems.reduce((sum, p) => sum + p.passedHiddenTests, 0), totalHiddenTests: problems.reduce((sum, p) => sum + p.hiddenTests, 0), compileErrors: problems.filter(p => p.evaluationStatus === coding.STATUS.COMPILE_ERROR).length, runtimeErrors: problems.filter(p => p.evaluationStatus === coding.STATUS.RUNTIME_ERROR).length, timeouts: problems.filter(p => p.evaluationStatus === coding.STATUS.TIME_LIMIT_EXCEEDED).length, score, xpEarned: netXP, overallStatus: solved === totalProblems && totalProblems ? 'accepted' : attempted ? 'partial' : 'not_attempted', timeTaken, expired, executionAvailable, evaluationNote: executionAvailable ? 'Your submitted code was evaluated against the configured test cases.' : 'Your code was saved; execution was unavailable, so no pass or fail result was assigned.', xpGranted: false, problems });
        } catch (error) {
            if (error?.code === 11000) {
                await Result.deleteOne({ _id: result._id, userId: attempt.userId });
                const priorAttempt = await CodingSubmission.findOne({ company: 'Accenture', userId: attempt.userId, attemptId: attempt.attemptId }).lean();
                if (priorAttempt) return res.json({ ok: true, redirect: `/accenture/coding/result/${priorAttempt._id}` });
            }
            throw error;
        }
        if (netXP > 0) {
            await User.updateOne({ _id: attempt.userId }, { $set: { xp: xpAfter, level: levelAfter } });
            await UserStats.updateOne({ userId: attempt.userId }, { $set: { xp: xpAfter }, $inc: { totalQuizzes: 1, totalQuestions: totalProblems } }, { upsert: true });
            await XPHistory.create({ userId: attempt.userId, resultId: result._id, section: CODING_SECTION, xpEarned: netXP, xpLost: 0, netXP, reason: `[Accenture Coding] attempt ${attempt.attemptId}: ${solved}/${totalProblems} solved`, levelBefore, levelAfter });
            await SectionProgress.updateOne({ userId: attempt.userId, section: CODING_SECTION }, { $set: { xp: netXP, level: levelAfter, lastAttempt: new Date() }, $inc: { correct: solved, wrong: attempted - solved, skipped: totalProblems - attempted, quizzesAttempted: 1, totalQuestions: totalProblems } }, { upsert: true });
            saved.xpGranted = true; await saved.save();
        } else {
            await UserStats.updateOne({ userId: attempt.userId }, { $inc: { totalQuizzes: 1, totalQuestions: totalProblems } }, { upsert: true });
            await SectionProgress.updateOne({ userId: attempt.userId, section: CODING_SECTION }, { $set: { lastAttempt: new Date() }, $inc: { quizzesAttempted: 1, totalQuestions: totalProblems } }, { upsert: true });
        }
        req.session.accentureCodingAttempt = null;
        res.json({ ok: true, redirect: `/accenture/coding/result/${saved._id}` });
    } catch (error) {
        console.error('Accenture coding submission failed:', error.message);
        res.status(500).json({ ok: false, message: 'Your submission could not be saved. Please try again.' });
    }
});

module.exports = router;
