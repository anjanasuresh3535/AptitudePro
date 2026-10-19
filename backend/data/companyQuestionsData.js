// backend/data/companyQuestionsData.js
// Company Practice Question Bank (1,350 Questions Total)
// 9 Companies x 3 Difficulty Levels x 50 Questions per Level = 1,350 Questions
// Companies: TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini, HCLTech, Tech Mahindra, IBM

const COMPANIES = [
    { name: 'TCS', focus: 'Numerical & Logical Reasoning' },
    { name: 'Infosys', focus: 'Analytical & Verbal Aptitude' },
    { name: 'Wipro', focus: 'Quantitative & Logical Ability' },
    { name: 'Accenture', focus: 'Critical Thinking & Abstract Logic' },
    { name: 'Cognizant', focus: 'Data Interpretation & Reasoning' },
    { name: 'Capgemini', focus: 'Game-Based & Pseudo Code Aptitude' },
    { name: 'HCLTech', focus: 'Technical & Quantitative Aptitude' },
    { name: 'Tech Mahindra', focus: 'Aptitude & Verbal Fluency' },
    { name: 'IBM', focus: 'Cognitive & Problem Solving Skills' }
];

const companyQuestions = [];

function generateCompanyBank() {
    COMPANIES.forEach((compObj) => {
        const companyName = compObj.name;

        for (let level = 1; level <= 3; level++) {
            const levelLabel = level === 1 ? 'Foundation' : (level === 2 ? 'Intermediate' : 'Advanced');

            for (let qIndex = 1; qIndex <= 50; qIndex++) {
                let sec = 'Maths';
                let subj = 'Quantitative Aptitude';
                let cat = 'Numerical Reasoning';
                let qText = '';
                let o1 = '', o2 = '', o3 = '', o4 = '', ans = '';
                let exp = '', step = '', formula = '', trick = '', mistake = '';

                const topicChoice = qIndex % 4;

                if (topicChoice === 1) {
                    // QUANTITATIVE REASONING PATTERN
                    sec = 'Maths';
                    subj = 'Quantitative Aptitude';
                    cat = `${companyName} Quant Pattern`;

                    if (level === 1) {
                        const baseVal = 20 + qIndex * 3;
                        const pct = 15;
                        const result = (baseVal * (100 + pct)) / 100;
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] A team completed a task in ${baseVal} hours. Efficiency improved by ${pct}%. How many effective work units were produced?`;
                        ans = `${result}`;
                        o1 = `${result - 2}`; o2 = `${result}`; o3 = `${result + 2.5}`; o4 = `${result + 5}`;
                        exp = `Work units = ${baseVal} * (1 + ${pct}/100) = ${result}.`;
                        step = `${baseVal} * 1.15 = ${result}.`;
                        formula = 'Final Value = Base * (1 + Rate/100)';
                        trick = 'Calculate 10% then 5% and add to base value.';
                        mistake = 'Subtracting percentage instead of adding.';
                    } else if (level === 2) {
                        const distance = 120 + qIndex * 10;
                        const speed1 = 40 + (qIndex % 5) * 5;
                        const timeVal = (distance / speed1).toFixed(2);
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] A delivery truck travels ${distance} km at an average speed of ${speed1} km/h. What is the total travel time in hours?`;
                        ans = `${timeVal} hours`;
                        o1 = `${(parseFloat(timeVal) - 0.5).toFixed(2)} hours`;
                        o2 = `${timeVal} hours`;
                        o3 = `${(parseFloat(timeVal) + 0.5).toFixed(2)} hours`;
                        o4 = `${(parseFloat(timeVal) + 1.0).toFixed(2)} hours`;
                        exp = `Time = Distance / Speed = ${distance} / ${speed1} = ${timeVal} hours.`;
                        step = `${distance} / ${speed1} = ${timeVal}.`;
                        formula = 'Time = Distance / Speed';
                        trick = 'Direct ratio of distance to speed.';
                        mistake = 'Inverting speed and distance.';
                    } else {
                        const principal = 5000 + qIndex * 200;
                        const rate = 10;
                        const interest = (principal * rate * 2) / 100;
                        const ciDiff = (principal * (rate / 100) ** 2);
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] Find the difference between Compound Interest and Simple Interest on ₹${principal} at ${rate}% per annum for 2 years.`;
                        ans = `₹${ciDiff}`;
                        o1 = `₹${ciDiff - 10}`; o2 = `₹${ciDiff}`; o3 = `₹${ciDiff + 10}`; o4 = `₹${ciDiff + 20}`;
                        exp = `Difference = P * (R/100)^2 = ${principal} * (${rate}/100)^2 = ₹${ciDiff}.`;
                        step = `${principal} * 0.01 = ${ciDiff}.`;
                        formula = 'Difference = P * (R/100)^2 for 2 years';
                        trick = 'Multiply principal by (R/100)^2.';
                        mistake = 'Calculating 3-year difference formula.';
                    }

                } else if (topicChoice === 2) {
                    // LOGICAL REASONING PATTERN
                    sec = 'Logical';
                    subj = 'Logical Reasoning';
                    cat = `${companyName} Logical Pattern`;

                    if (level === 1) {
                        const start = qIndex * 2 + 5;
                        const diff = 4;
                        const t1 = start, t2 = start + diff, t3 = t2 + diff, t4 = t3 + diff, t5 = t4 + diff;
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] What is the next number in the sequence: ${t1}, ${t2}, ${t3}, ${t4}, ?`;
                        ans = `${t5}`;
                        o1 = `${t5 - 2}`; o2 = `${t5}`; o3 = `${t5 + 2}`; o4 = `${t5 + 4}`;
                        exp = `The sequence adds +${diff} at each step. ${t4} + ${diff} = ${t5}.`;
                        step = `${t4} + ${diff} = ${t5}.`;
                        formula = 'Arithmetic Progression Series';
                        trick = `Constant step difference of ${diff}.`;
                        mistake = 'Adding wrong step difference.';
                    } else if (level === 2) {
                        const codeOffset = (qIndex % 5) + 1;
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] If CODE is written as ${String.fromCharCode(67+codeOffset)}${String.fromCharCode(79+codeOffset)}${String.fromCharCode(68+codeOffset)}${String.fromCharCode(69+codeOffset)}, how is DATA written under the same rule?`;
                        const cD = String.fromCharCode(68+codeOffset);
                        const cA = String.fromCharCode(65+codeOffset);
                        const cT = String.fromCharCode(84+codeOffset);
                        ans = `${cD}${cA}${cT}${cA}`;
                        o1 = `${cD}${cA}${cT}${cA}`;
                        o2 = `${String.fromCharCode(68+codeOffset-1)}${cA}${cT}${cA}`;
                        o3 = `${cD}${cA}${String.fromCharCode(84+codeOffset+1)}${cA}`;
                        o4 = `${cD}${cA}${cT}${String.fromCharCode(65+codeOffset+1)}`;
                        exp = `Each letter is shifted forward by +${codeOffset} positions.`;
                        step = `D+${codeOffset}=${cD}, A+${codeOffset}=${cA}, T+${codeOffset}=${cT}, A+${codeOffset}=${cA}.`;
                        formula = `Alphabet Position Shift (+${codeOffset})`;
                        trick = `Apply fixed shift +${codeOffset} to each letter.`;
                        mistake = 'Applying variable shift instead of fixed shift.';
                    } else {
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] In a row of 50 candidates, Ramesh is ${10 + (qIndex % 15)}th from left end. What is his rank from right end?`;
                        const leftRank = 10 + (qIndex % 15);
                        const rightRank = 50 - leftRank + 1;
                        ans = `${rightRank}th`;
                        o1 = `${rightRank - 1}th`; o2 = `${rightRank}th`; o3 = `${rightRank + 1}th`; o4 = `${rightRank + 2}th`;
                        exp = `Right Rank = Total - Left Rank + 1 = 50 - ${leftRank} + 1 = ${rightRank}.`;
                        step = `50 - ${leftRank} + 1 = ${rightRank}.`;
                        formula = 'Total = Left Rank + Right Rank - 1';
                        trick = 'Subtract left rank from total and add 1.';
                        mistake = 'Forgetting to add 1.';
                    }

                } else if (topicChoice === 3) {
                    // VERBAL ABILITY PATTERN
                    sec = 'English';
                    subj = 'Verbal Ability';
                    cat = `${companyName} Verbal Pattern`;

                    const verbalWords = [
                        { word: 'ACCELERATE', syn: 'Speed up', ant: 'Delay' },
                        { word: 'METICULOUS', syn: 'Precise', ant: 'Careless' },
                        { word: 'PRAGMATIC', syn: 'Practical', ant: 'Idealistic' },
                        { word: 'CANDID', syn: 'Frank', ant: 'Deceitful' },
                        { word: 'OPTIMAL', syn: 'Best', ant: 'Worst' },
                        { word: 'LUCID', syn: 'Clear', ant: 'Obscure' },
                        { word: 'ROBUST', syn: 'Strong', ant: 'Weak' },
                        { word: 'INNOVATIVE', syn: 'Creative', ant: 'Conventional' },
                        { word: 'RESILIENT', syn: 'Tough', ant: 'Fragile' },
                        { word: 'VERSATILE', syn: 'Adaptable', ant: 'Rigid' }
                    ];
                    const wObj = verbalWords[qIndex % verbalWords.length];

                    if (level === 1) {
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] Select the synonym for the word "${wObj.word}".`;
                        ans = wObj.syn;
                        o1 = wObj.ant; o2 = wObj.syn; o3 = 'Unrelated'; o4 = 'Doubtful';
                        exp = `"${wObj.word}" means ${wObj.syn.toLowerCase()}.`;
                        step = `Synonym of ${wObj.word} = ${wObj.syn}.`;
                        formula = 'Vocabulary Matching';
                        trick = 'Focus on core definition.';
                        mistake = 'Selecting the antonym.';
                    } else if (level === 2) {
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] Select the antonym for the word "${wObj.word}".`;
                        ans = wObj.ant;
                        o1 = wObj.syn; o2 = wObj.ant; o3 = 'Similar'; o4 = 'Equivalent';
                        exp = `"${wObj.word}" is opposite in meaning to "${wObj.ant}".`;
                        step = `Antonym of ${wObj.word} = ${wObj.ant}.`;
                        formula = 'Antonym Pair Identification';
                        trick = `Find the word with opposite meaning.`;
                        mistake = 'Selecting the synonym.';
                    } else {
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] Identify the grammatically correct sentence:`;
                        ans = `Neither of the reports was submitted on time.`;
                        o1 = `Neither of the reports were submitted on time.`;
                        o2 = `Neither of the reports was submitted on time.`;
                        o3 = `Neither of the reports have submitted on time.`;
                        o4 = `Neither of the reports are submitted on time.`;
                        exp = `"Neither of" is followed by a plural noun ("reports") and a singular verb ("was").`;
                        step = `Neither of + plural noun + singular verb = "was".`;
                        formula = 'Subject-Verb Agreement with Neither of';
                        trick = 'Look for singular verb "was" after "Neither of".';
                        mistake = 'Using plural verb "were" due to plural noun "reports".';
                    }

                } else {
                    // DATA INTERPRETATION & REASONING PATTERN
                    sec = 'Mixed';
                    subj = 'Data Interpretation & Reasoning';
                    cat = `${companyName} DI & Reasoning`;

                    const totalEmployees = 200 + qIndex * 10;
                    const deptPct = 25;
                    const deptCount = (totalEmployees * deptPct) / 100;

                    if (level === 1) {
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] In a company of ${totalEmployees} employees, ${deptPct}% work in QA. How many employees work in QA?`;
                        ans = `${deptCount}`;
                        o1 = `${deptCount - 5}`; o2 = `${deptCount}`; o3 = `${deptCount + 5}`; o4 = `${deptCount + 10}`;
                        exp = `${deptPct}% of ${totalEmployees} = (${deptPct}/100) * ${totalEmployees} = ${deptCount}.`;
                        step = `${totalEmployees} * 0.25 = ${deptCount}.`;
                        formula = 'Value = Percentage * Total / 100';
                        trick = '25% means divide total by 4.';
                        mistake = 'Dividing total by 25.';
                    } else if (level === 2) {
                        const passPct = 70;
                        const totalApp = 500 + qIndex * 20;
                        const passed = (totalApp * passPct) / 100;
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] Out of ${totalApp} candidates who appeared for assessment, ${passPct}% passed. How many candidates failed?`;
                        const failed = totalApp - passed;
                        ans = `${failed}`;
                        o1 = `${failed - 10}`; o2 = `${failed}`; o3 = `${failed + 10}`; o4 = `${passed}`;
                        exp = `Failed percentage = 30%. Failed candidates = 30% of ${totalApp} = ${failed}.`;
                        step = `${totalApp} * 0.30 = ${failed}.`;
                        formula = 'Failed = Total * (100 - Pass%)/100';
                        trick = 'Multiply total by (100 - 70)% = 30%.';
                        mistake = 'Calculating passed candidates instead of failed.';
                    } else {
                        const malePct = 60;
                        const malePGPct = 40;
                        const totalStaff = 400 + qIndex * 10;
                        const males = (totalStaff * malePct) / 100;
                        const malePG = (males * malePGPct) / 100;
                        qText = `[${companyName} ${levelLabel} Practice #${qIndex}] In a workforce of ${totalStaff} employees, ${malePct}% are male. If ${malePGPct}% of male employees hold a Master's degree, how many male employees hold a Master's degree?`;
                        ans = `${malePG}`;
                        o1 = `${malePG - 4}`; o2 = `${malePG}`; o3 = `${malePG + 4}`; o4 = `${malePG + 8}`;
                        exp = `Males = ${males}. Male Master's degree holders = 40% of ${males} = ${malePG}.`;
                        step = `${males} * 0.40 = ${malePG}.`;
                        formula = 'Subgroup Value = Total * Main% * Sub%';
                        trick = `${totalStaff} * 0.60 * 0.40 = ${malePG}.`;
                        mistake = 'Applying 40% directly to total workforce.';
                    }
                }

                companyQuestions.push({
                    learningPath: 'college',
                    placementType: 'company',
                    company: companyName,
                    difficultyLevel: level,
                    section: sec,
                    subject: subj,
                    category: cat,
                    question: qText,
                    option1: o1,
                    option2: o2,
                    option3: o3,
                    option4: o4,
                    answer: ans,
                    explanation: exp,
                    stepSolution: step,
                    formulaUsed: formula,
                    quickTrick: trick,
                    commonMistake: mistake
                });
            }
        }
    });
}

generateCompanyBank();

module.exports = companyQuestions;
