// backend/routes/game.js

const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middleware/auth');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const gameService = require('../services/GameService');
const levelService = require('../services/LevelService');
const { GAME_SECTIONS, getGameConfig } = require('../config/gameConfig');

// ============================================
// GET /gaming - Gaming Hub Main Page
// ============================================
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        if (!user) return res.redirect('/login');

        const stats = await UserStats.findOne({ userId });
        const userXP = stats?.xp || user.xp || 0;
        const userLevel = levelService.getLevelFromXP(userXP);
        const levelDetails = levelService.getLevelDetails(userLevel);
        const nextLevelDetails = levelService.getLevelDetails(userLevel + 1);

        const xpInLevel = Math.max(0, userXP - levelDetails.min);
        const levelSpan = Math.max(1, levelDetails.max - levelDetails.min);
        const pctToNextLevel = userLevel >= 195 ? 100 : Math.min(100, Math.max(0, Math.round((xpInLevel / levelSpan) * 100)));
        const xpRemaining = userLevel >= 195 ? 0 : Math.max(0, levelDetails.max - userXP);

        const allTiers = levelService.getAllTiers();
        const tierColors = levelService.getTierColors();

        const currentTierIndex = allTiers.findIndex(t => t.name.toLowerCase() === levelDetails.tier.toLowerCase());
        let nextMilestoneTier = null;
        let levelsToMilestone = 0;

        if (currentTierIndex >= 0 && currentTierIndex < allTiers.length - 1) {
            const nextT = allTiers[currentTierIndex + 1];
            nextMilestoneTier = {
                name: nextT.name,
                icon: nextT.icon,
                targetLevel: nextT.range[0],
                range: nextT.range,
                color: tierColors[nextT.name]?.color || '#ffffff'
            };
            levelsToMilestone = Math.max(0, nextT.range[0] - userLevel);
        } else {
            nextMilestoneTier = {
                name: 'GOAT MAX',
                icon: '🐐',
                targetLevel: 195,
                range: [96, 195],
                color: tierColors['GOAT']?.color || '#f39c12'
            };
            levelsToMilestone = Math.max(0, 195 - userLevel);
        }

        const fullMapByTier = allTiers.map(t => {
            const start = t.range[0];
            const end = t.range[1];
            const subLevels = [];
            for (let lvl = start; lvl <= end; lvl++) {
                subLevels.push({
                    level: lvl,
                    details: levelService.getLevelDetails(lvl),
                    isCurrent: lvl === userLevel,
                    isCompleted: lvl < userLevel,
                    isLocked: lvl > userLevel
                });
            }

            const isCurrentTier = t.name.toLowerCase() === levelDetails.tier.toLowerCase();
            const isCompletedTier = currentTierIndex > allTiers.findIndex(x => x.name === t.name);

            return {
                name: t.name,
                icon: t.icon,
                rangeStr: t.levels,
                range: t.range,
                colors: tierColors[t.name] || {},
                isCurrentTier,
                isCompletedTier,
                isFutureTier: !isCurrentTier && !isCompletedTier,
                subLevels
            };
        });

        const gameStats = await gameService.getUserGameStats(userId);
        const recentGames = await gameService.getUserGameHistory(userId, 5);

        const errorMsg = req.session.gameError || null;
        req.session.gameError = null;

        res.render('gaming', {
            title: 'Aptitude Gaming Hub — AptitudePro',
            user,
            userXP,
            userLevel,
            levelDetails,
            nextLevelDetails,
            xpInLevel,
            levelSpan,
            pctToNextLevel,
            xpRemaining,
            allTiers,
            tierColors,
            currentTierIndex,
            nextMilestoneTier,
            levelsToMilestone,
            fullMapByTier,
            gameSections: GAME_SECTIONS,
            gameStats,
            recentGames,
            errorMsg
        });
    } catch (error) {
        console.error('❌ Error rendering Gaming Hub:', error);
        res.status(500).render('error', { message: 'Failed to load Gaming Hub.' });
    }
});

// ============================================
// POST /gaming/session - Initialize a Game Session
// ============================================
router.post('/session', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const gameSection = req.body.gameSection || req.body.mode;
        const difficulty = req.body.difficulty;

        const sessionPayload = await gameService.createSession(userId, gameSection, difficulty);
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({
                success: true,
                session: sessionPayload,
                redirectUrl: `/gaming/play?sessionId=${sessionPayload.sessionId}`
            });
        }

        return res.redirect(`/gaming/play?sessionId=${sessionPayload.sessionId}`);
    } catch (error) {
        console.error('❌ Error creating game session:', error);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to start game session.'
            });
        }
        req.session.gameError = error.message || 'Failed to start game session.';
        return res.redirect('/gaming');
    }
});

// ============================================
// GET /gaming/play - Interactive Game Interface
// ============================================
router.get('/play', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const sessionId = req.query.sessionId;

        if (!sessionId) {
            return res.redirect('/gaming');
        }

        const GameSession = require('../models/GameSession');
        const session = await GameSession.findOne({ sessionId, userId });

        if (!session) {
            req.session.gameError = 'Game session not found or expired.';
            return res.redirect('/gaming');
        }

        if (session.status === 'COMPLETED') {
            return res.redirect(`/gaming/result/${sessionId}`);
        }

        const sanitized = gameService.sanitizeSessionForClient(session);
        const config = getGameConfig(session.gameSection, session.difficulty);

        res.render('gaming-play', {
            title: `${session.gameSectionName} — Aptitude Gaming`,
            session: sanitized,
            config,
            user: res.locals.user
        });
    } catch (error) {
        console.error('❌ Error loading game play view:', error);
        res.status(500).render('error', { message: 'Failed to load game session.' });
    }
});

// ============================================
// POST /gaming/submit - Submit Game Session Answers
// ============================================
router.post('/submit', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { sessionId, timeTakenSec, answersJson } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }

        let userAnswers = [];
        if (typeof answersJson === 'string') {
            try {
                userAnswers = JSON.parse(answersJson);
            } catch (e) {
                userAnswers = [];
            }
        } else if (Array.isArray(req.body.answers)) {
            userAnswers = req.body.answers;
        }

        const completedSession = await gameService.submitSession(
            userId,
            sessionId,
            userAnswers,
            timeTakenSec
        );

        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.json({
                success: true,
                xpAwarded: completedSession.xpEarned || 0,
                accuracy: completedSession.accuracy || 0,
                redirectUrl: `/gaming/result/${sessionId}`
            });
        }

        return res.redirect(`/gaming/result/${sessionId}`);
    } catch (error) {
        console.error('❌ Error submitting game session:', error);
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(500).json({ error: error.message || 'Failed to submit game.' });
        }
        req.session.gameError = error.message || 'Error processing game result.';
        return res.redirect('/gaming');
    }
});

// ============================================
// GET /gaming/result/:sessionId - Game Result View
// ============================================
router.get('/result/:sessionId', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const sessionId = req.params.sessionId;

        const session = await gameService.getSessionResult(userId, sessionId);
        if (!session) {
            req.session.gameError = 'Game result not found.';
            return res.redirect('/gaming');
        }

        const levelInfo = levelService.getLevelInfo(session.levelAfter);
        const tierColors = levelService.getTierColors()[levelInfo.tier] || {};

        res.render('gaming-result', {
            title: `Result: ${session.gameSectionName} — Aptitude Gaming`,
            session,
            levelInfo,
            tierColors,
            user: res.locals.user
        });
    } catch (error) {
        console.error('❌ Error rendering game result:', error);
        res.status(500).render('error', { message: 'Failed to display game result.' });
    }
});

// ============================================
// GET /gaming/history - User Game History View
// ============================================
router.get('/history', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const history = await gameService.getUserGameHistory(userId, 50);
        const gameStats = await gameService.getUserGameStats(userId);

        res.render('gaming-history', {
            title: 'Gaming History — AptitudePro',
            history,
            gameStats,
            user: res.locals.user
        });
    } catch (error) {
        console.error('❌ Error rendering game history:', error);
        res.status(500).render('error', { message: 'Failed to load game history.' });
    }
});

module.exports = router;
