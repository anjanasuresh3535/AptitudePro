// Cognizant written-communication tasks (free_response) and interview prompts
// (interview_prompt). Object format — the seed maps these onto the shared
// Question schema. Automated scoring is NOT enabled: responses are stored for
// self/peer review, so no score is ever invented (mirrors Accenture).

const evaluationCriteriaWriting = ['Relevance', 'Grammar', 'Clarity', 'Professionalism', 'Structure'];
const evaluationCriteriaInterview = ['Specific examples', 'Clear structure', 'Relevant reasoning', 'Professional communication'];

// Communication round: professional writing + one speaking-style prompt.
const communication = [
    { topic: 'Email Writing', responseType: 'email', question: 'Requesting a deadline extension', prompt: 'Write a professional email to your project manager explaining that a deliverable will be delayed by two days. State the reason, the revised completion time, and how you will reduce the impact.', minWords: 60, maxWords: 180 },
    { topic: 'Email Writing', responseType: 'email', question: 'Status update to a stakeholder', prompt: 'Write a brief status email to a client covering completed work, one current risk, the next steps, and any decision you need from them this week.', minWords: 60, maxWords: 180 },
    { topic: 'Email Writing', responseType: 'email', question: 'Reporting a technical blocker', prompt: 'Write an email to your support team describing an application issue that blocks your work. State the impact, what you have already tried, and the specific help you need.', minWords: 60, maxWords: 180 },
    { topic: 'Business Writing', responseType: 'text', question: 'Describe a project you built', prompt: 'In 150-200 words, describe a project you built or a problem you solved. Explain your role, the challenges you faced, and the outcome. Write in complete paragraphs.', minWords: 150, maxWords: 200 },
    { topic: 'Business Writing', responseType: 'text', question: 'Explain a technical concept to a non-technical reader', prompt: 'In 120-180 words, explain what an API is to a non-technical business reader. Use one everyday analogy and avoid jargon.', minWords: 120, maxWords: 180 },
    { topic: 'Speaking', responseType: 'text', question: 'Speaking practice: introduce yourself', prompt: 'Speaking task (audio recording is not available in practice mode, so type the answer you would give). Introduce yourself and explain why you are interested in a technology career, as if speaking for 1-2 minutes without long pauses.', minWords: 120, maxWords: 260 }
];

// Interview round: [category, question, guidance, followUps]
const interview = [
    ['Resume', 'Walk me through your resume, focusing on your most recent project.', 'Keep it to 90 seconds: background -> skills -> key project -> why this role.', []],
    ['Resume', 'What was your specific contribution in your final-year project?', 'Use "I" for your own work; quantify impact (users, accuracy, performance).', ['How did you divide work in the team?', 'What would you do differently now?']],
    ['Resume', 'Which technology in your resume are you most comfortable defending in depth?', 'Be honest; interviewers drill into whatever you claim.', ['Why did you choose it over alternatives?']],
    ['Resume', 'Explain one internship or certification and what you actually learned from it.', 'Focus on applied learning, not the brand name.', []],
    ['Fundamentals', 'What is the difference between a compiled and an interpreted language?', 'C/C++ compile to machine code; Python/JS are interpreted (or JIT). Mention trade-offs: speed vs portability/dev-cycle.', []],
    ['Fundamentals', 'Explain call by value vs call by reference.', 'Use a swap function example; mention Java is always pass-by-value (of references).', []],
    ['Fundamentals', 'What is memory management and why does it matter in C/C++?', 'Cover stack vs heap, malloc/free or new/delete, leaks and dangling pointers.', []],
    ['Fundamentals', 'What are static and dynamic data structures? Give examples.', 'Arrays (fixed) vs stacks/queues/linked lists (grow at runtime).', []],
    ['Fundamentals', 'Explain the difference between an error, a bug and a defect.', 'Short, precise definitions with a debugging example.', []],
    ['OOP & Data Structures', 'Explain the four OOP pillars with one real-world example each.', 'Encapsulation (medicine capsule), inheritance (car is-a vehicle), polymorphism (one button, many devices), abstraction (driving without knowing engine internals).', []],
    ['OOP & Data Structures', 'When would you use an ArrayList vs a LinkedList?', 'Random access & reads: ArrayList. Heavy insert/delete at arbitrary positions: LinkedList. Mention cache locality.', []],
    ['OOP & Data Structures', 'What is the time complexity of common operations on a hash map?', 'Average O(1) get/put; worst case O(n) with collisions; mention resizing.', []],
    ['OOP & Data Structures', 'Difference between overloading and overriding?', 'Same class vs parent-child; compile-time vs runtime polymorphism.', []],
    ['OOP & Data Structures', 'Explain stack vs queue with one application each.', 'Stack: undo / balanced parentheses. Queue: CPU scheduling / printer spool.', []],
    ['Database', 'What is normalisation? Explain 1NF, 2NF and 3NF briefly.', 'Removing redundancy: atomic columns -> full functional dependence on PK -> no transitive dependencies.', []],
    ['Database', 'INNER JOIN vs LEFT JOIN — when do you use each?', 'LEFT JOIN keeps unmatched left rows; use when optional relationships exist.', []],
    ['Database', 'What are indexes and what is their downside?', 'Faster reads, slower writes and extra storage.', []],
    ['Database', 'Explain ACID properties with a money-transfer example.', 'Atomicity (both legs or none), consistency, isolation, durability.', []],
    ['Database', 'DELETE vs TRUNCATE vs DROP?', 'Row-level logged delete vs fast full-table reset vs removing the table itself.', []],
    ['Coding Discussion', 'Talk me through how you would solve "find duplicates in an array" before writing code.', 'Show process: clarify constraints -> brute force O(n^2) -> hash set O(n) -> discuss trade-offs.', []],
    ['Coding Discussion', 'You wrote code that passed your tests but failed in production. What went wrong and what do you change?', 'Own it; discuss missing edge cases and adding test coverage/validation.', []],
    ['Coding Discussion', 'Explain the approach and complexity of binary search.', 'Halving invariant, sorted prerequisite, O(log n), off-by-one pitfalls.', []],
    ['Coding Discussion', 'How do you debug a program that produces the wrong output?', 'Reproduce -> isolate -> print/debugger -> smallest failing case -> fix -> regression test.', []],
    ['Situational', 'Describe a time you disagreed with a teammate. How did you resolve it?', 'STAR format; show listening, data-driven resolution, no blame.', []],
    ['Situational', 'You are given a task with an unclear requirement and your mentor is unavailable. What do you do?', 'Document assumptions, make safe progress, list questions for review.', []],
    ['Situational', 'Tell me about a time you failed to meet a deadline.', 'Honesty + root cause + concrete process change afterwards.', []],
    ['Situational', 'Your team is one member short before a submission. How do you respond?', 'Prioritise scope, redistribute by strength, communicate risk early.', []],
    ['Situational', 'How do you handle repetitive work, like extensive documentation or testing?', 'Show diligence and any automation mindset.', []],
    ['HR', 'Why do you want to join Cognizant?', 'Research: scale, training programs, domains, recent news. Connect to your goals.', []],
    ['HR', 'Where do you see yourself in 3-5 years?', 'Growth in depth (technical) or breadth (lead/architect), aligned with the company.', []],
    ['HR', 'What are your strengths and one genuine area of improvement?', 'Strengths with evidence; weakness with an active improvement plan.', []],
    ['HR', 'Are you open to relocation and shift work?', 'Answer honestly; flexibility is valued but never misrepresent yourself.', []],
    ['HR', 'Do you have any questions for us?', 'Always prepare 2-3: team structure, learning path, evaluation. Never say "no questions".', []]
];

module.exports = {
    communication,
    interview,
    evaluationCriteriaWriting,
    evaluationCriteriaInterview
};
