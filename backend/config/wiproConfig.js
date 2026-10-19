// backend/config/wiproConfig.js
//
// Configuration blueprint for the Wipro placement practice module.
//
// NOTE: Wipro's hiring pattern can vary by hiring drive. This configuration
// reflects widely-reported practice patterns (prepinsta.com and similar
// preparation resources). Mark as VERIFIED only when confirmed against
// an official Wipro offer letter or official communication.
//
// Status: REPORTED PRACTICE PATTERN — not an official Wipro document.
// Everything below is stored as configurable data so a different verified
// hiring pattern (e.g. 18–22 verbal questions) can be adopted without code
// changes.

// ── Assessment metadata ─────────────────────────────────────────────
const WIPRO_ASSESSMENT_META = {
    company: 'Wipro',
    exam: 'Wipro_Elite_NTH',
    status: 'reported_practice_pattern',
    verified: false,
    reference: 'https://prepinsta.com/wipro-quantitative-aptitude-questions/',
    note: 'Wipro recruitment pattern may vary by hiring drive. Figures below are the reported practice pattern used for this mock.',
    // Configurable verbal count (references report ~18–22). Default 20 keeps the
    // aptitude total at exactly 50.
    verbalCountOptions: [18, 19, 20, 21, 22]
};

const WIPRO_SECTIONS = {
    quantitativeAptitude: {
        key: 'quantitativeAptitude',
        name: 'Quantitative Aptitude',
        dbSection: 'Maths',
        questionType: 'mcq',
        sectionRegex: /Quantitative|Percentage|Profit|Loss|Time|Work|Speed|Distance|Interest|Ratio|Average|Number|Algebra|Geometry|Data Interpretation|Arithmetic|Mixture|Probability|Permutation/i,
        level: 'Foundation',
        questionCount: 16,
        timeLimitSec: 2880,   // 48 min total aptitude — proportional share
        description: '16 questions covering arithmetic, algebra, and data interpretation.',
        topics: [
            'Percentages', 'Profit and Loss', 'Time and Work',
            'Time Speed Distance', 'Simple Interest', 'Compound Interest',
            'Ratios and Proportions', 'Averages', 'Number Systems',
            'Algebra', 'Geometry', 'Data Interpretation'
        ]
    },
    logicalReasoning: {
        key: 'logicalReasoning',
        name: 'Logical Reasoning',
        dbSection: 'Logical',
        questionType: 'mcq',
        sectionRegex: /Logical|Reasoning|Series|Coding|Decoding|Direction|Blood|Relation|Syllogism|Seating|Arrangement|Puzzle|Deduction|Sufficiency|Analogy/i,
        level: 'Foundation',
        questionCount: 14,
        timeLimitSec: 2880,   // shared aptitude timer
        description: '14 questions covering reasoning, series, puzzles, and arrangements.',
        topics: [
            'Number Series', 'Letter Series', 'Coding-Decoding',
            'Direction Sense', 'Blood Relations', 'Syllogisms',
            'Seating Arrangements', 'Logical Puzzles',
            'Data Sufficiency', 'Deductive Logic'
        ]
    },
    verbalAbility: {
        key: 'verbalAbility',
        name: 'Verbal Ability',
        dbSection: 'English',
        questionType: 'mcq',
        sectionRegex: /Verbal|Synonym|Antonym|Error|Sentence|Improvement|Reading|Comprehension|Para|Jumble|Fill|Blank|Vocabulary|Grammar/i,
        level: 'Foundation',
        questionCount: 20,
        timeLimitSec: 2880,   // shared aptitude timer
        description: '20 questions covering synonyms, grammar, reading comprehension, and sentence skills.',
        topics: [
            'Synonyms', 'Antonyms', 'Error Identification', 'Sentence Improvement',
            'Reading Comprehension', 'Fill in the Blanks', 'Para Jumbles'
        ]
    },
    writtenCommunication: {
        key: 'writtenCommunication',
        name: 'Written Communication',
        dbSection: 'English',
        questionType: 'fill_in_blank',
        sectionRegex: /Writing|Essay|Composition|Communication|Prompt|Topic/i,
        level: 'Foundation',
        questionCount: 1,
        timeLimitSec: 1200,   // 20 minutes
        isWritingSection: true,
        minWords: 200,
        maxWords: 400,
        description: '1 essay writing task (200–400 words). Reviewed on relevance, grammar, vocabulary, clarity, coherence, paragraph structure, and conclusion.',
        evaluationCriteria: [
            'Relevance to the topic',
            'Grammar',
            'Vocabulary',
            'Clarity',
            'Coherence',
            'Paragraph structure',
            'Appropriate conclusion'
        ],
        topics: [
            'Technology and Society', 'Workplace and Professional Life',
            'Education and Learning', 'Environment and Sustainability', 'Social Issues'
        ]
    },
    codingPractice: {
        key: 'codingPractice',
        name: 'Coding Practice',
        dbSection: 'Programming',
        questionType: 'coding',
        sectionRegex: /Coding|Programming|Arrays|Strings|Matrix|Recursion|Searching|Sorting|Data Structures|Algorithm/i,
        level: 'Foundation',
        questionCount: 2,
        timeLimitSec: 3600,   // 60 minutes
        isCodingSection: true,
        languages: ['C', 'C++', 'Java', 'Python'],
        description: '2 coding problems (60 minutes). Basic-to-intermediate problem solving with complete input/output specification and test cases.',
        topics: [
            'Number manipulation', 'Loops and conditions', 'Arrays', 'Strings',
            'Functions', 'Recursion', 'Searching', 'Sorting', 'Matrices',
            'Basic data structures', 'Problem-solving algorithms'
        ]
    }
};

// Aptitude mock: 50 questions in 48 minutes (combined timer)
const WIPRO_APTITUDE_MOCK_CONFIG = {
    key: 'mock_wipro_aptitude',
    name: 'Wipro Aptitude Mock Test',
    company: 'Wipro',
    exam: 'Wipro_Elite_NTH',
    totalQuestions: 50,
    timeLimitSec: 2880,  // 48 minutes
    description: 'Full 50-question aptitude mock: Quantitative (16) + Logical (14) + Verbal (20). Combined 48-minute timer.',
    distribution: {
        quantitativeAptitude: 16,
        logicalReasoning: 14,
        verbalAbility: 20
    }
};

// Coding mock: 2 problems in 60 minutes
const WIPRO_CODING_MOCK_CONFIG = {
    key: 'mock_wipro_coding',
    name: 'Wipro Coding Mock Test',
    company: 'Wipro',
    exam: 'Wipro_Elite_NTH',
    totalQuestions: 2,
    timeLimitSec: 3600,  // 60 minutes
    languages: ['C', 'C++', 'Java', 'Python'],
    // Availability is resolved at RUNTIME by the execution service (Docker
    // daemon probe). It is intentionally not hard-coded here: the daemon may be
    // running in a deployment and stopped on a developer laptop. Call
    // services/coding/availability.getExecutionStatus() for the live value.
    description: '2 coding problems in 60 minutes. Submit code in C, C++, Java, or Python. When the isolated execution service is running, submissions are compiled and tested against the sample and hidden test cases; otherwise they are stored unexecuted with no invented result.',
    distribution: {
        codingPractice: 2
    }
};

// Writing mock: 1 essay in 20 minutes
const WIPRO_WRITING_MOCK_CONFIG = {
    key: 'mock_wipro_writing',
    name: 'Wipro Written Communication Mock',
    company: 'Wipro',
    exam: 'Wipro_Elite_NTH',
    totalQuestions: 1,
    timeLimitSec: 1200,  // 20 minutes
    minWords: 200,
    maxWords: 400,
    distribution: {
        writtenCommunication: 1
    }
};

// ── Full mock: aptitude (50 Qs / 48 min) + coding (2 / 60 min) + writing (1 / 20 min)
// Total: 53 tasks / 128 minutes. Components keep their own sub-timers so the
// combined question count is never misrepresented as a single MCQ paper.
const WIPRO_FULL_MOCK_CONFIG = {
    key: 'mock_wipro_full',
    name: 'Wipro Full Practice Mock',
    company: 'Wipro',
    exam: 'Wipro_Elite_NTH',
    totalTasks: 53,
    totalTimeLimitSec: 7680,  // 128 minutes
    components: [
        { key: 'aptitude',   name: 'Aptitude',               questions: 50, timeLimitSec: 2880, mode: 'mock-aptitude' },
        { key: 'coding',     name: 'Coding',                 questions: 2,  timeLimitSec: 3600, mode: 'mock-coding' },
        { key: 'writing',    name: 'Written Communication',  questions: 1,  timeLimitSec: 1200, mode: 'mock-writing' }
    ],
    // MCQ-based combined run (aptitude + writing) used by the single-timer quiz engine
    totalQuestions: 51,
    timeLimitSec: 4080,   // 48 + 20 minutes = 68 min (coding runs on its own 60-min timer)
    description: 'Aptitude (50 Qs, 48 min) + Coding (2 problems, 60 min) + Written Communication (1 task, 20 min) = 53 tasks / 128 minutes.',
    distribution: {
        quantitativeAptitude: 16,
        logicalReasoning: 14,
        verbalAbility: 20,
        writtenCommunication: 1
    }
};

// Question bank development targets
const WIPRO_DEVELOPMENT_TARGETS = {
    quantitativeAptitude: 120,
    logicalReasoning: 100,
    verbalAbility: 100,
    writtenCommunication: 25,
    codingPractice: 30,
    total: 375
};

function getSectionConfig(sectionKey) {
    return WIPRO_SECTIONS[sectionKey] || null;
}

function getAllWiproTopics() {
    const topicMap = {};
    for (const [key, sec] of Object.entries(WIPRO_SECTIONS)) {
        topicMap[key] = { name: sec.name, level: sec.level, topics: sec.topics };
    }
    return topicMap;
}

function getSectionKeys() {
    return Object.keys(WIPRO_SECTIONS);
}

module.exports = {
    WIPRO_ASSESSMENT_META,
    WIPRO_SECTIONS,
    WIPRO_APTITUDE_MOCK_CONFIG,
    WIPRO_CODING_MOCK_CONFIG,
    WIPRO_WRITING_MOCK_CONFIG,
    WIPRO_FULL_MOCK_CONFIG,
    WIPRO_DEVELOPMENT_TARGETS,
    getSectionConfig,
    getAllWiproTopics,
    getSectionKeys
};
