// backend/config/tcsConfig.js
//
// Configuration blueprint for TCS NQT exam structure, topic taxonomy,
// practice modes, and configurable mock test specifications.

const TCS_NQT_SECTIONS = {
    numericalAbility: {
        key: 'numericalAbility',
        name: 'Numerical Ability',
        level: 'Foundation',
        questionCount: 20,
        timeLimitSec: 1500, // 25 minutes
        topics: [
            'Number System', 'LCM and HCF', 'Percentages', 'Profit and Loss',
            'Time and Work', 'Speed, Distance and Time', 'Simple Interest',
            'Compound Interest', 'Ratio and Proportion', 'Averages',
            'Mixtures and Allegations', 'Permutation and Combination',
            'Probability', 'Geometry', 'Mensuration'
        ]
    },
    reasoningAbility: {
        key: 'reasoningAbility',
        name: 'Reasoning Ability',
        level: 'Foundation',
        questionCount: 20,
        timeLimitSec: 1500, // 25 minutes
        topics: [
            'Coding and Decoding', 'Blood Relations', 'Seating Arrangements',
            'Syllogisms', 'Direction Sense', 'Number Series', 'Letter Series',
            'Data Sufficiency', 'Visual Reasoning', 'Cube Folding', 'Paper Cutting'
        ]
    },
    verbalAbility: {
        key: 'verbalAbility',
        name: 'Verbal Ability',
        level: 'Foundation',
        questionCount: 25,
        timeLimitSec: 1500, // 25 minutes
        topics: [
            'Sentence Completion', 'Passage Recall', 'Error Identification',
            'Reading Comprehension', 'Para-jumbles', 'Professional Email Writing'
        ]
    },
    advancedQuantReasoning: {
        key: 'advancedQuantReasoning',
        name: 'Advanced Quantitative & Reasoning',
        level: 'Advanced',
        questionCount: 15,
        timeLimitSec: 1500, // 25 minutes
        topics: [
            'Higher-level equations', 'Advanced quantitative reasoning',
            'Complex arrangements', 'Advanced data interpretation',
            'Multi-step puzzles'
        ]
    },
    advancedCoding: {
        key: 'advancedCoding',
        name: 'Advanced Coding',
        level: 'Advanced',
        questionCount: 2,
        timeLimitSec: 5400, // 90 minutes
        topics: [
            'Mathematical constructs', 'Arrays', 'Strings', 'Matrices',
            'Recursion', 'Data structures', 'Linked lists', 'Stacks',
            'Queues', 'Trees', 'Graphs', 'Algorithms'
        ]
    }
};

const TCS_FOUNDATION_MOCK_CONFIG = {
    key: 'mock_foundation',
    name: 'Level 1 — Foundation Section',
    totalQuestions: 65,
    timeLimitSec: 4500, // 75 minutes total
    distribution: {
        numericalAbility: 20,
        verbalAbility: 25,
        reasoningAbility: 20
    }
};

const TCS_ADVANCED_MOCK_CONFIG = {
    key: 'mock_advanced',
    name: 'Level 2 — Advanced Section',
    totalQuestions: 17,
    timeLimitSec: 6900, // 115 minutes total
    distribution: {
        advancedQuantReasoning: 15,
        advancedCoding: 2
    }
};

const TCS_MOCK_TEST_TEMPLATE = {
    company: 'TCS',
    exam: 'TCS_NQT',
    title: 'TCS NQT Full Mock Assessment',
    totalQuestions: 82,
    totalTimeLimitSec: 11400, // 190 minutes total
    allowSectionRevisit: false,
    allowUnanswered: true,
    sections: [
        TCS_NQT_SECTIONS.numericalAbility,
        TCS_NQT_SECTIONS.reasoningAbility,
        TCS_NQT_SECTIONS.verbalAbility,
        TCS_NQT_SECTIONS.advancedQuantReasoning,
        TCS_NQT_SECTIONS.advancedCoding
    ]
};

const TCS_DEVELOPMENT_TARGETS = {
    numericalAbility: 300,
    reasoningAbility: 300,
    verbalAbility: 300,
    advancedQuantReasoning: 300,
    advancedCoding: 100,
    total: 1300
};

function getSectionConfig(sectionKey) {
    return TCS_NQT_SECTIONS[sectionKey] || null;
}

function getAllTcsTopics() {
    const topicMap = {};
    for (const [secKey, secObj] of Object.entries(TCS_NQT_SECTIONS)) {
        topicMap[secKey] = {
            name: secObj.name,
            level: secObj.level,
            topics: secObj.topics
        };
    }
    return topicMap;
}

module.exports = {
    TCS_NQT_SECTIONS,
    TCS_FOUNDATION_MOCK_CONFIG,
    TCS_ADVANCED_MOCK_CONFIG,
    TCS_MOCK_TEST_TEMPLATE,
    TCS_DEVELOPMENT_TARGETS,
    getSectionConfig,
    getAllTcsTopics
};
