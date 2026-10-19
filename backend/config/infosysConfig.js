// backend/config/infosysConfig.js
//
// Configuration blueprint for Infosys InfyTQ exam structure, topic taxonomy,
// practice modes, and configurable mock test specifications.
// Keep all counts and timings in this file for easy future adjustment.

const INFOSYS_SECTIONS = {
    technicalAbility: {
        key: 'technicalAbility',
        name: 'Technical Ability',
        dbSection: 'Maths',
        sectionRegex: /Technical|Quantitative|Aptitude|Percentage|Profit|Speed|Work|Probability|Permutation|Mixture|Series|LCM|HCF|Ages|Divisib|Number|Fraction|Decimal|Boat|Stream/i,
        level: 'Foundation',
        questionCount: 10,
        timeLimitSec: 2100, // 35 minutes
        topics: [
            'Percentages', 'Data Interpretation', 'Permutation and Combination',
            'Probability', 'Areas, Shapes and Perimeter', 'Speed, Time and Distance',
            'Boats and Streams', 'Time and Work', 'Profit and Loss',
            'Mixtures and Alligation', 'Problems on Ages', 'Divisibility',
            'Numbers, Decimals and Fractions', 'Series and Progression', 'LCM and HCF'
        ]
    },
    logicalReasoning: {
        key: 'logicalReasoning',
        name: 'Logical Reasoning',
        dbSection: 'Logical',
        sectionRegex: /Logical|Reasoning|Arrangement|Puzzle|Syllogism|Coding|Decoding|Series|Cryptarithmetic|Clock|Calendar|Sufficiency|Deduction/i,
        level: 'Foundation',
        questionCount: 15,
        timeLimitSec: 1500, // 25 minutes
        topics: [
            'Arrangements', 'Puzzles', 'Syllogisms', 'Coding-Decoding',
            'Number Series', 'Cryptarithmetic', 'Clocks and Calendar',
            'Data Sufficiency', 'Most Logical Choice', 'Logical Deduction'
        ]
    },
    verbalAbility: {
        key: 'verbalAbility',
        name: 'Verbal Ability',
        dbSection: 'English',
        sectionRegex: /Verbal|Reading|Comprehension|Sentence|Para|Jumble|Analogy|Fill|Blank|Substitution|Critical|Error|Spotting/i,
        level: 'Foundation',
        questionCount: 20,
        timeLimitSec: 1200, // 20 minutes
        topics: [
            'Reading Comprehension', 'Sentence Correction', 'Sentence Selection',
            'Sentence Completion', 'Para Jumbles', 'Spotting Errors', 'Analogy',
            'Fill in the Blanks', 'One Word Substitution', 'Critical Reasoning'
        ]
    },
    pseudoCode: {
        key: 'pseudoCode',
        name: 'Pseudo Code',
        dbSection: 'Programming',
        sectionRegex: /Pseudo|Code|Output|Loop|Array|Recursion|Bitwise|Pointer|Stack|Queue|Function|Conditional/i,
        level: 'Foundation',
        questionCount: 5,
        timeLimitSec: 600, // 10 minutes
        topics: [
            'Nested Loops', 'Arrays', 'Conditional Statements', 'Functions',
            'Recursion', 'Operators', 'Bitwise Operations', 'Pointers',
            'Stacks and Queues', 'Data Structure Operations'
        ]
    },
    puzzleSolving: {
        key: 'puzzleSolving',
        name: 'Puzzle Solving',
        dbSection: 'Maths',
        sectionRegex: /Puzzle|Pattern|Grid|Missing|Number Puzzle|Arithmetic Constraint/i,
        level: 'Foundation',
        questionCount: 4,
        timeLimitSec: 600, // 10 minutes
        topics: [
            'Number Patterns', 'Missing Number Puzzles', 'Numerical Grids',
            'Arithmetic Constraints', 'Multi-step Reasoning Puzzles'
        ]
    },
    englishGrammar: {
        key: 'englishGrammar',
        name: 'English Grammar',
        dbSection: 'English',
        sectionRegex: /Grammar|Error|Correction|Completion|Contextual|Article|Tense|Preposition|Subject|Verb|Agreement/i,
        level: 'Foundation',
        questionCount: 5,
        timeLimitSec: 600, // 10 minutes
        topics: [
            'Sentence Correction', 'Error Identification', 'Sentence Completion',
            'Contextual Grammar', 'Fill in the Blanks'
        ]
    },
    englishWriting: {
        key: 'englishWriting',
        name: 'English Writing',
        dbSection: 'English',
        sectionRegex: /Writing|Essay|Prompt|Composition|Email/i,
        level: 'Foundation',
        questionCount: 1,
        timeLimitSec: 600, // 10 minutes
        topics: [
            'Essay Writing', 'Professional Email', 'Opinion Writing',
            'Descriptive Paragraph', 'Situation-based Writing'
        ]
    }
};

const INFOSYS_MOCK_CONFIG = {
    key: 'mock_infosys',
    name: 'Infosys InfyTQ Full Mock Test',
    company: 'Infosys',
    exam: 'Infosys_InfyTQ',
    totalQuestions: 60,
    timeLimitSec: 7200, // 120 minutes
    distribution: {
        technicalAbility: 10,
        logicalReasoning: 15,
        verbalAbility: 20,
        pseudoCode: 5,
        puzzleSolving: 4,
        englishGrammar: 5,
        englishWriting: 1
    }
};

// Question bank development targets (not exam counts)
const INFOSYS_DEVELOPMENT_TARGETS = {
    technicalAbility: 100,
    logicalReasoning: 100,
    verbalAbility: 100,
    pseudoCode: 60,
    puzzleSolving: 40,
    englishGrammar: 50,
    englishWriting: 20,
    total: 470
};

function getSectionConfig(sectionKey) {
    return INFOSYS_SECTIONS[sectionKey] || null;
}

function getAllInfosysTopics() {
    const topicMap = {};
    for (const [secKey, secObj] of Object.entries(INFOSYS_SECTIONS)) {
        topicMap[secKey] = {
            name: secObj.name,
            level: secObj.level,
            topics: secObj.topics
        };
    }
    return topicMap;
}

function getSectionKeys() {
    return Object.keys(INFOSYS_SECTIONS);
}

module.exports = {
    INFOSYS_SECTIONS,
    INFOSYS_MOCK_CONFIG,
    INFOSYS_DEVELOPMENT_TARGETS,
    getSectionConfig,
    getAllInfosysTopics,
    getSectionKeys
};
