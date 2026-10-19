// backend/config/gameConfig.js

const GAME_SECTIONS = {
    speedChallenge: {
        key: 'speedChallenge',
        name: 'Speed Challenge',
        badge: 'Time Attack',
        description: 'Test your rapid problem-solving skills under time pressure. Earn bonus XP for quick answers!',
        icon: 'fa-bolt',
        color: '#00f2fe',
        bgGradient: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(4, 90, 138, 0.3) 100%)',
        borderColor: 'rgba(0, 242, 254, 0.4)',
        levels: {
            2: {
                difficultyLevel: 2,
                difficultyName: 'Intermediate',
                questionCount: 15,
                timeLimitSec: 450, // 7.5 minutes
                perQuestionTimeSec: 30,
                baseXpPerCorrect: 15,
                penaltyPerWrong: 2,
                penaltyPerSkip: 1,
                speedBonusMaxXP: 5
            },
            3: {
                difficultyLevel: 3,
                difficultyName: 'Advanced',
                questionCount: 20,
                timeLimitSec: 500, // 8.33 minutes
                perQuestionTimeSec: 25,
                baseXpPerCorrect: 25,
                penaltyPerWrong: 3,
                penaltyPerSkip: 2,
                speedBonusMaxXP: 10
            }
        }
    },
    accuracyRush: {
        key: 'accuracyRush',
        name: 'Accuracy Rush',
        badge: 'Streak Master',
        description: 'Focus on precision and build consecutive correct answer streaks to unlock massive XP bonuses!',
        icon: 'fa-bullseye',
        color: '#00e676',
        bgGradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(1, 87, 155, 0.3) 100%)',
        borderColor: 'rgba(0, 230, 118, 0.4)',
        levels: {
            2: {
                difficultyLevel: 2,
                difficultyName: 'Intermediate',
                questionCount: 15,
                timeLimitSec: 600, // 10 minutes
                perQuestionTimeSec: 40,
                baseXpPerCorrect: 15,
                penaltyPerWrong: 2,
                penaltyPerSkip: 1,
                streakThreshold: 3,
                streakBonusXP: 5
            },
            3: {
                difficultyLevel: 3,
                difficultyName: 'Advanced',
                questionCount: 20,
                timeLimitSec: 700, // 11.66 minutes
                perQuestionTimeSec: 35,
                baseXpPerCorrect: 25,
                penaltyPerWrong: 3,
                penaltyPerSkip: 2,
                streakThreshold: 3,
                streakBonusXP: 10
            }
        }
    }
};

function normalizeGameSection(gameSection) {
    if (!gameSection) return null;
    const str = String(gameSection).trim();
    if (GAME_SECTIONS[str]) return str;
    const lower = str.toLowerCase().replace(/[-_\s]/g, '');
    if (lower === 'speedchallenge' || lower === 'speed') return 'speedChallenge';
    if (lower === 'accuracyrush' || lower === 'accuracy') return 'accuracyRush';
    return null;
}

function parseDifficultyLevel(difficulty) {
    if (typeof difficulty === 'string') {
        const d = difficulty.toLowerCase().trim();
        if (d === 'intermediate' || d === 'medium' || d === '2') return 2;
        if (d === 'advanced' || d === 'hard' || d === '3') return 3;
    }
    const num = parseInt(difficulty);
    if (num === 2 || num === 3) return num;
    return 2;
}

function getGameConfig(gameSection, difficulty) {
    const normKey = normalizeGameSection(gameSection);
    const sec = GAME_SECTIONS[normKey];
    if (!sec) return null;
    const levelNum = parseDifficultyLevel(difficulty);
    const lvl = sec.levels[levelNum];
    if (!lvl) return null;
    return {
        section: sec,
        level: lvl
    };
}

function isValidGameSection(gameSection) {
    return Boolean(normalizeGameSection(gameSection));
}

function isValidDifficulty(difficulty) {
    if (typeof difficulty === 'string') {
        const d = difficulty.toLowerCase().trim();
        if (['intermediate', 'advanced', 'medium', 'hard', '2', '3'].includes(d)) return true;
    }
    const num = parseInt(difficulty);
    return num === 2 || num === 3;
}

module.exports = {
    GAME_SECTIONS,
    normalizeGameSection,
    parseDifficultyLevel,
    getGameConfig,
    isValidGameSection,
    isValidDifficulty
};
