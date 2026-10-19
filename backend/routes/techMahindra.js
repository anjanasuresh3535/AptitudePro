const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const CodingSubmission = require('../models/CodingSubmission');
const Activity = require('../models/CapgeminiAttempt');
const coding = require('../services/coding');
const { getExecutionStatus } = require('../services/coding/availability');
const codingExecutionConfig = require('../config/codingExecutionConfig');
const { LANGUAGES, resolveLanguage } = require('../services/coding/languages');
const { TECH_MAHINDRA_SECTIONS, ESSAY_TOPICS, PSYCHOMETRIC_QUESTIONS, COMMUNICATION_ACTIVITIES, TECHNICAL_INTERVIEW_QUESTIONS, HR_INTERVIEW_QUESTIONS } = require('../config/techMahindraConfig');

const router = express.Router(), COMPANY = 'Tech Mahindra', BACKEND = codingExecutionConfig.techMahindraBackend || 'judge0';
const owner = req => String(req.session.userId);
function currentAttempt(req, key, duration = 20) {
    const name = `techMahindra_${key}`, userId = owner(req);
    let attempt = req.session[name];
    if (!attempt || attempt.userId !== userId || attempt.deadline <= Date.now()) {
        const content = key === 'essay' ? [ESSAY_TOPICS[Math.floor(Math.random() * ESSAY_TOPICS.length)]] : [];
        attempt = { userId, company: COMPANY, key, attemptId: `tm_${key}_${new mongoose.Types.ObjectId()}`, startedAt: Date.now(), deadline: Date.now() + duration * 60000, content };
        req.session[name] = attempt;
    }
    return attempt;
}
const objectiveExpected = key => ['logical', 'quantitative', 'verbal', 'programming', 'cs'].includes(key);
function activityContent(key) {
    if (key === 'psychometric') return PSYCHOMETRIC_QUESTIONS;
    if (key === 'communication') return COMMUNICATION_ACTIVITIES;
    if (key === 'technicalInterview') return TECHNICAL_INTERVIEW_QUESTIONS;
    if (key === 'hrInterview') return HR_INTERVIEW_QUESTIONS;
    return [];
}
async function renderActivity(req, res, key, items, duration, config) {
    const lifetimeMinutes = duration || 24 * 60;
    const sessionKey = `techMahindra_${key}`;
    let attempt = req.session[sessionKey], savedResponses = [];
    if (!attempt || attempt.userId !== owner(req) || attempt.deadline <= Date.now()) {
        const prior = await Activity.findOne({ userId: req.session.userId, company: COMPANY, sectionKey: key, status: 'draft' }).sort({ updatedAt: -1 }).lean();
        const deadline = prior ? new Date(prior.startedAt).getTime() + lifetimeMinutes * 60000 : 0;
        if (prior && deadline > Date.now()) {
            attempt = { userId: owner(req), company: COMPANY, key, attemptId: prior.attemptId, startedAt: new Date(prior.startedAt).getTime(), deadline,
                content: key === 'essay' ? [ESSAY_TOPICS.find(topic => topic.id === prior.responses?.[0]?.promptId) || ESSAY_TOPICS[0]] : [] };
            req.session[sessionKey] = attempt; savedResponses = prior.responses || [];
        } else attempt = currentAttempt(req, key, lifetimeMinutes);
    }
    if (!savedResponses.length) savedResponses = (await Activity.findOne({ userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, status: 'draft' }).select('responses').lean())?.responses || [];
    return res.render('tech-mahindra-activity', { kind: key, title: config.name, attemptId: attempt.attemptId, remainingSeconds: duration ? Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)) : 0, items: key === 'essay' ? attempt.content : items, savedResponses, config });
}
function renderActivitySafely(req, res, key, items, duration, config) {
    return renderActivity(req, res, key, items, duration, config).catch(error => {
        console.error('Tech Mahindra practice page failed:', error.message);
        if (!res.headersSent) res.status(500).render('error', { title: 'Practice activity', message: 'The practice activity could not be loaded', error: 'Please try again shortly.' });
    });
}

router.get('/', auth, (req, res) => res.redirect('/placement/college/company/tech-mahindra'));
router.get('/essay', auth, (req, res) => renderActivitySafely(req, res, 'essay', [], TECH_MAHINDRA_SECTIONS.essay.minutes, TECH_MAHINDRA_SECTIONS.essay));
router.get('/psychometric', auth, (req, res) => renderActivitySafely(req, res, 'psychometric', PSYCHOMETRIC_QUESTIONS, TECH_MAHINDRA_SECTIONS.psychometric.minutes, TECH_MAHINDRA_SECTIONS.psychometric));
router.get('/communication', auth, (req, res) => renderActivitySafely(req, res, 'communication', COMMUNICATION_ACTIVITIES, TECH_MAHINDRA_SECTIONS.communication.minutes, TECH_MAHINDRA_SECTIONS.communication));
router.get('/interview/:kind', auth, async (req, res) => {
    const key = req.params.kind === 'technical' ? 'technicalInterview' : req.params.kind === 'hr' ? 'hrInterview' : null;
    if (!key) return res.status(404).render('error', { title: 'Practice not found', message: 'Interview practice not found', error: 'Choose technical or HR interview practice.' });
    return renderActivitySafely(req, res, key, activityContent(key), 0, TECH_MAHINDRA_SECTIONS[key]);
});
async function saveActivity(req, res, isSubmit) {
    try {
        const key = req.params.kind, attempt = req.session[`techMahindra_${key}`];
        if (isSubmit && req.body.attemptId) {
            const previous = await Activity.findOne({ userId: req.session.userId, company: COMPANY, attemptId: req.body.attemptId, status: 'submitted' }).lean();
            if (previous) return res.json({ ok: true, id: String(previous._id), submitted: true, redirect: `/tech-mahindra/result/${previous._id}` });
        }
        if (!['essay', 'psychometric', 'communication', 'technicalInterview', 'hrInterview'].includes(key) || !attempt || attempt.userId !== owner(req) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This draft session has expired. Reopen the practice to continue.' });
        let responses = req.body.responses;
        if (!responses || typeof responses !== 'object' || Array.isArray(responses)) responses = {};
        const allowed = key === 'essay' ? attempt.content : activityContent(key);
        const saved = allowed.map(item => {
            const value = responses[item.id];
            return { promptId: item.id, prompt: item.prompt || item.title || item.question, response: typeof value === 'string' ? value.slice(0, 20000) : '', correct: null, expectedAnswer: key === 'technicalInterview' ? item.answer : key === 'hrInterview' ? item.example : '', explanation: key === 'essay' ? `Self-review only. No automated writing or plagiarism score is configured. Recommended length: ${TECH_MAHINDRA_SECTIONS.essay.minWords}–${TECH_MAHINDRA_SECTIONS.essay.recommendedMaxWords} words.` : key === 'psychometric' ? 'Reflective practice only. Responses are not scored or used to infer personality or job suitability.' : '' };
        });
        if (['essay', 'hrInterview'].includes(key) && Array.isArray(responses.__selfReview)) saved.push({ promptId: 'self-review', prompt: `${key === 'essay' ? 'Essay' : 'HR answer'} self-review checklist`, response: responses.__selfReview.filter(value => typeof value === 'string').slice(0, 10).join('; '), correct: null, explanation: 'Learner-selected reflection checklist. No automated evaluation was performed.' });
        const record = await Activity.findOneAndUpdate({ userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId }, { $set: { sectionKey: key, status: isSubmit ? 'submitted' : 'draft', responses: saved, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.startedAt) / 1000)), ...(isSubmit ? { submittedAt: new Date() } : {}) }, $setOnInsert: { startedAt: new Date(attempt.startedAt) } }, { upsert: true, new: true, runValidators: true });
        if (isSubmit) req.session[`techMahindra_${key}`] = null;
        res.json({ ok: true, id: String(record._id), savedAt: new Date().toISOString(), submitted: isSubmit, redirect: isSubmit ? `/tech-mahindra/result/${record._id}` : undefined });
    } catch (error) { console.error('Tech Mahindra activity save failed:', error.message); res.status(500).json({ ok: false, message: 'Your activity could not be saved. Please retry.' }); }
}
router.post('/activity/:kind/draft', auth, (req, res) => saveActivity(req, res, false));
router.post('/activity/:kind/submit', auth, (req, res) => saveActivity(req, res, true));
router.get('/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Practice review', message: 'Review not found', error: 'This review is unavailable or does not belong to you.' });
    const attempt = await Activity.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY, status: 'submitted' }).lean();
    if (!attempt) return res.status(404).render('error', { title: 'Practice review', message: 'Review not found', error: 'This review is unavailable or does not belong to you.' });
    res.render('tech-mahindra-result', { attempt });
});
router.get('/history', auth, async (req, res) => {
    const attempts = await Activity.find({ userId: req.session.userId, company: COMPANY, status: 'submitted' }).sort({ submittedAt: -1 }).limit(50).lean();
    const results = await require('../models/Result').find({ userId: req.session.userId, company: COMPANY }).sort({ testDate: -1 }).limit(50).lean();
    const codingSubmissions = await CodingSubmission.find({ userId: req.session.userId, company: COMPANY }).sort({ submittedAt: -1 }).limit(20).lean();
    res.render('tech-mahindra-history', { attempts, results, codingSubmissions });
});

function publicProblem(q) {
    const raw = q.starterCodeByLanguage instanceof Map ? Object.fromEntries(q.starterCodeByLanguage) : q.starterCodeByLanguage || {};
    const languages = (q.supportedLanguages || []).filter(resolveLanguage), samples = (q.testCases || []).filter(test => !test.isHidden);
    return { id: String(q._id), title: q.problemTitle || q.question, statement: q.problemStatement || q.question, topic: q.topic || 'Programming', difficulty: q.difficulty || 'Easy', inputFormat: q.inputFormat || '', outputFormat: q.outputFormat || '', constraints: q.constraints || '', sampleInput: q.sampleInput || samples[0]?.input || '', sampleOutput: q.sampleOutput || samples[0]?.output || '', languages, starters: Object.fromEntries(languages.map(language => [language, String(raw[language] || q.starterCode || LANGUAGES[language].starter || '')])) };
}
function validCodeAttempt(req, id) { const a = req.session.techMahindraCoding; return a && a.userId === owner(req) && a.attemptId === req.body.attemptId && a.deadline > Date.now() && a.questionIds.includes(id); }
router.get('/coding', auth, async (req, res) => {
    try {
        const userId = owner(req), now = Date.now(); let attempt = req.session.techMahindraCoding, questions = [];
        if (attempt?.userId === userId && attempt.deadline > now) {
            const docs = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } }).lean();
            const byId = new Map(docs.map(q => [String(q._id), q])); questions = attempt.questionIds.map(id => byId.get(String(id))).filter(Boolean); if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (!attempt) {
            questions = await Question.aggregate([{ $match: { company: COMPANY, questionType: 'coding', active: { $ne: false } } }, { $sample: { size: TECH_MAHINDRA_SECTIONS.coding.count } }]);
            if (!questions.length) return res.render('tech-mahindra-coding', { unavailable: true, problems: [], languages: [], initialStateJson: '{}', remainingSeconds: 0, attemptId: '', executionAvailable: false, executionMessage: 'No active coding questions are available. Add practice problems with the Tech Mahindra seed script.' });
            attempt = { userId, attemptId: `tm_code_${new mongoose.Types.ObjectId()}`, questionIds: questions.map(q => String(q._id)), codeState: {}, selectedLanguages: {}, startedAt: now, deadline: now + TECH_MAHINDRA_SECTIONS.coding.minutes * 60000 }; req.session.techMahindraCoding = attempt;
        }
        attempt.codeState ||= {}; attempt.selectedLanguages ||= {};
        const status = await getExecutionStatus({ backend: BACKEND });
        res.render('tech-mahindra-coding', { unavailable: false, problems: questions.map(publicProblem), languages: [...new Set(questions.flatMap(q => q.supportedLanguages || []).filter(resolveLanguage))], initialStateJson: JSON.stringify({ codeState: attempt.codeState, selectedLanguages: attempt.selectedLanguages }).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), attemptId: attempt.attemptId, executionAvailable: status.available === true, executionMessage: status.reason || '', executionBackend: BACKEND });
    } catch (error) { console.error('Tech Mahindra coding page failed:', error.message); res.status(500).render('error', { title: 'Coding practice', message: 'Coding practice could not be loaded', error: 'Please retry shortly.' }); }
});
router.post('/coding/draft', auth, async (req, res) => {
    try { const id = String(req.body.questionId || ''), language = String(req.body.language || ''), code = req.body.code;
        if (!validCodeAttempt(req, id) || !resolveLanguage(language) || typeof code !== 'string' || code.length > 100000) return res.status(400).json({ ok: false, message: 'Draft details are invalid or this attempt expired.' });
        const q = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } }).select('supportedLanguages').lean(); if (!q || !q.supportedLanguages.includes(language)) return res.status(404).json({ ok: false, message: 'Problem or language is unavailable.' });
        const a = req.session.techMahindraCoding; a.codeState[`${id}|${language}`] = code; a.selectedLanguages[id] = language; res.json({ ok: true });
    } catch (error) { res.status(500).json({ ok: false, message: 'Could not save code draft.' }); }
});
router.post('/coding/run', auth, async (req, res) => {
    try { const id = String(req.body.questionId || ''), language = String(req.body.language || ''), source = req.body.code;
        if (!validCodeAttempt(req, id)) return res.status(400).json({ ok: false, message: 'The coding attempt expired.' });
        const q = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } }); if (!q || !resolveLanguage(language) || !q.supportedLanguages.includes(language) || typeof source !== 'string' || !source.trim()) return res.status(400).json({ ok: false, message: 'Choose a supported language and enter code.' });
        const a = req.session.techMahindraCoding; a.codeState[`${id}|${language}`] = source.slice(0, 100000); a.selectedLanguages[id] = language;
        const availability = await getExecutionStatus({ force: true, backend: BACKEND }), result = await coding.evaluateSubmission({ question: q, language, source: source.slice(0, 100000), executionAvailable: availability.available === true, sampleOnly: true, backend: BACKEND });
        res.json({ ok: true, status: result.status, outputs: result.outputs || [], passed: result.passedSampleTests || 0, total: result.sampleTests || 0, message: result.status === 'not_executed' ? availability.reason || 'Execution is unavailable; code was not run.' : result.message });
    } catch (error) { console.error('Tech Mahindra code run failed:', error.message); res.status(500).json({ ok: false, message: 'The sample run failed.' }); }
});
router.post('/coding/submit', auth, async (req, res) => {
    try {
        const a = req.session.techMahindraCoding, attemptId = String(req.body.attemptId || '');
        const prior = await CodingSubmission.findOne({ userId: req.session.userId, company: COMPANY, attemptId }).lean(); if (prior) return res.json({ ok: true, redirect: `/tech-mahindra/coding/result/${prior._id}` });
        if (!a || a.userId !== owner(req) || a.attemptId !== attemptId) return res.status(400).json({ ok: false, message: 'This coding attempt is no longer valid.' });
        const entries = Array.isArray(req.body.submissions) ? req.body.submissions : [], docs = await Question.find({ _id: { $in: a.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        const byId = new Map(docs.map(q => [String(q._id), q])); if (byId.size !== a.questionIds.length) return res.status(400).json({ ok: false, message: 'A problem is no longer available.' });
        const availability = await getExecutionStatus({ force: true, backend: BACKEND }), problems = [];
        for (const id of a.questionIds) {
            const q = byId.get(id), entry = entries.find(item => item && String(item.questionId) === id) || {}, language = String(entry.language || a.selectedLanguages?.[id] || q.supportedLanguages?.[0] || ''), source = typeof entry.code === 'string' ? entry.code.slice(0, 100000) : String(a.codeState?.[`${id}|${language}`] || '').slice(0, 100000);
            if (!resolveLanguage(language) || !q.supportedLanguages.includes(language)) return res.status(400).json({ ok: false, message: 'Choose a supported language for each problem.' });
            const outcome = await coding.evaluateSubmission({ question: q, language, source, executionAvailable: availability.available === true && Date.now() <= a.deadline, backend: BACKEND });
            problems.push({ questionId: q._id, problemTitle: q.problemTitle, language, code: source, attempted: !!source.trim(), evaluationStatus: outcome.status, message: outcome.message || outcome.status, passedTests: outcome.passedTests || 0, totalTests: outcome.totalTests || 0, sampleTests: outcome.sampleTests || 0, hiddenTests: outcome.hiddenTests || 0, passedSampleTests: outcome.passedSampleTests || 0, passedHiddenTests: outcome.passedHiddenTests || 0, runtimeMs: outcome.runtimeMs || 0, score: outcome.score || 0, caseResults: outcome.caseResults || [] });
        }
        const total = problems.reduce((sum, p) => sum + p.totalTests, 0), passed = problems.reduce((sum, p) => sum + p.passedTests, 0);
        const submission = await CodingSubmission.create({ userId: req.session.userId, company: COMPANY, exam: 'Tech_Mahindra_Coding', attemptId, section: 'Company-tech-mahindra-coding', testTitle: 'Tech Mahindra Coding Practice', totalProblems: problems.length, attemptedProblems: problems.filter(p => p.attempted).length, solvedProblems: problems.filter(p => p.evaluationStatus === coding.STATUS.ACCEPTED).length, passedTests: passed, totalTests: total, passedHiddenTests: problems.reduce((s,p)=>s+p.passedHiddenTests,0), totalHiddenTests: problems.reduce((s,p)=>s+p.hiddenTests,0), score: availability.available && total ? Math.round(passed*100/total) : 0, overallStatus: availability.available ? 'partial' : 'not_evaluated', executionAvailable: availability.available === true, evaluationNote: availability.available ? 'Evaluated in the configured isolated sandbox against public and hidden tests.' : 'Code was saved without execution; no pass or fail was assigned.', xpGranted: false, problems, timeTaken: Math.floor((Date.now()-a.startedAt)/1000) });
        req.session.techMahindraCoding = null; res.json({ ok: true, redirect: `/tech-mahindra/coding/result/${submission._id}` });
    } catch (error) { console.error('Tech Mahindra coding submit failed:', error.message); res.status(500).json({ ok: false, message: 'The submission could not be saved.' }); }
});
router.get('/coding/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Coding review', message: 'Review not found', error: 'This review is unavailable or does not belong to you.' });
    const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean(); if (!submission) return res.status(404).render('error', { title: 'Coding review', message: 'Review not found', error: 'This review is unavailable or does not belong to you.' });
    res.render('tech-mahindra-coding-result', { submission });
});

module.exports = router;
