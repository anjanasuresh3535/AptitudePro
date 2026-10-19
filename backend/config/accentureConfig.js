// Configurable practice setup. Assessment invitations vary by role and drive.
const ACCENTURE_SECTIONS = {
    cognitive: { name: 'Cognitive Assessment', topics: ['critical thinking', 'abstract reasoning', 'verbal reasoning', 'numerical reasoning', 'pattern recognition', 'data interpretation'], count: 20, minutes: 20 },
    technical: { name: 'Technical Assessment', topics: ['pseudocode', 'programming fundamentals', 'OOP', 'DBMS', 'SQL', 'operating systems', 'networks', 'cloud', 'cybersecurity'], count: 20, minutes: 25 },
    coding: { name: 'Coding Assessment', count: 2, minutes: 60, languages: ['C', 'C++', 'Java', 'Python'] },
    communication: { name: 'Communication Assessment', count: 1, minutes: 20 },
    interview: { name: 'Interview Preparation', count: 1, minutes: 30 }
};

module.exports = { ACCENTURE_SECTIONS };
