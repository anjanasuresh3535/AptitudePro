const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const isAuthenticated = require('../middleware/auth');
const Result = require('../models/Result');
const AccentureResponse = require('../models/AccentureResponse');
const SectionProgress = require('../models/SectionProgress');
const levelService = require('../services/LevelService');
const { getAreaDisplayName, getDifficultyLabel, DISCLAIMER_TEXT, COMPANY_LIST } = require('../config/placementConfig');

const VALID_SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];

function computeTopicBreakdown(answers) {
    const bySubject = {};
    (answers || []).forEach(a => {
        const subject = a.subject || 'General';
        if (!bySubject[subject]) bySubject[subject] = { correct: 0, total: 0 };
        bySubject[subject].total++;
        if (a.isCorrect) bySubject[subject].correct++;
    });

    const subjects = Object.keys(bySubject).map(subject => ({
        subject,
        correct: bySubject[subject].correct,
        total: bySubject[subject].total,
        accuracy: Math.round((bySubject[subject].correct / bySubject[subject].total) * 100)
    }));

    if (subjects.length < 2) {
        return { strongest: null, weakest: null, insufficientData: true, subjects };
    }

    subjects.sort((a, b) => b.accuracy - a.accuracy);
    return {
        strongest: subjects[0],
        weakest: subjects[subjects.length - 1],
        insufficientData: false,
        subjects
    };
}

function formatTime(seconds) {
    const s = Math.max(0, parseInt(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

// ============================================
// GET /results - convenience redirect
// ============================================
router.get('/', isAuthenticated, (req, res) => {
    res.redirect('/results/history');
});

// ============================================
// GET /results/history
// ============================================
router.get('/history', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 10;
        
        const section = VALID_SECTIONS.includes(req.query.section) ? req.query.section : null;
        const learningPath = ['school', 'college'].includes(req.query.learningPath) ? req.query.learningPath : null;
        const placementType = ['general', 'company'].includes(req.query.placementType) ? req.query.placementType : null;
        const companyFilter = req.query.company || null;
        const difficultyFilter = [1, 2, 3].includes(parseInt(req.query.difficulty)) ? parseInt(req.query.difficulty) : null;
        const dateFilter = req.query.date;

        const query = { userId };
        if (section) query.section = section;
        if (learningPath) query.learningPath = learningPath;
        if (placementType) query.placementType = placementType;
        if (companyFilter) query.company = companyFilter;
        if (difficultyFilter) query.difficulty = difficultyFilter;

        if (dateFilter) {
            const start = new Date(dateFilter + 'T00:00:00.000Z');
            const end = new Date(dateFilter + 'T23:59:59.999Z');
            if (!isNaN(start.getTime())) {
                query.testDate = { $gte: start, $lte: end };
            }
        }

        const [results, total] = await Promise.all([
            Result.find(query)
                .select('section difficulty testTitle learningPath placementType company score totalQuestions accuracy netXP timeTaken testDate evaluationStatus')
                .sort({ testDate: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Result.countDocuments(query)
        ]);

        const totalPages = Math.max(1, Math.ceil(total / limit));

        const responseHistory = await AccentureResponse.find({ userId, company: 'Accenture', submissionStatus: 'submitted' })
            .select('section taskTitle wordCount submittedAt createdAt')
            .sort({ submittedAt: -1 }).limit(20).lean();

        res.render('result-history', {
            results,
            total,
            page,
            totalPages,
            section: section || '',
            learningPath: learningPath || '',
            placementType: placementType || '',
            company: companyFilter || '',
            difficulty: difficultyFilter || '',
            date: dateFilter || '',
            sections: VALID_SECTIONS,
            companies: COMPANY_LIST,
            responseHistory,
            formatTime,
            error: null
        });

    } catch (error) {
        console.error('Result history error:', error);
        res.status(500).render('result-history', {
            results: [], total: 0, page: 1, totalPages: 1,
            section: '', learningPath: '', placementType: '', company: '', difficulty: '', date: '',
            sections: VALID_SECTIONS, companies: COMPANY_LIST, responseHistory: [], formatTime,
            error: 'Failed to load history. Please try again.'
        });
    }
});

// ============================================
// GET /results/:id
// ============================================
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).render('error', {
                title: 'Result Not Found',
                message: 'Result not found',
                error: 'This result does not exist or the link is invalid.',
                user: req.session.user || null
            });
        }

        const result = await Result.findById(id).lean();

        if (!result || result.userId.toString() !== userId) {
            return res.status(404).render('error', {
                title: 'Result Not Found',
                message: 'Result not found',
                error: 'This result does not exist or you do not have permission to view it.',
                user: req.session.user || null
            });
        }

        const topicBreakdown = computeTopicBreakdown(result.answers || []);

        const previousResult = await Result.findOne({
            userId,
            section: result.section,
            testDate: { $lt: result.testDate }
        }).sort({ testDate: -1 }).select('accuracy testDate').lean();

        const improvement = previousResult
            ? Math.round(result.accuracy - previousResult.accuracy)
            : null;

        const last5Docs = await Result.find({ userId, section: result.section })
            .sort({ testDate: -1 })
            .limit(5)
            .select('accuracy testDate')
            .lean();
        const last5 = last5Docs.slice().reverse();
        const last5Average = last5.length > 0
            ? Math.round(last5.reduce((sum, r) => sum + r.accuracy, 0) / last5.length)
            : 0;

        const totalQuizzesThisSection = await Result.countDocuments({ userId, section: result.section });

        const sectionProgress = await SectionProgress.findOne({ userId, section: result.section }).lean();

        const levelDetails = levelService.getLevelDetails(result.levelAfter);
        const xpInLevel = result.xpAfter - levelDetails.min;
        const xpNeededForLevel = levelDetails.max - levelDetails.min;
        const levelProgress = xpNeededForLevel > 0
            ? Math.min(100, Math.round((xpInLevel / xpNeededForLevel) * 100))
            : 100;

        const avgSecondsPerQuestion = result.totalQuestions > 0
            ? Math.round(result.timeTaken / result.totalQuestions)
            : null;

        const areaDisplayName = result.testTitle || (result.company ? `${result.company} Placement Practice` : getAreaDisplayName(result.section));
        const difficultyLabel = getDifficultyLabel(result.difficulty);
        const placementCategoryLabel = result.learningPath === 'school' ? 'School Aptitude' : (result.company ? `${result.company} Practice` : 'General Placement');

        res.render('result', {
            result,
            topicBreakdown,
            previousResult,
            improvement,
            last5,
            last5Average,
            totalQuizzesThisSection,
            sectionProgress,
            levelDetails,
            levelProgress,
            avgSecondsPerQuestion,
            areaDisplayName,
            difficultyLabel,
            placementCategoryLabel,
            disclaimer: result.company ? DISCLAIMER_TEXT : null,
            formatTime,
            error: null
        });

    } catch (error) {
        console.error('Result view error:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load result',
            error: 'Something went wrong loading this result. Please try again.',
            user: req.session.user || null
        });
    }
});

module.exports = router;
