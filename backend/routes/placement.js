const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/auth');
const placementService = require('../services/PlacementService');
const { ACCENTURE_SECTIONS } = require('../config/accentureConfig');
const {
    LEARNING_PATHS,
    COMPANY_LIST,
    DIFFICULTY_LABELS,
    UNLOCK_ACCURACY_THRESHOLD,
    DISCLAIMER_TEXT,
    getCompanyBySlug,
    getDifficultyLabel
} = require('../config/placementConfig');

// ============================================
// 1. GET /placement - Main Choice (School vs College)
// ============================================
router.get('/', isAuthenticated, (req, res) => {
    res.render('placement', {
        step: 'main-choice',
        title: 'Choose Learning Path',
        paths: LEARNING_PATHS,
        user: req.session.user || null,
        error: null
    });
});

// ============================================
// 2. GET /placement/school - School Aptitude Levels
// ============================================
router.get('/school', isAuthenticated, async (req, res) => {
    const flashError = req.session.placementError || null;
    delete req.session.placementError;

    try {
        const userId = req.session.userId;
        const unlocked = await placementService.getUnlockedLevels(userId, 'School-Aptitude');

        const levels = [1, 2, 3].map(num => ({
            number: num,
            label: getDifficultyLabel(num),
            unlocked: unlocked[num]
        }));

        res.render('placement', {
            step: 'school-levels',
            title: 'School Aptitude Test',
            subtitle: 'Combined Mathematics, Logical Reasoning & English',
            levels,
            unlockThreshold: UNLOCK_ACCURACY_THRESHOLD,
            user: req.session.user || null,
            error: flashError
        });
    } catch (error) {
        console.error('School placement load error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load School Aptitude levels',
            error: 'Something went wrong. Please try again.',
            user: req.session.user || null
        });
    }
});

// ============================================
// 3. GET /placement/college - College Choice (General vs Company)
// ============================================
router.get('/college', isAuthenticated, (req, res) => {
    res.render('placement', {
        step: 'college-choice',
        title: 'College & Placement Preparation',
        subtitle: 'Select General Placement or Practice by Company',
        disclaimer: DISCLAIMER_TEXT,
        user: req.session.user || null,
        error: null
    });
});

// ============================================
// 4. GET /placement/college/general - General Placement Levels
// ============================================
router.get('/college/general', isAuthenticated, async (req, res) => {
    const flashError = req.session.placementError || null;
    delete req.session.placementError;

    try {
        const userId = req.session.userId;
        const unlocked = await placementService.getUnlockedLevels(userId, 'College-General');

        const levels = [1, 2, 3].map(num => ({
            number: num,
            label: getDifficultyLabel(num),
            unlocked: unlocked[num]
        }));

        res.render('placement', {
            step: 'college-general-levels',
            title: 'General Placement Aptitude',
            subtitle: 'Quantitative Aptitude, Logical Reasoning, Verbal & DI',
            levels,
            unlockThreshold: UNLOCK_ACCURACY_THRESHOLD,
            user: req.session.user || null,
            error: flashError
        });
    } catch (error) {
        console.error('General college placement load error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load General Placement levels',
            error: 'Something went wrong. Please try again.',
            user: req.session.user || null
        });
    }
});

// ============================================
// 5. GET /placement/college/company - Company Cards Grid
// ============================================
router.get('/college/company', isAuthenticated, async (req, res) => {
    const Question = require('../models/Question');
    const [cognizantQuestionCount, capgeminiQuestionCount, hcltechQuestionCount, techMahindraQuestionCount, ibmQuestionCount] = await Promise.all([
        Question.countDocuments({ company: 'Cognizant', active: { $ne: false } }),
        Question.countDocuments({ company: 'Capgemini', active: { $ne: false } }),
        Question.countDocuments({
            company: 'HCLTech', active: { $ne: false }, questionType: { $in: ['mcq', 'coding'] },
            category: { $in: ['HCLTech Quantitative', 'HCLTech Verbal', 'HCLTech Logical', 'HCLTech Computer Fundamentals', 'HCLTech Coding Practice'] }
        }),
        Question.countDocuments({ company: 'Tech Mahindra', active: { $ne: false }, questionType: { $in: ['mcq', 'coding'] }, category: { $regex: /^Tech Mahindra / } }),
        Question.countDocuments({ company: 'IBM', active: { $ne: false }, sourceReference: 'AptitudePro original IBM-style practice', category: { $in: ['IBM English Language Test', 'IBM Coding Practice'] } })
    ]);
    res.render('placement', {
        step: 'company-list',
        title: 'Practice by Company',
        subtitle: 'Company-oriented placement practice',
        companies: COMPANY_LIST,
        cognizantQuestionCount,
        capgeminiQuestionCount,
        hcltechQuestionCount,
        techMahindraQuestionCount,
        ibmQuestionCount,
        disclaimer: DISCLAIMER_TEXT,
        user: req.session.user || null,
        error: null
    });
});

// ============================================
// 6. GET /placement/college/company/:company - Selected Company Levels
// ============================================
router.get('/college/company/:company', isAuthenticated, async (req, res) => {
    const companyObj = getCompanyBySlug(req.params.company);
    if (!companyObj) {
        return res.redirect('/placement/college/company');
    }

    const flashError = req.session.placementError || null;
    delete req.session.placementError;

    try {
        const userId = req.session.userId;
        const trackKey = `Company-${companyObj.slug}`;
        const unlocked = await placementService.getUnlockedLevels(userId, trackKey);

        const levels = [1, 2, 3].map(num => ({
            number: num,
            label: getDifficultyLabel(num),
            unlocked: unlocked[num]
        }));

        const isTcs    = companyObj.slug === 'tcs';
        const isInfosys = companyObj.slug === 'infosys';
        const isWipro   = companyObj.slug === 'wipro';
        const isAccenture = companyObj.slug === 'accenture';
        const isCognizant = companyObj.slug === 'cognizant';
        const isCapgemini = companyObj.slug === 'capgemini';
        const isHCLTech = companyObj.slug === 'hcltech';
        const isTechMahindra = companyObj.slug === 'tech-mahindra';
        const isIBM = companyObj.slug === 'ibm';

        // Section counts and timers shown on the page come from the active
        // Wipro assessment configuration, never from hard-coded text.
        let wiproConfig = null;
        if (isWipro) {
            const cfg = require('../config/wiproConfig');
            // Execution availability is probed live (Docker daemon), so the card
            // never claims a capability the host does not currently have.
            const { getExecutionStatus } = require('../services/coding/availability');
            const execStatus = await getExecutionStatus();
            wiproConfig = {
                meta: cfg.WIPRO_ASSESSMENT_META,
                aptitude: cfg.WIPRO_APTITUDE_MOCK_CONFIG,
                coding: Object.assign({}, cfg.WIPRO_CODING_MOCK_CONFIG, {
                    executionAvailable: execStatus.available === true
                }),
                writing: cfg.WIPRO_WRITING_MOCK_CONFIG,
                full: cfg.WIPRO_FULL_MOCK_CONFIG,
                sections: cfg.WIPRO_SECTIONS
            };
        }
        let accentureSections = null;
        if (isAccenture) {
            const Question = require('../models/Question');
            const sections = [
                ['cognitive', 'Cognitive Assessment', 'Critical thinking, abstract reasoning, verbal and numerical practice.'],
                ['technical', 'Technical Assessment', 'Pseudocode, programming, OOP, databases, systems, networks, cloud and security.'],
                ['coding', 'Coding Assessment', 'Solve placement-style problems in a simple coding workspace.'],
                ['communication', 'Communication Assessment', 'Write professional emails and practice objective communication questions.'],
                ['interview', 'Interview Preparation', 'Prepare technical, HR, behavioral and project interview responses.']
            ];
            accentureSections = await Promise.all(sections.map(async ([key, name, description]) => ({
                key, name, description,
                count: await placementService.countAccentureQuestions(key),
                sessionCount: ACCENTURE_SECTIONS[key]?.count || 0,
                difficulty: key === 'coding' ? 'Easy · Medium · Hard' : 'Easy · Medium · Hard'
            })));
        }
        let cognizantRounds = null;
        if (isCognizant) {
            const { COGNIZANT_ROUNDS, COGNIZANT_SECTIONS } = require('../config/cognizantConfig');
            const Result = require('../models/Result');
            const CognizantResponse = require('../models/CognizantResponse');
            const CognizantGameAttempt = require('../models/CognizantGameAttempt');
            const sectionCounts = await Promise.all(Object.keys(COGNIZANT_SECTIONS).map(async key => [key, await placementService.countCognizantQuestions(key)]));
            const counts = Object.fromEntries(sectionCounts);
            const completedKeys = new Set((await Result.find({ userId, company: 'Cognizant' }).select('assessmentId').lean()).map(r => r.assessmentId));
            const submittedResponses = await CognizantResponse.distinct('assessmentId', { userId, company: 'Cognizant', submissionStatus: 'submitted' });
            submittedResponses.forEach(key => completedKeys.add(key));
            if (await CognizantGameAttempt.exists({ userId, company: 'Cognizant', completed: true })) completedKeys.add('Company-cognizant-games');
            cognizantRounds = COGNIZANT_ROUNDS.map(round => {
                const sections = round.sections.map(section => {
                    const cfg = COGNIZANT_SECTIONS[section.key];
                    const count = counts[section.key] || (cfg.games || []).length;
                    return { ...section, name: cfg.name, count, sessionCount: Math.min(cfg.count || (cfg.games || []).length, count), minutes: cfg.minutes, available: count > 0, completed: completedKeys.has(`Company-cognizant-${section.key}`) };
                });
                return { ...round, sections, count: sections.reduce((n, s) => n + s.count, 0), minutes: sections.reduce((n, s) => n + s.minutes, 0) };
            });
        }
        let capgeminiSections = null;
        if (isCapgemini) {
            const { CAPGEMINI_SECTIONS, BEHAVIORAL_QUESTIONS, WRITING_TASKS } = require('../config/capgeminiConfig');
            const { LISTENING_PASSAGES } = require('../config/capgeminiListening');
            const Result = require('../models/Result');
            const CapgeminiAttempt = require('../models/CapgeminiAttempt');
            const [technicalCount, englishCount, codingCount, completedResults, completedOther] = await Promise.all([
                placementService.countCapgeminiQuestions('technical'),
                placementService.countCapgeminiQuestions('english'),
                require('../models/Question').countDocuments({ company: 'Capgemini', questionType: 'coding', active: { $ne: false } }),
                Result.find({ userId, company: 'Capgemini' }).select('assessmentId').lean(),
                CapgeminiAttempt.find({ userId, company: 'Capgemini', status: 'submitted' }).select('sectionKey').lean()
            ]);
            const completed = new Set([...completedResults.map(r => r.assessmentId), ...completedOther.map(a => `Company-capgemini-${a.sectionKey}`)]);
            const available = {
                technical: technicalCount,
                english: englishCount,
                writing: WRITING_TASKS.length,
                games: 4,
                behavioral: BEHAVIORAL_QUESTIONS.length,
                coding: codingCount,
                listening: LISTENING_PASSAGES.reduce((total, passage) => total + passage.questions.length, 0)
            };
            capgeminiSections = [
                ['technical', CAPGEMINI_SECTIONS.technical, 'Pseudocode and core computer science topics.'],
                ['english', CAPGEMINI_SECTIONS.english, 'Grammar, correction and reading practice.'],
                ['listening', CAPGEMINI_SECTIONS.listening, 'Listen to locally generated original English passages, then answer comprehension questions.'],
                ['writing', CAPGEMINI_SECTIONS.writing, 'Write a workplace email and short update; saved for review without an invented score.'],
                ['games', CAPGEMINI_SECTIONS.games, 'Four interactive AptitudePro practice games with transparent answer checks.'],
                ['behavioral', CAPGEMINI_SECTIONS.behavioral, 'Reflective workplace scenarios and statements; answers are saved without personality scoring.'],
                ['coding', CAPGEMINI_SECTIONS.coding, 'Solve original Capgemini coding practice problems in the isolated execution sandbox.']
            ].map(([key, cfg, description]) => ({
                key, name: cfg.name, description, count: available[key], targetCount: cfg.targetCount,
                sessionCount: Math.min(cfg.targetCount, available[key]), minutes: cfg.minutes,
                available: available[key] > 0,
                completed: completed.has(`Company-capgemini-${key}`)
            }));
        }
        let hcltechSections = null;
        if (isHCLTech) {
            const { HCLTECH_SECTIONS, HCLTECH_ASSESSMENT } = require('../config/hcltechConfig');
            const Result = require('../models/Result');
            const CodingSubmission = require('../models/CodingSubmission');
            const keys = Object.keys(HCLTECH_SECTIONS);
            const counts = Object.fromEntries(await Promise.all(keys.map(async key => [key, await placementService.countHCLTechQuestions(key)])));
            const [results, codingSubmissions] = await Promise.all([
                Result.find({ userId, company: 'HCLTech' }).select('assessmentId').lean(),
                CodingSubmission.find({ userId, company: 'HCLTech' }).sort({ submittedAt: -1 }).limit(10).lean()
            ]);
            const completed = new Set(results.map(result => result.assessmentId));
            hcltechSections = keys.map(key => {
                const cfg = HCLTECH_SECTIONS[key];
                return { key, name: cfg.name, count: counts[key], targetCount: cfg.targetCount, sessionCount: Math.min(cfg.targetCount, counts[key]), minutes: cfg.minutes, available: counts[key] > 0, completed: key !== 'coding' && completed.has(`Company-hcltech-${key}`) };
            });
            hcltechSections.assessment = HCLTECH_ASSESSMENT;
            hcltechSections.codingSubmissions = codingSubmissions;
        }
        let techMahindraSections = null;
        if (isTechMahindra) {
            const { TECH_MAHINDRA_SECTIONS, ESSAY_TOPICS, PSYCHOMETRIC_QUESTIONS, COMMUNICATION_ACTIVITIES, TECHNICAL_INTERVIEW_QUESTIONS, HR_INTERVIEW_QUESTIONS } = require('../config/techMahindraConfig');
            const Result = require('../models/Result');
            const Activity = require('../models/CapgeminiAttempt');
            const CodingSubmission = require('../models/CodingSubmission');
            const objectiveKeys = ['logical', 'quantitative', 'verbal', 'programming', 'cs'];
            const [counts, results, activities, codingCount, codingSubmissions] = await Promise.all([
                Promise.all(Object.keys(TECH_MAHINDRA_SECTIONS).filter(key => TECH_MAHINDRA_SECTIONS[key].category).map(async key => [key, await placementService.countTechMahindraQuestions(key)])),
                Result.find({ userId, company: 'Tech Mahindra' }).select('assessmentId').lean(),
                Activity.find({ userId, company: 'Tech Mahindra', status: 'submitted' }).select('sectionKey').lean(),
                placementService.countTechMahindraQuestions('coding'),
                CodingSubmission.find({ userId, company: 'Tech Mahindra' }).sort({ submittedAt: -1 }).limit(10).lean()
            ]);
            const countsByKey = Object.fromEntries(counts);
            const completed = new Set(results.map(item => item.assessmentId));
            activities.forEach(item => completed.add(`Company-tech-mahindra-${item.sectionKey}`));
            techMahindraSections = Object.entries(TECH_MAHINDRA_SECTIONS).map(([key, cfg]) => {
                let count = cfg.category ? countsByKey[key] || 0 : key === 'coding' ? codingCount : key === 'psychometric' ? PSYCHOMETRIC_QUESTIONS.length : key === 'communication' ? COMMUNICATION_ACTIVITIES.length : key === 'essay' ? ESSAY_TOPICS.length : key === 'technicalInterview' ? TECHNICAL_INTERVIEW_QUESTIONS.length : key === 'hrInterview' ? HR_INTERVIEW_QUESTIONS.length : 0;
                const routeKey = key === 'technicalInterview' ? 'interview/technical' : key === 'hrInterview' ? 'interview/hr' : key;
                return { key, routeKey, name: cfg.name, count, sessionCount: cfg.count || 1, minutes: cfg.minutes || null, available: count > 0, completed: objectiveKeys.includes(key) ? completed.has(`Company-tech-mahindra-${key}`) : completed.has(`Company-tech-mahindra-${key}`) };
            });
            techMahindraSections.codingSubmissions = codingSubmissions;
        }
        let ibmSections = null;
        if (isIBM) {
            const { IBM_SECTIONS, IBM_GROUP_TOPICS, IBM_TECHNICAL_QUESTIONS, IBM_HR_QUESTIONS, IBM_NEGATIVE_MARKING } = require('../config/ibmConfig');
            const Result = require('../models/Result');
            const Activity = require('../models/CapgeminiAttempt');
            const CodingSubmission = require('../models/CodingSubmission');
            const [englishCount, codingCount, results, activities, codingSubmissions] = await Promise.all([
                placementService.countIBMQuestions('english'), placementService.countIBMQuestions('coding'),
                Result.find({ userId, company: 'IBM' }).select('assessmentId').lean(),
                Activity.find({ userId, company: 'IBM', status: 'submitted' }).select('sectionKey').lean(),
                CodingSubmission.find({ userId, company: 'IBM' }).sort({ submittedAt: -1 }).limit(10).lean()
            ]);
            const completed = new Set(results.map(row => row.assessmentId));
            activities.forEach(row => completed.add(`Company-ibm-${row.sectionKey}`));
            const counts = { english: englishCount, coding: codingCount, groupDiscussion: IBM_GROUP_TOPICS.length, technicalInterview: IBM_TECHNICAL_QUESTIONS.length, hrInterview: IBM_HR_QUESTIONS.length };
            ibmSections = Object.entries(IBM_SECTIONS).map(([key, cfg]) => ({
                key, name: cfg.name, count: counts[key] || 0, sessionCount: cfg.count || counts[key] || 0,
                minutes: cfg.minutes || null, available: (counts[key] || 0) > 0,
                completed: completed.has(`Company-ibm-${key}`), negativeMarking: key === 'english' ? IBM_NEGATIVE_MARKING : null
            }));
            ibmSections.codingSubmissions = codingSubmissions;
        }
        const Result = require('../models/Result');
        const passedFoundation = await Result.exists({
            userId,
            company: 'TCS',
            accuracy: { $gte: UNLOCK_ACCURACY_THRESHOLD }
        });
        const advancedUnlocked = unlocked[2] || !!passedFoundation;

        res.render('placement', {
            step: 'company-levels',
            title: `${companyObj.name} Placement Practice`,
            subtitle: companyObj.tag,
            company: companyObj,
            isTcs,
            isInfosys,
            isWipro,
            isAccenture,
            isCognizant,
            isCapgemini,
            isHCLTech,
            isTechMahindra,
            isIBM,
            accentureSections,
            cognizantRounds,
            capgeminiSections,
            hcltechSections,
            techMahindraSections,
            ibmSections,
            wiproConfig,
            advancedUnlocked,
            levels,
            unlockThreshold: UNLOCK_ACCURACY_THRESHOLD,
            disclaimer: DISCLAIMER_TEXT,
            user: req.session.user || null,
            error: flashError
        });
    } catch (error) {
        console.error('Company level load error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load company practice levels',
            error: 'Something went wrong. Please try again.',
            user: req.session.user || null
        });
    }
});

// ============================================
// 7. POST /placement/admin/questions - Manual Admin Question Entry API
// ============================================
router.post('/admin/questions', isAuthenticated, async (req, res) => {
    try {
        const Question = require('../models/Question');
        const { validateQuestionRecord } = require('../../scripts/import-tcs-questions');

        const validated = validateQuestionRecord(req.body, 1);
        if (!validated.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Question validation failed',
                errors: validated.errors
            });
        }

        const newQuestion = await Question.create(validated.doc);
        return res.status(201).json({
            success: true,
            message: 'Question added successfully',
            question: newQuestion
        });
    } catch (error) {
        console.error('Admin question creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create question',
            error: error.message
        });
    }
});

// ============================================
// 8. PUT /placement/admin/questions/:id - Manual Admin Question Update API
// ============================================
router.put('/admin/questions/:id', isAuthenticated, async (req, res) => {
    try {
        const Question = require('../models/Question');
        const { id } = req.params;

        const updated = await Question.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        return res.json({
            success: true,
            message: 'Question updated successfully',
            question: updated
        });
    } catch (error) {
        console.error('Admin question update error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update question',
            error: error.message
        });
    }
});

module.exports = router;
