// backend/config/placementConfig.js

const LEARNING_PATHS = {
    school: {
        key: 'school',
        title: 'School Students',
        subtitle: 'School Aptitude',
        description: 'Build strong aptitude skills through combined Mathematics, Logical Reasoning, and English.',
        icon: 'fa-graduation-cap'
    },
    college: {
        key: 'college',
        title: 'College Students & Placement',
        subtitle: 'College & Placement Preparation',
        description: 'Prepare for campus recruitment drives and professional placement assessments.',
        icon: 'fa-briefcase'
    }
};

const COMPANY_LIST = [
    { slug: 'tcs', name: 'TCS', tag: 'TATA Consultancy Services', logoBg: '#0f2027', icon: 'fa-building' },
    { slug: 'infosys', name: 'Infosys', tag: 'Infosys Placement Practice', logoBg: '#007cc3', icon: 'fa-laptop-code' },
    { slug: 'wipro', name: 'Wipro', tag: 'Wipro Assessment Prep', logoBg: '#005b96', icon: 'fa-network-wired' },
    { slug: 'accenture', name: 'Accenture', tag: 'Accenture Aptitude Practice', logoBg: '#a100ff', icon: 'fa-chart-line', button: 'Practice Accenture Patterns →' },
    { slug: 'cognizant', name: 'Cognizant', tag: 'CTS Placement Practice', logoBg: '#003366', icon: 'fa-code-branch' },
    { slug: 'capgemini', name: 'Capgemini', tag: 'Capgemini Test Series', logoBg: '#0070ad', icon: 'fa-shield-halved' },
    { slug: 'hcltech', name: 'HCLTech', tag: 'HCLTech Aptitude Prep', logoBg: '#1f4e78', icon: 'fa-microchip' },
    { slug: 'tech-mahindra', name: 'Tech Mahindra', tag: 'Tech Mahindra Assessment', logoBg: '#d92525', icon: 'fa-server' },
    { slug: 'ibm', name: 'IBM', tag: 'IBM Assessment Prep', logoBg: '#1f70c1', icon: 'fa-brain' }
];

const DIFFICULTY_LABELS = {
    1: { number: 1, name: 'Foundation', short: 'Level 1', full: 'Level 1 – Foundation', tagline: 'Build your fundamentals' },
    2: { number: 2, name: 'Intermediate', short: 'Level 2', full: 'Level 2 – Intermediate', tagline: 'Practice moderate problem sets' },
    3: { number: 3, name: 'Advanced', short: 'Level 3', full: 'Level 3 – Advanced', tagline: 'Challenge yourself with advanced problems' }
};

const UNLOCK_ACCURACY_THRESHOLD = 60;

const DISCLAIMER_TEXT = "Company-oriented placement practice. Practice aptitude patterns commonly associated with major placement assessments. AptitudePro is an independent educational practice feature and is not affiliated with or endorsed by any listed company.";

const QUIZ_TIME_LIMITS = {
    school: 1500, // 25 minutes in seconds
    college_general: 1800, // 30 minutes in seconds
    company: 1800 // 30 minutes in seconds
};

// Configurable Question Count per Attempt by Learning Path, Placement Type & Level
const QUIZ_QUESTION_COUNTS = {
    school: { 1: 25, 2: 25, 3: 25 },
    generalPlacement: { 1: 25, 2: 25, 3: 25 },
    company: { 1: 25, 2: 25, 3: 25 }
};

// Enforced Subject Distribution for School Aptitude Tests (25 Questions per attempt)
const SCHOOL_SUBJECT_DISTRIBUTION = {
    1: { Maths: 10, Logical: 8, English: 7 },  // Foundation Total: 25
    2: { Maths: 10, Logical: 8, English: 7 },  // Intermediate Total: 25
    3: { Maths: 10, Logical: 8, English: 7 }   // Advanced Total: 25
};

function getTimeLimitSec(learningPath, placementType, company) {
    if (learningPath === 'school') {
        return QUIZ_TIME_LIMITS.school;
    }
    if (learningPath === 'college' && placementType === 'company' && company) {
        return QUIZ_TIME_LIMITS.company;
    }
    return QUIZ_TIME_LIMITS.college_general;
}

function getQuestionCount(learningPath, placementType, level) {
    const lvlNum = parseInt(level) || 1;
    if (learningPath === 'school') {
        return QUIZ_QUESTION_COUNTS.school[lvlNum] || 25;
    }
    if (learningPath === 'college' && placementType === 'company') {
        return QUIZ_QUESTION_COUNTS.company[lvlNum] || 25;
    }
    return QUIZ_QUESTION_COUNTS.generalPlacement[lvlNum] || 25;
}

function getSchoolDistribution(level) {
    const lvlNum = parseInt(level) || 1;
    return SCHOOL_SUBJECT_DISTRIBUTION[lvlNum] || SCHOOL_SUBJECT_DISTRIBUTION[1];
}

function getCompanyBySlug(slug) {
    if (!slug) return null;
    const s = slug.toLowerCase().trim();
    return COMPANY_LIST.find(c => c.slug.toLowerCase() === s || c.name.toLowerCase() === s) || null;
}

function getDifficultyLabel(level) {
    const lvlNum = parseInt(level) || 1;
    return DIFFICULTY_LABELS[lvlNum] || DIFFICULTY_LABELS[1];
}

module.exports = {
    LEARNING_PATHS,
    COMPANY_LIST,
    DIFFICULTY_LABELS,
    UNLOCK_ACCURACY_THRESHOLD,
    DISCLAIMER_TEXT,
    QUIZ_TIME_LIMITS,
    QUIZ_QUESTION_COUNTS,
    SCHOOL_SUBJECT_DISTRIBUTION,
    getTimeLimitSec,
    getQuestionCount,
    getSchoolDistribution,
    getCompanyBySlug,
    getDifficultyLabel
};
