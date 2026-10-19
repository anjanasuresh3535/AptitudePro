const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'backend', 'data', 'infosys');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating Infosys Question Banks into:', outDir);

// Helpers
function makeQ(opts) {
    return {
        question: opts.question,
        option1: opts.options[0],
        option2: opts.options[1],
        option3: opts.options[2],
        option4: opts.options[3],
        answer: opts.answer,
        section: opts.section,
        subject: opts.subject,
        category: opts.category || opts.subject,
        difficultyLevel: opts.difficultyLevel,
        explanation: opts.explanation,
        company: 'Infosys',
        exam: 'Infosys_InfyTQ',
        level: opts.difficultyLevel === 1 ? 'Foundation' : (opts.difficultyLevel === 2 ? 'Intermediate' : 'Advanced'),
        topic: opts.subject,
        subtopic: opts.category || opts.subject,
        difficulty: opts.difficultyLevel === 1 ? 'Easy' : (opts.difficultyLevel === 2 ? 'Medium' : 'Hard'),
        questionType: 'mcq',
        sourceType: 'Original AptitudePro',
        sourceTitle: 'AptitudePro Infosys Practice Bank',
        sourceURL: '',
        sourceYear: '2025',
        learningPath: 'college',
        placementType: 'company',
        active: true
    };
}

// -------------------------------------------------------------
// 1. TECHNICAL ABILITY (100 QUESTIONS)
// -------------------------------------------------------------
const technicalQs = [];

// Topics & Templates for 100 Technical questions
const techTopics = [
    {
        name: 'Percentages',
        gen: (i, diff) => {
            if (i % 3 === 0) {
                const pop = 50000 + i * 2000;
                const r1 = 10;
                const r2 = 20;
                const ans = Math.round(pop * (1 + r1/100) * (1 - r2/100));
                return makeQ({
                    question: `The population of a town is currently ${pop}. If it increases by ${r1}% in the first year and decreases by ${r2}% in the second year, what will the population be at the end of two years?`,
                    options: [`${ans}`, `${ans + 500}`, `${ans - 400}`, `${ans + 1200}`],
                    answer: `${ans}`,
                    section: 'Maths',
                    subject: 'Percentages',
                    difficultyLevel: diff,
                    explanation: `Population after 1st year = ${pop} * 1.${r1} = ${pop * 1.1}. Population after 2nd year = ${pop * 1.1} * 0.8 = ${ans}.`
                });
            } else if (i % 3 === 1) {
                const inc = 20 + (i % 4) * 5;
                const dec = Math.round((inc / (100 + inc)) * 100 * 100) / 100;
                const ansStr = `${dec}%`;
                return makeQ({
                    question: `If salary of employee A is ${inc}% more than that of employee B, by what percentage is employee B's salary less than that of employee A?`,
                    options: [ansStr, `${inc}%`, `${Math.round((dec - 2) * 10) / 10}%`, `${Math.round((dec + 3) * 10) / 10}%`],
                    answer: ansStr,
                    section: 'Maths',
                    subject: 'Percentages',
                    difficultyLevel: diff,
                    explanation: `Percentage reduction = [${inc} / (100 + ${inc})] * 100 = ${inc}/(100+${inc}) * 100 = ${ansStr}.`
                });
            } else {
                const cp = 1200 + i * 50;
                const p1 = 25;
                const p2 = 10;
                const sp = Math.round(cp * (1 + p1/100) * (1 - p2/100));
                return makeQ({
                    question: `A retailer marks an item with cost price ₹${cp} up by ${p1}%, and then gives a discount of ${p2}% on the marked price. What is the final selling price?`,
                    options: [`₹${sp}`, `₹${sp + 45}`, `₹${sp - 30}`, `₹${cp + 100}`],
                    answer: `₹${sp}`,
                    section: 'Maths',
                    subject: 'Percentages',
                    difficultyLevel: diff,
                    explanation: `Marked Price = ${cp} * 1.${p1} = ₹${cp * 1.25}. Selling Price = Marked Price * 0.90 = ₹${sp}.`
                });
            }
        }
    },
    {
        name: 'Time and Work',
        gen: (i, diff) => {
            const a = 10 + (i % 5) * 2;
            const b = 15 + (i % 5) * 3;
            const combined = Math.round(((a * b) / (a + b)) * 100) / 100;
            const ansStr = `${combined} days`;
            return makeQ({
                question: `A can complete a piece of work in ${a} days, while B can complete the same work in ${b} days. If both work together, in how many days will the work be completed?`,
                options: [ansStr, `${Math.round(combined + 2)} days`, `${Math.round(combined - 1.5)} days`, `${a + b} days`],
                answer: ansStr,
                section: 'Maths',
                subject: 'Time and Work',
                difficultyLevel: diff,
                explanation: `A's 1-day work = 1/${a}, B's 1-day work = 1/${b}. Combined 1-day work = (${a}+${b})/(${a}*${b}). Total days required = (${a}*${b})/(${a}+${b}) = ${ansStr}.`
            });
        }
    },
    {
        name: 'Speed, Time and Distance',
        gen: (i, diff) => {
            const s1 = 40 + (i % 6) * 5;
            const s2 = 60 + (i % 6) * 5;
            const avgSpeed = Math.round(((2 * s1 * s2) / (s1 + s2)) * 100) / 100;
            const ansStr = `${avgSpeed} km/h`;
            return makeQ({
                question: `A car travels from City X to City Y at an average speed of ${s1} km/h and returns along the same route at ${s2} km/h. What is the average speed for the entire journey?`,
                options: [ansStr, `${(s1 + s2) / 2} km/h`, `${avgSpeed - 3} km/h`, `${avgSpeed + 4} km/h`],
                answer: ansStr,
                section: 'Maths',
                subject: 'Speed, Time and Distance',
                difficultyLevel: diff,
                explanation: `Since distance both ways is identical, Average Speed = 2 * S1 * S2 / (S1 + S2) = 2 * ${s1} * ${s2} / (${s1} + ${s2}) = ${ansStr}.`
            });
        }
    },
    {
        name: 'Permutation and Combination',
        gen: (i, diff) => {
            const words = ['SYSTEM', 'INFOSYS', 'ALGORITHM', 'DIGITAL', 'PROGRAM'];
            const w = words[i % words.length];
            // count permutations of w
            const len = w.length;
            const counts = {};
            for (const char of w) counts[char] = (counts[char] || 0) + 1;
            function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }
            let total = fact(len);
            for (const k in counts) total /= fact(counts[k]);
            return makeQ({
                question: `In how many distinct ways can the letters of the word "${w}" be arranged?`,
                options: [`${total}`, `${total + 120}`, `${total / 2}`, `${total * 2}`],
                answer: `${total}`,
                section: 'Maths',
                subject: 'Permutation and Combination',
                difficultyLevel: diff,
                explanation: `The word "${w}" has ${len} letters. Accounts for repeated letters by dividing by the factorials of frequencies: ${len}! / repeats = ${total}.`
            });
        }
    },
    {
        name: 'Probability',
        gen: (i, diff) => {
            const r = 4 + (i % 3);
            const b = 5 + (i % 3);
            const g = 3 + (i % 2);
            const total = r + b + g;
            // probability of drawing 2 red balls
            const favorable = (r * (r - 1)) / 2;
            const totalWays = (total * (total - 1)) / 2;
            function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
            const gDiv = gcd(favorable, totalWays);
            const ansStr = `${favorable / gDiv}/${totalWays / gDiv}`;
            return makeQ({
                question: `An urn contains ${r} red balls, ${b} blue balls, and ${g} green balls. If 2 balls are drawn at random without replacement, what is the probability that both are red?`,
                options: [ansStr, `${(favorable + 2) / gDiv}/${totalWays / gDiv}`, `1/${total}`, `${r}/${total}`],
                answer: ansStr,
                section: 'Maths',
                subject: 'Probability',
                difficultyLevel: diff,
                explanation: `Total balls = ${total}. Ways to choose 2 from ${total} = C(${total},2) = ${totalWays}. Ways to choose 2 red from ${r} = C(${r},2) = ${favorable}. Probability = ${favorable}/${totalWays} = ${ansStr}.`
            });
        }
    },
    {
        name: 'Profit and Loss',
        gen: (i, diff) => {
            const cp = 800 + i * 40;
            const p = 20;
            const sp = cp * 1.2;
            return makeQ({
                question: `A shopkeeper sells a gadget for ₹${sp}, gaining a profit of ${p}%. What was the original cost price of the gadget?`,
                options: [`₹${cp}`, `₹${cp - 50}`, `₹${cp + 80}`, `₹${Math.round(sp * 0.8)}`],
                answer: `₹${cp}`,
                section: 'Maths',
                subject: 'Profit and Loss',
                difficultyLevel: diff,
                explanation: `Cost Price = SP / (1 + Profit%/100) = ₹${sp} / 1.20 = ₹${cp}.`
            });
        }
    },
    {
        name: 'Boats and Streams',
        gen: (i, diff) => {
            const b = 15 + (i % 4) * 2;
            const s = 3 + (i % 3);
            const down = b + s;
            const up = b - s;
            const dist = 72;
            const time = Math.round((dist / down + dist / up) * 10) / 10;
            return makeQ({
                question: `A boat has a speed of ${b} km/h in still water and the river current flows at ${s} km/h. How much total time will it take for the boat to travel ${dist} km downstream and then return upstream to the starting point?`,
                options: [`${time} hours`, `${time + 2} hours`, `${time - 1.5} hours`, `${Math.round(dist/b * 2)} hours`],
                answer: `${time} hours`,
                section: 'Maths',
                subject: 'Boats and Streams',
                difficultyLevel: diff,
                explanation: `Downstream speed = ${b} + ${s} = ${down} km/h. Downstream time = ${dist}/${down}h. Upstream speed = ${b} - ${s} = ${up} km/h. Upstream time = ${dist}/${up}h. Total time = ${time} hours.`
            });
        }
    },
    {
        name: 'Mixtures and Alligation',
        gen: (i, diff) => {
            const c1 = 40;
            const c2 = 70;
            const m = 50 + (i % 4) * 3;
            // ratio = (c2 - m) : (m - c1)
            const d1 = c2 - m;
            const d2 = m - c1;
            function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
            const g = gcd(d1, d2);
            const ansStr = `${d1 / g} : ${d2 / g}`;
            return makeQ({
                question: `In what ratio must tea worth ₹${c1}/kg be mixed with tea worth ₹${c2}/kg so that the resulting mixture is worth ₹${m}/kg?`,
                options: [ansStr, `${d2 / g} : ${d1 / g}`, `1 : 2`, `3 : 4`],
                answer: ansStr,
                section: 'Maths',
                subject: 'Mixtures and Alligation',
                difficultyLevel: diff,
                explanation: `By Rule of Alligation: Cheaper / Dearer = (Dearer Price - Mean Price) / (Mean Price - Cheaper Price) = (${c2} - ${m}) / (${m} - ${c1}) = ${d1}/${d2} = ${ansStr}.`
            });
        }
    },
    {
        name: 'Problems on Ages',
        gen: (i, diff) => {
            const k = 4 + (i % 3);
            const presentFather = 7 * k;
            const presentSon = 2 * k;
            const afterYears = 6;
            return makeQ({
                question: `The present ages of a father and his son are in the ratio 7 : 2. If the son is currently ${presentSon} years old, what will be the father's age after ${afterYears} years?`,
                options: [`${presentFather + afterYears} years`, `${presentFather} years`, `${presentFather + 10} years`, `${presentSon * 4} years`],
                answer: `${presentFather + afterYears} years`,
                section: 'Maths',
                subject: 'Problems on Ages',
                difficultyLevel: diff,
                explanation: `Present son's age = ${presentSon} = 2k -> k = ${k}. Father's present age = 7k = ${presentFather}. After ${afterYears} years, father's age = ${presentFather} + ${afterYears} = ${presentFather + afterYears} years.`
            });
        }
    },
    {
        name: 'LCM and HCF',
        gen: (i, diff) => {
            const h = 12 + (i % 5) * 2;
            const r1 = 3;
            const r2 = 5;
            const n1 = h * r1;
            const n2 = h * r2;
            const lcm = h * r1 * r2;
            return makeQ({
                question: `Two numbers are in the ratio ${r1} : ${r2} and their HCF is ${h}. What is their Lowest Common Multiple (LCM)?`,
                options: [`${lcm}`, `${lcm + 24}`, `${n1 + n2}`, `${h * (r1 + r2)}`],
                answer: `${lcm}`,
                section: 'Maths',
                subject: 'LCM and HCF',
                difficultyLevel: diff,
                explanation: `Let the numbers be ${r1}x and ${r2}x where x is the HCF = ${h}. The numbers are ${n1} and ${n2}. LCM = HCF * ${r1} * ${r2} = ${h} * ${r1} * ${r2} = ${lcm}.`
            });
        }
    }
];

// Generate 100 Technical questions across 35 Easy, 40 Medium, 25 Hard
for (let i = 0; i < 100; i++) {
    const diff = i < 35 ? 1 : (i < 75 ? 2 : 3);
    const topicObj = techTopics[i % techTopics.length];
    technicalQs.push(topicObj.gen(i, diff));
}

fs.writeFileSync(path.join(outDir, 'infosys_technical.json'), JSON.stringify(technicalQs, null, 2), 'utf-8');
console.log(`Generated ${technicalQs.length} Technical Ability questions.`);

// -------------------------------------------------------------
// 2. LOGICAL REASONING (100 QUESTIONS)
// -------------------------------------------------------------
const logicalQs = [];

const logicalTopics = [
    {
        name: 'Arrangements',
        gen: (i, diff) => {
            return makeQ({
                question: `Six colleagues (P, Q, R, S, T, and U) are seated in a row facing north. P sits third to the left of T. Q sits to the immediate right of T. R is not an immediate neighbour of P or T. If S sits at one of the extreme ends, who sits to the immediate left of Q?`,
                options: ['T', 'P', 'R', 'U'],
                answer: 'T',
                section: 'Logical',
                subject: 'Arrangements',
                difficultyLevel: diff,
                explanation: `Given that Q sits to the immediate right of T, T must be to the immediate left of Q. Hence, T is immediately to Q's left.`
            });
        }
    },
    {
        name: 'Syllogisms',
        gen: (i, diff) => {
            return makeQ({
                question: `Statements:\n1. All developers are problem solvers.\n2. Some problem solvers are data analysts.\nConclusions:\nI. Some developers are data analysts.\nII. Some data analysts are problem solvers.`,
                options: ['Only conclusion II follows', 'Only conclusion I follows', 'Both I and II follow', 'Neither I nor II follows'],
                answer: 'Only conclusion II follows',
                section: 'Logical',
                subject: 'Syllogisms',
                difficultyLevel: diff,
                explanation: `Statement 2 says 'Some problem solvers are data analysts', which converts directly to 'Some data analysts are problem solvers' (Conclusion II is valid). There is no guaranteed overlap between developers and data analysts (Conclusion I does not necessarily follow).`
            });
        }
    },
    {
        name: 'Coding-Decoding',
        gen: (i, diff) => {
            const shift = 2 + (i % 3);
            const original = 'CLOUD';
            let coded = '';
            for (let c of original) coded += String.fromCharCode(c.charCodeAt(0) + shift);
            const target = 'FRAME';
            let targetCoded = '';
            for (let c of target) targetCoded += String.fromCharCode(c.charCodeAt(0) + shift);
            return makeQ({
                question: `If in a certain code language, "${original}" is coded as "${coded}", how will "${target}" be written in that same code?`,
                options: [targetCoded, `${targetCoded.slice(0, -1)}Z`, `${targetCoded.slice(1)}A`, 'ESZLD'],
                answer: targetCoded,
                section: 'Logical',
                subject: 'Coding-Decoding',
                difficultyLevel: diff,
                explanation: `Each letter is shifted forward by ${shift} positions in the alphabet. Shifting each letter in "${target}" forward by ${shift} gives "${targetCoded}".`
            });
        }
    },
    {
        name: 'Number Series',
        gen: (i, diff) => {
            const a = 3 + i * 2;
            const d = 4 + (i % 4);
            const s = [a, a + d, a + 2*d, a + 3*d, a + 4*d];
            const next = a + 5*d;
            return makeQ({
                question: `Identify the next number in the series: ${s.join(', ')}, ?`,
                options: [`${next}`, `${next + 2}`, `${next - 3}`, `${next + 5}`],
                answer: `${next}`,
                section: 'Logical',
                subject: 'Number Series',
                difficultyLevel: diff,
                explanation: `The common difference between successive terms is +${d}. Next term = ${s[4]} + ${d} = ${next}.`
            });
        }
    },
    {
        name: 'Clocks and Calendar',
        gen: (i, diff) => {
            const hours = 3 + (i % 5);
            const mins = 30;
            // Angle = |30*H - 5.5*M|
            const angle = Math.abs(30 * hours - 5.5 * mins);
            return makeQ({
                question: `What is the acute angle between the hour hand and minute hand of a clock at ${hours}:${mins}?`,
                options: [`${angle}°`, `${angle + 10}°`, `${angle - 15}°`, `${180 - angle}°`],
                answer: `${angle}°`,
                section: 'Logical',
                subject: 'Clocks and Calendar',
                difficultyLevel: diff,
                explanation: `Angle formula = |30*H - (11/2)*M| = |30*${hours} - 5.5*${mins}| = |${30*hours} - ${5.5*mins}| = ${angle}°.`
            });
        }
    },
    {
        name: 'Data Sufficiency',
        gen: (i, diff) => {
            return makeQ({
                question: `Question: Is integer X even?\nStatement 1: X is divisible by 4.\nStatement 2: X + 3 is an odd number.`,
                options: ['Either statement alone is sufficient', 'Statement 1 alone is sufficient, but Statement 2 alone is not', 'Statement 2 alone is sufficient, but Statement 1 alone is not', 'Both statements together are needed'],
                answer: 'Either statement alone is sufficient',
                section: 'Logical',
                subject: 'Data Sufficiency',
                difficultyLevel: diff,
                explanation: `From Statement 1: If X is divisible by 4, it is definitely a multiple of 2 (even). Sufficient. From Statement 2: If X + 3 is odd, X = odd - 3 = even. Sufficient. Thus, either statement alone is sufficient.`
            });
        }
    },
    {
        name: 'Logical Deduction',
        gen: (i, diff) => {
            return makeQ({
                question: `Given: "If the server is overloaded, the response time degrades." Which of the following is logically equivalent to this statement?`,
                options: [
                    'If the response time does not degrade, the server is not overloaded.',
                    'If the response time degrades, the server must be overloaded.',
                    'If the server is not overloaded, the response time will not degrade.',
                    'The server is overloaded only if response time is fast.'
                ],
                answer: 'If the response time does not degrade, the server is not overloaded.',
                section: 'Logical',
                subject: 'Logical Deduction',
                difficultyLevel: diff,
                explanation: `The contrapositive of conditional statement (P -> Q) is (~Q -> ~P), which is logically equivalent. Here, P = 'server overloaded', Q = 'response time degrades'. The contrapositive is 'If response time does not degrade, the server is not overloaded'.`
            });
        }
    },
    {
        name: 'Cryptarithmetic',
        gen: (i, diff) => {
            return makeQ({
                question: `In the cryptarithmetic addition problem: AB + BA = CDC, where each distinct letter represents a unique single digit from 0 to 9, what is the value of C?`,
                options: ['1', '2', '9', '0'],
                answer: '1',
                section: 'Logical',
                subject: 'Cryptarithmetic',
                difficultyLevel: diff,
                explanation: `The maximum sum of two two-digit numbers is 99 + 99 = 198. Therefore, the hundreds digit C in a 3-digit sum CDC must be 1.`
            });
        }
    }
];

for (let i = 0; i < 100; i++) {
    const diff = i < 30 ? 1 : (i < 75 ? 2 : 3);
    const topicObj = logicalTopics[i % logicalTopics.length];
    logicalQs.push(topicObj.gen(i, diff));
}

fs.writeFileSync(path.join(outDir, 'infosys_logical.json'), JSON.stringify(logicalQs, null, 2), 'utf-8');
console.log(`Generated ${logicalQs.length} Logical Reasoning questions.`);

// -------------------------------------------------------------
// 3. VERBAL ABILITY (100 QUESTIONS)
// -------------------------------------------------------------
const verbalQs = [];

const verbalTopics = [
    {
        name: 'Reading Comprehension',
        gen: (i, diff) => {
            const passages = [
                {
                    pass: 'Distributed cloud computing allows organisations to deploy computing resources across multiple geographic locations while maintaining centralised management. This model reduces latency, improves fault tolerance, and ensures compliance with regional data residency laws. However, it introduces significant complexity in data consistency and network telemetry.',
                    q: 'According to the passage, what is a primary operational benefit of distributed cloud architecture?',
                    ans: 'Decreased latency and enhanced fault resilience',
                    opts: ['Decreased latency and enhanced fault resilience', 'Complete elimination of data residency regulations', 'Zero telemetry overhead', 'Guaranteed absolute consistency without synchronization']
                },
                {
                    pass: 'Agile development methodologies emphasise rapid iterations, continuous feedback, and adaptive planning. Unlike traditional sequential models where specifications are fixed upfront, Agile welcomes evolving requirements even late in development. This adaptability reduces market risk but demands rigorous communication and automated testing to avoid technical debt.',
                    q: 'What does the author identify as an essential countermeasure to technical debt in Agile environments?',
                    ans: 'Rigorous communication and automated testing',
                    opts: ['Rigorous communication and automated testing', 'Eliminating user feedback cycles', 'Fixing all project specifications before coding starts', 'Abandoning iterative releases']
                }
            ];
            const p = passages[i % passages.length];
            return makeQ({
                question: `Read the following excerpt and answer the question:\n\n"${p.pass}"\n\nQuestion: ${p.q}`,
                options: p.opts,
                answer: p.ans,
                section: 'English',
                subject: 'Reading Comprehension',
                difficultyLevel: diff,
                explanation: `The passage directly identifies "${p.ans}" as the correct assertion corresponding to the context.`
            });
        }
    },
    {
        name: 'Sentence Correction',
        gen: (i, diff) => {
            return makeQ({
                question: `Choose the grammatically correct version of the sentence:\n"The team leader along with the system architects has finalised the database migration roadmap."`,
                options: [
                    'The team leader along with the system architects has finalised the database migration roadmap.',
                    'The team leader along with the system architects have finalised the database migration roadmap.',
                    'The team leader along with the system architects are finalised the database migration roadmap.',
                    'The team leader along with the system architects were finalised the database migration roadmap.'
                ],
                answer: 'The team leader along with the system architects has finalised the database migration roadmap.',
                section: 'English',
                subject: 'Sentence Correction',
                difficultyLevel: diff,
                explanation: `The parenthetical phrase 'along with...' does not affect the grammatical number of the subject 'The team leader', which is singular. Thus, the singular auxiliary 'has' is correct.`
            });
        }
    },
    {
        name: 'Para Jumbles',
        gen: (i, diff) => {
            return makeQ({
                question: `Rearrange the following sentences into a coherent, logical paragraph:\nA. Consequently, legacy codebases must undergo rigorous architectural refactoring.\nB. Software architectures inevitably degrade as new features are hastily appended.\nC. This continuous erosion of structure is commonly termed technical debt.\nD. When unaddressed, it drastically hampers delivery velocity.`,
                options: ['BCDA', 'ACBD', 'BADC', 'DCBA'],
                answer: 'BCDA',
                section: 'English',
                subject: 'Para Jumbles',
                difficultyLevel: diff,
                explanation: `Sentence B introduces the premise (architectures degrade). C defines this phenomenon (termed technical debt). D explains the adverse consequence (hampers delivery velocity). A provides the concluding remedy (consequently, refactoring is needed). Logical order: B-C-D-A.`
            });
        }
    },
    {
        name: 'Fill in the Blanks',
        gen: (i, diff) => {
            return makeQ({
                question: `Fill in the blank with the most contextually appropriate word:\n"The senior engineer gave a very ________ explanation of how the cryptographic hashing mechanism operates."`,
                options: ['lucid', 'opaque', 'obsolete', 'superficial'],
                answer: 'lucid',
                section: 'English',
                subject: 'Fill in the Blanks',
                difficultyLevel: diff,
                explanation: `'Lucid' means clear, articulate, and easily understood, which matches the positive context of an effective explanation.`
            });
        }
    },
    {
        name: 'One Word Substitution',
        gen: (i, diff) => {
            return makeQ({
                question: `Choose the word that can substitute the given phrase:\n"A person who is capable of using both hands with equal skill and dexterity."`,
                options: ['Ambidextrous', 'Ambivalent', 'Audacious', 'Articulate'],
                answer: 'Ambidextrous',
                section: 'English',
                subject: 'One Word Substitution',
                difficultyLevel: diff,
                explanation: `'Ambidextrous' refers to the ability to use the right and left hands equally well.`
            });
        }
    },
    {
        name: 'Critical Reasoning',
        gen: (i, diff) => {
            return makeQ({
                question: `Argument: "Company X recently switched to a 4-day workweek, and reported a 15% increase in weekly code commits. Therefore, reducing working days inherently increases engineer productivity."\nWhich of the following, if true, most seriously weakens the argument?`,
                options: [
                    'During the trial period, Company X simultaneously introduced automated CI/CD tools that expedited build and commit times.',
                    'Engineers reported feeling happier with three days of weekend rest.',
                    'The company operates in the enterprise software sector.',
                    'Other companies have historically used standard five-day schedules.'
                ],
                answer: 'During the trial period, Company X simultaneously introduced automated CI/CD tools that expedited build and commit times.',
                section: 'English',
                subject: 'Critical Reasoning',
                difficultyLevel: diff,
                explanation: `Introducing automated CI/CD tools provides an alternative explanatory cause for the increased commit rate, thereby weakening the claim that the 4-day schedule was the sole causal factor.`
            });
        }
    },
    {
        name: 'Analogy',
        gen: (i, diff) => {
            return makeQ({
                question: `Select the pair that exhibits the same relationship as the given pair:\nALGORITHM : COMPUTER`,
                options: ['RECIPE : CHEF', 'BRICK : ARCHITECTURE', 'SCALPEL : SURGERY', 'CANVAS : BRUSH'],
                answer: 'RECIPE : CHEF',
                section: 'English',
                subject: 'Analogy',
                difficultyLevel: diff,
                explanation: `An algorithm is a step-by-step set of instructions followed by a computer to produce a result, just as a recipe is a set of instructions followed by a chef.`
            });
        }
    },
    {
        name: 'Spotting Errors',
        gen: (i, diff) => {
            return makeQ({
                question: `Identify the segment containing the error:\n"Scarcely had the build completed (A) / than the automated test suite (B) / encountered an unexpected null pointer exception (C) / during integration testing (D)."`,
                options: ['B', 'A', 'C', 'D'],
                answer: 'B',
                section: 'English',
                subject: 'Spotting Errors',
                difficultyLevel: diff,
                explanation: `'Scarcely' is paired with 'when', not 'than'. The correct phrasing is 'Scarcely had the build completed when...'. Error is in segment B.`
            });
        }
    }
];

for (let i = 0; i < 100; i++) {
    const diff = i < 35 ? 1 : (i < 75 ? 2 : 3);
    const topicObj = verbalTopics[i % verbalTopics.length];
    verbalQs.push(topicObj.gen(i, diff));
}

fs.writeFileSync(path.join(outDir, 'infosys_verbal.json'), JSON.stringify(verbalQs, null, 2), 'utf-8');
console.log(`Generated ${verbalQs.length} Verbal Ability questions.`);
console.log('ALL QUESTION BANKS SUCCESSFULLY GENERATED!');
