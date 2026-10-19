const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const CodingSubmission = require('../models/CodingSubmission');
const Result = require('../models/Result');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const SectionProgress = require('../models/SectionProgress');
const XPHistory = require('../models/XPHistory');
const coding = require('../services/coding');
const codingExecutionConfig = require('../config/codingExecutionConfig');
const { getExecutionStatus } = require('../services/coding/availability');
const { LANGUAGES, resolveLanguage } = require('../services/coding/languages');
const { HCLTECH_SECTIONS } = require('../config/hcltechConfig');

const router = express.Router();
const COMPANY = 'HCLTech';
const SECTION = 'Company-hcltech-coding';
const BACKEND = codingExecutionConfig.hcltechBackend || 'judge0';
const TIME_LIMIT_MS = HCLTECH_SECTIONS.coding.minutes * 60 * 1000;

function publicProblem(question) {
    const raw = question.starterCodeByLanguage instanceof Map ? Object.fromEntries(question.starterCodeByLanguage) : (question.starterCodeByLanguage || {});
    const languages = (question.supportedLanguages || []).filter(resolveLanguage);
    const samples = (question.testCases || []).filter(test => !test.isHidden);
    return { id: String(question._id), title: question.problemTitle || question.question, statement: question.problemStatement || question.question, topic: question.topic || '', difficulty: question.difficulty || 'Easy', inputFormat: question.inputFormat || '', outputFormat: question.outputFormat || '', constraints: question.constraints || '', sampleInput: question.sampleInput || samples[0]?.input || '', sampleOutput: question.sampleOutput || samples[0]?.output || '', languages, starters: Object.fromEntries(languages.map(language => [language, String(raw[language] || question.starterCode || LANGUAGES[language].starter || '')])) };
}
function validAttempt(req, questionId) {
    const attempt = req.session.hcltechCodingAttempt;
    return attempt && attempt.userId === String(req.session.userId) && attempt.company === COMPANY && attempt.deadline > Date.now() && attempt.attemptId === req.body.attemptId && attempt.questionIds.includes(questionId);
}

router.get('/coding', auth, async (req, res) => {
    try {
        const userId = String(req.session.userId), now = Date.now();
        let attempt = req.session.hcltechCodingAttempt, questions = [];
        if (attempt?.userId === userId && attempt.deadline > now && Array.isArray(attempt.questionIds)) {
            const docs = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } }).lean();
            const byId = new Map(docs.map(question => [String(question._id), question]));
            questions = attempt.questionIds.map(id => byId.get(String(id))).filter(Boolean);
            if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (!attempt) {
            questions = await Question.aggregate([{ $match: { company: COMPANY, questionType: 'coding', active: { $ne: false } } }, { $sample: { size: HCLTECH_SECTIONS.coding.count } }]);
            if (!questions.length) return res.status(200).render('hcltech-coding', { unavailable: true, problems: [], languages: [], initialStateJson: '{}', remainingSeconds: 0, attemptId: '', executionAvailable: false, executionMessage: 'No active HCLTech coding practice problems are available.' });
            attempt = { userId, company: COMPANY, attemptId: `hcl_code_${new mongoose.Types.ObjectId()}`, questionIds: questions.map(question => String(question._id)), codeState: {}, selectedLanguages: {}, startTime: now, deadline: now + TIME_LIMIT_MS };
            req.session.hcltechCodingAttempt = attempt;
        }
        attempt.codeState ||= {}; attempt.selectedLanguages ||= {};
        const availability = await getExecutionStatus({ backend: BACKEND });
        const problems = questions.map(publicProblem), languages = [...new Set(problems.flatMap(problem => problem.languages))];
        res.render('hcltech-coding', { unavailable: false, problems, languages, attemptId: attempt.attemptId, initialStateJson: JSON.stringify({ codeState: attempt.codeState, selectedLanguages: attempt.selectedLanguages }).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), executionAvailable: availability.available === true, executionMessage: availability.reason || '', executionBackend: BACKEND });
    } catch (error) {
        console.error('HCLTech coding load failed:', error.message);
        res.status(500).render('error', { title: 'Coding Practice', message: 'Coding practice could not be loaded', error: 'Please try again shortly.' });
    }
});

router.post('/coding/draft', auth, async (req, res) => {
    try {
        const id = String(req.body.questionId || ''), language = String(req.body.language || ''), source = req.body.code;
        if (!validAttempt(req, id) || !resolveLanguage(language) || typeof source !== 'string' || source.length > 100000) return res.status(400).json({ ok: false, message: 'Draft details are invalid or the attempt expired.' });
        const question = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } }).select('supportedLanguages').lean();
        if (!question || !question.supportedLanguages.includes(language)) return res.status(404).json({ ok: false, message: 'Problem or language is unavailable.' });
        const attempt = req.session.hcltechCodingAttempt; attempt.codeState ||= {}; attempt.selectedLanguages ||= {};
        attempt.codeState[`${id}|${language}`] = source; attempt.selectedLanguages[id] = language;
        res.json({ ok: true });
    } catch (error) { console.error('HCLTech coding draft save failed:', error.message); res.status(500).json({ ok: false, message: 'The code draft could not be saved.' }); }
});

router.post('/coding/run', auth, async (req, res) => {
    try {
        const id = String(req.body.questionId || ''), language = String(req.body.language || ''), source = req.body.code;
        if (!validAttempt(req, id)) return res.status(400).json({ ok: false, message: 'The coding attempt expired.' });
        const question = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        if (!question || !resolveLanguage(language) || !question.supportedLanguages.includes(language) || typeof source !== 'string' || !source.trim()) return res.status(400).json({ ok: false, message: 'Choose a supported language and enter code.' });
        const attempt = req.session.hcltechCodingAttempt; attempt.codeState[`${id}|${language}`] = source.slice(0, 100000); attempt.selectedLanguages[id] = language;
        const availability = await getExecutionStatus({ force: true, backend: BACKEND });
        const evaluated = await coding.evaluateSubmission({ question, language, source: source.slice(0, 100000), executionAvailable: availability.available === true, sampleOnly: true, backend: BACKEND });
        res.json({ ok: true, status: evaluated.status, outputs: evaluated.outputs || [], passed: evaluated.passedSampleTests || 0, total: evaluated.sampleTests || 0, message: evaluated.status === 'not_executed' ? availability.reason || 'The sandbox is unavailable; code was not run.' : evaluated.message });
    } catch (error) { console.error('HCLTech coding sample run failed:', error.message); res.status(500).json({ ok: false, message: 'The sample run could not be completed.' }); }
});

router.post('/coding/submit', auth, async (req, res) => {
    let createdResultId = null;
    try {
        const attempt = req.session.hcltechCodingAttempt, attemptId = String(req.body.attemptId || '');
        const prior = attemptId ? await CodingSubmission.findOne({ userId: req.session.userId, company: COMPANY, attemptId }).lean() : null;
        if (prior) return res.json({ ok: true, redirect: `/hcltech/coding/result/${prior._id}` });
        if (!attempt || attempt.userId !== String(req.session.userId) || attempt.company !== COMPANY || attempt.attemptId !== attemptId) return res.status(400).json({ ok: false, message: 'This coding attempt is no longer valid.' });
        let entries = req.body.submissions;
        if (typeof entries === 'string') { try { entries = JSON.parse(entries); } catch (_) { entries = []; } }
        if (!Array.isArray(entries)) entries = [];
        const questions = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        const byId = new Map(questions.map(question => [String(question._id), question]));
        if (byId.size !== attempt.questionIds.length) return res.status(400).json({ ok: false, message: 'A problem is no longer available.' });
        const availability = await getExecutionStatus({ force: true, backend: BACKEND }), executable = availability.available === true && Date.now() <= attempt.deadline, evaluated = [];
        for (const id of attempt.questionIds) {
            const question = byId.get(id), entry = entries.find(item => item && String(item.questionId) === id) || {};
            const language = String(entry.language || attempt.selectedLanguages?.[id] || question.supportedLanguages?.[0] || '');
            const source = typeof entry.code === 'string' ? entry.code.slice(0, 100000) : String(attempt.codeState?.[`${id}|${language}`] || '').slice(0, 100000);
            if (!resolveLanguage(language) || !question.supportedLanguages.includes(language)) return res.status(400).json({ ok: false, message: 'Choose a supported language for each problem.' });
            const result = await coding.evaluateSubmission({ question, language, source, executionAvailable: executable, backend: BACKEND });
            evaluated.push({ questionId: question._id, problemTitle: question.problemTitle || question.question, language, code: source, attempted: !!source.trim(), evaluationStatus: result.status, message: result.message || result.status, passedTests: result.passedTests || 0, totalTests: result.totalTests || 0, sampleTests: result.sampleTests || 0, hiddenTests: result.hiddenTests || 0, passedSampleTests: result.passedSampleTests || 0, passedHiddenTests: result.passedHiddenTests || 0, runtimeMs: result.runtimeMs || 0, score: result.score || 0, caseResults: result.caseResults || [] });
        }
        const totalProblems = evaluated.length, attempted = evaluated.filter(problem => problem.attempted).length, solved = evaluated.filter(problem => problem.evaluationStatus === coding.STATUS.ACCEPTED).length;
        const passedTests = evaluated.reduce((sum, problem) => sum + problem.passedTests, 0), totalTests = evaluated.reduce((sum, problem) => sum + problem.totalTests, 0), score = totalTests ? Math.round(passedTests * 100 / totalTests) : 0;
        const stats = await UserStats.findOne({ userId: attempt.userId });
        const xpBefore = stats?.xp || 0, levelService = require('../services/LevelService'), levelBefore = levelService.getLevelFromXP(xpBefore);
        const xpEarned = executable ? Math.max(0, coding.calculateCodingXp({ problems: evaluated })) : 0, xpAfter = xpBefore + xpEarned, levelAfter = levelService.getLevelFromXP(xpAfter);
        const timeTaken = Math.min(HCLTECH_SECTIONS.coding.minutes * 60, Math.max(0, Math.floor((Date.now() - attempt.startTime) / 1000)));
        const result = await Result.create({ userId: attempt.userId, company: COMPANY, section: SECTION, assessmentId: SECTION, attemptId, evaluationStatus: executable ? 'evaluated' : 'execution-unavailable', learningPath: 'college', placementType: 'company', testTitle: 'HCLTech Coding Round', difficulty: 1, score: executable ? solved : 0, totalQuestions: totalProblems, correct: executable ? solved : 0, wrong: executable ? attempted - solved : 0, skipped: executable ? totalProblems - attempted : totalProblems, accuracy: executable ? score : 0, xpEarned, xpLost: 0, netXP: xpEarned, levelBefore, levelAfter, xpBefore, xpAfter, timeTaken, answers: [] });
        createdResultId = result._id;
        let saved;
        try {
            saved = await CodingSubmission.create({ userId: attempt.userId, company: COMPANY, exam: 'HCLTech_Configurable_Practice', resultId: result._id, attemptId, section: SECTION, testTitle: 'HCLTech Coding Round', totalProblems, attemptedProblems: attempted, solvedProblems: solved, passedTests, totalTests, passedHiddenTests: evaluated.reduce((sum, p) => sum + p.passedHiddenTests, 0), totalHiddenTests: evaluated.reduce((sum, p) => sum + p.hiddenTests, 0), compileErrors: evaluated.filter(p => p.evaluationStatus === coding.STATUS.COMPILE_ERROR).length, runtimeErrors: evaluated.filter(p => p.evaluationStatus === coding.STATUS.RUNTIME_ERROR).length, timeouts: evaluated.filter(p => p.evaluationStatus === coding.STATUS.TIME_LIMIT_EXCEEDED).length, score, xpEarned, overallStatus: solved === totalProblems && totalProblems ? 'accepted' : attempted ? 'partial' : 'not_attempted', timeTaken, expired: Date.now() > attempt.deadline, executionAvailable: executable, evaluationNote: executable ? 'Evaluated against public and hidden tests in the isolated sandbox.' : 'Code was saved, but execution was unavailable or the attempt expired; no result was invented.', xpGranted: xpEarned > 0, problems: evaluated });
        } catch (error) {
            await Result.deleteOne({ _id: result._id }); createdResultId = null;
            if (error.code === 11000) {
                const duplicate = await CodingSubmission.findOne({ userId: attempt.userId, company: COMPANY, attemptId }).lean();
                if (duplicate) return res.json({ ok: true, redirect: `/hcltech/coding/result/${duplicate._id}` });
            }
            throw error;
        }
        createdResultId = null;
        await UserStats.updateOne({ userId: attempt.userId }, { $set: { xp: xpAfter }, $inc: { totalQuizzes: 1, totalQuestions: totalProblems, totalCorrect: executable ? solved : 0, totalWrong: executable ? attempted - solved : 0, totalSkipped: executable ? totalProblems - attempted : totalProblems } }, { upsert: true });
        const progress = await SectionProgress.findOne({ userId: attempt.userId, section: SECTION });
        const sectionXpAfter = (progress?.xp || 0) + xpEarned, sectionLevelAfter = levelService.getLevelFromXP(sectionXpAfter);
        await SectionProgress.updateOne({ userId: attempt.userId, section: SECTION }, { $set: { xp: sectionXpAfter, level: sectionLevelAfter, lastAttempt: new Date() }, $inc: { correct: executable ? solved : 0, wrong: executable ? attempted - solved : 0, skipped: executable ? totalProblems - attempted : totalProblems, quizzesAttempted: 1, totalQuestions: totalProblems } }, { upsert: true });
        if (xpEarned > 0) {
            await User.updateOne({ _id: attempt.userId }, { $set: { xp: xpAfter, level: levelAfter } });
            await XPHistory.create({ userId: attempt.userId, resultId: result._id, section: SECTION, xpEarned, xpLost: 0, netXP: xpEarned, reason: `[HCLTech Coding] ${solved}/${totalProblems} accepted`, levelBefore, levelAfter });
        }
        req.session.hcltechCodingAttempt = null;
        res.json({ ok: true, redirect: `/hcltech/coding/result/${saved._id}` });
    } catch (error) {
        if (createdResultId) await Result.deleteOne({ _id: createdResultId }).catch(() => {});
        console.error('HCLTech coding submit failed:', error.message);
        res.status(500).json({ ok: false, message: 'Your coding submission could not be saved.' });
    }
});

router.get('/coding/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    res.render('hcltech-coding-result', { submission });
});

module.exports = router;
