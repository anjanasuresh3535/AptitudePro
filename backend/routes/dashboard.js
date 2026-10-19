const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/auth');

const User = require('../models/User');
const UserStats = require('../models/UserStats');
const SectionProgress = require('../models/SectionProgress');
const Result = require('../models/Result');
const XPHistory = require('../models/XPHistory');

const levelService = require('../services/LevelService');
const sectionService = require('../services/SectionService');

function startOfTodayUTC() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

function endOfTodayUTC() {
    const d = new Date();
    d.setUTCHours(23, 59, 59, 999);
    return d;
}

function formatDate(date) {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
}

router.get('/', isAuthenticated, async (req, res) => {
    try {
        if ((req.session.role === 'admin' || (req.session.user && req.session.user.role === 'admin')) && req.query.view !== 'student') {
            return res.redirect('/admin');
        }

        const userId = req.session.userId;
        const username = req.session.user.name;

        // --- UserStats (with safe defaults if the document is missing) ---
        const statsDoc = await UserStats.findOne({ userId });
        const userStats = statsDoc || { xp: 0, streak: 0, totalCorrect: 0, totalWrong: 0 };
        const xp = userStats.xp || 0;
        const streak = userStats.streak || 0;
        const correct = userStats.totalCorrect || 0;
        const wrong = userStats.totalWrong || 0;

        // Level is always derived live from current XP (via LevelService),
        // never trusted from a possibly-stale stored field - this is the
        // single source of truth for level, same approach used everywhere
        // else in this project.
        const levelNum = levelService.getLevelFromXP(xp);

        const levelData = levelService.getLevelDetails(levelNum);
        const levelInfo = levelService.getLevelInfo(levelNum);
        const nextXP = levelData.max;
        const minXP = levelData.min;
        const stay = levelData.stay;

        const xpInLevel = xp - minXP;
        const xpNeeded = nextXP - minXP;
        const progress = xpNeeded > 0 ? Math.min(100, (xpInLevel / xpNeeded) * 100) : 100;
        const isDanger = levelNum > 5 && xp < stay;

        const totalAttempts = correct + wrong;
        const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;

        // --- Quiz counts ---
        const quizCount = await Result.countDocuments({ userId });
        const todayCount = await Result.countDocuments({
            userId,
            testDate: { $gte: startOfTodayUTC(), $lte: endOfTodayUTC() }
        });

        // --- Recent results (aliased to the exact field names dashboard.ejs reads) ---
        const recentDocs = await Result.find({ userId })
            .sort({ testDate: -1 })
            .limit(3)
            .lean();
        const recent = recentDocs.map(r => ({
            total: r.totalQuestions,
            score: r.score,
            test_date: formatDate(r.testDate),
            xp_earned: r.xpEarned || 0
        }));

        // --- XP history (aliased the same way) ---
        const xpHistoryDocs = await XPHistory.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        const xpHistory = xpHistoryDocs.map(h => ({
            reason: h.reason,
            xp_change: h.netXP
        }));

        // --- Badges - not built yet (no Badge/UserBadge models exist),
        // so this shows the same empty state the original app shows for
        // a user with no badges rather than a fake/placeholder list. ---
        const badges = [];
        const badgeCount = 0;

        const tierColors = levelService.getTierColors();
        const tc = tierColors[levelData.tier] || tierColors['Nothing'];
        const cl = levelData;
        const li = levelInfo;

        const roadStart = Math.max(1, levelNum - 3);
        const roadEnd = Math.min(195, levelNum + 6);
        const roadLevels = {};
        const allLevels = levelService.levels;
        for (let i = roadStart; i <= roadEnd; i++) {
            roadLevels[i] = allLevels[i];
        }

        // --- Section progress (create the doc if missing, matching the
        // original app's auto-create-on-first-visit behavior) ---
        const sections = sectionService.getSections();
        const sectionProgress = {};

        for (const key of Object.keys(sections)) {
            let spDoc = await SectionProgress.findOne({ userId, section: key });

            if (!spDoc) {
                spDoc = await SectionProgress.create({
                    userId,
                    section: key,
                    xp: 0,
                    level: 1
                });
            }

            const spXP = spDoc.xp || 0;
            const spLevelNum = levelService.getLevelFromXP(spXP);
            const spLD = levelService.getLevelDetails(spLevelNum);
            const spLI = levelService.getLevelInfo(spLevelNum);
            const spProgress = spLD.max > spLD.min
                ? Math.min(100, ((spXP - spLD.min) / (spLD.max - spLD.min)) * 100)
                : 100;

            const spCorrect = spDoc.correct || 0;
            const spWrong = spDoc.wrong || 0;
            const spAcc = (spCorrect + spWrong) > 0
                ? Math.round((spCorrect / (spCorrect + spWrong)) * 100)
                : 0;

            sectionProgress[key] = {
                level_number: spLevelNum,
                xp: spXP,
                total_quizzes: spDoc.quizzesAttempted || 0,
                levelDetails: spLD,
                levelInfo: spLI,
                progress: spProgress,
                accuracy: spAcc
            };
        }

        res.render('dashboard', {
            username,
            userStats,
            xp,
            streak,
            levelNum,
            correct,
            wrong,
            levelData,
            levelInfo,
            nextXP,
            minXP,
            stay,
            progress,
            isDanger,
            accuracy,
            quizCount,
            todayCount,
            recent,
            xpHistory,
            badges,
            badgeCount,
            tierColors,
            tc,
            cl,
            li,
            roadStart,
            roadEnd,
            roadLevels,
            sections,
            sectionProgress,
            allTiers: levelService.getAllTiers(),
            levelService
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard: ' + error.message);
    }
});

module.exports = router;
