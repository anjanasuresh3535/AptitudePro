// backend/services/PlacementService.js
//
// Level-unlock and configuration-driven question-pool retrieval logic for AptitudePro.
// Level Unlocking is computed from Result history for the specified track.
// Quiz Difficulty (1, 2, 3) is strictly decoupled from User XP Level.

const Question = require('../models/Question');
const Result = require('../models/Result');
const { 
    UNLOCK_ACCURACY_THRESHOLD, 
    getCompanyBySlug, 
    getQuestionCount, 
    getSchoolDistribution 
} = require('../config/placementConfig');

/**
 * Check unlocked levels for a specific section or placement track
 */
async function getUnlockedLevels(userId, sectionKey) {
    const unlocked = { 1: true, 2: false, 3: false };

    const passedLevel1 = await Result.exists({
        userId,
        section: sectionKey,
        difficulty: 1,
        accuracy: { $gte: UNLOCK_ACCURACY_THRESHOLD }
    });
    if (passedLevel1) unlocked[2] = true;

    const passedLevel2 = await Result.exists({
        userId,
        section: sectionKey,
        difficulty: 2,
        accuracy: { $gte: UNLOCK_ACCURACY_THRESHOLD }
    });
    if (passedLevel2) unlocked[3] = true;

    return unlocked;
}

async function isLevelUnlocked(userId, sectionKey, level) {
    if (level <= 1) return true;
    const unlocked = await getUnlockedLevels(userId, sectionKey);
    return !!unlocked[level];
}

/**
 * GENUINE QUESTION POOL SELECTION LOGIC
 *
 * Configurable question counts & subject distributions strictly enforced.
 */

// 1. SCHOOL APTITUDE QUESTION POOL
async function getSchoolQuestions(difficultyLevel, userId = null) {
    const diff = Number(difficultyLevel) || 1;
    const targetCount = getQuestionCount('school', 'general', diff);
    const dist = getSchoolDistribution(diff);

    let seenObjectIds = [];
    if (userId) {
        const seenIds = await getAttemptedQuestionIds(userId, { learningPath: 'school' });
        const mongoose = require('mongoose');
        seenObjectIds = seenIds.map(id => {
            try { return new mongoose.Types.ObjectId(id.toString()); } catch(e) { return null; }
        }).filter(Boolean);
    }

    async function sampleWithRepeatAvoidance(baseMatch, count) {
        if (!seenObjectIds.length) {
            return await Question.aggregate([
                { $match: baseMatch },
                { $sample: { size: count } }
            ]);
        }
        let docs = await Question.aggregate([
            { $match: { ...baseMatch, _id: { $nin: seenObjectIds } } },
            { $sample: { size: count } }
        ]);
        if (docs.length < count) {
            const needed = count - docs.length;
            const fetchedIds = docs.map(d => d._id);
            const fallbackDocs = await Question.aggregate([
                { $match: { ...baseMatch, _id: { $nin: fetchedIds } } },
                { $sample: { size: needed } }
            ]);
            docs = [...docs, ...fallbackDocs];
        }
        return docs;
    }

    // Fetch Maths questions for School at specified level
    const mathsMatch = { 
        learningPath: 'school', 
        difficultyLevel: diff,
        $or: [{ section: 'Maths' }, { subject: /Math/i }]
    };
    const mathsDocs = await sampleWithRepeatAvoidance(mathsMatch, dist.Maths);

    // Fetch Logical Reasoning questions for School at specified level
    const logicalMatch = { 
        learningPath: 'school', 
        difficultyLevel: diff,
        $or: [{ section: 'Logical' }, { subject: /Reasoning|Logical/i }]
    };
    const logicalDocs = await sampleWithRepeatAvoidance(logicalMatch, dist.Logical);

    // Fetch English questions for School at specified level
    const englishMatch = { 
        learningPath: 'school', 
        difficultyLevel: diff,
        $or: [{ section: 'English' }, { subject: /Verbal|English/i }]
    };
    const englishDocs = await sampleWithRepeatAvoidance(englishMatch, dist.English);

    const totalFetched = mathsDocs.length + logicalDocs.length + englishDocs.length;

    // Strict check: Must have enough questions matching the exact subject distribution
    if (mathsDocs.length < dist.Maths || logicalDocs.length < dist.Logical || englishDocs.length < dist.English) {
        console.warn(`[PlacementService] Insufficient school pool for Level ${diff}. Needed: M:${dist.Maths}, L:${dist.Logical}, E:${dist.English}. Got: M:${mathsDocs.length}, L:${logicalDocs.length}, E:${englishDocs.length}`);
        return {
            questions: [],
            isFallback: false,
            insufficient: true,
            totalAvailable: totalFetched
        };
    }

    // Combine and shuffle final questions
    const combined = [...mathsDocs, ...logicalDocs, ...englishDocs];
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return {
        questions: combined,
        isFallback: false,
        totalAvailable: combined.length
    };
}

// 2. GENERAL COLLEGE PLACEMENT QUESTION POOL
async function getGeneralCollegeQuestions(difficultyLevel, userId = null) {
    const diff = Number(difficultyLevel) || 1;
    const targetCount = getQuestionCount('college', 'general', diff);

    const baseMatch = { 
        learningPath: 'college', 
        placementType: 'general',
        difficultyLevel: diff 
    };

    let questions = [];
    let seenObjectIds = [];
    if (userId) {
        const seenIds = await getAttemptedQuestionIds(userId, { learningPath: 'college', placementType: 'general' });
        const mongoose = require('mongoose');
        seenObjectIds = seenIds.map(id => {
            try { return new mongoose.Types.ObjectId(id.toString()); } catch(e) { return null; }
        }).filter(Boolean);
    }

    if (seenObjectIds.length) {
        questions = await Question.aggregate([
            { $match: { ...baseMatch, _id: { $nin: seenObjectIds } } },
            { $sample: { size: targetCount } }
        ]);
        if (questions.length < targetCount) {
            const needed = targetCount - questions.length;
            const fetchedIds = questions.map(q => q._id);
            const fallback = await Question.aggregate([
                { $match: { ...baseMatch, _id: { $nin: fetchedIds } } },
                { $sample: { size: needed } }
            ]);
            questions = [...questions, ...fallback];
        }
    } else {
        questions = await Question.aggregate([
            { $match: baseMatch },
            { $sample: { size: targetCount } }
        ]);
    }

    if (questions.length < targetCount) {
        console.warn(`[PlacementService] Insufficient general college pool for Level ${diff}. Needed ${targetCount}, got ${questions.length}`);
        return {
            questions: [],
            isFallback: false,
            insufficient: true,
            totalAvailable: questions.length
        };
    }

    return {
        questions,
        isFallback: false,
        totalAvailable: questions.length
    };
}

// 3. COMPANY PRACTICE QUESTION POOL (STRICT COMPANY ISOLATION - NO FALLBACKS)
async function getCompanyQuestions(companySlugOrName, difficultyLevel, userId = null) {
    const diff = Number(difficultyLevel) || 1;
    const companyObj = getCompanyBySlug(companySlugOrName);
    const companyName = companyObj ? companyObj.name : companySlugOrName;
    const targetCount = getQuestionCount('college', 'company', diff);

    const baseMatch = { 
        learningPath: 'college', 
        placementType: 'company',
        company: companyName,
        difficultyLevel: diff 
    };

    let questions = [];
    let seenObjectIds = [];
    if (userId) {
        const seenIds = await getAttemptedQuestionIds(userId, companyName);
        const mongoose = require('mongoose');
        seenObjectIds = seenIds.map(id => {
            try { return new mongoose.Types.ObjectId(id.toString()); } catch(e) { return null; }
        }).filter(Boolean);
    }

    if (seenObjectIds.length) {
        questions = await Question.aggregate([
            { $match: { ...baseMatch, _id: { $nin: seenObjectIds } } },
            { $sample: { size: targetCount } }
        ]);
        if (questions.length < targetCount) {
            const needed = targetCount - questions.length;
            const fetchedIds = questions.map(q => q._id);
            const fallback = await Question.aggregate([
                { $match: { ...baseMatch, _id: { $nin: fetchedIds } } },
                { $sample: { size: needed } }
            ]);
            questions = [...questions, ...fallback];
        }
    } else {
        questions = await Question.aggregate([
            { $match: baseMatch },
            { $sample: { size: targetCount } }
        ]);
    }

    if (questions.length < targetCount) {
        console.warn(`[PlacementService] Insufficient company pool for ${companyName} Level ${diff}. Needed ${targetCount}, got ${questions.length}`);
        return {
            questions: [],
            isFallback: false,
            insufficient: true,
            companyCount: questions.length,
            totalAvailable: questions.length
        };
    }

    return {
        questions,
        isFallback: false,
        companyCount: questions.length,
        totalAvailable: questions.length
    };
}

/**
 * Helper to fetch previously attempted question IDs for a user to enforce repeat avoidance.
 */
async function getAttemptedQuestionIds(userId, filter = 'TCS') {
    if (!userId) return [];
    let query = { userId };
    if (typeof filter === 'string') {
        query.company = filter;
    } else if (filter && typeof filter === 'object') {
        Object.assign(query, filter);
    }
    const results = await Result.find(query).select('answers.questionId').sort({ createdAt: -1 }).limit(10).lean();
    const ids = new Set();
    results.forEach(r => {
        (r.answers || []).forEach(a => {
            if (a.questionId) ids.add(a.questionId.toString());
        });
    });
    return Array.from(ids);
}

/**
 * Dedicated TCS NQT Question Selection Engine with Repeat Avoidance & Topic Practice.
 */
async function getTCSQuestions({ userId = null, difficultyLevel = null, topic = null, section = null, questionType = null, count = 25, excludeIds = [] } = {}) {
    const matchFilter = {
        company: 'TCS',
        active: { $ne: false }
    };

    if (difficultyLevel) {
        matchFilter.difficultyLevel = Number(difficultyLevel);
    }

    if (questionType) {
        matchFilter.questionType = questionType;
    }

    if (section) {
        let sectionRegex = section;
        if (typeof section === 'string') {
            if (/math|quant|num/i.test(section)) {
                sectionRegex = /Maths|Quant|Numerical/i;
                matchFilter.$and = [
                    {
                        $or: [
                            { section: sectionRegex },
                            { subject: sectionRegex },
                            { topic: sectionRegex },
                            { category: sectionRegex },
                            { level: sectionRegex }
                        ]
                    },
                    {
                        section: { $not: /Logical/i },
                        subject: { $not: /Logical|Reasoning|\bDI\b|Data Interpretation/i },
                        topic: { $not: /Logical|Reasoning|\bDI\b|Data Interpretation/i }
                    }
                ];
            } else if (/eng|verb/i.test(section)) {
                sectionRegex = /English|Verbal/i;
                matchFilter.$or = [
                    { section: sectionRegex },
                    { subject: sectionRegex },
                    { topic: sectionRegex },
                    { category: sectionRegex },
                    { level: sectionRegex }
                ];
            } else if (/logi|reas|di/i.test(section)) {
                sectionRegex = /Logical|Reasoning|\bDI\b|Data Interpretation/i;
                matchFilter.$or = [
                    { section: sectionRegex },
                    { subject: sectionRegex },
                    { topic: sectionRegex },
                    { category: sectionRegex },
                    { level: sectionRegex }
                ];
            } else if (/prog|code/i.test(section)) {
                sectionRegex = /Programming|Coding/i;
                matchFilter.$or = [
                    { section: sectionRegex },
                    { subject: sectionRegex },
                    { topic: sectionRegex },
                    { category: sectionRegex },
                    { level: sectionRegex }
                ];
            } else {
                sectionRegex = new RegExp(section, 'i');
                matchFilter.$or = [
                    { section: sectionRegex },
                    { subject: sectionRegex },
                    { topic: sectionRegex },
                    { category: sectionRegex },
                    { level: sectionRegex }
                ];
            }
        } else {
            matchFilter.$or = [
                { section: sectionRegex },
                { subject: sectionRegex },
                { topic: sectionRegex },
                { category: sectionRegex },
                { level: sectionRegex }
            ];
        }
    }

    if (topic) {
        const topicRegex = new RegExp(topic, 'i');
        matchFilter.$or = [{ topic: topicRegex }, { subtopic: topicRegex }, { subject: topicRegex }, { category: topicRegex }];
    }

    // Step 1: Collect previously attempted question IDs for repeat avoidance
    let seenIds = [...excludeIds];
    if (userId) {
        const attemptedIds = await getAttemptedQuestionIds(userId, 'TCS');
        seenIds = Array.from(new Set([...seenIds, ...attemptedIds]));
    }

    const mongoose = require('mongoose');
    const seenObjectIds = seenIds.map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch(e) { return null; }
    }).filter(Boolean);

    const explicitExcludeObjectIds = (excludeIds || []).map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch(e) { return null; }
    }).filter(Boolean);

    // Query unseen questions first
    const unseenFilter = { ...matchFilter, _id: { $nin: seenObjectIds } };
    let questions = await Question.aggregate([
        { $match: unseenFilter },
        { $sample: { size: count } }
    ]);

    // If unseen questions are fewer than requested, sample remaining from available section pool
    if (questions.length < count) {
        const remainingNeeded = count - questions.length;
        const fetchedUnseenIds = questions.map(q => q._id);
        const fallbackExclude = [...explicitExcludeObjectIds, ...fetchedUnseenIds];

        const fallbackQuestions = await Question.aggregate([
            { $match: { ...matchFilter, _id: { $nin: fallbackExclude } } },
            { $sample: { size: remainingNeeded } }
        ]);

        questions = [...questions, ...fallbackQuestions];
    }

    return {
        questions,
        insufficient: questions.length < count,
        totalAvailable: questions.length
    };
}

function cleanQuestionText(text) {
    if (!text || typeof text !== 'string') return text || '';
    return text.replace(/^\s*\[(?:TCS|Infosys|Wipro|Accenture|Cognizant|Capgemini|HCL|Mindtree|Tech Mahindra|Placement|Foundation|Advanced|Intermediate|Practice|Pattern|#\d+|[A-Z0-9_\s#]+)[^\]]*\]\s*/i, '').trim();
}

/**
 * Assemble TCS NQT Foundation Mock (20 Numerical, 25 Verbal, 20 Reasoning = 65 Qs)
 */
async function getTCSFoundationMockQuestions(userId = null) {
    const { TCS_FOUNDATION_MOCK_CONFIG } = require('../config/tcsConfig');
    const dist = TCS_FOUNDATION_MOCK_CONFIG.distribution;

    const numRes = await getTCSQuestions({ userId, section: 'Maths', questionType: 'mcq', count: dist.numericalAbility });
    const numQuestions = numRes.questions || [];
    const numIds = numQuestions.map(q => q._id);

    const verbRes = await getTCSQuestions({ userId, section: 'English', questionType: 'mcq', count: dist.verbalAbility, excludeIds: numIds });
    const verbQuestions = verbRes.questions || [];
    const verbIds = verbQuestions.map(q => q._id);

    const reasRes = await getTCSQuestions({ userId, section: 'Logical', questionType: 'mcq', count: dist.reasoningAbility, excludeIds: [...numIds, ...verbIds] });
    const reasQuestions = reasRes.questions || [];

    const numCount = numQuestions.length;
    const verbCount = verbQuestions.length;
    const reasCount = reasQuestions.length;

    if (numCount < dist.numericalAbility || verbCount < dist.verbalAbility || reasCount < dist.reasoningAbility) {
        console.warn(`[PlacementService] Shortage in TCS Foundation question bank. Got N:${numCount}/${dist.numericalAbility}, V:${verbCount}/${dist.verbalAbility}, R:${reasCount}/${dist.reasoningAbility}`);
        return {
            questions: [],
            insufficient: true,
            errorMessage: `The TCS Foundation question bank has a shortage. Needed ${dist.numericalAbility} Numerical, ${dist.verbalAbility} Verbal, ${dist.reasoningAbility} Reasoning. Found Numerical: ${numCount}, Verbal: ${verbCount}, Reasoning: ${reasCount}. Please import more TCS questions.`
        };
    }

    const combined = [...numQuestions, ...verbQuestions, ...reasQuestions];
    const cleaned = combined.map(q => {
        const doc = q.toObject ? q.toObject() : { ...q };
        if (doc.question) doc.question = cleanQuestionText(doc.question);
        return doc;
    });

    return {
        questions: cleaned,
        isFallback: false,
        totalAvailable: cleaned.length
    };
}

/**
 * Assemble TCS NQT Advanced Mock (15 Adv Quant & Reasoning, 2 Adv Coding = 17 Qs)
 */
async function getTCSAdvancedMockQuestions(userId = null) {
    const { TCS_ADVANCED_MOCK_CONFIG } = require('../config/tcsConfig');
    const dist = TCS_ADVANCED_MOCK_CONFIG.distribution;

    const codingMatch = {
        company: 'TCS',
        active: { $ne: false },
        $or: [
            { questionType: 'coding' },
            { section: 'Programming' },
            { topic: /Coding/i }
        ]
    };
    const codingDocs = await Question.aggregate([
        { $match: codingMatch },
        { $sample: { size: dist.advancedCoding } }
    ]);
    const codingIds = codingDocs.map(q => q._id);

    const advQuantRes = await getTCSQuestions({
        userId,
        difficultyLevel: 2,
        count: dist.advancedQuantReasoning,
        excludeIds: codingIds
    });
    const advQuantQuestions = advQuantRes.questions || [];

    if (advQuantQuestions.length < dist.advancedQuantReasoning || codingDocs.length < dist.advancedCoding) {
        console.warn(`[PlacementService] Shortage in TCS Advanced question bank. Got AdvQuant:${advQuantQuestions.length}/${dist.advancedQuantReasoning}, Coding:${codingDocs.length}/${dist.advancedCoding}`);
        return {
            questions: [],
            insufficient: true,
            errorMessage: `The TCS Advanced question bank has a shortage. Needed ${dist.advancedQuantReasoning} Adv Quant, ${dist.advancedCoding} Coding problems. Found Adv Quant: ${advQuantQuestions.length}, Coding: ${codingDocs.length}. Please import more TCS questions.`
        };
    }

    const combined = [...advQuantQuestions, ...codingDocs];
    const cleaned = combined.map(q => {
        const doc = q.toObject ? q.toObject() : { ...q };
        if (doc.question) doc.question = cleanQuestionText(doc.question);
        return doc;
    });

    return {
        questions: cleaned,
        isFallback: false,
        totalAvailable: cleaned.length
    };
}

/**
 * Assemble Full Integrated TCS NQT Mock Assessment (65 Foundation + 17 Advanced = 82 Qs)
 */
async function getTCSIntegratedMockQuestions(userId = null) {
    const fRes = await getTCSFoundationMockQuestions(userId);
    if (fRes.insufficient) return fRes;

    const fIds = fRes.questions.map(q => q._id);

    const advQuantRes = await getTCSQuestions({ userId, difficultyLevel: 2, count: 15, excludeIds: fIds });
    const advQuantQuestions = advQuantRes.questions || [];
    const advQuantIds = advQuantQuestions.map(q => q._id);

    const codingMatch = {
        company: 'TCS',
        active: { $ne: false },
        _id: { $nin: [...fIds, ...advQuantIds] },
        $or: [
            { questionType: 'coding' },
            { section: 'Programming' },
            { topic: /Coding/i },
            { difficultyLevel: 3 }
        ]
    };
    const codingDocs = await Question.aggregate([
        { $match: codingMatch },
        { $sample: { size: 2 } }
    ]);

    if (advQuantQuestions.length < 15 || codingDocs.length < 2) {
        return {
            questions: [],
            insufficient: true,
            errorMessage: 'Shortage in question bank for full TCS NQT Integrated Mock Assessment. Requires 82 total questions (65 Foundation + 17 Advanced).'
        };
    }

    const combined = [...fRes.questions, ...advQuantQuestions, ...codingDocs];
    const cleaned = combined.map(q => {
        const doc = q.toObject ? q.toObject() : { ...q };
        if (doc.question) doc.question = cleanQuestionText(doc.question);
        return doc;
    });

    return {
        questions: cleaned,
        isFallback: false,
        totalAvailable: cleaned.length
    };
}

/**
 * Section specific practice questions for TCS
 */
async function getTCSSectionPracticeQuestions(userId = null, sectionKey = 'numericalAbility') {
    const { getSectionConfig } = require('../config/tcsConfig');
    const secConfig = getSectionConfig(sectionKey);

    const count = secConfig ? secConfig.questionCount : 20;
    let sectionName = 'Maths';
    if (sectionKey === 'numericalAbility') sectionName = 'Maths';
    else if (sectionKey === 'reasoningAbility') sectionName = 'Logical';
    else if (sectionKey === 'verbalAbility') sectionName = 'English';
    else if (sectionKey === 'advancedQuantReasoning') sectionName = 'Maths';
    else if (sectionKey === 'advancedCoding') sectionName = 'Programming';

    // For foundation sections, do not restrict by difficultyLevel — the DB has mixed difficulty
    // questions and restricting to level 1 alone yields fewer than required.
    // For advancedQuantReasoning use level 2. For advancedCoding, no level filter (questions are level 3).
    let diff = null;
    if (sectionKey === 'advancedQuantReasoning') {
        diff = 2;
    }
    // advancedCoding: leave diff = null so coding questions (difficultyLevel: 3) are included

    const res = await getTCSQuestions({ userId, section: sectionName, difficultyLevel: diff, count });
    if (res.questions) {
        res.questions = res.questions.map(q => {
            const doc = q.toObject ? q.toObject() : { ...q };
            if (doc.question) doc.question = cleanQuestionText(doc.question);
            return doc;
        });
    }
    return res;
}

// ============================================================
// INFOSYS InfyTQ QUESTION SELECTION ENGINE
// ============================================================

/**
 * Core Infosys question query with section regex matching and
 * unseen-first repeat avoidance.  No difficulty filter by default.
 */
async function getInfosysQuestions({ userId = null, sectionRegex = null, difficultyLevel = null, count = 10, excludeIds = [] } = {}) {
    const mongoose = require('mongoose');

    const matchFilter = { company: 'Infosys', active: { $ne: false } };
    if (difficultyLevel) matchFilter.difficultyLevel = Number(difficultyLevel);
    if (sectionRegex) {
        matchFilter.$or = [
            { section:  sectionRegex },
            { subject:  sectionRegex },
            { topic:    sectionRegex },
            { category: sectionRegex }
        ];
    }

    let seenIds = [...excludeIds];
    if (userId) {
        const attemptedIds = await getAttemptedQuestionIds(userId, 'Infosys');
        seenIds = Array.from(new Set([...seenIds, ...attemptedIds]));
    }

    const seenObjectIds = seenIds.map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch (e) { return null; }
    }).filter(Boolean);

    const explicitExcludeObjectIds = (excludeIds || []).map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch (e) { return null; }
    }).filter(Boolean);

    // Unseen-first query
    let questions = await Question.aggregate([
        { $match: { ...matchFilter, _id: { $nin: seenObjectIds } } },
        { $sample: { size: count } }
    ]);

    // Backfill from seen pool if needed
    if (questions.length < count) {
        const remaining  = count - questions.length;
        const fetchedIds = questions.map(q => q._id);
        const fallback   = await Question.aggregate([
            { $match: { ...matchFilter, _id: { $nin: [...explicitExcludeObjectIds, ...fetchedIds] } } },
            { $sample: { size: remaining } }
        ]);
        questions = [...questions, ...fallback];
    }

    return { questions, insufficient: questions.length < count, totalAvailable: questions.length };
}

/**
 * Assemble a full 60-question Infosys InfyTQ mock.
 * Tech:10, Logical:15, Verbal:20, PseudoCode:5, Puzzle:4, Grammar:5, Writing:1
 */
async function getInfosysMockQuestions(userId = null) {
    const { INFOSYS_SECTIONS, INFOSYS_MOCK_CONFIG } = require('../config/infosysConfig');
    const dist = INFOSYS_MOCK_CONFIG.distribution;

    let allQuestions = [];
    let excludeIds   = [];
    const shortages  = [];

    for (const [key, needed] of Object.entries(dist)) {
        const secConfig = INFOSYS_SECTIONS[key];
        const res = await getInfosysQuestions({
            userId,
            sectionRegex: secConfig.sectionRegex,
            count: needed,
            excludeIds
        });

        if (res.questions.length < needed) {
            shortages.push(`${secConfig.name}: need ${needed}, got ${res.questions.length}`);
        }
        allQuestions = [...allQuestions, ...res.questions];
        excludeIds   = [...excludeIds, ...res.questions.map(q => q._id.toString())];
    }

    if (shortages.length > 0) {
        console.warn(`[PlacementService] Infosys mock shortage: ${shortages.join(' | ')}`);
        return {
            questions: allQuestions,
            insufficient: true,
            errorMessage: `Infosys question bank shortage — ${shortages.join(', ')}. Please import more questions.`
        };
    }

    return { questions: allQuestions, insufficient: false, totalAvailable: allQuestions.length };
}

/**
 * Return questions for one Infosys section (section practice mode).
 * Uses full difficulty pool (no level filter).
 */
async function getInfosysSectionPracticeQuestions(userId = null, sectionKey = 'technicalAbility') {
    const { getSectionConfig } = require('../config/infosysConfig');
    const secConfig = getSectionConfig(sectionKey);
    if (!secConfig) {
        return { questions: [], insufficient: true, errorMessage: `Unknown Infosys section: ${sectionKey}` };
    }

    const res = await getInfosysQuestions({
        userId,
        sectionRegex: secConfig.sectionRegex,
        count: secConfig.questionCount
    });

    if (res.questions) {
        res.questions = res.questions.map(q => (q.toObject ? q.toObject() : { ...q }));
    }
    return res;
}

// ============================================================
// WIPRO QUESTION SELECTION ENGINE
// ============================================================

// Accenture has a deliberately configurable, company-isolated pool. Selection
// is unseen-first and falls back to older questions when the fresh pool runs out.
function getAccentureQuestionFilter(sectionKey) {
    const topicMap = {
        cognitive: ['Cognitive', 'Critical Thinking', 'Abstract Reasoning', 'Verbal Ability', 'Numerical Reasoning', 'Quantitative Aptitude', 'Logical Reasoning', 'Data Interpretation & Reasoning'],
        technical: ['Technical', 'Pseudocode', 'Programming Fundamentals', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'Cloud Computing', 'Cybersecurity', 'Software Engineering'],
        coding: ['Coding'], communication: ['Communication', 'Email Writing'], 'communication-objective': ['Communication', 'Workplace Communication'], interview: ['Interview']
    };
    const topics = topicMap[sectionKey];
    if (!topics) return null;
    const match = { company: 'Accenture', active: { $ne: false } };
    if (sectionKey === 'cognitive') {
        match.questionType = { $in: ['mcq', null] };
        match.$or = [
            { subject: { $in: topics } }, { topic: { $in: topics } }, { category: { $in: topics } },
            { category: /Accenture (?:Quant|Logical|DI|Pattern|Verbal)/i }
        ];
    } else if (sectionKey === 'coding') {
        match.questionType = 'coding';
        match.$or = [{ topic: { $exists: true, $ne: '' } }, { subject: 'Coding' }];
    } else if (sectionKey === 'communication') {
        match.questionType = 'free_response';
        match.$or = [{ topic: 'Email Writing' }, { subject: 'Communication' }];
    } else if (sectionKey === 'communication-objective') {
        match.questionType = { $in: ['mcq', null] };
        match.$or = [{ topic: { $in: topics } }, { subject: { $in: topics } }, { category: { $in: topics } }];
    } else if (sectionKey === 'interview') {
        match.questionType = 'interview_prompt';
        match.subject = 'Interview Preparation';
    } else {
        match.questionType = 'mcq';
        match.$or = [{ topic: { $in: topics } }, { subject: { $in: topics } }, { category: { $in: topics } }];
    }
    return match;
}

async function countAccentureQuestions(sectionKey) {
    if (sectionKey === 'communication') return (await countAccentureQuestions('communication-objective')) + (await Question.countDocuments({ company: 'Accenture', active: { $ne: false }, questionType: 'free_response', topic: 'Email Writing' }));
    const match = getAccentureQuestionFilter(sectionKey);
    return match ? Question.countDocuments(match) : 0;
}

async function getAccentureQuestions({ userId = null, sectionKey, count = 10 } = {}) {
    const mongoose = require('mongoose');
    const match = getAccentureQuestionFilter(sectionKey);
    if (!match) return { questions: [], insufficient: true, totalAvailable: 0 };
    let attempted = userId ? await getAttemptedQuestionIds(userId, 'Accenture') : [];
    if (userId && sectionKey === 'coding') {
        const CodingSubmission = require('../models/CodingSubmission');
        const saved = await CodingSubmission.find({ userId, company: 'Accenture' }).distinct('problems.questionId');
        attempted = Array.from(new Set([...attempted, ...saved.map(id => id.toString())]));
    }
    if (userId && ['communication', 'interview'].includes(sectionKey)) {
        const Response = require('../models/AccentureResponse');
        const saved = await Response.find({ userId, section: sectionKey === 'interview' ? 'Interview Preparation' : 'Communication', evaluationStatus: 'not-configured' }).distinct('taskId');
        attempted = Array.from(new Set([...attempted, ...saved.map(id => id.toString())]));
    }
    const ids = attempted.map(id => { try { return new mongoose.Types.ObjectId(id.toString()); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([{ $match: { ...match, _id: { $nin: ids } } }, { $sample: { size: count } }]);
    if (questions.length < count) {
        const freshIds = questions.map(q => q._id);
        const remaining = await Question.aggregate([{ $match: { ...match, _id: { $nin: freshIds } } }, { $sample: { size: count - questions.length } }]);
        questions = questions.concat(remaining);
    }
    const totalAvailable = await Question.countDocuments(match);
    return { questions, insufficient: questions.length < count, totalAvailable };
}

// Cognizant's pools use the same company-isolated, unseen-first selection rules.
// Questions can repeat only after the unseen pool is exhausted; the random
// sample stage guarantees no duplicate IDs inside one attempt.
function getCognizantQuestionFilter(sectionKey) {
    const { COGNIZANT_SECTIONS, COGNIZANT_QUIZ_KEYS } = require('../config/cognizantConfig');
    const cfg = COGNIZANT_SECTIONS[sectionKey];
    if (!cfg) return null;
    const match = { company: 'Cognizant', active: { $ne: false } };
    if (sectionKey === 'coding') match.questionType = 'coding';
    else if (sectionKey === 'sql') match.questionType = 'sql';
    else if (sectionKey === 'communication') match.questionType = 'free_response';
    else if (sectionKey === 'interview') match.questionType = 'interview_prompt';
    else if (COGNIZANT_QUIZ_KEYS.includes(sectionKey)) {
        match.questionType = 'mcq';
        match.$or = [
            { topic: { $in: cfg.topics } }, { subject: { $in: cfg.topics } },
            { category: { $in: cfg.topics } },
            { category: `Cognizant ${sectionKey === 'aptitude' ? 'Aptitude' : sectionKey === 'technical' ? 'Technical' : 'Communication'}` }
        ];
    } else return null;
    return match;
}

async function countCognizantQuestions(sectionKey) {
    if (sectionKey === 'communication') {
        return Question.countDocuments({ company: 'Cognizant', active: { $ne: false }, questionType: 'free_response' });
    }
    const match = getCognizantQuestionFilter(sectionKey);
    return match ? Question.countDocuments(match) : 0;
}

function getCapgeminiQuestionFilter(sectionKey) {
    const { CAPGEMINI_SECTIONS } = require('../config/capgeminiConfig');
    const cfg = CAPGEMINI_SECTIONS[sectionKey];
    if (!cfg || !cfg.subjects) return null;
    return {
        company: 'Capgemini', active: { $ne: false },
        questionType: { $in: ['mcq', null] },
        $or: [
            { subject: { $in: cfg.subjects } },
            { topic: { $in: cfg.subjects } },
            { category: { $in: cfg.subjects } }
        ]
    };
}

async function countCapgeminiQuestions(sectionKey) {
    const filter = getCapgeminiQuestionFilter(sectionKey);
    return filter ? Question.countDocuments(filter) : 0;
}

async function getCapgeminiQuestions({ userId = null, sectionKey, count = 10 } = {}) {
    const mongoose = require('mongoose');
    const filter = getCapgeminiQuestionFilter(sectionKey);
    if (!filter) return { questions: [], insufficient: true, totalAvailable: 0 };
    let attempted = userId ? await getAttemptedQuestionIds(userId, 'Capgemini') : [];
    const ids = attempted.map(id => { try { return new mongoose.Types.ObjectId(String(id)); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([
        { $match: { ...filter, _id: { $nin: ids } } }, { $sample: { size: Math.max(1, count) } }
    ]);
    if (questions.length < count) {
        const selected = questions.map(q => q._id);
        const rest = await Question.aggregate([
            { $match: { ...filter, _id: { $nin: selected } } }, { $sample: { size: count - questions.length } }
        ]);
        questions = questions.concat(rest);
    }
    return { questions, insufficient: questions.length < count, totalAvailable: await Question.countDocuments(filter) };
}

function getHCLTechQuestionFilter(sectionKey) {
    const { HCLTECH_SECTIONS } = require('../config/hcltechConfig');
    const cfg = HCLTECH_SECTIONS[sectionKey];
    if (!cfg?.category) return null;
    return { company: 'HCLTech', active: { $ne: false }, questionType: { $in: ['mcq', null] }, category: cfg.category };
}

async function countHCLTechQuestions(sectionKey) {
    const filter = getHCLTechQuestionFilter(sectionKey);
    return filter ? Question.countDocuments(filter) : sectionKey === 'coding'
        ? Question.countDocuments({ company: 'HCLTech', active: { $ne: false }, questionType: 'coding' })
        : 0;
}

async function getHCLTechQuestions({ userId = null, sectionKey, count = 15 } = {}) {
    const mongoose = require('mongoose'), filter = getHCLTechQuestionFilter(sectionKey);
    if (!filter) return { questions: [], insufficient: true, totalAvailable: 0 };
    const attempted = userId ? await getAttemptedQuestionIds(userId, 'HCLTech') : [];
    const ids = attempted.map(id => { try { return new mongoose.Types.ObjectId(String(id)); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([{ $match: { ...filter, _id: { $nin: ids } } }, { $sample: { size: Math.max(1, count) } }]);
    if (questions.length < count) {
        const selected = questions.map(question => question._id);
        const rest = await Question.aggregate([{ $match: { ...filter, _id: { $nin: selected } } }, { $sample: { size: count - questions.length } }]);
        questions = questions.concat(rest);
    }
    return { questions, insufficient: questions.length < count, totalAvailable: await Question.countDocuments(filter) };
}

function getTechMahindraQuestionFilter(sectionKey) {
    const { TECH_MAHINDRA_SECTIONS } = require('../config/techMahindraConfig');
    const cfg = TECH_MAHINDRA_SECTIONS[sectionKey];
    return cfg?.category ? { company: 'Tech Mahindra', category: cfg.category, active: { $ne: false }, questionType: { $in: ['mcq', null] } } : null;
}
async function countTechMahindraQuestions(sectionKey) {
    const filter = getTechMahindraQuestionFilter(sectionKey);
    if (filter) return Question.countDocuments(filter);
    return sectionKey === 'coding' ? Question.countDocuments({ company: 'Tech Mahindra', questionType: 'coding', active: { $ne: false } }) : 0;
}
async function getTechMahindraQuestions({ userId = null, sectionKey, count = 12 } = {}) {
    const mongoose = require('mongoose'), filter = getTechMahindraQuestionFilter(sectionKey);
    if (!filter) return { questions: [], insufficient: true, totalAvailable: 0 };
    const attempted = userId ? await getAttemptedQuestionIds(userId, 'Tech Mahindra') : [];
    const ids = attempted.map(id => { try { return new mongoose.Types.ObjectId(String(id)); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([{ $match: { ...filter, _id: { $nin: ids } } }, { $sample: { size: count } }]);
    if (questions.length < count) {
        const selected = questions.map(question => question._id);
        questions = questions.concat(await Question.aggregate([{ $match: { ...filter, _id: { $nin: selected } } }, { $sample: { size: count - questions.length } }]));
    }
    return { questions, insufficient: questions.length < count, totalAvailable: await Question.countDocuments(filter) };
}

function getIBMQuestionFilter(sectionKey) {
    const { IBM_SECTIONS } = require('../config/ibmConfig');
    const cfg = IBM_SECTIONS[sectionKey];
    if (!cfg?.category || sectionKey !== 'english') return null;
    return { company: 'IBM', category: cfg.category, active: { $ne: false }, questionType: { $in: ['mcq', null] } };
}
async function countIBMQuestions(sectionKey) {
    if (sectionKey === 'coding') return Question.countDocuments({ company: 'IBM', category: 'IBM Coding Practice', questionType: 'coding', active: { $ne: false } });
    const filter = getIBMQuestionFilter(sectionKey);
    return filter ? Question.countDocuments(filter) : 0;
}
async function getIBMQuestions({ userId = null, sectionKey, count = 10 } = {}) {
    const filter = getIBMQuestionFilter(sectionKey);
    if (!filter) return { questions: [], insufficient: true, totalAvailable: 0 };
    const attempted = userId ? await getAttemptedQuestionIds(userId, 'IBM') : [];
    const ids = attempted.map(id => { try { return new (require('mongoose').Types.ObjectId)(String(id)); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([{ $match: { ...filter, _id: { $nin: ids } } }, { $sample: { size: count } }]);
    if (questions.length < count) {
        const selected = questions.map(q => q._id);
        questions = questions.concat(await Question.aggregate([{ $match: { ...filter, _id: { $nin: selected } } }, { $sample: { size: count - questions.length } }]));
    }
    return { questions, insufficient: questions.length < count, totalAvailable: await Question.countDocuments(filter) };
}

async function getCognizantQuestions({ userId = null, sectionKey, count = 10 } = {}) {
    const mongoose = require('mongoose');
    const match = getCognizantQuestionFilter(sectionKey);
    if (!match) return { questions: [], insufficient: true, totalAvailable: 0 };
    let attempted = userId ? await getAttemptedQuestionIds(userId, 'Cognizant') : [];
    if (userId && ['coding', 'sql'].includes(sectionKey)) {
        const Model = require(`../models/${sectionKey === 'coding' ? 'CodingSubmission' : 'SqlSubmission'}`);
        const path = sectionKey === 'coding' ? 'problems.questionId' : 'tasks.taskId';
        const saved = await Model.find({ userId, company: 'Cognizant' }).distinct(path);
        attempted = [...new Set([...attempted, ...saved.map(id => String(id))])];
    }
    if (userId && ['communication', 'interview'].includes(sectionKey)) {
        const Response = require('../models/CognizantResponse');
        const section = sectionKey === 'interview' ? 'Interview Preparation' : 'Communication';
        const saved = await Response.find({ userId, section, submissionStatus: 'submitted' }).distinct('taskId');
        attempted = [...new Set([...attempted, ...saved.map(id => String(id))])];
    }
    const ids = attempted.map(id => { try { return new mongoose.Types.ObjectId(String(id)); } catch (_) { return null; } }).filter(Boolean);
    let questions = await Question.aggregate([{ $match: { ...match, _id: { $nin: ids } } }, { $sample: { size: Math.max(1, count) } }]);
    if (questions.length < count) {
        const selected = questions.map(q => q._id);
        const rest = await Question.aggregate([{ $match: { ...match, _id: { $nin: selected } } }, { $sample: { size: count - questions.length } }]);
        questions = questions.concat(rest);
    }
    return { questions, insufficient: questions.length < count, totalAvailable: await Question.countDocuments(match) };
}

/**
 * Core Wipro question query with section regex matching and
 * unseen-first repeat avoidance.
 */
async function getWiproQuestions({ userId = null, dbSection = null, questionType = null, sectionRegex = null, difficultyLevel = null, count = 10, excludeIds = [] } = {}) {
    const mongoose = require('mongoose');

    const matchFilter = { company: 'Wipro', active: { $ne: false } };
    if (difficultyLevel) matchFilter.difficultyLevel = Number(difficultyLevel);

    // Strict, non-overlapping selection: a Wipro section is defined by its
    // database section and question type so that coding problems and essay
    // tasks can never leak into the aptitude sections.
    if (dbSection) matchFilter.section = dbSection;
    if (questionType) {
        matchFilter.questionType = questionType;
    } else {
        matchFilter.questionType = { $nin: ['coding', 'fill_in_blank'] };
    }

    // Optional topic/subject narrowing (used when a section is not pinned to a
    // single database section).
    if (sectionRegex && !dbSection) {
        matchFilter.$or = [
            { subject:  sectionRegex },
            { topic:    sectionRegex },
            { category: sectionRegex }
        ];
    }

    let seenIds = [...excludeIds];
    if (userId) {
        const attemptedIds = await getAttemptedQuestionIds(userId, 'Wipro');
        seenIds = Array.from(new Set([...seenIds, ...attemptedIds]));
    }

    const seenObjectIds = seenIds.map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch (e) { return null; }
    }).filter(Boolean);

    const explicitExcludeObjectIds = (excludeIds || []).map(id => {
        try { return new mongoose.Types.ObjectId(id.toString()); } catch (e) { return null; }
    }).filter(Boolean);

    // Unseen-first query
    let questions = await Question.aggregate([
        { $match: { ...matchFilter, _id: { $nin: seenObjectIds } } },
        { $sample: { size: count } }
    ]);

    // Backfill from seen pool if needed
    if (questions.length < count) {
        const remaining  = count - questions.length;
        const fetchedIds = questions.map(q => q._id);
        const fallback   = await Question.aggregate([
            { $match: { ...matchFilter, _id: { $nin: [...explicitExcludeObjectIds, ...fetchedIds] } } },
            { $sample: { size: remaining } }
        ]);
        questions = [...questions, ...fallback];
    }

    return { questions, insufficient: questions.length < count, totalAvailable: questions.length };
}

/**
 * Assemble a 50-question Wipro aptitude mock.
 * Quant:16, Logical:14, Verbal:20
 */
async function getWiproAptitudeMockQuestions(userId = null) {
    const { WIPRO_SECTIONS, WIPRO_APTITUDE_MOCK_CONFIG } = require('../config/wiproConfig');
    const dist = WIPRO_APTITUDE_MOCK_CONFIG.distribution;

    let allQuestions = [];
    let excludeIds   = [];
    const shortages  = [];

    for (const [key, needed] of Object.entries(dist)) {
        const secConfig = WIPRO_SECTIONS[key];
        const res = await getWiproQuestions({
            userId,
            dbSection: secConfig.dbSection,
            questionType: secConfig.questionType,
            sectionRegex: secConfig.sectionRegex,
            count: needed,
            excludeIds
        });

        if (res.questions.length < needed) {
            shortages.push(`${secConfig.name}: need ${needed}, got ${res.questions.length}`);
        }
        allQuestions = [...allQuestions, ...res.questions];
        excludeIds   = [...excludeIds, ...res.questions.map(q => q._id.toString())];
    }

    if (shortages.length > 0) {
        console.warn(`[PlacementService] Wipro aptitude mock shortage: ${shortages.join(' | ')}`);
        return {
            questions: allQuestions,
            insufficient: true,
            errorMessage: `Wipro question bank shortage — ${shortages.join(', ')}. Please import more questions.`
        };
    }

    return { questions: allQuestions, insufficient: false, totalAvailable: allQuestions.length };
}

/**
 * Assemble a full Wipro mock: aptitude (50) + writing (1) = 51 questions.
 */
async function getWiproFullMockQuestions(userId = null) {
    const { WIPRO_SECTIONS, WIPRO_FULL_MOCK_CONFIG } = require('../config/wiproConfig');
    const dist = WIPRO_FULL_MOCK_CONFIG.distribution;

    let allQuestions = [];
    let excludeIds   = [];
    const shortages  = [];

    for (const [key, needed] of Object.entries(dist)) {
        const secConfig = WIPRO_SECTIONS[key];
        const res = await getWiproQuestions({
            userId,
            dbSection: secConfig.dbSection,
            questionType: secConfig.questionType,
            sectionRegex: secConfig.sectionRegex,
            count: needed,
            excludeIds
        });

        if (res.questions.length < needed) {
            shortages.push(`${secConfig.name}: need ${needed}, got ${res.questions.length}`);
        }
        allQuestions = [...allQuestions, ...res.questions];
        excludeIds   = [...excludeIds, ...res.questions.map(q => q._id.toString())];
    }

    if (shortages.length > 0) {
        console.warn(`[PlacementService] Wipro full mock shortage: ${shortages.join(' | ')}`);
        return {
            questions: allQuestions,
            insufficient: true,
            errorMessage: `Wipro question bank shortage — ${shortages.join(', ')}.`
        };
    }

    return { questions: allQuestions, insufficient: false, totalAvailable: allQuestions.length };
}

/**
 * Return questions for one Wipro section (section practice mode).
 */
async function getWiproSectionPracticeQuestions(userId = null, sectionKey = 'quantitativeAptitude') {
    const { getSectionConfig } = require('../config/wiproConfig');
    const secConfig = getSectionConfig(sectionKey);
    if (!secConfig) {
        return { questions: [], insufficient: true, errorMessage: `Unknown Wipro section: ${sectionKey}` };
    }

    const res = await getWiproQuestions({
        userId,
        dbSection: secConfig.dbSection,
        questionType: secConfig.questionType,
        sectionRegex: secConfig.sectionRegex,
        count: secConfig.questionCount
    });

    if (res.questions) {
        res.questions = res.questions.map(q => (q.toObject ? q.toObject() : { ...q }));
    }
    return res;
}

/**
 * Pick exactly 2 Wipro coding problems for a mock attempt.
 *
 * Selection strategy (in priority order):
 *   1. Prefer unseen questions (not in this user's CodingSubmission history).
 *   2. Pick from different topics.
 *   3. Prefer difficulty spread: one Medium (level 2) + one Medium/Hard or Hard (level 2-3).
 *   4. Fall back to any 2 active coding questions if the pool is small.
 *
 * The client never sees testCases, so hidden inputs remain hidden.
 */
async function getWiproCodingMockQuestions(userId = null) {
    const baseMatch = { company: 'Wipro', questionType: 'coding', active: { $ne: false } };

    // Get IDs the user has already attempted (from CodingSubmission history)
    let seenIds = [];
    if (userId) {
        try {
            const CodingSubmission = require('../models/CodingSubmission');
            const subs = await CodingSubmission.find({ userId })
                .select('problems.questionId')
                .lean();
            const idSet = new Set();
            subs.forEach(s => (s.problems || []).forEach(p => {
                if (p.questionId) idSet.add(p.questionId.toString());
            }));
            seenIds = [...idSet];
        } catch (e) {
            // CodingSubmission collection may not exist yet on first run
            seenIds = [];
        }
    }

    // Total pool
    const totalPool = await Question.find(baseMatch).select('_id topic subject difficultyLevel').lean();
    if (totalPool.length === 0) {
        return { questions: [], insufficient: true, errorMessage: 'No Wipro coding problems are available yet. Please run the coding question importer.' };
    }

    // Prefer unseen
    const unseenIds = new Set(totalPool.map(q => q._id.toString()).filter(id => !seenIds.includes(id)));
    const preferUnseen = totalPool.filter(q => unseenIds.has(q._id.toString()));
    const pool = preferUnseen.length >= 2 ? preferUnseen : totalPool;

    // Group by topic
    const byTopic = {};
    pool.forEach(q => {
        const t = q.topic || q.subject || 'General';
        if (!byTopic[t]) byTopic[t] = [];
        byTopic[t].push(q);
    });
    const topics = Object.keys(byTopic);

    // Shuffle helper
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let picked = [];

    if (topics.length >= 2) {
        // Pick from two different topics — prefer one level-2 and one level-2/3
        const shuffledTopics = shuffle(topics);

        // First problem: any difficulty from first topic
        const pool1 = shuffle(byTopic[shuffledTopics[0]]);
        const q1 = pool1[0];
        picked.push(q1);

        // Second problem: from second topic, prefer higher difficulty than q1
        const pool2 = shuffle(byTopic[shuffledTopics[1]]);
        const preferHarder = pool2.filter(q => q.difficultyLevel >= (q1.difficultyLevel || 2));
        const q2 = (preferHarder.length > 0 ? preferHarder : pool2)[0];
        picked.push(q2);
    } else {
        // Only one topic available — just pick 2 from it
        const shuffled = shuffle(pool);
        picked = shuffled.slice(0, 2);
    }

    if (picked.length < 2) {
        // Edge case: fewer than 2 questions total
        const shuffled = shuffle(pool);
        picked = shuffled.slice(0, Math.min(2, shuffled.length));
    }

    // Fetch full documents (with testCases for server-side execution)
    const fullDocs = await Question.find({
        _id: { $in: picked.map(q => q._id) },
        company: 'Wipro',
        active: { $ne: false }
    }).lean();

    // Maintain selection order
    const byId = new Map(fullDocs.map(d => [d._id.toString(), d]));
    const orderedDocs = picked.map(q => byId.get(q._id.toString())).filter(Boolean);

    return {
        questions: orderedDocs,
        insufficient: orderedDocs.length < 2,
        totalAvailable: totalPool.length,
        ...(orderedDocs.length < 2
            ? { errorMessage: `Only ${orderedDocs.length} Wipro coding problem(s) available. Please import more questions.` }
            : {})
    };
}

module.exports = {
    getUnlockedLevels,
    isLevelUnlocked,
    getSchoolQuestions,
    getGeneralCollegeQuestions,
    getCompanyQuestions,
    getAttemptedQuestionIds,
    getTCSQuestions,
    getTCSFoundationMockQuestions,
    getTCSAdvancedMockQuestions,
    getTCSIntegratedMockQuestions,
    getTCSSectionPracticeQuestions,
    getInfosysQuestions,
    getInfosysMockQuestions,
    getInfosysSectionPracticeQuestions,
    getWiproQuestions,
    getWiproAptitudeMockQuestions,
    getWiproFullMockQuestions,
    getWiproSectionPracticeQuestions,
    getWiproCodingMockQuestions,
    getAccentureQuestions,
    countAccentureQuestions,
    getCognizantQuestions,
    countCognizantQuestions,
    getCapgeminiQuestions,
    countCapgeminiQuestions,
    getHCLTechQuestionFilter,
    countHCLTechQuestions,
    getHCLTechQuestions
    ,getTechMahindraQuestionFilter,
    countTechMahindraQuestions,
    getTechMahindraQuestions,
    countIBMQuestions,
    getIBMQuestions
};
