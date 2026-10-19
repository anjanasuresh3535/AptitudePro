// Configurable Cognizant (CTS) practice setup. Like every other company module
// in AptitudePro, question counts, timers and topics are configuration, never
// hard-coded text. Assessment invitations vary by role and drive, so each round
// can be tuned to match a candidate's invitation.
//
// Section keys are used for: the selection filter (PlacementService), the
// Result.trackKey / SectionProgress key ('Company-cognizant-<key>'), and routing.

const COGNIZANT_SECTIONS = {
    // ── Round 1: Communication Assessment ──────────────────────────────────
    'communication-objective': {
        name: 'Objective Communication',
        round: 'Communication Assessment',
        topics: ['Grammar', 'Vocabulary', 'Workplace Communication', 'Reading Comprehension', 'Sentence Correction', 'Verbal Ability'],
        count: 15,
        minutes: 40
    },
    communication: {
        name: 'Written Communication',
        round: 'Communication Assessment',
        topics: ['Email Writing', 'Business Writing'],
        count: 1,
        minutes: 20
    },

    // ── Round 2: Aptitude and Game-Based Assessment ────────────────────────
    aptitude: {
        name: 'Aptitude Assessment',
        round: 'Aptitude & Game-Based Assessment',
        topics: ['Quantitative Aptitude', 'Numerical Reasoning', 'Logical Reasoning', 'Data Interpretation', 'Arithmetic', 'Verbal Reasoning'],
        count: 30,
        minutes: 30
    },
    games: {
        name: 'Game-Based Assessment',
        round: 'Aptitude & Game-Based Assessment',
        count: 5,
        minutes: 50,
        // Five short cognitive games. Scores are captured client-side, sent to
        // the server once, and converted to XP server-side (never trusted raw).
        games: [
            { key: 'motionCanvas', name: 'Motion Canvas', icon: 'fa-arrows-up-down-left-right', description: 'Track and tap the moving target as fast as you can. Measures reaction speed and attention.' },
            { key: 'digitRecall', name: 'Digit Recall', icon: 'fa-memory', description: 'Memorise a growing sequence of digits and type them back. Measures working memory.' },
            { key: 'switchTracker', name: 'Switch Tracker', icon: 'fa-right-left', description: 'Sort items by a rule that keeps switching. Measures cognitive flexibility.' },
            { key: 'patternMatrix', name: 'Pattern Matrix', icon: 'fa-table-cells', description: 'Complete the missing cell in a visual matrix. Measures abstract reasoning.' },
            { key: 'logicGrid', name: 'Logic Grid', icon: 'fa-diagram-project', description: 'Deduce the correct arrangement from a set of clues. Measures logical reasoning.' }
        ]
    },

    // ── Round 3: Technical Assessment ──────────────────────────────────────
    coding: {
        name: 'Coding Assessment',
        round: 'Technical Assessment',
        topics: ['Coding'],
        count: 2,
        minutes: 60,
        languages: ['C', 'C++', 'Java', 'Python']
    },
    sql: {
        name: 'SQL Assessment',
        round: 'Technical Assessment',
        topics: ['SQL', 'DBMS'],
        count: 2,
        minutes: 30
    },
    technical: {
        name: 'Technical Assessment',
        round: 'Technical Assessment',
        topics: ['Pseudocode', 'Programming Fundamentals', 'OOP', 'DBMS', 'Operating Systems', 'Computer Networks', 'Cloud Computing', 'Cybersecurity', 'Software Engineering'],
        count: 10,
        minutes: 20
    },

    // ── Round 4: Technical and HR Interview Preparation ────────────────────
    interview: {
        name: 'Interview Preparation',
        round: 'Technical & HR Interview Preparation',
        topics: ['Interview'],
        count: 1,
        minutes: 30
    }
};

// Dashboard grouping: the four recruitment rounds, in order, with the section
// keys each round exposes and how the candidate launches them.
const COGNIZANT_ROUNDS = [
    {
        key: 'communication',
        name: 'Communication Assessment',
        description: 'Objective grammar, vocabulary and reading practice plus written communication. Audio and automatic speech evaluation are not configured in this project.',
        icon: 'fa-comments',
        sections: [
            { key: 'communication-objective', launch: 'quiz' },
            { key: 'communication', launch: 'response' }
        ]
    },
    {
        key: 'aptitude',
        name: 'Aptitude & Game-Based Assessment',
        description: 'Quantitative, logical and data-interpretation questions plus five cognitive games.',
        icon: 'fa-chart-line',
        sections: [
            { key: 'aptitude', launch: 'quiz' },
            { key: 'games', launch: 'games' }
        ]
    },
    {
        key: 'technical',
        name: 'Technical Assessment',
        description: 'Two coding problems, two SQL tasks and core computer-science multiple choice.',
        icon: 'fa-laptop-code',
        sections: [
            { key: 'coding', launch: 'coding' },
            { key: 'sql', launch: 'sql' },
            { key: 'technical', launch: 'quiz' }
        ]
    },
    {
        key: 'interview',
        name: 'Technical & HR Interview Preparation',
        description: 'Prepare HR, behavioral, technical and project interview responses.',
        icon: 'fa-user-tie',
        sections: [
            { key: 'interview', launch: 'response' }
        ]
    }
];

// Section keys whose questions are multiple-choice and run through the shared
// /quiz engine (mode=cognizant). Everything else has a dedicated route.
const COGNIZANT_QUIZ_KEYS = ['communication-objective', 'aptitude', 'technical'];

function getCognizantSection(sectionKey) {
    return COGNIZANT_SECTIONS[sectionKey] || null;
}

module.exports = {
    COGNIZANT_SECTIONS,
    COGNIZANT_ROUNDS,
    COGNIZANT_QUIZ_KEYS,
    getCognizantSection
};
