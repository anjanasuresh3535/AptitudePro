const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const XPHistory = require('../models/XPHistory');
const SectionProgress = require('../models/SectionProgress');
const CognizantResponse = require('../models/CognizantResponse');
const CodingSubmission = require('../models/CodingSubmission');
const SqlSubmission = require('../models/SqlSubmission');
const CognizantGameAttempt = require('../models/CognizantGameAttempt');
const placement = require('../services/PlacementService');
const coding = require('../services/coding');
const sqlEngine = require('../services/sqlEngine');
const { getExecutionStatus } = require('../services/coding/availability');
const { LANGUAGES, resolveLanguage } = require('../services/coding/languages');
const executionConfig = require('../config/codingExecutionConfig');
const { COGNIZANT_SECTIONS } = require('../config/cognizantConfig');

const COMPANY = 'Cognizant';
const CODING_SECTION = 'Company-cognizant-coding';
const SQL_SECTION = 'Company-cognizant-sql';
const CODING_SECONDS = COGNIZANT_SECTIONS.coding.minutes * 60;
const SQL_SECONDS = COGNIZANT_SECTIONS.sql.minutes * 60;

function wordCount(value) { return String(value || '').trim().split(/\s+/).filter(Boolean).length; }
function safeStatus(status) {
    return ({ accepted: 'Accepted', wrong_answer: 'Wrong Answer', error: 'Query Error', compile_error: 'Compilation Error', runtime_error: 'Runtime Error', time_limit_exceeded: 'Time Limit Exceeded', memory_limit_exceeded: 'Memory Limit Exceeded', not_executed: 'Execution Unavailable', skipped: 'Skipped', unsupported_language: 'Unsupported Language' })[status] || 'Needs Review';
}
function publicProblem(q) {
    const sample = (q.testCases || []).find(tc => !tc.isHidden);
    const raw = q.starterCodeByLanguage instanceof Map ? Object.fromEntries(q.starterCodeByLanguage) : (q.starterCodeByLanguage || {});
    const languages = (q.supportedLanguages || []).filter(resolveLanguage);
    const starters = Object.fromEntries(languages.map(lang => [lang, String(raw[lang] || q.starterCode || LANGUAGES[lang]?.starter || '')]));
    return { id: String(q._id), title: q.problemTitle || q.question, statement: q.problemStatement || q.question, inputFormat: q.inputFormat || '', outputFormat: q.outputFormat || '', constraints: q.constraints || '', sampleInput: q.sampleInput || sample?.input || '', sampleOutput: q.sampleOutput || sample?.output || '', explanation: q.explanation || '', topic: q.topic || '', difficulty: q.difficulty || 'Medium', languages, starters };
}
function renderError(res, title, message) {
    return res.status(500).render('error', { title, message, error: 'Please try again shortly.', user: res.locals.user || null });
}

router.get('/', auth, (req, res) => res.redirect('/placement/college/company/cognizant'));

async function renderResponse(req, res, key) {
    const section = key === 'interview' ? 'Interview Preparation' : 'Communication';
    let attempt = req.session.cognizantResponseAttempt;
    let task = null;
    if (attempt?.userId === String(req.session.userId) && attempt.sectionKey === key && attempt.deadline > Date.now()) {
        task = await Question.findOne({ _id: attempt.taskId, company: COMPANY, questionType: key === 'interview' ? 'interview_prompt' : 'free_response', active: { $ne: false } });
        if (!task) attempt = null;
    } else attempt = null;
    if (!attempt) {
        const selected = await placement.getCognizantQuestions({ userId: req.session.userId, sectionKey: key, count: 1 });
        task = selected.questions[0];
        if (!task) return res.render('cognizant-response', { title: section, section, unavailable: true, task: null, attemptId: '', draftText: '', remainingSeconds: 0 });
        const attemptId = `cog_resp_${new mongoose.Types.ObjectId()}`;
        const seconds = COGNIZANT_SECTIONS[key].minutes * 60;
        attempt = { userId: String(req.session.userId), sectionKey: key, section, taskId: String(task._id), attemptId, startTime: Date.now(), deadline: Date.now() + seconds * 1000 };
        req.session.cognizantResponseAttempt = attempt;
    }
    const draft = await CognizantResponse.findOne({ userId: req.session.userId, attemptId: attempt.attemptId, taskId: task._id, submissionStatus: 'draft', company: COMPANY }).lean();
    res.render('cognizant-response', { 
        title: section, 
        section, 
        unavailable: false, 
        task: task.toObject ? task.toObject() : task, 
        attemptId: attempt.attemptId, 
        draftText: draft?.responseText || '', 
        draftAudio: draft?.audioData || '',
        draftAudioDuration: draft?.audioDuration || 0,
        remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)) 
    });
}
router.get('/communication', auth, (req, res) => res.redirect('/cognizant/communication/task'));
router.get('/communication/task', auth, (req, res) => renderResponse(req, res, 'communication').catch(e => { console.error('Cognizant communication failed:', e.message); renderError(res, 'Communication Practice', 'Communication task could not be loaded'); }));
router.get('/interview', auth, (req, res) => res.redirect('/cognizant/interview/task'));
router.get('/interview/task', auth, (req, res) => renderResponse(req, res, 'interview').catch(e => { console.error('Cognizant interview failed:', e.message); renderError(res, 'Interview Practice', 'Interview task could not be loaded'); }));

router.post('/response/draft', auth, async (req, res) => {
    try {
        const attempt = req.session.cognizantResponseAttempt;
        if (!attempt || attempt.userId !== String(req.session.userId) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This task expired. Open a new practice task.' });
        const task = await Question.findOne({ _id: attempt.taskId, company: COMPANY, active: { $ne: false }, questionType: { $in: ['free_response', 'interview_prompt'] } }).lean();
        if (!task) return res.status(404).json({ ok: false, message: 'This task is no longer available.' });
        
        const responseText = typeof req.body.responseText === 'string' ? req.body.responseText.slice(0, 20000) : '';
        const audioData = typeof req.body.audioData === 'string' ? req.body.audioData : '';
        const audioDuration = Number(req.body.audioDuration) || 0;
        const responseMode = req.body.responseMode || (audioData ? 'audio' : 'text');
        const submit = req.body.submit === 'true';

        const hasText = Boolean(responseText.trim());
        const hasAudio = Boolean(audioData && audioData.length > 20);

        if (submit && !hasText && !hasAudio) {
            return res.status(400).json({ ok: false, message: 'Record an audio response or write a response before submitting.' });
        }

        const doc = await CognizantResponse.findOneAndUpdate(
            { userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, taskId: task._id },
            { 
                $set: { 
                    company: COMPANY, 
                    section: attempt.section, 
                    assessmentId: `Company-cognizant-${attempt.sectionKey}`, 
                    taskTitle: task.question, 
                    topic: task.topic || '', 
                    difficulty: task.difficulty || 'Medium', 
                    responseText, 
                    audioData,
                    audioDuration,
                    responseMode,
                    wordCount: wordCount(responseText), 
                    evaluationCriteria: task.evaluationCriteria || [], 
                    submissionStatus: submit ? 'submitted' : 'draft', 
                    submittedAt: submit ? new Date() : null 
                } 
            },
            { upsert: true, new: true, runValidators: true }
        );
        if (submit) req.session.cognizantResponseAttempt = null;
        res.json({ ok: true, id: String(doc._id), submitted: submit, message: submit ? 'Response saved. Automated scoring is not enabled.' : 'Draft saved.' });
    } catch (e) { console.error('Cognizant response save failed:', e.message); res.status(500).json({ ok: false, message: 'Your response could not be saved.' }); }
});

router.get('/submission/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Submission not found', message: 'Submission not found', error: 'This submission does not exist or is not yours.' });
    const submission = await CognizantResponse.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Submission not found', message: 'Submission not found', error: 'This submission does not exist or is not yours.' });
    res.render('cognizant-response-result', { submission });
});

router.get('/history', auth, async (req, res) => {
    const userId = req.session.userId;
    const [results, responses, codingSubmissions, sqlSubmissions, gameAttempts] = await Promise.all([
        Result.find({ userId, company: COMPANY }).sort({ testDate: -1 }).limit(50).lean(),
        CognizantResponse.find({ userId, company: COMPANY, submissionStatus: 'submitted' }).sort({ submittedAt: -1 }).limit(50).lean(),
        CodingSubmission.find({ userId, company: COMPANY }).sort({ submittedAt: -1 }).limit(20).lean(),
        SqlSubmission.find({ userId, company: COMPANY }).sort({ submittedAt: -1 }).limit(20).lean(),
        CognizantGameAttempt.find({ userId, company: COMPANY }).sort({ createdAt: -1 }).limit(20).lean()
    ]);
    res.render('cognizant-history', { results, responses, codingSubmissions, sqlSubmissions, gameAttempts });
});

function makeGameChallenge() {
    const sequence = String(Math.floor(10000 + Math.random() * 90000));
    const target = Math.floor(Math.random() * 9);
    const symbols = ['●', '▲', '■', '◆'];
    const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const glyphs = Array.from({ length: 9 }, () => symbols.filter(s => s !== targetSymbol)[Math.floor(Math.random() * 3)]);
    glyphs[target] = targetSymbol;
    const values = Array.from({ length: 6 }, () => 1 + Math.floor(Math.random() * 20));
    const rules = ['odd-even', 'high-low', 'odd-even', 'high-low', 'odd-even', 'high-low'];
    const switchAnswers = values.map((n, i) => rules[i] === 'odd-even' ? (n % 2 ? 'odd' : 'even') : (n >= 11 ? 'high' : 'low'));
    const answers = { motion: String(target), digitRecall: sequence, switchTracker: switchAnswers.join(','), patternMatrix: '48', logicGrid: 'ada:dog,bert:cat,cleo:bird' };
    const reviews = {
        motion: `Tile ${target + 1} contains the target symbol ${targetSymbol}.`,
        digitRecall: `The memorised sequence was ${sequence}.`,
        switchTracker: `Classify items 1, 3 and 5 as odd/even, and items 2, 4 and 6 as high (11+) or low (10 or less). The answers are ${switchAnswers.join(', ')}.`,
        patternMatrix: 'Each number doubles: 3, 6, 12, 24, 48.',
        logicGrid: 'Cleo owns the bird. Ada cannot own the cat, so Ada owns the dog and Bert owns the cat.'
    };
    const displayAnswers = {
        motion: `Tile ${target + 1} (${targetSymbol})`,
        digitRecall: sequence,
        switchTracker: switchAnswers.join(', '),
        patternMatrix: '48',
        logicGrid: 'Ada: dog, Bert: cat, Cleo: bird'
    };
    return {
        startedAt: Date.now(),
        answers,
        reviews,
        displayAnswers,
        public: {
            motion: { targetSymbol, instructions: 'Tap the only tile containing the target symbol.', grid: glyphs },
            digitRecall: { digits: sequence, instructions: 'Memorise the 5 digits. They disappear after a few seconds.' },
            switchTracker: { values, instructions: 'For items 1, 3 and 5 sort by odd/even. For items 2, 4 and 6 sort by high (11 or more) / low (10 or less). Enter the six labels in order, separated by commas.' },
            patternMatrix: { sequence: '3, 6, 12, 24, ?', instructions: 'Complete the number pattern.' },
            logicGrid: { people: ['Ada', 'Bert', 'Cleo'], pets: ['cat', 'dog', 'bird'], clues: ['Each person owns a different pet.', 'Cleo owns the bird.', 'Ada does not own the cat.', 'Bert does not own the dog.'] }
        }
    };
}
router.get('/games', auth, async (req, res) => {
    let attempt = req.session.cognizantGamesAttempt;
    if (!attempt || attempt.userId !== String(req.session.userId) || attempt.deadline <= Date.now()) {
        attempt = { userId: String(req.session.userId), attemptId: `cog_games_${new mongoose.Types.ObjectId()}`, deadline: Date.now() + COGNIZANT_SECTIONS.games.minutes * 60000, challenge: makeGameChallenge() };
        req.session.cognizantGamesAttempt = attempt;
    }
    const previous = await CognizantGameAttempt.findOne({ userId: req.session.userId, company: COMPANY }).sort({ createdAt: -1 }).select('score totalGames createdAt').lean();
    res.render('cognizant-games', { challenge: attempt.challenge.public, attemptId: attempt.attemptId, remainingSeconds: Math.max(0, Math.floor((attempt.deadline - Date.now()) / 1000)), previous });
});
router.get('/games/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send('Game review not found.');
    const attempt = await CognizantGameAttempt.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!attempt) return res.status(404).send('Game review not found.');
    res.render('cognizant-game-result', { attempt });
});
router.post('/games/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.cognizantGamesAttempt;
        if (!attempt || attempt.userId !== String(req.session.userId) || attempt.attemptId !== req.body.attemptId || attempt.deadline <= Date.now()) return res.status(400).json({ ok: false, message: 'This game session expired. Start a new one.' });
        const input = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
        const keys = Object.keys(attempt.challenge.answers);
        const games = keys.map(key => {
            let answer = typeof input[key] === 'string' ? input[key].trim().toLowerCase() : '';
            if (key === 'switchTracker') answer = answer.split(',').map(s => s.trim()).filter(Boolean).join(',');
            if (key === 'logicGrid') answer = answer.replace(/\s/g, '');
            return {
                key,
                response: answer.slice(0, 200),
                correct: answer === attempt.challenge.answers[key],
                expectedAnswer: attempt.challenge.displayAnswers[key],
                explanation: attempt.challenge.reviews[key]
            };
        });
        const score = games.filter(g => g.correct).length;
        const saved = await CognizantGameAttempt.create({ userId: req.session.userId, company: COMPANY, attemptId: attempt.attemptId, score, totalGames: games.length, completed: true, games, timeTaken: Math.max(0, Math.floor((Date.now() - attempt.challenge.startedAt) / 1000)) });
        req.session.cognizantGamesAttempt = null;
        res.json({ ok: true, id: String(saved._id), score, total: games.length, games });
    } catch (e) { console.error('Cognizant games submit failed:', e.message); res.status(500).json({ ok: false, message: 'Game results could not be saved.' }); }
});

// Coding assessment: drafts are held per user, attempt, problem and language.
router.get('/coding', auth, async (req, res) => {
    try {
        const userId = String(req.session.userId), now = Date.now();
        let attempt = req.session.cognizantCodingAttempt;
        let questions = [];
        if (attempt?.userId === userId && attempt.deadline > now && Array.isArray(attempt.questionIds)) {
            const docs = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } }).lean();
            const byId = new Map(docs.map(q => [String(q._id), q]));
            questions = attempt.questionIds.map(id => byId.get(String(id))).filter(Boolean);
            if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (!attempt) {
            const pool = await placement.getCognizantQuestions({ userId, sectionKey: 'coding', count: COGNIZANT_SECTIONS.coding.count });
            questions = pool.questions;
            if (!questions.length) return res.render('cognizant-coding', { unavailable: true, problems: [], initialStateJson: '{}', attemptId: '', remainingSeconds: 0, executionAvailable: false, executionMessage: 'No active Cognizant coding problems are available yet.' });
            attempt = { userId, company: COMPANY, attemptId: `cog_code_${new mongoose.Types.ObjectId()}`, questionIds: questions.map(q => String(q._id)), codeState: {}, selectedLanguages: {}, startTime: now, deadline: now + CODING_SECONDS * 1000 };
            req.session.cognizantCodingAttempt = attempt;
        }
        attempt.codeState ||= {}; attempt.selectedLanguages ||= {};
        const execution = await getExecutionStatus({ backend: executionConfig.cognizantBackend || 'docker' });
        const problems = questions.map(publicProblem);
        const languages = [...new Set(problems.flatMap(p => p.languages))];
        res.render('cognizant-coding', { unavailable: false, problems, languages, attemptId: attempt.attemptId, initialStateJson: JSON.stringify({ codeState: attempt.codeState, selectedLanguages: attempt.selectedLanguages }).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), executionAvailable: execution.available === true, executionMessage: execution.available ? '' : execution.reason });
    } catch (e) { console.error('Cognizant coding load failed:', e.message); renderError(res, 'Coding Practice', 'Coding practice could not be loaded'); }
});

function validCodingAttempt(req, id) {
    const a = req.session.cognizantCodingAttempt;
    return a && a.userId === String(req.session.userId) && a.company === COMPANY && a.attemptId === req.body.attemptId && a.deadline > Date.now() && a.questionIds.includes(id);
}
router.post('/coding/draft', auth, async (req, res) => {
    const id = String(req.body.questionId || ''), lang = String(req.body.language || ''), source = req.body.code;
    if (!validCodingAttempt(req, id) || !resolveLanguage(lang) || typeof source !== 'string' || source.length > 100000) return res.status(400).json({ ok: false, message: 'Draft details are invalid or the attempt expired.' });
    const q = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } }).select('supportedLanguages').lean();
    if (!q || !q.supportedLanguages.includes(lang)) return res.status(404).json({ ok: false, message: 'Problem or language not available.' });
    const a = req.session.cognizantCodingAttempt; a.codeState ||= {}; a.selectedLanguages ||= {}; a.codeState[`${id}|${lang}`] = source; a.selectedLanguages[id] = lang; req.session.cognizantCodingAttempt = a;
    res.json({ ok: true });
});
router.post('/coding/run', auth, async (req, res) => {
    try {
        const id = String(req.body.questionId || ''), lang = String(req.body.language || ''), source = req.body.code;
        if (!validCodingAttempt(req, id)) return res.status(400).json({ ok: false, message: 'The coding attempt expired.' });
        const q = await Question.findOne({ _id: id, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        if (!q || !resolveLanguage(lang) || !q.supportedLanguages.includes(lang) || typeof source !== 'string' || !source.trim()) return res.status(400).json({ ok: false, message: 'Choose a supported language and enter code.' });
        const attempt = req.session.cognizantCodingAttempt; attempt.codeState ||= {}; attempt.codeState[`${id}|${lang}`] = source.slice(0, 100000); attempt.selectedLanguages[id] = lang;
        const backend = executionConfig.cognizantBackend || 'docker';
        const availability = await getExecutionStatus({ force: true, backend });
        const evaluation = await coding.evaluateSubmission({ question: q, language: lang, source: source.slice(0, 100000), executionAvailable: availability.available === true, sampleOnly: true, backend });
        res.json({ ok: true, status: safeStatus(evaluation.status), outputs: (evaluation.outputs || []).map((output, i) => ({ sample: i + 1, output })), message: evaluation.status === 'not_executed' ? availability.reason || 'Execution is unavailable; the code was not run.' : evaluation.message });
    } catch (e) { console.error('Cognizant sample run failed:', e.message); res.status(500).json({ ok: false, message: 'The sample run could not be completed.' }); }
});

router.get('/coding/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    const submission = await CodingSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!submission) return res.status(404).render('error', { title: 'Result not found', message: 'Coding result not found', error: 'This result does not exist or is not yours.' });
    const questions = await Question.find({ _id: { $in: submission.problems.map(p => p.questionId) }, company: COMPANY, questionType: 'coding' }).select('_id explanation').lean();
    const explanations = new Map(questions.map(q => [String(q._id), q.explanation || '']));
    submission.problems.forEach(problem => { problem.explanation = explanations.get(String(problem.questionId)) || ''; });
    res.render('cognizant-coding-result', { submission, safeStatus });
});

router.post('/coding/submit', auth, async (req, res) => {
    try {
        const attempt = req.session.cognizantCodingAttempt, attemptId = String(req.body.attemptId || '');
        const prior = attemptId ? await CodingSubmission.findOne({ userId: req.session.userId, company: COMPANY, attemptId }).lean() : null;
        if (prior) return res.json({ ok: true, redirect: `/cognizant/coding/result/${prior._id}` });
        if (!attempt || attempt.userId !== String(req.session.userId) || attempt.company !== COMPANY || attempt.attemptId !== attemptId) return res.status(400).json({ ok: false, message: 'This attempt is no longer valid.' });
        let submitted = req.body.submissions;
        if (typeof submitted === 'string') { try { submitted = JSON.parse(submitted); } catch (_) { submitted = []; } }
        if (!Array.isArray(submitted)) submitted = [];
        const questions = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'coding', active: { $ne: false } });
        const byId = new Map(questions.map(q => [String(q._id), q]));
        if (byId.size !== attempt.questionIds.length) return res.status(400).json({ ok: false, message: 'A problem is no longer available.' });
        const backend = executionConfig.cognizantBackend || 'docker';
        const availability = await getExecutionStatus({ force: true, backend });
        const evaluated = [];
        for (const id of attempt.questionIds) {
            const q = byId.get(id), entry = submitted.find(x => x && String(x.questionId) === id) || {};
            const lang = String(entry.language || attempt.selectedLanguages?.[id] || '');
            const source = typeof entry.code === 'string' ? entry.code.slice(0, 100000) : String(attempt.codeState?.[`${id}|${lang}`] || '').slice(0, 100000);
            if (!resolveLanguage(lang) || !q.supportedLanguages.includes(lang)) return res.status(400).json({ ok: false, message: 'Choose a supported language for each problem.' });
            const out = await coding.evaluateSubmission({ question: q, language: lang, source, executionAvailable: availability.available === true && Date.now() <= attempt.deadline, backend });
            evaluated.push({ questionId: q._id, problemTitle: q.problemTitle || q.question, language: lang, code: source, attempted: !!source.trim(), evaluationStatus: out.status, message: safeStatus(out.status), passedTests: out.passedTests || 0, totalTests: out.totalTests || 0, sampleTests: out.sampleTests || 0, hiddenTests: out.hiddenTests || 0, passedSampleTests: out.passedSampleTests || 0, passedHiddenTests: out.passedHiddenTests || 0, runtimeMs: out.runtimeMs || 0, score: out.score || 0, caseResults: out.caseResults || [] });
        }
        const totalProblems = evaluated.length, attempted = evaluated.filter(p => p.attempted).length, solved = evaluated.filter(p => p.evaluationStatus === coding.STATUS.ACCEPTED).length;
        const passedTests = evaluated.reduce((s, p) => s + p.passedTests, 0), totalTests = evaluated.reduce((s, p) => s + p.totalTests, 0), score = totalTests ? Math.round(passedTests * 100 / totalTests) : 0;
        const executable = availability.available === true && Date.now() <= attempt.deadline;
        const stats = await UserStats.findOne({ userId: req.session.userId });
        const xpBefore = stats?.xp || 0, levelService = require('../services/LevelService'), levelBefore = levelService.getLevelFromXP(xpBefore);
        const xpEarned = executable ? Math.max(0, coding.calculateCodingXp({ problems: evaluated })) : 0;
        const xpAfter = xpBefore + xpEarned, levelAfter = levelService.getLevelFromXP(xpAfter);
        const priorProgress = await SectionProgress.findOne({ userId: attempt.userId, section: CODING_SECTION });
        const sectionXpAfter = (priorProgress?.xp || 0) + xpEarned;
        const sectionLevelAfter = levelService.getLevelFromXP(sectionXpAfter);
        const timeTaken = Math.min(CODING_SECONDS, Math.max(0, Math.floor((Date.now() - attempt.startTime) / 1000)));
        const result = await Result.create({ userId: attempt.userId, company: COMPANY, section: CODING_SECTION, assessmentId: CODING_SECTION, attemptId: attempt.attemptId, evaluationStatus: executable ? 'evaluated' : 'execution-unavailable', learningPath: 'college', placementType: 'company', testTitle: 'Cognizant Coding Assessment', difficulty: 2, score: executable ? solved : 0, totalQuestions: totalProblems, correct: executable ? solved : 0, wrong: executable ? attempted - solved : 0, skipped: executable ? totalProblems - attempted : totalProblems, accuracy: executable ? score : 0, xpEarned, xpLost: 0, netXP: xpEarned, levelBefore, levelAfter, xpBefore, xpAfter, timeTaken, answers: [] });
        let saved;
        try {
            saved = await CodingSubmission.create({ userId: attempt.userId, company: COMPANY, exam: 'Cognizant_Configurable_Practice', resultId: result._id, attemptId: attempt.attemptId, section: CODING_SECTION, testTitle: 'Cognizant Coding Assessment', totalProblems, attemptedProblems: attempted, solvedProblems: solved, passedTests, totalTests, passedHiddenTests: evaluated.reduce((s, p) => s + p.passedHiddenTests, 0), totalHiddenTests: evaluated.reduce((s, p) => s + p.hiddenTests, 0), compileErrors: evaluated.filter(p => p.evaluationStatus === coding.STATUS.COMPILE_ERROR).length, runtimeErrors: evaluated.filter(p => p.evaluationStatus === coding.STATUS.RUNTIME_ERROR).length, timeouts: evaluated.filter(p => p.evaluationStatus === coding.STATUS.TIME_LIMIT_EXCEEDED).length, score, xpEarned, overallStatus: solved === totalProblems && totalProblems ? 'accepted' : attempted ? 'partial' : 'not_attempted', timeTaken, expired: Date.now() > attempt.deadline, executionAvailable: executable, evaluationNote: executable ? 'Evaluated against configured public and hidden tests.' : 'Code was saved, but the sandbox was unavailable or the attempt expired; no pass or fail was assigned.', xpGranted: false, problems: evaluated });
        } catch (e) { await Result.deleteOne({ _id: result._id }); if (e.code === 11000) { const duplicate = await CodingSubmission.findOne({ userId: attempt.userId, company: COMPANY, attemptId: attempt.attemptId }); if (duplicate) return res.json({ ok: true, redirect: `/cognizant/coding/result/${duplicate._id}` }); } throw e; }
        await UserStats.updateOne({ userId: attempt.userId }, { $set: { xp: xpAfter }, $inc: { totalQuizzes: 1, totalQuestions: totalProblems } }, { upsert: true });
        await SectionProgress.updateOne({ userId: attempt.userId, section: CODING_SECTION }, { $set: { xp: sectionXpAfter, level: sectionLevelAfter, lastAttempt: new Date() }, $inc: { correct: executable ? solved : 0, wrong: executable ? attempted - solved : 0, skipped: executable ? totalProblems - attempted : totalProblems, quizzesAttempted: 1, totalQuestions: totalProblems } }, { upsert: true });
        if (xpEarned > 0) {
            await User.updateOne({ _id: attempt.userId }, { $set: { xp: xpAfter, level: levelAfter } });
            await XPHistory.create({ userId: attempt.userId, resultId: result._id, section: CODING_SECTION, xpEarned, xpLost: 0, netXP: xpEarned, reason: `[Cognizant Coding] ${solved}/${totalProblems} solved`, levelBefore, levelAfter });
            saved.xpGranted = true; await saved.save();
        }
        req.session.cognizantCodingAttempt = null;
        res.json({ ok: true, redirect: `/cognizant/coding/result/${saved._id}` });
    } catch (e) { console.error('Cognizant coding submit failed:', e.message); res.status(500).json({ ok: false, message: 'Your coding submission could not be saved.' }); }
});

// SQL assessment uses an isolated, read-only SQLite database per run. Reference
// SQL and expected rows are never exposed to the browser.
router.get('/sql', auth, async (req, res) => {
    try {
        const userId = String(req.session.userId), now = Date.now(); let attempt = req.session.cognizantSqlAttempt, questions = [];
        if (attempt?.userId === userId && attempt.deadline > now && Array.isArray(attempt.questionIds)) {
            const docs = await Question.find({ _id: { $in: attempt.questionIds }, company: COMPANY, questionType: 'sql', active: { $ne: false } }).lean();
            const map = new Map(docs.map(q => [String(q._id), q])); questions = attempt.questionIds.map(id => map.get(String(id))).filter(Boolean); if (questions.length !== attempt.questionIds.length) attempt = null;
        } else attempt = null;
        if (!attempt) {
            const pool = await placement.getCognizantQuestions({ userId, sectionKey: 'sql', count: COGNIZANT_SECTIONS.sql.count }); questions = pool.questions;
            if (!questions.length) return res.render('cognizant-sql', { unavailable: true, tasks: [], attemptId: '', remainingSeconds: 0, executionAvailable: await sqlEngine.isAvailable() });
            attempt = { userId, company: COMPANY, attemptId: `cog_sql_${new mongoose.Types.ObjectId()}`, questionIds: questions.map(q => String(q._id)), queryState: {}, startTime: now, deadline: now + SQL_SECONDS * 1000 }; req.session.cognizantSqlAttempt = attempt;
        }
        attempt.queryState ||= {};
        const tasks = questions.map(q => ({ id: String(q._id), title: q.problemTitle || q.question, prompt: q.prompt || q.question, topic: q.topic || '', schemaDescription: q.sqlSchemaDescription || '', starter: q.sqlStarter || '' }));
        res.render('cognizant-sql', { unavailable: false, tasks, attemptId: attempt.attemptId, queryStateJson: JSON.stringify(attempt.queryState).replace(/</g, '\\u003c'), remainingSeconds: Math.max(0, Math.floor((attempt.deadline - now) / 1000)), executionAvailable: await sqlEngine.isAvailable() });
    } catch (e) { console.error('Cognizant SQL load failed:', e.message); renderError(res, 'SQL Practice', 'SQL practice could not be loaded'); }
});
router.post('/sql/run', auth, async (req, res) => {
    const a = req.session.cognizantSqlAttempt, id = String(req.body.taskId || ''), query = req.body.query;
    if (!a || a.userId !== String(req.session.userId) || a.company !== COMPANY || a.attemptId !== req.body.attemptId || a.deadline <= Date.now() || !a.questionIds.includes(id) || typeof query !== 'string' || query.length > 20000) return res.status(400).json({ ok: false, message: 'Task expired or query invalid.' });
    const q = await Question.findOne({ _id: id, company: COMPANY, questionType: 'sql', active: { $ne: false } }).lean();
    if (!q) return res.status(404).json({ ok: false, message: 'SQL task is unavailable.' });
    a.queryState ||= {}; a.queryState[id] = query; req.session.cognizantSqlAttempt = a;
    const result = await sqlEngine.evaluate({ schemaSql: q.sqlSchema, seedSql: q.sqlSeed, solutionSql: q.sqlSolution, query });
    res.json({ ok: true, status: safeStatus(result.status), message: result.message, previewColumns: result.previewColumns, previewRows: result.previewRows, rowsReturned: result.rowsReturned });
});
router.get('/sql/result/:id', auth, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).render('error', { title: 'SQL result not found', message: 'SQL result not found', error: 'This result does not exist or is not yours.' });
    const submission = await SqlSubmission.findOne({ _id: req.params.id, userId: req.session.userId, company: COMPANY }).lean();
    if (!submission) return res.status(404).render('error', { title: 'SQL result not found', message: 'SQL result not found', error: 'This result does not exist or is not yours.' });
    const questions = await Question.find({ _id: { $in: submission.tasks.map(t => t.taskId) }, company: COMPANY, questionType: 'sql' }).select('_id explanation').lean();
    const explanations = new Map(questions.map(q => [String(q._id), q.explanation || '']));
    submission.tasks.forEach(task => { task.explanation = explanations.get(String(task.taskId)) || ''; });
    res.render('cognizant-sql-result', { submission });
});
router.post('/sql/submit', auth, async (req, res) => {
    try {
        const a = req.session.cognizantSqlAttempt, attemptId = String(req.body.attemptId || '');
        const prior = attemptId ? await SqlSubmission.findOne({ userId: req.session.userId, company: COMPANY, attemptId }).lean() : null;
        if (prior) return res.json({ ok: true, redirect: `/cognizant/sql/result/${prior._id}` });
        if (!a || a.userId !== String(req.session.userId) || a.company !== COMPANY || a.attemptId !== attemptId) return res.status(400).json({ ok: false, message: 'This SQL attempt is no longer valid.' });
        let payload = req.body.queries; if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (_) { payload = []; } } if (!Array.isArray(payload)) payload = [];
        const expired = Date.now() > a.deadline;
        const docs = await Question.find({ _id: { $in: a.questionIds }, company: COMPANY, questionType: 'sql', active: { $ne: false } }).lean(); const map = new Map(docs.map(q => [String(q._id), q]));
        const tasks = [];
        for (const id of a.questionIds) { const q = map.get(id); if (!q) return res.status(400).json({ ok: false, message: 'An SQL task is no longer available.' }); const entry = payload.find(p => p && String(p.taskId) === id) || {}; const query = typeof entry.query === 'string' ? entry.query.slice(0, 20000) : String(a.queryState?.[id] || '').slice(0, 20000); const out = expired ? { status: 'not_executed', message: 'Time expired before submission; query was saved but not evaluated.', rowsReturned: 0, rowsExpected: 0 } : query.trim() ? await sqlEngine.evaluate({ schemaSql: q.sqlSchema, seedSql: q.sqlSeed, solutionSql: q.sqlSolution, query }) : { status: 'skipped', message: 'No query submitted.', rowsReturned: 0, rowsExpected: 0 }; tasks.push({ taskId: q._id, title: q.problemTitle || q.question, query, attempted: !!query.trim(), evaluationStatus: out.status, message: out.message, rowsReturned: out.rowsReturned || 0, rowsExpected: out.rowsExpected || 0 }); }
        const attempted = tasks.filter(t => t.attempted).length, solved = tasks.filter(t => t.evaluationStatus === 'accepted').length, executionAvailable = await sqlEngine.isAvailable();
        const evaluated = executionAvailable && !expired;
        const wrong = evaluated ? tasks.filter(t => t.attempted && ['wrong_answer', 'error'].includes(t.evaluationStatus)).length : 0;
        const skipped = evaluated ? tasks.length - attempted : tasks.length;
        const stats = await UserStats.findOne({ userId: a.userId });
        const xpBefore = stats?.xp || 0, levelSvc = require('../services/LevelService'), levelBefore = levelSvc.getLevelFromXP(xpBefore);
        const levelInfo = levelSvc.getLevelInfo(levelBefore);
        const xpEarned = evaluated ? solved * levelInfo.xp_per : 0;
        const xpLost = evaluated ? wrong * levelInfo.penalty + skipped * 2 : 0;
        const xpAfter = Math.max(0, xpBefore + xpEarned - xpLost), netXP = xpAfter - xpBefore;
        const levelAfter = levelSvc.getLevelFromXP(xpAfter);
        const timeTaken = Math.max(0, Math.floor((Date.now() - a.startTime) / 1000));
        const result = await Result.create({ userId: a.userId, company: COMPANY, section: SQL_SECTION, assessmentId: SQL_SECTION, attemptId: a.attemptId, evaluationStatus: evaluated ? 'evaluated' : 'execution-unavailable', learningPath: 'college', placementType: 'company', testTitle: 'Cognizant SQL Assessment', score: evaluated ? solved : 0, totalQuestions: tasks.length, correct: evaluated ? solved : 0, wrong, skipped, accuracy: evaluated && tasks.length ? Math.round(100 * solved / tasks.length) : 0, xpEarned, xpLost, netXP, levelBefore, levelAfter, xpBefore, xpAfter, timeTaken, answers: [] });
        let submission;
        try {
            submission = await SqlSubmission.create({ userId: a.userId, company: COMPANY, resultId: result._id, attemptId: a.attemptId, section: SQL_SECTION, testTitle: 'Cognizant SQL Assessment', totalTasks: tasks.length, attemptedTasks: attempted, solvedTasks: evaluated ? solved : 0, score: evaluated && tasks.length ? Math.round(solved * 100 / tasks.length) : 0, xpEarned, xpGranted: xpEarned > 0, overallStatus: !evaluated ? 'not_attempted' : solved === tasks.length ? 'accepted' : solved ? 'partial' : attempted ? 'partial' : 'not_attempted', timeTaken, expired, executionAvailable: evaluated, evaluationNote: expired ? 'Time expired before queries were evaluated.' : executionAvailable ? 'Queries were evaluated in an isolated, read-only in-memory database.' : 'Queries were saved, but SQL evaluation is unavailable.', tasks });
        } catch (e) {
            await Result.deleteOne({ _id: result._id, userId: a.userId });
            if (e.code === 11000) { const duplicate = await SqlSubmission.findOne({ userId: a.userId, company: COMPANY, attemptId: a.attemptId }).lean(); if (duplicate) return res.json({ ok: true, redirect: `/cognizant/sql/result/${duplicate._id}` }); }
            throw e;
        }
        const priorProgress = await SectionProgress.findOne({ userId: a.userId, section: SQL_SECTION });
        const sectionXpAfter = Math.max(0, (priorProgress?.xp || 0) + netXP);
        await User.updateOne({ _id: a.userId }, { $set: { xp: xpAfter, level: levelAfter } });
        await UserStats.updateOne({ userId: a.userId }, { $set: { xp: xpAfter }, $inc: { totalQuizzes: 1, totalQuestions: tasks.length, totalCorrect: evaluated ? solved : 0, totalWrong: wrong, totalSkipped: skipped } }, { upsert: true });
        await SectionProgress.updateOne({ userId: a.userId, section: SQL_SECTION }, { $set: { xp: sectionXpAfter, level: levelSvc.getLevelFromXP(sectionXpAfter), lastAttempt: new Date() }, $inc: { correct: evaluated ? solved : 0, wrong, skipped, quizzesAttempted: 1, totalQuestions: tasks.length } }, { upsert: true });
        await XPHistory.create({ userId: a.userId, resultId: result._id, section: SQL_SECTION, xpEarned, xpLost, netXP, reason: `[Cognizant SQL] ${evaluated ? `${solved}/${tasks.length} correct` : 'execution unavailable'}`, levelBefore, levelAfter });
        req.session.cognizantSqlAttempt = null; res.json({ ok: true, redirect: `/cognizant/sql/result/${submission._id}`, submissionId: String(submission._id) });
    } catch (e) { console.error('Cognizant SQL submit failed:', e.message); res.status(500).json({ ok: false, message: 'SQL submission could not be saved.' }); }
});

module.exports = router;
