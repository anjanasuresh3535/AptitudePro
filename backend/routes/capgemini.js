const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const CapgeminiAttempt = require('../models/CapgeminiAttempt');
const { CAPGEMINI_SECTIONS, BEHAVIORAL_QUESTIONS, WRITING_TASKS } = require('../config/capgeminiConfig');
const { LISTENING_PASSAGES } = require('../config/capgeminiListening');
const Question = require('../models/Question');
const CodingSubmission = require('../models/CodingSubmission');
const coding = require('../services/coding');
const codingExecutionConfig = require('../config/codingExecutionConfig');
const { getExecutionStatus } = require('../services/coding/availability');
const { LANGUAGES, resolveLanguage } = require('../services/coding/languages');
const router = express.Router();

const COMPANY = 'Capgemini';

function ownerId(req) { return String(req.session.userId); }
function newAttempt(sectionKey) {
    return { userId: null, attemptId: `cap_${sectionKey}_${new mongoose.Types.ObjectId()}`, startedAt: Date.now() };
}
function getAttempt(req, sectionKey) {
    const key = `capgemini_${sectionKey}_attempt`;
    let attempt = req.session[key];
    if (!attempt || attempt.userId !== ownerId(req) || attempt.deadline <= Date.now()) {
        attempt = newAttempt(sectionKey);
        attempt.userId = ownerId(req);
        attempt.deadline = Date.now() + ((CAPGEMINI_SECTIONS[sectionKey]?.minutes || 25) * 60 * 1000);
        if (sectionKey === 'games') {
            const digits = String(Math.floor(100000 + Math.random() * 900000));
            attempt.challenge = {
                motion: { prompt: 'Choose the next direction: ↑ → ↓ ← ↑ ?', expected: '→', explanation: 'The arrows repeat a four-step clockwise cycle.' },
                digits: { prompt: digits, expected: digits, explanation: 'Recall the six-digit sequence shown at the start.' },
                switches: { prompt: 'All four switches start OFF. Toggle them in this order: A, C, C, D. Which switches are ON at the end?', expected: 'a,d', display: 'A and D are ON; B and C are OFF.', explanation: 'A and D are toggled once and finish ON. C is toggled twice and returns to OFF; B is never toggled.' },
                deduction: { prompt: 'Ada, Bert and Cleo each own a different pet: cat, dog or bird. Cleo owns the bird. Ada does not own the cat. Bert does not own the dog. Enter each person’s pet.', expected: 'ada:dog,bert:cat,cleo:bird', display: 'Ada: dog; Bert: cat; Cleo: bird', explanation: 'Cleo has the bird. Ada cannot have the cat, and Bert cannot have the dog; the only assignment is Ada dog, Bert cat.' }
            };
        } else if (sectionKey === 'listening') {
            const passages = [...LISTENING_PASSAGES].sort(() => Math.random() - 0.5);
            attempt.challenge = { passages };
        }
        req.session[key] = attempt;
    }
    return attempt;
}
function publicCodingProblem(q) {
    const raw = q.starterCodeByLanguage instanceof Map ? Object.fromEntries(q.starterCodeByLanguage) : (q.starterCodeByLanguage || {});
    const languages = (q.supportedLanguages || []).filter(lang => resolveLanguage(lang));
    const samples = (q.testCases || []).filter(test => !test.isHidden);
    return { id: String(q._id), title: q.problemTitle || q.question, statement: q.problemStatement || q.question, topic: q.topic || 'Programming', difficulty: q.difficulty || 'Easy', inputFormat: q.inputFormat || '', outputFormat: q.outputFormat || '', constraints: q.constraints || '', sampleInput: q.sampleInput || samples[0]?.input || '', sampleOutput: q.sampleOutput || samples[0]?.output || '', languages, starters: Object.fromEntries(languages.map(lang => [lang, String(raw[lang] || q.starterCode || LANGUAGES[lang].starter || '')])) };
}

router.get('/coding', auth, async (req, res) => {
    try {
        const userId = String(req.session.userId), now = Date.now();
        let attempt = req.session.capgeminiCodingAttempt, questions = [];
        if (attempt?.userId === userId && attempt.deadline > now && Array.isArray(attempt.questionIds)) {
            const docs = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } }).lean();
            const byId = new Map(docs.map(q => [String(q._id), q]));
            questions = attempt.questionIds.map(id => byId.get(String(id))).filter(Boolean);
            if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (!attempt) {
            questions = await Question.aggregate([{ $match: { company: COMPANY, questionType: 'coding', active: { $ne: false } } }, { $sample: { size: 2 } }]);
            if (!questions.length) return res.status(200).render('capgemini-coding', { unavailable: true, problems: [], languages: [], initialStateJson: '{}', remainingSeconds: 0, attemptId: '', executionAvailable: false, executionMessage: 'No active Capgemini coding problems are available yet.' });
            attempt = { userId, company: COMPANY, attemptId: `cap_code_${new mongoose.Types.ObjectId()}`, questionIds: questions.map(q => String(q._id)), codeState: {}, selectedLanguages: {}, startTime: now, deadline: now + 45 * 60 * 1000 };
            req.session.capgeminiCodingAttempt = attempt;
        }
        attempt.codeState ||= {}; attempt.selectedLanguages ||= {};
        const execution = await getExecutionStatus({ backend: codingExecutionConfig.capgeminiBackend });
        const problems = questions.map(publicCodingProblem), languages = [...new Set(problems.flatMap(problem => problem.languages))];
        res.render('capgemini-coding', { unavailable: false, problems, languages, attemptId: attempt.attemptId, initialStateJson: JSON.stringify({ codeState: attempt.codeState, selectedLanguages: attempt.selectedLanguages }).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), executionAvailable: execution.available === true, executionMessage: execution.available ? '' : execution.reason, executionBackend: codingExecutionConfig.capgeminiBackend });
    } catch (error) { console.error('Capgemini coding load failed:', error.message); res.status(500).render('error', { title: 'Coding Practice', message: 'Coding practice could not be loaded', error: 'Please try again shortly.' }); }
});

function validCapgeminiCodingAttempt(req, questionId) {
    const attempt = req.session.capgeminiCodingAttempt;
    return attempt && attempt.userId === String(req.session.userId) && attempt.company === COMPANY && attempt.attemptId === req.body.attemptId && attempt.deadline > Date.now() && attempt.questionIds.includes(questionId);
}
router.post('/coding/draft', auth, async (req, res) => {
    const id = String(req.body.questionId || ''), language = String(req.body.language || ''), source = req.body.code;
    if (!validCapgeminiCodingAttempt(req, id) || !resolveLanguage(language) || typeof source !== 'string' || source.length > 100000) return res.status(400).json({ ok: false, message: 'Draft details are invalid or the attempt expired.' });
    const question = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } }).select('supportedLanguages').lean();
    if (!question || !question.supportedLanguages.includes(language)) return res.status(404).json({ ok: false, message: 'Problem or language not available.' });
    const attempt = req.session.capgeminiCodingAttempt; attempt.codeState ||= {}; attempt.selectedLanguages ||= {}; attempt.codeState[`${id}|${language}`] = source; attempt.selectedLanguages[id] = language;
    res.json({ ok: true });
});
router.post('/coding/run', auth, async (req, res) => {
    try {
        const id = String(req.body.questionId || ''), language = String(req.body.language || ''), source = req.body.code;
        if (!validCapgeminiCodingAttempt(req, id)) return res.status(400).json({ ok: false, message: 'The coding attempt expired.' });
        const question = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        if (!question || !resolveLanguage(language) || !question.supportedLanguages.includes(language) || typeof source !== 'string' || !source.trim()) return res.status(400).json({ ok: false, message: 'Choose a supported language and enter code.' });
        const attempt = req.session.capgeminiCodingAttempt; attempt.codeState[`${id}|${language}`] = source.slice(0, 100000); attempt.selectedLanguages[id] = language;
        const backend = codingExecutionConfig.capgeminiBackend, availability = await getExecutionStatus({ force: true, backend });
        const result = await coding.evaluateSubmission({ question, language, source: source.slice(0, 100000), executionAvailable: availability.available === true, sampleOnly: true, backend });
        res.json({ ok: true, status: result.status, outputs: result.outputs || [], passed: result.passedSampleTests || 0, total: result.sampleTests || 0, message: result.status === 'not_executed' ? availability.reason || 'Execution is unavailable; code was not run.' : result.message });
    } catch (error) { console.error('Capgemini sample run failed:', error.message); res.status(500).json({ ok: false, message: 'The sample run could not be completed.' }); }
});
router.post('/coding/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.capgeminiCodingAttempt, attemptId = String(req.body.attemptId || '');
        const prior = attemptId ? await CodingSubmission.findOne({ userId: req.session.userId, company: COMPANY, attemptId }).lean() : null;
        if (prior) return res.json({ ok: true, redirect: `/capgemini/coding/result/${prior._id}` });
        if (!attempt || attempt.userId !== String(req.session.userId) || attempt.company !== COMPANY || attempt.attemptId !== attemptId) return res.status(400).json({ ok: false, message: 'This attempt is no longer valid.' });
        let entries = req.body.submissions; if (typeof entries === 'string') { try { entries = JSON.parse(entries); } catch (_) { entries = []; } } if (!Array.isArray(entries)) entries = [];
        const questions = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        const byId = new Map(questions.map(q => [String(q._id), q])); if (byId.size !== attempt.questionIds.length) return res.status(400).json({ ok: false, message: 'A problem is no longer available.' });
        const backend = codingExecutionConfig.capgeminiBackend, availability = await getExecutionStatus({ force: true, backend }), problems = [];
        for (const id of attempt.questionIds) {
            const question = byId.get(id), entry = entries.find(item => item && String(item.questionId) === id) || {}, language = String(entry.language || attempt.selectedLanguages?.[id] || question.supportedLanguages?.[0] || '');
            const source = typeof entry.code === 'string' ? entry.code.slice(0, 100000) : String(attempt.codeState?.[`${id}|${language}`] || '').slice(0, 100000);
            if (!resolveLanguage(language) || !question.supportedLanguages.includes(language)) return res.status(400).json({ ok: false, message: 'Choose a supported language for each problem.' });
            const evaluated = await coding.evaluateSubmission({ question, language, source, executionAvailable: availability.available === true && Date.now() <= attempt.deadline, backend });
            problems.push({ questionId: question._id, problemTitle: question.problemTitle, language, code: source, attempted: !!source.trim(), evaluationStatus: evaluated.status, message: evaluated.message || evaluated.status, passedTests: evaluated.passedTests || 0, totalTests: evaluated.totalTests || 0, sampleTests: evaluated.sampleTests || 0, hiddenTests: evaluated.hiddenTests || 0, passedSampleTests: evaluated.passedSampleTests || 0, passedHiddenTests: evaluated.passedHiddenTests || 0, runtimeMs: evaluated.runtimeMs || 0, score: evaluated.score || 0, caseResults: evaluated.caseResults || [] });
        }
        const totalTests = problems.reduce((sum, p) => sum + p.totalTests, 0), passedTests = problems.reduce((sum, p) => sum + p.passedTests, 0), solved = problems.filter(p => p.evaluationStatus === coding.STATUS.ACCEPTED).length, executable = availability.available === true;
        const saved = await CodingSubmission.create({ userId: req.session.userId, company: COMPANY, exam: 'Capgemini_Optional_Coding', attemptId, section: 'Company-capgemini-coding', testTitle: 'Capgemini Coding Practice', totalProblems: problems.length, attemptedProblems: problems.filter(p => p.attempted).length, solvedProblems: solved, passedTests, totalTests, passedHiddenTests: problems.reduce((sum, p) => sum + p.passedHiddenTests, 0), totalHiddenTests: problems.reduce((sum, p) => sum + p.hiddenTests, 0), score: totalTests ? Math.round(passedTests * 100 / totalTests) : 0, overallStatus: solved === problems.length ? 'accepted' : 'partial', executionAvailable: executable, evaluationNote: executable ? 'Evaluated in the configured isolated sandbox against public and hidden tests.' : 'Code was saved, but execution is unavailable; no pass or fail was assigned.', xpGranted: false, problems, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.startTime) / 1000)) });
        req.session.capgeminiCodingAttempt = null;
        res.json({ ok: true, redirect: `/capgemini/coding/result/${saved._id}` });
    } catch (error) { console.error('Capgemini coding submit failed:', error.message); res.status(500).json({ ok: false, message: 'Your coding submission could not be saved.' }); }
});
router.get('/coding/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    res.render('capgemini-coding-result', { submission });
});

router.get('/', auth, (req, res) => res.redirect('/placement/college/company/capgemini'));
router.get('/games', auth, (req, res) => {
    const attempt = getAttempt(req, 'games');
    const challenge = attempt.challenge;
    res.render('capgemini-games', { attemptId: attempt.attemptId, remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)), challenge: {
        motion: challenge.motion.prompt,
        digits: challenge.digits.prompt,
        switches: challenge.switches.prompt,
        deduction: challenge.deduction.prompt
    } });
});
router.get('/games/restart', auth, (req, res) => {
    req.session.capgemini_games_attempt = null;
    res.redirect('/capgemini/games');
});
router.get('/listening', auth, (req, res) => {
    const attempt = getAttempt(req, 'listening');
    const passages = attempt.challenge.passages.map(passage => ({
        id: passage.id,
        title: passage.title,
        audioUrl: passage.audioUrl,
        questions: passage.questions.map(({ id, prompt, options }) => ({ id, prompt, options }))
    }));
    res.render('capgemini-listening', {
        attemptId: attempt.attemptId,
        passages,
        totalQuestions: passages.reduce((sum, passage) => sum + passage.questions.length, 0),
        remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000))
    });
});
router.get('/listening/restart', auth, (req, res) => {
    req.session.capgemini_listening_attempt = null;
    res.redirect('/capgemini/listening');
});
router.post('/listening/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.capgemini_listening_attempt;
        if (!attempt || attempt.userId !== ownerId(req) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) {
            return res.status(400).json({ ok: false, message: 'This listening session expired. Start a new session.' });
        }
        const prior = await CapgeminiAttempt.findOne({ userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId }).lean();
        if (prior?.status === 'submitted') return res.json({ ok: true, id: String(prior._id), score: prior.score, total: prior.total });
        const submitted = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
        const responses = attempt.challenge.passages.flatMap(passage => passage.questions.map(question => {
            const selected = typeof submitted[question.id] === 'string' && ['A', 'B', 'C', 'D'].includes(submitted[question.id]) ? submitted[question.id] : '';
            const correct = selected === question.correct;
            return {
                promptId: question.id,
                prompt: question.prompt,
                response: selected ? `${selected}: ${question.options[selected]}` : '',
                correct,
                expectedAnswer: `${question.correct}: ${question.options[question.correct]}`,
                explanation: question.explanation,
                score: correct ? 1 : 0,
                passageTitle: passage.title,
                audioUrl: passage.audioUrl
            };
        }));
        const score = responses.filter(item => item.correct).length;
        const saved = await CapgeminiAttempt.findOneAndUpdate(
            { userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, status: 'draft' },
            { $set: { sectionKey: 'listening', status: 'submitted', responses, score, total: responses.length, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.startedAt) / 1000)), submittedAt: new Date() }, $setOnInsert: { startedAt: new Date(attempt.startedAt) } },
            { upsert: true, new: true, runValidators: true }
        );
        req.session.capgemini_listening_attempt = null;
        res.json({ ok: true, id: String(saved._id), score, total: responses.length });
    } catch (error) {
        if (error?.code === 11000 && req.session.capgemini_listening_attempt?.attemptId) {
            const prior = await CapgeminiAttempt.findOne({ userId: req.session.userId, company: COMPANY, attemptId: req.session.capgemini_listening_attempt.attemptId }).lean();
            if (prior?.status === 'submitted') return res.json({ ok: true, id: String(prior._id), score: prior.score, total: prior.total });
        }
        console.error('Capgemini listening submission failed:', error.message);
        res.status(500).json({ ok: false, message: 'Your listening answers could not be saved.' });
    }
});

router.post('/games/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.capgemini_games_attempt;
        if (!attempt || attempt.userId !== ownerId(req) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This game session expired. Start a new session.' });
        const normalized = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, '') : '';
        const received = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
        const keys = ['motion', 'digits', 'switches', 'deduction'];
        const responses = keys.map(key => {
            const item = attempt.challenge[key];
            const response = normalized(received[key]).slice(0, 200);
            const expected = normalized(item.expected);
            const correct = key === 'switches' ? response.replace(/,/g, '') === expected.replace(/,/g, '') : response === expected;
            return { promptId: key, prompt: item.prompt, response, correct, expectedAnswer: item.display || item.expected, explanation: item.explanation, score: correct ? 1 : 0 };
        });
        const existing = await CapgeminiAttempt.findOne({ userId: req.session.userId, attemptId: attempt.attemptId, company: COMPANY }).lean();
        if (existing?.status === 'submitted') return res.json({ ok: true, id: String(existing._id), score: existing.score, total: existing.total, responses: existing.responses });
        const score = responses.reduce((sum, item) => sum + item.score, 0);
        const saved = await CapgeminiAttempt.findOneAndUpdate(
            { userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, status: 'draft' },
            { $set: { sectionKey: 'games', status: 'submitted', responses, score, total: responses.length, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.startedAt) / 1000)), submittedAt: new Date() }, $setOnInsert: { startedAt: new Date(attempt.startedAt) } },
            { upsert: true, new: true, runValidators: true }
        );
        req.session.capgemini_games_attempt = null;
        res.json({ ok: true, id: String(saved._id), score, total: responses.length, responses });
    } catch (error) {
        if (error?.code === 11000 && req.session.capgemini_games_attempt?.attemptId) {
            const prior = await CapgeminiAttempt.findOne({ userId: req.session.userId, attemptId: req.session.capgemini_games_attempt.attemptId, company: COMPANY }).lean();
            if (prior?.status === 'submitted') return res.json({ ok: true, id: String(prior._id), score: prior.score, total: prior.total, responses: prior.responses });
        }
        console.error('Capgemini game save failed:', error.message);
        res.status(500).json({ ok: false, message: 'Game results could not be saved.' });
    }
});

router.get('/behavioral', auth, (req, res) => {
    const attempt = getAttempt(req, 'behavioral');
    res.render('capgemini-activity', { kind: 'behavioral', title: 'Behavioral Competency Practice', attemptId: attempt.attemptId, questions: BEHAVIORAL_QUESTIONS, tasks: [], remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)) });
});
router.get('/writing', auth, (req, res) => {
    const attempt = getAttempt(req, 'writing');
    res.render('capgemini-activity', { kind: 'writing', title: 'Business Writing Practice', attemptId: attempt.attemptId, questions: [], tasks: WRITING_TASKS, remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)) });
});

router.post('/:kind/submit', auth, async (req, res) => {
    try {
        const kind = req.params.kind;
        if (!['behavioral', 'writing'].includes(kind)) return res.status(404).json({ ok: false, message: 'Activity not found.' });
        const attempt = req.session[`capgemini_${kind}_attempt`];
        if (!attempt || attempt.userId !== ownerId(req) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This activity expired. Open it again to start a new attempt.' });
        const existing = await CapgeminiAttempt.findOne({ userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId }).lean();
        if (existing?.status === 'submitted') return res.json({ ok: true, id: String(existing._id) });
        const raw = req.body.responses && typeof req.body.responses === 'object' ? req.body.responses : {};
        const source = kind === 'behavioral' ? BEHAVIORAL_QUESTIONS : WRITING_TASKS;
        const responses = source.map(item => ({
            promptId: item.id,
            prompt: item.prompt,
            response: typeof raw[item.id] === 'string' ? raw[item.id].slice(0, 20000) : '',
            correct: null,
            explanation: kind === 'writing' ? `Saved for your review. Automated grading is not configured. Criteria: ${item.criteria.join('; ')}.` : 'Reflective practice only. Responses are not scored or used to infer personality or job suitability.'
        }));
        const saved = await CapgeminiAttempt.findOneAndUpdate(
            { userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, status: 'draft' },
            { $set: { sectionKey: kind, status: 'submitted', responses, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.startedAt) / 1000)), submittedAt: new Date() }, $setOnInsert: { startedAt: new Date(attempt.startedAt) } },
            { upsert: true, new: true, runValidators: true }
        );
        req.session[`capgemini_${kind}_attempt`] = null;
        res.json({ ok: true, id: String(saved._id), redirect: `/capgemini/result/${saved._id}` });
    } catch (error) {
        if (error?.code === 11000) {
            const prior = await CapgeminiAttempt.findOne({ userId: req.session.userId, attemptId: req.body.attemptId, company: COMPANY }).lean();
            if (prior?.status === 'submitted') return res.json({ ok: true, id: String(prior._id), redirect: `/capgemini/result/${prior._id}` });
        }
        console.error('Capgemini response save failed:', error.message);
        res.status(500).json({ ok: false, message: 'Your responses could not be saved.' });
    }
});

router.get('/history', auth, async (req, res) => {
    const [attempts, results, codingSubmissions] = await Promise.all([
        CapgeminiAttempt.find({ userId: req.session.userId, company: COMPANY, status: 'submitted' }).sort({ submittedAt: -1 }).limit(50).lean(),
        require('../models/Result').find({ userId: req.session.userId, company: COMPANY }).sort({ testDate: -1 }).limit(50).lean(),
        require('../models/CodingSubmission').find({ userId: req.session.userId, company: COMPANY }).sort({ submittedAt: -1 }).limit(20).lean()
    ]);
    res.render('capgemini-history', { attempts, results, codingSubmissions });
});
router.get('/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Review not found', message: 'Review not found', error: 'This activity is unavailable or does not belong to you.' });
    const attempt = await CapgeminiAttempt.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY, status: 'submitted' }).lean();
    if (!attempt) return res.status(404).render('error', { title: 'Review not found', message: 'Review not found', error: 'This activity is unavailable or does not belong to you.' });
    res.render('capgemini-result', { attempt });
});

module.exports = router;
