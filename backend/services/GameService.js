// backend/services/GameService.js

const crypto = require('crypto');
const { mongoose } = require('../config/database');
const Question = require('../models/Question');
const GameSession = require('../models/GameSession');
const User = require('../models/User');
const UserStats = require('../models/UserStats');
const XPHistory = require('../models/XPHistory');
const levelService = require('./LevelService');
const { getGameConfig, isValidGameSection, isValidDifficulty, parseDifficultyLevel, normalizeGameSection } = require('../config/gameConfig');

function normalizeAnswer(text) {
    return (text ?? '').toString().trim().toLowerCase();
}

function findCorrectLetter(q) {
    const answer = normalizeAnswer(q.answer);
    const options = {
        A: q.option1,
        B: q.option2,
        C: q.option3,
        D: q.option4
    };

    for (const letter of ['A', 'B', 'C', 'D']) {
        if (normalizeAnswer(options[letter]) === answer) {
            return letter;
        }
    }
    return 'A';
}

function isTransactionUnsupportedError(error) {
    return (
        error?.code === 20 ||
        error?.codeName === 'IllegalOperation' ||
        (typeof error?.message === 'string' && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
    );
}

class GameService {
    /**
     * Create a new game session with randomized questions matching section & difficulty
     */
    async createSession(userId, gameSection, difficulty) {
        gameSection = normalizeGameSection(gameSection);
        if (!isValidGameSection(gameSection)) {
            throw new Error(`Invalid game section: ${gameSection}`);
        }
        if (!isValidDifficulty(difficulty)) {
            throw new Error(`Invalid difficulty level: ${difficulty}. Must be Intermediate (2) or Advanced (3).`);
        }
        const diffNum = parseDifficultyLevel(difficulty);

        const config = getGameConfig(gameSection, diffNum);
        if (!config) {
            throw new Error('Game configuration not found.');
        }

        const { section, level } = config;

        // Fetch questions from question bank matching difficulty level (MCQ only)
        const matchBase = {
            difficultyLevel: diffNum,
            isActive: { $ne: false },
            active: { $ne: false },
            questionType: { $in: ['mcq', null, undefined] },
            option1: { $exists: true, $ne: '' },
            option2: { $exists: true, $ne: '' }
        };

        const availableQuestions = await Question.aggregate([
            { $match: matchBase },
            { $sample: { size: level.questionCount } }
        ]);

        // Fallback: If not enough questions found at exact level, fetch any MCQ questions sorted randomly
        let questionDocs = availableQuestions;
        if (questionDocs.length < level.questionCount) {
            const fallbackQuestions = await Question.aggregate([
                {
                    $match: {
                        isActive: { $ne: false },
                        active: { $ne: false },
                        questionType: { $in: ['mcq', null, undefined] },
                        option1: { $exists: true, $ne: '' },
                        option2: { $exists: true, $ne: '' }
                    }
                },
                { $sample: { size: level.questionCount } }
            ]);
            questionDocs = fallbackQuestions;
        }

        if (!questionDocs || questionDocs.length === 0) {
            throw new Error('No questions available to start the game session.');
        }

        const sessionId = 'game_' + crypto.randomUUID().replace(/-/g, '');

        const questionSnapshots = questionDocs.map(q => {
            const correctLetter = findCorrectLetter(q);
            const optionsMap = { A: q.option1, B: q.option2, C: q.option3, D: q.option4 };
            return {
                questionId: q._id,
                questionText: q.question,
                options: { a: q.option1, b: q.option2, c: q.option3, d: q.option4 },
                correctAnswerLetter: correctLetter,
                correctAnswerText: optionsMap[correctLetter] || q.option1,
                subject: q.subject || '',
                category: q.category || '',
                explanation: q.explanation || '',
                fullExplanation: q.fullExplanation || '',
                formulaUsed: q.formulaUsed || '',
                stepSolution: q.stepSolution || '',
                quickTrick: q.quickTrick || '',
                commonMistake: q.commonMistake || ''
            };
        });

        const gameSession = await GameSession.create({
            userId,
            sessionId,
            gameSection: section.key,
            gameSectionName: section.name,
            difficulty: level.difficultyLevel,
            difficultyName: level.difficultyName,
            totalQuestions: questionSnapshots.length,
            timeLimitSec: level.timeLimitSec,
            questions: questionSnapshots,
            status: 'ACTIVE',
            startTime: new Date()
        });

        return this.sanitizeSessionForClient(gameSession);
    }

    /**
     * Sanitize session document for client play view (removes correct answers)
     */
    sanitizeSessionForClient(session) {
        return {
            sessionId: session.sessionId,
            gameSection: session.gameSection,
            gameSectionName: session.gameSectionName,
            difficulty: session.difficulty,
            difficultyName: session.difficultyName,
            totalQuestions: session.totalQuestions,
            timeLimitSec: session.timeLimitSec,
            startTime: session.startTime,
            status: session.status,
            questions: session.questions.map((q, idx) => ({
                index: idx + 1,
                questionId: q.questionId,
                questionText: q.questionText,
                options: q.options,
                subject: q.subject,
                category: q.category
            }))
        };
    }

    /**
     * Submit game session answers, evaluate score & XP on server
     */
    async submitSession(userId, sessionId, userAnswers = [], timeTakenSec = 0) {
        const session = await GameSession.findOne({ sessionId, userId });
        if (!session) {
            throw new Error('Game session not found.');
        }

        // Idempotency check: If session already completed, return existing result without re-awarding XP
        if (session.status === 'COMPLETED') {
            console.log(`[GAME SUBMIT] Session ${sessionId} already completed. Returning cached result.`);
            return session;
        }

        const config = getGameConfig(session.gameSection, session.difficulty);
        const { section, level } = config;

        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        let earnedXP = 0;
        let lostXP = 0;
        let currentStreak = 0;
        let maxStreak = 0;

        const evaluatedAnswers = [];
        const answerMap = new Map();
        if (Array.isArray(userAnswers)) {
            userAnswers.forEach(ans => {
                if (ans && ans.questionId) {
                    answerMap.set(ans.questionId.toString(), ans);
                }
            });
        }

        session.questions.forEach((q, idx) => {
            const clientAns = answerMap.get(q.questionId.toString()) || userAnswers[idx] || {};
            const rawChoice = (clientAns.selectedOption || clientAns.selectedAnswer || '').toString().toUpperCase();
            const timeSpent = parseInt(clientAns.timeSpentSec) || 0;

            let isCorrect = false;
            let isSkipped = false;
            let selectedLetter = null;
            let selectedText = null;
            let questionXP = 0;

            if (!['A', 'B', 'C', 'D'].includes(rawChoice)) {
                isSkipped = true;
                skippedCount++;
                currentStreak = 0;
                lostXP += level.penaltyPerSkip;
            } else {
                selectedLetter = rawChoice;
                const optionKey = rawChoice.toLowerCase();
                selectedText = q.options[optionKey] || rawChoice;

                if (rawChoice === q.correctAnswerLetter) {
                    isCorrect = true;
                    correctCount++;
                    currentStreak++;
                    if (currentStreak > maxStreak) maxStreak = currentStreak;

                    questionXP += level.baseXpPerCorrect;

                    // Mode-specific bonus XP
                    if (session.gameSection === 'speedChallenge') {
                        // Speed bonus if answered faster than target per question time
                        if (timeSpent > 0 && timeSpent <= level.perQuestionTimeSec) {
                            const speedRatio = (level.perQuestionTimeSec - timeSpent) / level.perQuestionTimeSec;
                            const speedBonus = Math.round(speedRatio * (level.speedBonusMaxXP || 5));
                            questionXP += Math.max(1, speedBonus);
                        }
                    } else if (session.gameSection === 'accuracyRush') {
                        // Streak bonus for every threshold reached (e.g., every 3 consecutive correct)
                        if (currentStreak > 0 && currentStreak % (level.streakThreshold || 3) === 0) {
                            questionXP += (level.streakBonusXP || 5);
                        }
                    }

                    earnedXP += questionXP;
                } else {
                    wrongCount++;
                    currentStreak = 0;
                    lostXP += level.penaltyPerWrong;
                }
            }

            evaluatedAnswers.push({
                questionId: q.questionId,
                questionText: q.questionText,
                options: q.options,
                selectedAnswer: selectedLetter,
                selectedAnswerText: selectedText,
                correctAnswer: q.correctAnswerLetter,
                correctAnswerText: q.correctAnswerText,
                explanation: q.explanation || '',
                fullExplanation: q.fullExplanation || '',
                formulaUsed: q.formulaUsed || '',
                stepSolution: q.stepSolution || '',
                quickTrick: q.quickTrick || '',
                commonMistake: q.commonMistake || '',
                subject: q.subject || '',
                category: q.category || '',
                isCorrect,
                isSkipped,
                timeSpentSec: timeSpent,
                streakAtAnswer: currentStreak,
                xpEarnedForQuestion: questionXP
            });
        });

        const totalQ = session.totalQuestions;
        const score = correctCount;
        const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
        const netXP = Math.max(0, earnedXP - lostXP);
        const actualTimeTakenSec = parseInt(timeTakenSec) || 0;

        // Perform transactional database update for User XP, UserStats & XPHistory
        const dbSession = await mongoose.startSession();
        try {
            await dbSession.withTransaction(async () => {
                await this.executeSubmissionDatabaseUpdates({
                    userId,
                    session,
                    evaluatedAnswers,
                    score,
                    correctCount,
                    wrongCount,
                    skippedCount,
                    maxStreak,
                    accuracy,
                    earnedXP,
                    lostXP,
                    netXP,
                    actualTimeTakenSec,
                    dbSession
                });
            });
        } catch (error) {
            if (isTransactionUnsupportedError(error)) {
                console.warn('⚠️ MongoDB Transactions unsupported. Executing non-transactional fallback for Game Submission...');
                await this.executeSubmissionDatabaseUpdates({
                    userId,
                    session,
                    evaluatedAnswers,
                    score,
                    correctCount,
                    wrongCount,
                    skippedCount,
                    maxStreak,
                    accuracy,
                    earnedXP,
                    lostXP,
                    netXP,
                    actualTimeTakenSec,
                    dbSession: null
                });
            } else {
                throw error;
            }
        } finally {
            await dbSession.endSession();
        }

        return GameSession.findOne({ _id: session._id });
    }

    /**
     * Helper to perform database mutations for game session completion
     */
    async executeSubmissionDatabaseUpdates({
        userId,
        session,
        evaluatedAnswers,
        score,
        correctCount,
        wrongCount,
        skippedCount,
        maxStreak,
        accuracy,
        earnedXP,
        lostXP,
        netXP,
        actualTimeTakenSec,
        dbSession
    }) {
        const queryOpts = dbSession ? { session: dbSession } : {};

        const statsDoc = await UserStats.findOne({ userId }, null, queryOpts);
        const currentUserXP = statsDoc?.xp || 0;
        const currentUserLevel = levelService.getLevelFromXP(currentUserXP);

        const newUserXP = Math.max(0, currentUserXP + netXP);
        const newUserLevel = levelService.getLevelFromXP(newUserXP);

        // Update GameSession
        session.answers = evaluatedAnswers;
        session.score = score;
        session.correctCount = correctCount;
        session.wrongCount = wrongCount;
        session.skippedCount = skippedCount;
        session.maxStreak = maxStreak;
        session.accuracy = accuracy;
        session.earnedXP = earnedXP;
        session.lostXP = lostXP;
        session.netXP = netXP;
        session.levelBefore = currentUserLevel;
        session.levelAfter = newUserLevel;
        session.xpBefore = currentUserXP;
        session.xpAfter = newUserXP;
        session.status = 'COMPLETED';
        session.completedAt = new Date();
        session.timeTakenSec = actualTimeTakenSec;

        await session.save(queryOpts);

        // Update User Model
        await User.updateOne(
            { _id: userId },
            { $set: { xp: newUserXP, level: newUserLevel } },
            queryOpts
        );

        // Update UserStats Model
        await UserStats.updateOne(
            { userId },
            {
                $set: { xp: newUserXP },
                $inc: {
                    totalCorrect: correctCount,
                    totalWrong: wrongCount,
                    totalSkipped: skippedCount,
                    totalQuestions: session.totalQuestions
                }
            },
            { upsert: true, ...queryOpts }
        );

        // Log XP History
        await XPHistory.create([{
            userId,
            resultId: null,
            section: 'Mixed',
            xpEarned: earnedXP,
            xpLost: lostXP,
            netXP,
            reason: `[Gaming - ${session.gameSectionName}] ${session.difficultyName}: ${correctCount}/${session.totalQuestions} correct (${accuracy}%)`,
            levelBefore: currentUserLevel,
            levelAfter: newUserLevel
        }], queryOpts);
    }

    /**
     * Get specific completed session result
     */
    async getSessionResult(userId, sessionId) {
        const session = await GameSession.findOne({ sessionId, userId });
        if (!session) return null;
        return session;
    }

    /**
     * Get summary gaming statistics for user
     */
    async getUserGameStats(userId) {
        const sessions = await GameSession.find({ userId, status: 'COMPLETED' });

        let totalGames = sessions.length;
        let totalXPEarned = 0;
        let bestStreak = 0;
        let speedCount = 0;
        let accuracyCount = 0;

        sessions.forEach(s => {
            totalXPEarned += (s.netXP || 0);
            if (s.maxStreak > bestStreak) bestStreak = s.maxStreak;
            if (s.gameSection === 'speedChallenge') speedCount++;
            if (s.gameSection === 'accuracyRush') accuracyCount++;
        });

        return {
            totalGames,
            totalXPEarned,
            bestStreak,
            speedCount,
            accuracyCount
        };
    }

    /**
     * Get user game history
     */
    async getUserGameHistory(userId, limit = 20) {
        return GameSession.find({ userId, status: 'COMPLETED' })
            .sort({ completedAt: -1 })
            .limit(limit);
    }
}

module.exports = new GameService();
