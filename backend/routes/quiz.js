const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/auth');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const SectionProgress = require('../models/SectionProgress');
const XPHistory = require('../models/XPHistory');

const levelService = require('../services/LevelService');
const placementService = require('../services/PlacementService');
const { getCompanyBySlug, getDifficultyLabel, getTimeLimitSec, DISCLAIMER_TEXT } = require('../config/placementConfig');
const { ACCENTURE_SECTIONS } = require('../config/accentureConfig');
const { COGNIZANT_SECTIONS, COGNIZANT_QUIZ_KEYS } = require('../config/cognizantConfig');
const { CAPGEMINI_SECTIONS } = require('../config/capgeminiConfig');
const { HCLTECH_SECTIONS, HCLTECH_ASSESSMENT } = require('../config/hcltechConfig');
const { TECH_MAHINDRA_SECTIONS } = require('../config/techMahindraConfig');
const { IBM_SECTIONS, IBM_NEGATIVE_MARKING } = require('../config/ibmConfig');

const VALID_SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const DIFFICULTY_TO_NUMBER = { 1: 1, 2: 2, 3: 3, easy: 1, medium: 2, hard: 3, foundation: 1, intermediate: 2, advanced: 3 };
const SKIP_PENALTY = 2;
const MAX_QUESTIONS = 25;
const SUBMIT_LOCK_TTL_MS = 30 * 1000;
const LATENCY_BUFFER_MS = 10 * 1000; // 10 second network grace buffer

function normalizeAnswer(text) {
    return (text ?? '').toString().trim().toLowerCase();
}

function findCorrectLetter(question) {
    const answer = normalizeAnswer(question.answer);
    const options = {
        A: question.option1,
        B: question.option2,
        C: question.option3,
        D: question.option4
    };

    for (const letter of ['A', 'B', 'C', 'D']) {
        if (normalizeAnswer(options[letter]) === answer) {
            return letter;
        }
    }

    console.warn(`⚠️ No matching option for question ${question._id}, answer="${question.answer}"`);
    return 'A';
}

function prepareShuffledQuestion(q, existingShuffle = null) {
    // Detect question type for special rendering
    const questionType = q.questionType || 'mcq';
    const qSection     = q.section || '';
    const qSubject     = q.subject || q.category || '';
    const isPseudoCode = qSection === 'Programming' || /pseudo.?code|code.?trac/i.test(qSubject);
    const isWriting    = questionType === 'fill_in_blank' || questionType === 'free_response';

    if (existingShuffle) {
        return {
            qid: q._id ? q._id.toString() : (q.qid || ''),
            question_text: q.question || q.question_text || '',
            option_a: existingShuffle.A,
            option_b: existingShuffle.B,
            option_c: existingShuffle.C,
            option_d: existingShuffle.D,
            correct_option: existingShuffle.correctLetter,
            category: q.company === 'Accenture' ? (q.topic || q.subject || q.category || 'Practice') : (q.category || q.subject || 'General'),
            questionType,
            isPseudoCode,
            isWriting
        };
    }

    const rawCorrectLetter = findCorrectLetter(q);
    const rawAnswerText = normalizeAnswer(q.answer);

    const origOptions = [
        { key: 'A', text: q.option1 },
        { key: 'B', text: q.option2 },
        { key: 'C', text: q.option3 },
        { key: 'D', text: q.option4 }
    ];

    let correctIndex = -1;
    if (rawCorrectLetter === 'A') correctIndex = 0;
    else if (rawCorrectLetter === 'B') correctIndex = 1;
    else if (rawCorrectLetter === 'C') correctIndex = 2;
    else if (rawCorrectLetter === 'D') correctIndex = 3;
    else {
        correctIndex = origOptions.findIndex(o => normalizeAnswer(o.text) === rawAnswerText);
        if (correctIndex === -1) correctIndex = 0;
    }

    const correctItem = origOptions[correctIndex];

    // For writing questions, don't shuffle — options are not shown
    let shuffled;
    let correctOptionLetter;
    if (isWriting) {
        shuffled = origOptions;
        correctOptionLetter = rawCorrectLetter || 'A';
    } else {
        // Fisher-Yates option shuffle
        shuffled = [...origOptions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const letterKeys = ['A', 'B', 'C', 'D'];
        const newCorrectIdx = shuffled.findIndex(item => item === correctItem);
        correctOptionLetter = newCorrectIdx !== -1 ? letterKeys[newCorrectIdx] : 'A';
    }

    return {
        qid: q._id ? q._id.toString() : (q.qid || ''),
        question_text: q.question || q.question_text || '',
        option_a: shuffled[0].text,
        option_b: shuffled[1].text,
        option_c: shuffled[2].text,
        option_d: shuffled[3].text,
        correct_option: correctOptionLetter,
        category: q.company === 'Accenture' ? (q.topic || q.subject || q.category || 'Practice') : (q.category || q.subject || 'General'),
        questionType,
        isPseudoCode,
        isWriting
    };
}

async function getCurrentUserXP(userId) {
    const stats = await UserStats.findOne({ userId });
    if (stats) return stats.xp || 0;
    const user = await User.findOne({ userId });
    return user?.xp || 0;
}

function isTransactionUnsupportedError(error) {
    return (
        error?.code === 20 ||
        error?.codeName === 'IllegalOperation' ||
        (typeof error?.message === 'string' && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
    );
}

// ============================================
// GET /quiz - Display quiz page
// ============================================
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const learningPath = req.query.learningPath === 'school' ? 'school' : (req.query.learningPath === 'college' ? 'college' : null);
        const placementType = req.query.placementType === 'company' ? 'company' : (req.query.placementType === 'general' ? 'general' : null);
        const companyParam = req.query.company || null;
        
        const rawDiff = (req.query.difficulty || '1').toString().toLowerCase();
        const difficulty = DIFFICULTY_TO_NUMBER[rawDiff] || 1;
        const difficultyInfo = getDifficultyLabel(difficulty);

        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        let testTitle = 'Aptitude Test';
        let trackKey = 'Mixed';
        let section = 'Mixed';
        let poolResult = { questions: [], isFallback: false };
        let companyObj = null;
        let timeLimitSecOverride = null;

        // Determine quiz mode & question pool based on query parameters
        if (learningPath === 'school') {
            testTitle = `School Aptitude Test – ${difficultyInfo.name}`;
            trackKey = 'School-Aptitude';
            section = 'Mixed';

            if (difficulty > 1) {
                const unlocked = await placementService.isLevelUnlocked(userId, trackKey, difficulty);
                if (!unlocked) {
                    req.session.placementError = `Level ${difficulty} is locked for School Aptitude – score 60% or higher on Level ${difficulty - 1} to unlock it.`;
                    return res.redirect('/placement/school');
                }
            }

            poolResult = await placementService.getSchoolQuestions(difficulty);

        } else if (learningPath === 'college' && placementType === 'general') {
            testTitle = `General Placement Aptitude – ${difficultyInfo.name}`;
            trackKey = 'College-General';
            section = 'Mixed';

            if (difficulty > 1) {
                const unlocked = await placementService.isLevelUnlocked(userId, trackKey, difficulty);
                if (!unlocked) {
                    req.session.placementError = `Level ${difficulty} is locked for General Placement Aptitude – score 60% or higher on Level ${difficulty - 1} to unlock it.`;
                    return res.redirect('/placement/college/general');
                }
            }

            poolResult = await placementService.getGeneralCollegeQuestions(difficulty);

        } else if (learningPath === 'college' && placementType === 'company' && companyParam) {
            companyObj = getCompanyBySlug(companyParam);
            const compName = companyObj ? companyObj.name : companyParam;
            const mode = req.query.mode || null;
            const sectionKey = req.query.sectionKey || null;

            if (companyParam === 'cognizant' || compName === 'Cognizant') {
                if (mode !== 'cognizant' || !COGNIZANT_QUIZ_KEYS.includes(sectionKey)) {
                    return res.redirect('/placement/college/company/cognizant');
                }
                const cfg = COGNIZANT_SECTIONS[sectionKey];
                testTitle = `Cognizant ${cfg.name}`;
                trackKey = `Company-cognizant-${sectionKey}`;
                section = sectionKey === 'aptitude' ? 'Maths' : sectionKey === 'technical' ? 'Mixed' : 'English';
                poolResult = await placementService.getCognizantQuestions({ userId, sectionKey, count: cfg.count });
                timeLimitSecOverride = cfg.minutes * 60;
            } else if (companyParam === 'accenture' || compName === 'Accenture') {
                if (mode !== 'accenture' || !req.query.sectionKey) {
                    return res.redirect('/placement/college/company/accenture');
                }
                const sectionKey = req.query.sectionKey;
                const names = { cognitive: 'Cognitive Assessment', technical: 'Technical Assessment', coding: 'Coding Assessment', communication: 'Communication Assessment', interview: 'Interview Preparation' };
                testTitle = `Accenture ${names[sectionKey] || 'Practice'}`;
                trackKey = `Company-accenture-${sectionKey}`;
                section = sectionKey === 'coding' ? 'Programming' : (sectionKey === 'cognitive' ? 'Mixed' : 'English');
                poolResult = await placementService.getAccentureQuestions({ userId, sectionKey, count: ACCENTURE_SECTIONS[sectionKey]?.count || 10 });
            } else if (companyParam === 'capgemini' || compName === 'Capgemini') {
                const sectionKey = req.query.sectionKey;
                const cfg = CAPGEMINI_SECTIONS[sectionKey];
                if (mode !== 'capgemini' || !['technical', 'english'].includes(sectionKey) || !cfg) {
                    return res.redirect('/placement/college/company/capgemini');
                }
                testTitle = `Capgemini ${cfg.name}`;
                trackKey = `Company-capgemini-${sectionKey}`;
                section = sectionKey === 'technical' ? 'Programming' : 'English';
                poolResult = await placementService.getCapgeminiQuestions({ userId, sectionKey, count: cfg.targetCount });
                timeLimitSecOverride = cfg.minutes * 60;
            } else if (companyParam === 'hcltech' || compName === 'HCLTech') {
                const sectionKey = req.query.sectionKey;
                const cfg = HCLTECH_SECTIONS[sectionKey];
                if (mode !== 'hcltech' || !cfg?.category) return res.redirect('/placement/college/company/hcltech');
                testTitle = `HCLTech ${cfg.name}`;
                trackKey = `Company-hcltech-${sectionKey}`;
                section = cfg.section;
                poolResult = await placementService.getHCLTechQuestions({ userId, sectionKey, count: cfg.targetCount });
                timeLimitSecOverride = cfg.minutes * 60;
            } else if (companyParam === 'tech-mahindra' || compName === 'Tech Mahindra') {
                const sectionKey = req.query.sectionKey;
                const cfg = TECH_MAHINDRA_SECTIONS[sectionKey];
                if (mode !== 'tech-mahindra' || !cfg?.category) return res.redirect('/placement/college/company/tech-mahindra');
                testTitle = `Tech Mahindra ${cfg.name}`;
                trackKey = `Company-tech-mahindra-${sectionKey}`;
                section = cfg.section;
                poolResult = await placementService.getTechMahindraQuestions({ userId, sectionKey, count: cfg.count });
                timeLimitSecOverride = cfg.minutes * 60;
            } else if (companyParam === 'ibm' || compName === 'IBM') {
                const sectionKey = req.query.sectionKey;
                const cfg = IBM_SECTIONS[sectionKey];
                if (mode !== 'ibm' || sectionKey !== 'english' || !cfg) return res.redirect('/placement/college/company/ibm');
                testTitle = `IBM ${cfg.name}`;
                trackKey = `Company-ibm-${sectionKey}`;
                section = 'English';
                poolResult = await placementService.getIBMQuestions({ userId, sectionKey, count: cfg.count });
                timeLimitSecOverride = cfg.minutes * 60;
            } else if (companyParam === 'tcs' || compName === 'TCS') {
                const { getSectionConfig } = require('../config/tcsConfig');

                if (mode === 'mock_foundation') {
                    testTitle = 'TCS NQT Foundation Mock Test';
                    trackKey = 'Company-tcs-foundation';
                    section = 'Mixed';
                    poolResult = await placementService.getTCSFoundationMockQuestions(userId);
                    timeLimitSecOverride = 4500; // 75 mins
                } else if (mode === 'mock_advanced') {
                    testTitle = 'TCS NQT Advanced Mock Test';
                    trackKey = 'Company-tcs-advanced';
                    section = 'Mixed';
                    poolResult = await placementService.getTCSAdvancedMockQuestions(userId);
                    timeLimitSecOverride = 6900; // 115 mins
                } else if (mode === 'mock_integrated') {
                    testTitle = 'TCS NQT Integrated Full Mock Assessment';
                    trackKey = 'Company-tcs-integrated';
                    section = 'Mixed';
                    poolResult = await placementService.getTCSIntegratedMockQuestions(userId);
                    timeLimitSecOverride = 11400; // 190 mins
                } else if (mode === 'section' && sectionKey) {
                    const secConfig = getSectionConfig(sectionKey);
                    const secTitle = secConfig ? secConfig.name : 'Section Practice';

                    testTitle = `TCS NQT — ${secTitle}`;
                    trackKey = `Company-tcs-${sectionKey}`;
                    section = secTitle;
                    poolResult = await placementService.getTCSSectionPracticeQuestions(userId, sectionKey);
                    timeLimitSecOverride = secConfig ? secConfig.timeLimitSec : 1500;
                } else {
                    testTitle = `${compName} Placement Practice – ${difficultyInfo.name}`;
                    trackKey = `Company-${companyObj ? companyObj.slug : compName}`;
                    section = 'Mixed';

                    if (difficulty > 1) {
                        const unlocked = await placementService.isLevelUnlocked(userId, trackKey, difficulty);
                        if (!unlocked) {
                            req.session.placementError = `Level ${difficulty} is locked for ${compName} Placement Practice – score 60% or higher on Level ${difficulty - 1} to unlock it.`;
                            return res.redirect(`/placement/college/company/${companyObj ? companyObj.slug : companyParam}`);
                        }
                    }

                    poolResult = await placementService.getCompanyQuestions(compName, difficulty);
                }
            } else if (companyParam === 'infosys' || compName === 'Infosys') {
                // ── Infosys InfyTQ Dedicated Routes ──────────────────────────────
                const { getSectionConfig } = require('../config/infosysConfig');
                const mode = req.query.mode || null;
                const sectionKey = req.query.sectionKey || null;

                if (mode === 'mock') {
                    testTitle = 'Infosys InfyTQ Full Mock Test';
                    trackKey  = 'Company-infosys-mock';
                    section   = 'Mixed';
                    poolResult = await placementService.getInfosysMockQuestions(userId);
                    timeLimitSecOverride = 7200; // 120 minutes

                } else if (mode === 'section' && sectionKey) {
                    const secConfig = getSectionConfig(sectionKey);
                    const secTitle  = secConfig ? secConfig.name : 'Section Practice';
                    testTitle  = `Infosys InfyTQ — ${secTitle}`;
                    trackKey   = `Company-infosys-${sectionKey}`;
                    section    = secTitle;
                    poolResult = await placementService.getInfosysSectionPracticeQuestions(userId, sectionKey);
                    timeLimitSecOverride = secConfig ? secConfig.timeLimitSec : 1200;

                } else {
                    // Generic Infosys practice (difficulty 1/2/3) — existing behaviour
                    testTitle = `${compName} Placement Practice – ${difficultyInfo.name}`;
                    trackKey  = `Company-${companyObj ? companyObj.slug : compName}`;
                    section   = 'Mixed';

                    if (difficulty > 1) {
                        const unlocked = await placementService.isLevelUnlocked(userId, trackKey, difficulty);
                        if (!unlocked) {
                            req.session.placementError = `Level ${difficulty} is locked for ${compName} Placement Practice – score 60% or higher on Level ${difficulty - 1} to unlock it.`;
                            return res.redirect(`/placement/college/company/${companyObj ? companyObj.slug : companyParam}`);
                        }
                    }
                    poolResult = await placementService.getCompanyQuestions(compName, difficulty);
                }
            } else if (companyParam === 'wipro' || compName === 'Wipro') {
                // ── Wipro Elite NTH / WILP Dedicated Routes ──────────────────────────
                const { getSectionConfig } = require('../config/wiproConfig');
                const mode       = req.query.mode || null;
                const sectionKey = req.query.sectionKey || null;

                if (mode === 'mock-writing') {
                    testTitle = 'Wipro Written Communication Mock (1 Task)';
                    trackKey  = 'Company-wipro-mock-writing';
                    section   = 'English';
                    poolResult = await placementService.getWiproSectionPracticeQuestions(userId, 'writtenCommunication');
                    timeLimitSecOverride = 1200; // 20 minutes

                } else if (mode === 'mock-aptitude') {
                    testTitle = 'Wipro Aptitude Mock Test (50 Questions)';
                    trackKey  = 'Company-wipro-mock-aptitude';
                    section   = 'Mixed';
                    poolResult = await placementService.getWiproAptitudeMockQuestions(userId);
                    timeLimitSecOverride = 2880; // 48 minutes

                } else if (mode === 'mock-full') {
                    testTitle = 'Wipro Full Practice Mock';
                    trackKey  = 'Company-wipro-mock-full';
                    section   = 'Mixed';
                    poolResult = await placementService.getWiproFullMockQuestions(userId);
                    timeLimitSecOverride = 4080; // 68 minutes (apt 48 + writing 20)

                } else if (mode === 'section' && sectionKey) {
                    const secConfig = getSectionConfig(sectionKey);
                    const secTitle  = secConfig ? secConfig.name : 'Section Practice';
                    testTitle  = `Wipro — ${secTitle}`;
                    trackKey   = `Company-wipro-${sectionKey}`;
                    section    = secTitle;
                    poolResult = await placementService.getWiproSectionPracticeQuestions(userId, sectionKey);
                    timeLimitSecOverride = secConfig ? secConfig.timeLimitSec : 1200;

                } else {
                    // Generic Wipro practice (difficulty 1/2/3)
                    testTitle = `${compName} Placement Practice – ${difficultyInfo.name}`;
                    trackKey  = `Company-${companyObj ? companyObj.slug : compName}`;
                    section   = 'Mixed';

                    if (difficulty > 1) {
                        const unlocked = await placementService.isLevelUnlocked(userId, trackKey, difficulty);
                        if (!unlocked) {
                            req.session.placementError = `Level ${difficulty} is locked for ${compName} Placement Practice – score 60% or higher on Level ${difficulty - 1} to unlock it.`;
                            return res.redirect(`/placement/college/company/${companyObj ? companyObj.slug : companyParam}`);
                        }
                    }
                    poolResult = await placementService.getCompanyQuestions(compName, difficulty);
                }
            }

        } else {
            section = VALID_SECTIONS.includes(req.query.section) ? req.query.section : 'Maths';
            testTitle = `${section} Practice – Level ${difficulty}`;
            trackKey = section;

            const rawQuestions = await Question.aggregate([
                { $match: { section, difficultyLevel: difficulty } },
                { $sample: { size: MAX_QUESTIONS } }
            ]);
            poolResult = { questions: rawQuestions, isFallback: false };
        }

        const compName = companyObj ? companyObj.name : companyParam;
        const timeLimitSec = timeLimitSecOverride || getTimeLimitSec(learningPath, placementType, compName);

        // Check for existing active session quiz attempt (Timer Refresh Survival)
        let activeAttempt = req.session.quizAttempt;
        const now = Date.now();
        const currentMode = req.query.mode || null;
        const currentSectionKey = req.query.sectionKey || null;
        const expectedTotalQ = (poolResult.questions || []).length;

        if (
            activeAttempt &&
            activeAttempt.userId === userId &&
            activeAttempt.trackKey === trackKey &&
            activeAttempt.difficulty === difficulty &&
            activeAttempt.mode === currentMode &&
            activeAttempt.sectionKey === currentSectionKey &&
            activeAttempt.questionIds &&
            activeAttempt.questionIds.length > 0 &&
            activeAttempt.questionIds.length === expectedTotalQ &&
            activeAttempt.deadline > now
        ) {
            console.log(`[QUIZ TIMER] Resuming existing quiz attempt. Deadline in ${Math.round((activeAttempt.deadline - now) / 1000)}s`);
            if (activeAttempt.questionIds && activeAttempt.questionIds.length > 0) {
                const existingFilter = { _id: { $in: activeAttempt.questionIds } };
                if (['Cognizant', 'Capgemini', 'HCLTech', 'Tech Mahindra', 'IBM'].includes(activeAttempt.company)) existingFilter.company = activeAttempt.company;
                if (activeAttempt.company === 'IBM') existingFilter.category = IBM_SECTIONS.english.category;
                const existingDocs = await Question.find(existingFilter);
                const docMap = new Map(existingDocs.map(d => [d._id.toString(), d]));
                const orderedDocs = activeAttempt.questionIds.map(id => docMap.get(id)).filter(Boolean);
                if (orderedDocs.length === expectedTotalQ) {
                    poolResult.questions = orderedDocs;
                }
            }
        } else {
            // Create a new server-enforced quiz attempt
            const startTime = now;
            const deadline = startTime + (timeLimitSec * 1000);
            activeAttempt = {
                attemptId: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                userId,
                trackKey,
                difficulty,
                mode: currentMode,
                sectionKey: currentSectionKey,
                learningPath,
                placementType,
                company: compName,
                startTime,
                deadline,
                questionIds: (poolResult.questions || []).map(q => q._id.toString()),
                shuffledOptions: {}
            };
            req.session.quizAttempt = activeAttempt;
            console.log(`[QUIZ TIMER] Created new quiz attempt ${activeAttempt.attemptId}. Time limit: ${timeLimitSec}s (questions: ${activeAttempt.questionIds.length})`);
        }

        const remainingSeconds = Math.max(0, Math.floor((activeAttempt.deadline - now) / 1000));

        const userXP = await getCurrentUserXP(userId);
        const userLevelNum = levelService.getLevelFromXP(userXP);
        const levelInfo = levelService.getLevelInfo(userLevelNum);

        // Prepare or retrieve shuffled questions
        const sMap = activeAttempt.shuffledOptions || {};
        const questions = (poolResult.questions || []).map(q => {
            const qid = q._id.toString();
            const existing = sMap[qid];
            const prepared = prepareShuffledQuestion(q, existing);
            if (!existing) {
                sMap[qid] = {
                    A: prepared.option_a,
                    B: prepared.option_b,
                    C: prepared.option_c,
                    D: prepared.option_d,
                    correctLetter: prepared.correct_option
                };
            }
            return prepared;
        });

        activeAttempt.shuffledOptions = sMap;
        req.session.quizAttempt = activeAttempt;

        let noticeMessage = null;
        if (poolResult.isFallback && companyObj) {
            noticeMessage = `Notice: General placement questions commonly useful for ${companyObj.name}'s assessment style have been included to provide a full 25-question practice test.`;
        }

        let errorMessage = null;
        if (poolResult.insufficient) {
            errorMessage = poolResult.errorMessage || "More questions are being added to this practice level. Please try another level or path.";
        } else if (questions.length === 0) {
            errorMessage = "More questions are being added to this practice level. Please try another level or path.";
        }

        res.render('quiz', {
            title: testTitle,
            testTitle,
            section,
            learningPath: learningPath || 'college',
            placementType: placementType || 'general',
            company: companyObj ? companyObj.name : (companyParam || null),
            difficulty,
            difficultyLabel: difficultyInfo,
            questions,
            totalQ: questions.length,
            timeLimitSec,
            remainingSeconds,
            xp: userXP,
            xpPer: levelInfo.xp_per,
            penalty: levelInfo.penalty,
            skipPenalty: SKIP_PENALTY,
            negativeMarking: companyObj?.name === 'HCLTech' ? HCLTECH_ASSESSMENT.negativeMarking : companyObj?.name === 'IBM' ? IBM_NEGATIVE_MARKING : true,
            levelNum: userLevelNum,
            levelData: levelInfo,
            levelInfo: levelInfo,
            user,
            userId,
            disclaimer: DISCLAIMER_TEXT,
            noticeMessage,
            error: errorMessage
        });

    } catch (error) {
        console.error('Quiz load error:', error);
        const fallbackLevel = levelService.getLevelInfo(1);
        res.render('quiz', {
            title: 'Take Quiz',
            testTitle: 'Aptitude Test',
            section: req.query.section || 'Maths',
            learningPath: 'college',
            placementType: 'general',
            company: null,
            difficulty: 1,
            difficultyLabel: getDifficultyLabel(1),
            questions: [],
            totalQ: 0,
            timeLimitSec: 1800,
            remainingSeconds: 1800,
            xp: 0,
            xpPer: fallbackLevel.xp_per,
            penalty: fallbackLevel.penalty,
            skipPenalty: SKIP_PENALTY,
            levelNum: 1,
            levelData: fallbackLevel,
            levelInfo: fallbackLevel,
            user: req.session.user || null,
            userId: req.session.userId || null,
            disclaimer: DISCLAIMER_TEXT,
            noticeMessage: null,
            error: `Failed to load quiz: ${error.message}`
        });
    }
});

// ============================================
// POST /quiz/submit-quiz - Submit quiz answers
// ============================================

async function performQuizSubmission({ userId, section, learningPath, placementType, company, testTitle, parsedQuestionIds, parsedSelectedOptions, timeTaken, shuffledOptions, parsedEssayTexts, assessmentId, attemptId, negativeMarking = true }, session) {
    console.log('[QUIZ SUBMIT] loading questions from MongoDB...');
    const questionDocs = await Question.find({ _id: { $in: parsedQuestionIds } }).session(session);
    console.log(`[QUIZ SUBMIT] questions loaded: ${questionDocs.length} of ${parsedQuestionIds.length} requested IDs matched`);

    const questionMap = new Map(questionDocs.map(q => [q._id.toString(), q]));

    const statsDoc = await UserStats.findOne({ userId }).session(session);
    const currentUserXP = statsDoc?.xp || 0;
    const currentUserLevel = levelService.getLevelFromXP(currentUserXP);
    const levelInfo = levelService.getLevelInfo(currentUserLevel);

    const xpPerCorrect = levelInfo.xp_per;
    const penaltyPerWrong = negativeMarking ? levelInfo.penalty : 0;
    const penaltyPerSkip = negativeMarking ? SKIP_PENALTY : 0;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let earnedXP = 0;
    let lostXP = 0;
    const answerSnapshots = [];

    parsedQuestionIds.forEach((qid, index) => {
        const q = questionMap.get(qid);
        if (!q) return;

        const selected = parsedSelectedOptions[index];
        const qShuffle = shuffledOptions ? shuffledOptions[qid] : null;

        let optionTextMap = { A: q.option1, B: q.option2, C: q.option3, D: q.option4 };
        let correctLetter = findCorrectLetter(q);

        if (qShuffle) {
            optionTextMap = { A: qShuffle.A, B: qShuffle.B, C: qShuffle.C, D: qShuffle.D };
            correctLetter = qShuffle.correctLetter;
        }

        let isCorrect = false;
        let isSkipped = false;
        let selectedLetter = null;
        let selectedText = null;

        if (selected === 'WRITING_SUBMITTED') {
            // Essay was typed and submitted. The full response is persisted in
            // the result snapshot so it can be reviewed later.
            isCorrect = true;
            selectedLetter = 'WRITING_SUBMITTED';
            selectedText = (Array.isArray(parsedEssayTexts) && parsedEssayTexts[index])
                ? String(parsedEssayTexts[index])
                : 'Essay submitted';
            correctCount++;
            earnedXP += xpPerCorrect;
        } else if (selected === 'SKIPPED' || selected === null || selected === undefined || selected === '') {
            isSkipped = true;
            selectedLetter = selected === 'SKIPPED' ? 'SKIPPED' : null;
            skippedCount++;
            lostXP += penaltyPerSkip;
        } else {
            selectedLetter = selected;
            selectedText = optionTextMap[selected] || selected;
            if (selected === correctLetter || normalizeAnswer(selectedText) === normalizeAnswer(q.answer)) {
                isCorrect = true;
                correctCount++;
                earnedXP += xpPerCorrect;
            } else {
                wrongCount++;
                lostXP += penaltyPerWrong;
            }
        }

        answerSnapshots.push({
            questionId: q._id,
            questionText: q.question,
            options: { a: optionTextMap.A, b: optionTextMap.B, c: optionTextMap.C, d: optionTextMap.D },
            selectedAnswer: selectedLetter,
            selectedAnswerText: selectedText,
            correctAnswer: correctLetter,
            correctAnswerText: optionTextMap[correctLetter] || q.answer,
            explanation: q.explanation || '',
            fullExplanation: q.fullExplanation || '',
            formula: q.formulaUsed || '',
            stepSolution: q.stepSolution || '',
            quickTrick: q.quickTrick || '',
            commonMistake: q.commonMistake || '',
            subject: q.subject || '',
            category: q.category || '',
            difficulty: q.difficultyLevel,
            isCorrect,
            isSkipped,
            timeSpent: 0
        });
    });

    console.log(`[QUIZ SUBMIT] answers evaluated: ${correctCount} correct, ${wrongCount} wrong, ${skippedCount} skipped`);

    const totalQ = parsedQuestionIds.length;
    const netXP = earnedXP - lostXP;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const newUserXP = Math.max(0, currentUserXP + netXP);
    const newUserLevel = levelService.getLevelFromXP(newUserXP);
    const timeTakenSec = parseInt(timeTaken) || 0;

    // Track section key for SectionProgress
    let progressSectionKey = section;
    if (learningPath === 'school') progressSectionKey = 'School-Aptitude';
    else if (learningPath === 'college' && placementType === 'general') progressSectionKey = 'College-General';
        else if (learningPath === 'college' && placementType === 'company' && ['Accenture', 'Cognizant', 'Capgemini', 'HCLTech', 'Tech Mahindra', 'IBM'].includes(company) && assessmentId) {
        progressSectionKey = assessmentId;
    } else if (learningPath === 'college' && placementType === 'company' && company) {
        const compObj = getCompanyBySlug(company);
        progressSectionKey = `Company-${compObj ? compObj.slug : company}`;
    }

    console.log('[QUIZ SUBMIT] result document prepared, saving...');
    const [resultDoc] = await Result.create([{
        userId,
        section: progressSectionKey,
        learningPath,
        placementType,
        company,
        assessmentId: assessmentId || null,
        attemptId: attemptId || null,
        testTitle,
        difficulty: questionDocs[0]?.difficultyLevel || 1,
        score: correctCount,
        totalQuestions: totalQ,
        correct: correctCount,
        wrong: wrongCount,
        skipped: skippedCount,
        accuracy,
        xpEarned: earnedXP,
        xpLost: lostXP,
        netXP,
        levelBefore: currentUserLevel,
        levelAfter: newUserLevel,
        xpBefore: currentUserXP,
        xpAfter: newUserXP,
        timeTaken: timeTakenSec,
        answers: answerSnapshots
    }], { session });

    const resultId = resultDoc._id;
    console.log(`[QUIZ SUBMIT] result saved: ${resultId}`);

    await User.updateOne(
        { _id: userId },
        { $set: { xp: newUserXP, level: newUserLevel } }
    ).session(session);

    await UserStats.updateOne(
        { userId },
        {
            $set: { xp: newUserXP },
            $inc: {
                totalCorrect: correctCount,
                totalWrong: wrongCount,
                totalSkipped: skippedCount,
                totalQuizzes: 1,
                totalQuestions: totalQ
            }
        },
        { upsert: true, session }
    );

    // Also update SectionProgress for both the specific track and primary section
    const targetSections = Array.from(new Set([progressSectionKey, VALID_SECTIONS.includes(section) ? section : 'Mixed']));

    for (const secKey of targetSections) {
        const sectionDoc = await SectionProgress.findOne({ userId, section: secKey }).session(session);
        const currentSectionXP = sectionDoc?.xp || 0;
        const newSectionXP = Math.max(0, currentSectionXP + netXP);
        const newSectionLevel = levelService.getLevelFromXP(newSectionXP);

        await SectionProgress.updateOne(
            { userId, section: secKey },
            {
                $set: {
                    xp: newSectionXP,
                    level: newSectionLevel,
                    lastAttempt: new Date()
                },
                $inc: {
                    correct: correctCount,
                    wrong: wrongCount,
                    skipped: skippedCount,
                    quizzesAttempted: 1,
                    totalQuestions: totalQ
                }
            },
            { upsert: true, session }
        );
    }

    await XPHistory.create([{
        userId,
        resultId,
        section: progressSectionKey,
        xpEarned: earnedXP,
        xpLost: lostXP,
        netXP,
        reason: `[${testTitle || section}] Quiz: ${correctCount}/${totalQ} correct (${accuracy}%)`,
        levelBefore: currentUserLevel,
        levelAfter: newUserLevel
    }], { session });

    console.log('[QUIZ SUBMIT] user stats, section progress, and XP history updated');

    return resultId;
}

router.post('/submit-quiz', isAuthenticated, async (req, res) => {
    console.log('[QUIZ SUBMIT] request received');

    const now = Date.now();
    const lockedAt = req.session.quizSubmittingAt;
    const isLocked = lockedAt && (now - lockedAt) < SUBMIT_LOCK_TTL_MS;

    if (isLocked) {
        return res.status(429).send('Your quiz is already being submitted - please wait a moment and try again.');
    }

    req.session.quizSubmittingAt = now;

    try {
        const userId = req.session.userId;
        console.log(`[QUIZ SUBMIT] session/user found: ${userId}`);

        const { section, learningPath, placementType, company, testTitle, questionIds, selectedOptions, timeTaken, essayTexts } = req.body;

        const parsedQuestionIds = typeof questionIds === 'string' ? JSON.parse(questionIds) : (questionIds || []);
        const parsedSelectedOptions = typeof selectedOptions === 'string' ? JSON.parse(selectedOptions) : (selectedOptions || []);

        let parsedEssayTexts = essayTexts || [];
        if (typeof parsedEssayTexts === 'string') {
            try { parsedEssayTexts = JSON.parse(parsedEssayTexts); } catch (e) { parsedEssayTexts = []; }
        }
        if (!Array.isArray(parsedEssayTexts)) parsedEssayTexts = [];
        console.log(`[QUIZ SUBMIT] submitted answers parsed: ${parsedQuestionIds.length} question IDs`);

        if (!Array.isArray(parsedQuestionIds) || parsedQuestionIds.length === 0) {
            req.session.quizSubmittingAt = null;
            return res.status(400).send('No questions submitted.');
        }

        const liveAttempt = req.session.quizAttempt;
        if (company === 'Accenture' || company === 'Cognizant' || company === 'Capgemini' || company === 'HCLTech' || company === 'Tech Mahindra' || company === 'IBM') {
            const expectedCompany = company;
            const submittedIds = parsedQuestionIds.map(String).sort();
            const expectedIds = (liveAttempt?.questionIds || []).map(String).sort();
            const expectedMode = expectedCompany === 'Cognizant' ? 'cognizant' : expectedCompany === 'Capgemini' ? 'capgemini' : expectedCompany === 'HCLTech' ? 'hcltech' : expectedCompany === 'Tech Mahindra' ? 'tech-mahindra' : expectedCompany === 'IBM' ? 'ibm' : liveAttempt?.mode;
            const owned = liveAttempt && liveAttempt.userId === userId && liveAttempt.company === expectedCompany && liveAttempt.mode === expectedMode;
            if (!owned || liveAttempt.deadline < Date.now() || submittedIds.join(',') !== expectedIds.join(',')) {
                req.session.quizSubmittingAt = null;
                return res.status(400).send('This company practice attempt is no longer valid. Please start another practice set.');
            }
            const validDocs = await Question.countDocuments({ _id: { $in: expectedIds }, company: expectedCompany, active: { $ne: false } });
            if (validDocs !== expectedIds.length) {
                req.session.quizSubmittingAt = null;
                return res.status(400).send('Some questions in this practice set are no longer available. Please start another set.');
            }
        }

        const submissionData = {
            userId,
            section: section || 'Mixed',
            learningPath: learningPath || 'college',
            placementType: placementType || 'general',
            company: company || null,
            testTitle: testTitle || 'Aptitude Test',
            parsedQuestionIds,
            parsedSelectedOptions,
            timeTaken,
            shuffledOptions: req.session.quizAttempt?.shuffledOptions || null,
            parsedEssayTexts,
            assessmentId: liveAttempt?.trackKey || null,
            attemptId: liveAttempt?.attemptId || null,
            negativeMarking: company === 'HCLTech' ? HCLTECH_ASSESSMENT.negativeMarking : company === 'IBM' ? IBM_NEGATIVE_MARKING : true
        };

        let resultId;
        const mongoose = require('mongoose');
        let mongoSession = null;
        try {
            mongoSession = await mongoose.startSession();
            await mongoSession.withTransaction(async () => {
                resultId = await performQuizSubmission(submissionData, mongoSession);
            });
        } catch (txError) {
            if (isTransactionUnsupportedError(txError)) {
                console.warn('[QUIZ SUBMIT] MongoDB transactions fallback to sequential writes.');
                resultId = await performQuizSubmission(submissionData, null);
            } else {
                throw txError;
            }
        } finally {
            if (mongoSession) mongoSession.endSession();
        }

        console.log(`[QUIZ SUBMIT] redirecting to /results/${resultId}`);
        req.session.quizSubmittingAt = null;
        req.session.quizAttempt = null; // Clear active attempt on successful submission
        res.redirect(`/results/${resultId}`);

    } catch (error) {
        console.error('[QUIZ SUBMIT ERROR]', error);
        req.session.quizSubmittingAt = null;
        res.status(500).send('Failed to submit quiz. Please try again.');
    }
});

router.performQuizSubmission = performQuizSubmission;
module.exports = router;
