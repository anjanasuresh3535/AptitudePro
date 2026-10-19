// Configurable AptitudePro practice pattern based on the project owner's brief.
// It is not a guaranteed or official pattern for every HCLTech recruitment drive.
const HCLTECH_SECTIONS = {
    quantitative: { name: 'Quantitative / Numerical Ability', targetCount: 15, minutes: 15, category: 'HCLTech Quantitative', section: 'Maths' },
    verbal: { name: 'Verbal Ability', targetCount: 15, minutes: 15, category: 'HCLTech Verbal', section: 'English' },
    logical: { name: 'Logical Reasoning', targetCount: 15, minutes: 15, category: 'HCLTech Logical', section: 'Logical' },
    computer: { name: 'Computer Fundamentals', targetCount: 30, minutes: 30, category: 'HCLTech Computer Fundamentals', section: 'Programming' },
    coding: { name: 'Coding Round', targetCount: 2, minutes: 20, count: 2, languages: ['C', 'C++', 'Java', 'Python'] }
};

const HCLTECH_ASSESSMENT = { objectiveQuestions: 75, objectiveMinutes: 75, totalItems: 77, totalMinutes: 95, negativeMarking: false, adaptive: false };

module.exports = { HCLTECH_SECTIONS, HCLTECH_ASSESSMENT };
