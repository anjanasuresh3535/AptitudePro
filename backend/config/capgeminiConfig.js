// Configurable AptitudePro practice targets. The counts shown in the UI are
// always bounded by active, verified content in the local question bank.
const CAPGEMINI_SECTIONS = {
    technical: { name: 'Technical Test', targetCount: 40, minutes: 45, subjects: ['Pseudocode', 'Pseudo Code & Quant', 'Programming Fundamentals', 'C Programming', 'C++ Programming', 'Object Oriented Programming', 'Data Structures', 'DBMS', 'SQL', 'Operating Systems', 'Computer Networks'] },
    english: { name: 'English Communication', targetCount: 30, minutes: 30, subjects: ['Grammar', 'Error Correction', 'Reading Comprehension', 'Verbal Ability', 'English'] },
    listening: { name: 'Listening Comprehension', targetCount: 30, minutes: 30 },
    writing: { name: 'Business Writing', targetCount: 2, minutes: 30 },
    games: { name: 'Cognitive Games', targetCount: 4, minutes: 25 },
    behavioral: { name: 'Behavioral Competency', targetCount: 10, minutes: 25 },
    coding: { name: 'Optional Coding Round', targetCount: 2, minutes: 45, languages: ['C', 'C++', 'Java'] }
};

// Original AptitudePro practice scenarios. They are reflective, not right/wrong
// personality tests; answers are saved for the learner and are never scored.
const BEHAVIORAL_QUESTIONS = [
    { id: 'bg1', type: 'scenario', prompt: 'A teammate misses a handoff that blocks your work. What would you do first?', options: ['Ask them privately what happened and agree on a recovery plan.', 'Tell the whole team they caused the delay.', 'Wait without communicating until they notice.', 'Complete their work without discussing ownership.'] },
    { id: 'bg2', type: 'scenario', prompt: 'A requirement changes shortly before a deadline. How would you respond?', options: ['Clarify the change, assess impact, and share revised options.', 'Ignore the change and deliver the old version.', 'Promise everything without checking feasibility.', 'Blame the requester for changing direction.'] },
    { id: 'bg3', type: 'likert', prompt: 'I ask for clarification when expectations are unclear.' },
    { id: 'bg4', type: 'scenario', prompt: 'You discover an error in work you already submitted. What is the best next step?', options: ['Notify the relevant people promptly and propose a correction.', 'Hope nobody notices.', 'Change the record without telling anyone.', 'Wait until someone else reports it.'] },
    { id: 'bg5', type: 'likert', prompt: 'I make space for teammates with different viewpoints.' },
    { id: 'bg6', type: 'scenario', prompt: 'Two urgent tasks compete for your time. How do you proceed?', options: ['Confirm priorities and communicate a realistic plan.', 'Work on whichever task is easiest without telling anyone.', 'Say both will be finished immediately, regardless of capacity.', 'Stop both tasks until someone follows up.'] },
    { id: 'bg7', type: 'likert', prompt: 'I use feedback to decide what to improve next.' },
    { id: 'bg8', type: 'scenario', prompt: 'A meeting is moving away from its goal. What would you do?', options: ['Respectfully summarize the goal and suggest returning to it.', 'Interrupt repeatedly until everyone stops.', 'Stay silent even if a decision is being missed.', 'End the meeting without agreement.'] },
    { id: 'bg9', type: 'likert', prompt: 'I share progress early when a risk may affect delivery.' },
    { id: 'bg10', type: 'scenario', prompt: 'You disagree with a proposed solution. How would you contribute?', options: ['Explain the concern with evidence and invite comparison of alternatives.', 'Dismiss the idea without explanation.', 'Agree in the meeting and undermine it later.', 'Refuse to continue the work.'] }
];

const WRITING_TASKS = [
    { id: 'email-delay', type: 'email', title: 'Project status email', prompt: 'Write a concise, professional email to your project lead explaining that a dependency is delayed, its likely impact, and the next step you propose.', criteria: ['Clear subject and purpose', 'Professional tone', 'Specific impact and next step'] },
    { id: 'short-update', type: 'short', title: 'Short workplace update', prompt: 'Write a short update (3–5 sentences) for a teammate summarizing a completed task, one remaining risk, and what help you need.', criteria: ['Clear progress summary', 'Risk stated plainly', 'Actionable request'] }
];

module.exports = { CAPGEMINI_SECTIONS, BEHAVIORAL_QUESTIONS, WRITING_TASKS };
