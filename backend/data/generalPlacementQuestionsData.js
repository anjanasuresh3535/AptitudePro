// backend/data/generalPlacementQuestionsData.js
// General Placement Aptitude Question Bank (150 Questions Total)
// Foundation (Level 1): 50 Questions
// Intermediate (Level 2): 50 Questions
// Advanced (Level 3): 50 Questions

const generalPlacementQuestions = [];

// Helper generator function for clear structured creation
function addGenQ({ level, sec, subj, cat, q, o1, o2, o3, o4, ans, exp, step, formula, trick, mistake }) {
    generalPlacementQuestions.push({
        learningPath: 'college',
        placementType: 'general',
        company: null,
        difficultyLevel: level,
        section: sec || 'Mixed',
        subject: subj || 'General Aptitude',
        category: cat || 'Placement Prep',
        question: q,
        option1: o1,
        option2: o2,
        option3: o3,
        option4: o4,
        answer: ans,
        explanation: exp || `The correct answer is ${ans}.`,
        stepSolution: step || `Direct step-by-step evaluation yields ${ans}.`,
        formulaUsed: formula || 'Standard Aptitude Logic',
        quickTrick: trick || 'Analyze pattern and eliminate improbable distractors.',
        commonMistake: mistake || 'Misreading unit values or miscalculating simple steps.'
    });
}

// =============================================================================
// LEVEL 1: FOUNDATION (50 Questions)
// =============================================================================

// Quantitative Aptitude Foundation (18 Q)
addGenQ({
    level: 1, sec: 'Maths', subj: 'Percentages', cat: 'Quantitative Aptitude',
    q: 'A salary is increased by 20% from ₹25,000. What is the new salary?',
    o1: '₹28,000', o2: '₹30,000', o3: '₹32,000', o4: '₹35,000', ans: '₹30,000',
    exp: '20% of 25,000 = 5,000. New salary = 25,000 + 5,000 = ₹30,000.',
    step: '25000 * 1.20 = 30000.', formula: 'New Value = Original * (1 + Rate/100)', trick: '10% is 2500, so 20% is 5000.', mistake: 'Adding 20 instead of 20%.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Ratio & Proportion', cat: 'Quantitative Aptitude',
    q: 'If A:B = 4:5 and the sum of A and B is 180, what is the value of B?',
    o1: '80', o2: '90', o3: '100', o4: '110', ans: '100',
    exp: 'Total parts = 4 + 5 = 9. One part = 180 / 9 = 20. B = 5 * 20 = 100.',
    step: '5/9 * 180 = 100.', formula: 'Share = (Ratio Part / Total Ratio) * Total', trick: '180 / 9 = 20; 5 * 20 = 100.', mistake: 'Calculating A\'s share instead of B\'s.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Averages', cat: 'Quantitative Aptitude',
    q: 'Find the average of 15, 25, 35, 45, and 55.',
    o1: '30', o2: '35', o3: '40', o4: '45', ans: '35',
    exp: 'Sum = 175. Average = 175 / 5 = 35.',
    step: '(15+25+35+45+55)/5 = 175/5 = 35.', formula: 'Average = Sum of terms / Number of terms', trick: 'For symmetric arithmetic series, middle term is average.', mistake: 'Dividing sum by 4 instead of 5.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Profit & Loss', cat: 'Quantitative Aptitude',
    q: 'An article purchased for ₹400 is sold for ₹480. Find the profit percentage.',
    o1: '15%', o2: '18%', o3: '20%', o4: '25%', ans: '20%',
    exp: 'Profit = 480 - 400 = 80. Profit% = (80 / 400) * 100 = 20%.',
    step: '(80 / 400) * 100 = 20%.', formula: 'Profit% = (Profit / Cost Price) * 100', trick: '80 is 1/5th of 400, which is 20%.', mistake: 'Calculating profit % on Selling Price.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Simple Interest', cat: 'Quantitative Aptitude',
    q: 'Calculate the simple interest on ₹6,000 at 5% per annum for 3 years.',
    o1: '₹800', o2: '₹900', o3: '₹1,000', o4: '₹1,200', ans: '₹900',
    exp: 'SI = (P * R * T) / 100 = (6000 * 5 * 3) / 100 = ₹900.',
    step: '60 * 15 = 900.', formula: 'SI = (P * R * T) / 100', trick: '5% of 6000 is 300 per year; 300 * 3 = 900.', mistake: 'Forgetting to divide by 100.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Speed, Distance & Time', cat: 'Quantitative Aptitude',
    q: 'A car covers 240 km in 4 hours. What is its speed in km/h?',
    o1: '50 km/h', o2: '55 km/h', o3: '60 km/h', o4: '65 km/h', ans: '60 km/h',
    exp: 'Speed = Distance / Time = 240 / 4 = 60 km/h.',
    step: '240 / 4 = 60.', formula: 'Speed = Distance / Time', trick: 'Direct division: 24/4 = 6 -> 60.', mistake: 'Multiplying distance by time.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Number System', cat: 'Quantitative Aptitude',
    q: 'What is the LCM of 12 and 18?',
    o1: '24', o2: '36', o3: '48', o4: '72', ans: '36',
    exp: 'Multiples of 12: 12, 24, 36... Multiples of 18: 18, 36... LCM is 36.',
    step: '12 = 2^2 * 3, 18 = 2 * 3^2. LCM = 2^2 * 3^2 = 36.', formula: 'LCM = Product of highest powers of prime factors', trick: 'Take larger number (18), double it: 36 is divisible by 12.', mistake: 'Selecting HCF (6) instead of LCM.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Algebra', cat: 'Quantitative Aptitude',
    q: 'If 4x - 8 = 16, what is the value of x?',
    o1: '4', o2: '5', o3: '6', o4: '8', ans: '6',
    exp: '4x = 16 + 8 = 24 => x = 24 / 4 = 6.',
    step: '4x = 24 => x = 6.', formula: 'Linear equation isolation', trick: 'Add 8 to 16 = 24, divide by 4 = 6.', mistake: 'Subtracting 8 from 16 instead of adding.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Time & Work', cat: 'Quantitative Aptitude',
    q: 'If 6 workers build a wall in 10 days, how many days will 12 workers take?',
    o1: '3 days', o2: '4 days', o3: '5 days', o4: '6 days', ans: '5 days',
    exp: 'M1 * D1 = M2 * D2 => 6 * 10 = 12 * D2 => D2 = 60 / 12 = 5 days.',
    step: '60 / 12 = 5.', formula: 'M1 * D1 = M2 * D2', trick: 'Workers doubled, so time is halved (10 / 2 = 5).', mistake: 'Doubling the days to 20.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Decimals & Fractions', cat: 'Quantitative Aptitude',
    q: 'Convert 3/8 into a percentage.',
    o1: '32.5%', o2: '35%', o3: '37.5%', o4: '40%', ans: '37.5%',
    exp: '3/8 * 100 = 300 / 8 = 37.5%.',
    step: '3 * 12.5% = 37.5%.', formula: 'Percentage = Fraction * 100', trick: '1/8 is 12.5%, so 3/8 is 3 * 12.5% = 37.5%.', mistake: 'Confusing 3/8 with 3/5.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Ages', cat: 'Quantitative Aptitude',
    q: 'The sum of ages of father and son is 50. Father is 4 times older than son. Find son\'s age.',
    o1: '8', o2: '10', o3: '12', o4: '15', ans: '10',
    exp: 'Son = x, Father = 4x. x + 4x = 50 => 5x = 50 => x = 10.',
    step: '5x = 50 => x = 10.', formula: 'Linear Ratio Sum', trick: '50 / (1 + 4) = 10.', mistake: 'Dividing 50 by 4.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Simplification', cat: 'Quantitative Aptitude',
    q: 'Evaluate: 20 + 4 * 5 - 10 / 2',
    o1: '25', o2: '30', o3: '35', o4: '55', ans: '35',
    exp: 'By BODMAS: 4*5 = 20, 10/2 = 5. Result = 20 + 20 - 5 = 35.',
    step: '20 + 20 - 5 = 35.', formula: 'BODMAS Order of Operations', trick: 'Multiply and divide first, then add/subtract.', mistake: 'Calculating strictly left to right.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Mensuration', cat: 'Quantitative Aptitude',
    q: 'Find the perimeter of a rectangle with length 15 cm and breadth 10 cm.',
    o1: '25 cm', o2: '50 cm', o3: '75 cm', o4: '150 cm', ans: '50 cm',
    exp: 'Perimeter = 2 * (l + b) = 2 * (15 + 10) = 50 cm.',
    step: '2 * 25 = 50.', formula: 'P = 2(l + b)', trick: 'Add sides (25) and double it (50).', mistake: 'Calculating Area (150) instead of Perimeter.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Number Series', cat: 'Quantitative Aptitude',
    q: 'Complete the series: 4, 9, 16, 25, 36, ?',
    o1: '40', o2: '42', o3: '49', o4: '64', ans: '49',
    exp: 'The series consists of square numbers: 2^2, 3^2, 4^2, 5^2, 6^2, 7^2 = 49.',
    step: '7^2 = 49.', formula: 'n^2 Square Series', trick: 'Recognize consecutive perfect squares.', mistake: 'Adding 11 to 36 to get 47.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Discount', cat: 'Quantitative Aptitude',
    q: 'A watch marked at ₹1,500 is offered at a 10% discount. What is the selling price?',
    o1: '₹1,300', o2: '₹1,350', o3: '₹1,400', o4: '₹1,450', ans: '₹1,350',
    exp: 'Discount = 10% of 1500 = 150. SP = 1500 - 150 = ₹1,350.',
    step: '1500 * 0.90 = 1350.', formula: 'SP = MP * (1 - Discount%/100)', trick: 'Subtract 150 from 1500.', mistake: 'Adding discount instead of subtracting.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'HCF & LCM', cat: 'Quantitative Aptitude',
    q: 'What is the HCF of 24 and 36?',
    o1: '6', o2: '8', o3: '12', o4: '18', ans: '12',
    exp: 'Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24. Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36. HCF is 12.',
    step: '24 = 12*2, 36 = 12*3.', formula: 'Highest Common Factor', trick: 'Difference between 36 and 24 is 12, which divides both.', mistake: 'Selecting 6 which is common but not highest.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Probabilities', cat: 'Quantitative Aptitude',
    q: 'A fair coin is tossed once. What is the probability of getting heads?',
    o1: '1/4', o2: '1/3', o3: '1/2', o4: '1', ans: '1/2',
    exp: 'Sample space = {H, T}. Favorable = {H}. P(H) = 1/2.',
    step: '1 / 2 = 0.5.', formula: 'P(E) = Favorable / Total', trick: 'Two equal outcomes: 1/2.', mistake: 'Thinking P(H) is 1/4.'
});
addGenQ({
    level: 1, sec: 'Maths', subj: 'Percentages', cat: 'Quantitative Aptitude',
    q: 'What is 25% of 80?',
    o1: '15', o2: '20', o3: '25', o4: '30', ans: '20',
    exp: '25% = 1/4. 1/4 of 80 = 20.',
    step: '80 / 4 = 20.', formula: 'Value = Percentage * Number', trick: '25% means divide by 4.', mistake: 'Dividing 80 by 25.'
});

// Logical Reasoning Foundation (16 Q)
addGenQ({
    level: 1, sec: 'Logical', subj: 'Series Completion', cat: 'Logical Reasoning',
    q: 'Find the next term in the series: A, C, E, G, I, ?',
    o1: 'J', o2: 'K', o3: 'L', o4: 'M', ans: 'K',
    exp: 'The series skips one letter (+2 position): A(1), C(3), E(5), G(7), I(9), K(11).',
    step: '9 + 2 = 11 -> K.', formula: 'Alphabetical Position +2', trick: 'Skip alternate letters.', mistake: 'Selecting J (consecutive letter).'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Coding-Decoding', cat: 'Logical Reasoning',
    q: 'If CAT is coded as DBU, how is MAN coded?',
    o1: 'NBO', o2: 'NBN', o3: 'OCP', o4: 'MBO', ans: 'NBO',
    exp: 'Each letter is shifted by +1: M->N, A->B, N->O.',
    step: 'M+1=N, A+1=B, N+1=O.', formula: 'Letter Shift Cipher (+1)', trick: 'Apply +1 shift to each letter.', mistake: 'Applying -1 shift.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Blood Relations', cat: 'Logical Reasoning',
    q: 'Pointing to a man, Neha says "He is my mother\'s brother". How is the man related to Neha?',
    o1: 'Father', o2: 'Maternal Uncle', o3: 'Brother', o4: 'Grandfather', ans: 'Maternal Uncle',
    exp: 'Mother\'s brother is Maternal Uncle.',
    step: 'Mother\'s Brother = Maternal Uncle.', formula: 'Family Relation Mapping', trick: 'Direct relationship definition.', mistake: 'Confusing with Paternal Uncle.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Direction Sense', cat: 'Logical Reasoning',
    q: 'Rohan walks 10 m North, then turns Right and walks 10 m. Which direction is he facing now?',
    o1: 'North', o2: 'South', o3: 'East', o4: 'West', ans: 'East',
    exp: 'Facing North and turning Right (90° clockwise) points towards East.',
    step: 'North + Right = East.', formula: 'Cardinal Directions', trick: 'Right turn from North leads to East.', mistake: 'Confusing East with West.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Odd One Out', cat: 'Logical Reasoning',
    q: 'Which word does NOT belong with the others?',
    o1: 'Square', o2: 'Triangle', o3: 'Rectangle', o4: 'Cube', ans: 'Cube',
    exp: 'Square, Triangle, and Rectangle are 2D shapes; Cube is a 3D shape.',
    step: '2D vs 3D classification.', formula: 'Dimensional Classification', trick: 'Identify 3D object among 2D figures.', mistake: 'Choosing Triangle because it has 3 sides.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Analogy', cat: 'Logical Reasoning',
    q: 'Pen is to Write as Knife is to ___?',
    o1: 'Sharp', o2: 'Cut', o3: 'Steel', o4: 'Fork', ans: 'Cut',
    exp: 'A Pen is used to Write; a Knife is used to Cut.',
    step: 'Tool -> Action function.', formula: 'Tool-Function Analogy', trick: 'Match the primary action of the tool.', mistake: 'Selecting Sharp (an attribute, not action).'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Number Series', cat: 'Logical Reasoning',
    q: 'Find the missing number: 5, 10, 15, 20, ?',
    o1: '22', o2: '24', o3: '25', o4: '30', ans: '25',
    exp: 'Constant difference of +5: 20 + 5 = 25.',
    step: '20 + 5 = 25.', formula: 'Arithmetic Addition Series (+5)', trick: 'Add 5 to current term.', mistake: 'Multiplying 20 by 2.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Order & Ranking', cat: 'Logical Reasoning',
    q: 'In a row of 20 boys, Anil is 5th from the left. What is his rank from the right?',
    o1: '15th', o2: '16th', o3: '17th', o4: '18th', ans: '16th',
    exp: 'Rank from right = Total - Left + 1 = 20 - 5 + 1 = 16th.',
    step: '20 - 5 + 1 = 16.', formula: 'Total = Left + Right - 1', trick: 'Subtract left rank from total and add 1.', mistake: 'Forgetting to add 1 (getting 15th).'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Syllogisms', cat: 'Logical Reasoning',
    q: 'All dogs are animals. All animals are living beings. Conclusion: All dogs are living beings.',
    o1: 'True', o2: 'False', o3: 'Can cannot be determined', o4: 'Invalid statement', ans: 'True',
    exp: 'If Dogs ⊆ Animals and Animals ⊆ Living Beings, then Dogs ⊆ Living Beings.',
    step: 'Transitive set inclusion.', formula: 'Categorical Syllogism', trick: 'Nested set inclusion.', mistake: 'Reversing conclusion.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Coding-Decoding', cat: 'Logical Reasoning',
    q: 'If BOY is coded as 2-15-25, how is GIRL coded?',
    o1: '7-9-18-12', o2: '7-9-17-12', o3: '7-10-18-12', o4: '6-9-18-12', ans: '7-9-18-12',
    exp: 'Alphabet positions: G=7, I=9, R=18, L=12.',
    step: 'G=7, I=9, R=18, L=12.', formula: 'Alphabetical Index Mapping', trick: 'Use standard A=1..Z=26 positions.', mistake: 'Miscounting R position.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Analogy', cat: 'Logical Reasoning',
    q: 'Doctor is to Hospital as Teacher is to ___?',
    o1: 'Student', o2: 'Book', o3: 'School', o4: 'Class', ans: 'School',
    exp: 'A Doctor works in a Hospital; a Teacher works in a School.',
    step: 'Profession -> Workplace.', formula: 'Worker-Workplace Analogy', trick: 'Match the primary workplace.', mistake: 'Selecting Student (counterpart, not workplace).'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Series Completion', cat: 'Logical Reasoning',
    q: 'Find the next term: Z, Y, X, W, V, ?',
    o1: 'U', o2: 'T', o3: 'S', o4: 'R', ans: 'U',
    exp: 'Reverse alphabetical order: Z, Y, X, W, V, U.',
    step: 'V - 1 = U.', formula: 'Backward Alphabet Sequence', trick: 'Preceding letter of V is U.', mistake: 'Selecting T.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Blood Relations', cat: 'Logical Reasoning',
    q: 'A man said to a woman, "Your mother\'s husband\'s sister is my aunt." How is the woman related to the man?',
    o1: 'Mother', o2: 'Sister', o3: 'Aunt', o4: 'Daughter', ans: 'Sister',
    exp: 'Woman\'s mother\'s husband = Woman\'s father. Father\'s sister = Aunt. Since she is his aunt too, the woman and man are siblings (Sister).',
    step: 'Father\'s sister = Aunt -> Siblings.', formula: 'Family Relationship Deduction', trick: 'Trace mother\'s husband = father.', mistake: 'Assuming cousin.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Direction Sense', cat: 'Logical Reasoning',
    q: 'If East becomes South, what does North become?',
    o1: 'West', o2: 'East', o3: 'South', o4: 'North', ans: 'East',
    exp: 'Rotating directions 90° clockwise: East -> South, North -> East.',
    step: '90° Clockwise Rotation.', formula: 'Direction Matrix Rotation', trick: 'Apply same 90° CW turn to North.', mistake: 'Rotating counter-clockwise.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Odd One Out', cat: 'Logical Reasoning',
    q: 'Which number is the odd one out: 2, 3, 5, 7, 9, 11?',
    o1: '3', o2: '5', o3: '9', o4: '11', ans: '9',
    exp: '9 is composite (3x3); 2, 3, 5, 7, 11 are all prime numbers.',
    step: 'Prime numbers vs Composite.', formula: 'Prime Property Classification', trick: '9 is not prime.', mistake: 'Selecting 2 because it is even.'
});
addGenQ({
    level: 1, sec: 'Logical', subj: 'Seating Arrangement', cat: 'Logical Reasoning',
    q: 'Four friends A, B, C, D sit in a row. A is next to B, C is not next to D. If B is at left end, where is A?',
    o1: 'Left end', o2: '2nd from left', o3: '3rd from left', o4: 'Right end', ans: '2nd from left',
    exp: 'B is at 1st position (left end). Since A is next to B, A must be 2nd from left.',
    step: 'B at pos 1 -> A at pos 2.', formula: 'Positional Constraint Logic', trick: 'Only adjacent position to left end is 2nd position.', mistake: 'Placing A at right end.'
});

// Verbal Ability Foundation (16 Q)
addGenQ({
    level: 1, sec: 'English', subj: 'Synonyms', cat: 'Verbal Ability',
    q: 'Select the synonym for "BEGIN".',
    o1: 'Stop', o2: 'Start', o3: 'Finish', o4: 'Close', ans: 'Start',
    exp: 'Begin means to perform the first part of an action (Start).',
    step: 'Begin = Start.', formula: 'Vocabulary Synonym Matching', trick: 'Direct equivalent meaning.', mistake: 'Selecting Stop (Antonym).'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Antonyms', cat: 'Verbal Ability',
    q: 'Select the antonym for "BRAVE".',
    o1: 'Bold', o2: 'Courageous', o3: 'Cowardly', o4: 'Strong', ans: 'Cowardly',
    exp: 'Brave means showing courage; its opposite is Cowardly.',
    step: 'Brave <-> Cowardly.', formula: 'Vocabulary Antonym Matching', trick: 'Opposite of courage is cowardice.', mistake: 'Selecting Bold (Synonym).'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Grammar', cat: 'Verbal Ability',
    q: 'Choose the correct option: She ___ to school every day.',
    o1: 'go', o2: 'goes', o3: 'going', o4: 'gone', ans: 'goes',
    exp: 'Third-person singular (She) takes "goes" in present simple tense.',
    step: 'She + Present Simple = goes.', formula: 'Subject-Verb Agreement', trick: 'She/He/It takes verb+s/es.', mistake: 'Using base form "go".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Articles', cat: 'Verbal Ability',
    q: 'Fill in the blank: He is ___ honest man.',
    o1: 'a', o2: 'an', o3: 'the', o4: 'no article', ans: 'an',
    exp: '"Honest" begins with a silent \'h\' vowel sound (/ɒ/), requiring "an".',
    step: 'Vowel sound /ɒ/ -> "an".', formula: 'Phonetic Article Rule', trick: 'Listen to initial sound, not spelling.', mistake: 'Using "a" because of letter \'h\'.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Spelling', cat: 'Verbal Ability',
    q: 'Choose the correctly spelled word.',
    o1: 'Recieve', o2: 'Receive', o3: 'Receeve', o4: 'Riceive', ans: 'Receive',
    exp: 'Correct spelling is Receive (e before i after c).',
    step: 'R-E-C-E-I-V-E.', formula: 'Standard English Spelling', trick: '\'i\' before \'e\' except after \'c\'.', mistake: 'Writing Recieve.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Prepositions', cat: 'Verbal Ability',
    q: 'Fill in the blank: The book is ___ the table.',
    o1: 'on', o2: 'in', o3: 'at', o4: 'into', ans: 'on',
    exp: 'Use "on" to indicate position touching a flat surface.',
    step: 'Surface contact -> "on".', formula: 'Preposition of Place', trick: 'Book rests on surface of table.', mistake: 'Using "in".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Idioms', cat: 'Verbal Ability',
    q: 'What does the idiom "Once in a blue moon" mean?',
    o1: 'Very frequently', o2: 'Very rarely', o3: 'Every month', o4: 'Never', ans: 'Very rarely',
    exp: '"Once in a blue moon" refers to an event that happens very rarely.',
    step: 'Idiomatic meaning = Very rarely.', formula: 'Idiom Meaning Recall', trick: 'Blue moon is a rare celestial event.', mistake: 'Interpreting as every month.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Sentence Correction', cat: 'Verbal Ability',
    q: 'Identify the error: One of my friend live in Delhi.',
    o1: 'One of', o2: 'my friend', o3: 'live in', o4: 'Delhi', ans: 'my friend',
    exp: 'The phrase "One of" must be followed by a plural noun ("friends"). Correct: "One of my friends".',
    step: 'One of + plural noun = One of my friends.', formula: 'Plural Noun Rule after "One of"', trick: 'Check noun after "One of".', mistake: 'Overlooking singular friend.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Synonyms', cat: 'Verbal Ability',
    q: 'Select the synonym for "HAPPY".',
    o1: 'Sad', o2: 'Joyful', o3: 'Gloomy', o4: 'Angry', ans: 'Joyful',
    exp: 'Happy means feeling or showing pleasure; Joyful is its synonym.',
    step: 'Happy = Joyful.', formula: 'Vocabulary Matching', trick: 'Positive emotion match.', mistake: 'Selecting Sad.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Antonyms', cat: 'Verbal Ability',
    q: 'Select the antonym for "ANCIENT".',
    o1: 'Old', o2: 'Modern', o3: 'Historic', o4: 'Past', ans: 'Modern',
    exp: 'Ancient means belonging to the distant past; Modern means present time.',
    step: 'Ancient <-> Modern.', formula: 'Antonym Pair Matching', trick: 'Old vs New.', mistake: 'Selecting Old.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'One-Word Substitution', cat: 'Verbal Ability',
    q: 'One who studies plants is called a ___?',
    o1: 'Zoologist', o2: 'Botanist', o3: 'Geologist', o4: 'Chemist', ans: 'Botanist',
    exp: 'A Botanist is a scientist who specializes in plant biology.',
    step: 'Plant scientist = Botanist.', formula: 'Specialization Substitution', trick: 'Botany = Plants, Zoology = Animals.', mistake: 'Selecting Zoologist.'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Grammar', cat: 'Verbal Ability',
    q: 'Choose the correct pronoun: Rahul and ___ went to the market.',
    o1: 'I', o2: 'me', o3: 'myself', o4: 'mine', ans: 'I',
    exp: 'Use subject pronoun "I" as part of the compound subject (Rahul and I).',
    step: 'Subject position -> "I".', formula: 'Subjective Pronoun Case', trick: 'Test sentence without "Rahul and": "I went to market".', mistake: 'Using "me".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Conjunctions', cat: 'Verbal Ability',
    q: 'Fill in the blank: Work hard ___ you will fail.',
    o1: 'and', o2: 'but', o3: 'or', o4: 'so', ans: 'or',
    exp: 'Use "or" to indicate an alternative consequence if condition is not met.',
    step: 'Alternative consequence -> "or".', formula: 'Adversative Conjunction', trick: 'Otherwise clause.', mistake: 'Using "but".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Active Passive Voice', cat: 'Verbal Ability',
    q: 'Convert to Passive Voice: "The boy kicked the ball."',
    o1: 'The ball was kicked by the boy.', o2: 'The ball is kicked by the boy.', o3: 'The ball had been kicked by the boy.', o4: 'The boy was kicking the ball.', ans: 'The ball was kicked by the boy.',
    exp: 'Past simple active (kicked) converts to "was kicked" in passive voice.',
    step: 'Object + was/were + V3 + by subject.', formula: 'Simple Past Passive Rules', trick: 'Look for "was kicked".', mistake: 'Using present tense "is kicked".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Direct Indirect Speech', cat: 'Verbal Ability',
    q: 'He said, "I am busy." In indirect speech: He said that he ___ busy.',
    o1: 'is', o2: 'was', o3: 'had been', o4: 'will be', ans: 'was',
    exp: 'Present simple "am" changes to past simple "was" in reported speech.',
    step: 'Am -> Was.', formula: 'Tense Backshift Rule', trick: 'Shift present tense one step back to past.', mistake: 'Keeping present tense "is".'
});
addGenQ({
    level: 1, sec: 'English', subj: 'Vocabulary', cat: 'Verbal Ability',
    q: 'Choose the word that means "A period of ten years".',
    o1: 'Century', o2: 'Decade', o3: 'Millennium', o4: 'Fortnight', ans: 'Decade',
    exp: 'A decade is a period of 10 years.',
    step: '10 years = Decade.', formula: 'Time Interval Terminology', trick: 'Deca = 10.', mistake: 'Selecting Century (100 years).'
});


// =============================================================================
// LEVEL 2: INTERMEDIATE (50 Questions)
// =============================================================================

// Quantitative Aptitude Intermediate (18 Q)
addGenQ({
    level: 2, sec: 'Maths', subj: 'Compound Interest', cat: 'Quantitative Aptitude',
    q: 'Find the compound interest on ₹10,000 at 10% per annum for 2 years compounded annually.',
    o1: '₹2,000', o2: '₹2,100', o3: '₹2,200', o4: '₹2,400', ans: '₹2,100',
    exp: 'Amount = 10,000 * (1.10)^2 = 12,100. CI = 12,100 - 10,000 = ₹2,100.',
    step: '10000 * 1.21 = 12100 -> CI = 2100.', formula: 'A = P(1 + R/100)^T', trick: '10% + 10% + (10*10)/100 = 21% net interest.', mistake: 'Using simple interest formula (getting 2000).'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Time & Work', cat: 'Quantitative Aptitude',
    q: 'A can do a job in 12 days, B in 15 days. How long will they take working together?',
    o1: '6.67 days', o2: '7 days', o3: '7.5 days', o4: '8 days', ans: '6.67 days',
    exp: 'Combined rate = 1/12 + 1/15 = 9/60 = 3/20. Time = 20/3 = 6.67 days.',
    step: '20 / 3 = 6.67.', formula: 'Time = (A * B) / (A + B)', trick: '(12 * 15) / (12 + 15) = 180 / 27 = 6.67 days.', mistake: 'Averaging 12 and 15.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Speed, Distance & Time', cat: 'Quantitative Aptitude',
    q: 'A train 200 m long running at 72 km/h crosses a pole. How many seconds does it take?',
    o1: '8 s', o2: '10 s', o3: '12 s', o4: '15 s', ans: '10 s',
    exp: 'Speed in m/s = 72 * (5/18) = 20 m/s. Time = Distance / Speed = 200 / 20 = 10 s.',
    step: '200 / 20 = 10.', formula: 'm/s = km/h * (5/18)', trick: '72 km/h is 20 m/s. 200 / 20 = 10.', mistake: 'Forgetting to convert km/h to m/s.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Pipes & Cisterns', cat: 'Quantitative Aptitude',
    q: 'Pipe A fills a tank in 10 hours, Pipe B empties it in 15 hours. If both open, how long to fill?',
    o1: '20 hours', o2: '25 hours', o3: '30 hours', o4: '35 hours', ans: '30 hours',
    exp: 'Net rate = 1/10 - 1/15 = 1/30 per hour. Total time = 30 hours.',
    step: '1/10 - 1/15 = 1/30.', formula: 'Net rate = Fill rate - Empty rate', trick: '(10 * 15) / (15 - 10) = 150 / 5 = 30.', mistake: 'Adding rates instead of subtracting.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Profit & Loss', cat: 'Quantitative Aptitude',
    q: 'A trader marks goods 40% above CP and offers a 20% discount. Find profit percentage.',
    o1: '10%', o2: '12%', o3: '15%', o4: '20%', ans: '12%',
    exp: 'Let CP = 100. MP = 140. SP = 140 * 0.80 = 112. Profit% = 12%.',
    step: '100 -> 140 -> 112 -> 12% profit.', formula: 'Net % = A - B - (A*B)/100', trick: '40 - 20 - (40*20)/100 = 20 - 8 = 12%.', mistake: 'Subtracting 20% directly from 40% (getting 20%).'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Mixtures & Alligations', cat: 'Quantitative Aptitude',
    q: 'In what ratio must ₹20/kg tea be mixed with ₹30/kg tea to get a mixture worth ₹26/kg?',
    o1: '2:3', o2: '3:2', o3: '1:2', o4: '4:1', ans: '2:3',
    exp: 'By alligation: (30 - 26) : (26 - 20) = 4 : 6 = 2 : 3.',
    step: '4 : 6 = 2 : 3.', formula: 'Alligation Rule', trick: 'Cross difference: 4 and 6 -> ratio 2:3.', mistake: 'Inverting ratio to 3:2.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Permutations & Combinations', cat: 'Quantitative Aptitude',
    q: 'In how many ways can 4 people be chosen from a group of 7 people?',
    o1: '28', o2: '35', o3: '42', o4: '70', ans: '35',
    exp: '7C4 = 7! / (4! * 3!) = (7 * 6 * 5) / (3 * 2 * 1) = 35.',
    step: '35.', formula: 'nCr = n! / (r! * (n-r)!)', trick: '7C4 is same as 7C3 = (7*6*5)/(3*2*1) = 35.', mistake: 'Using 7P4 permutation formula.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Probability', cat: 'Quantitative Aptitude',
    q: 'Two dice are rolled. What is the probability of getting a sum of 8?',
    o1: '5/36', o2: '1/6', o3: '7/36', o4: '1/4', ans: '5/36',
    exp: 'Favorable outcomes: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36.',
    step: '5 / 36.', formula: 'P(E) = Favorable / Total (36)', trick: 'Count ordered pairs summing to 8.', mistake: 'Counting (4,4) twice.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Boats & Streams', cat: 'Quantitative Aptitude',
    q: 'A boat moves at 10 km/h in still water. Stream speed is 2 km/h. Find downstream speed.',
    o1: '8 km/h', o2: '10 km/h', o3: '12 km/h', o4: '14 km/h', ans: '12 km/h',
    exp: 'Downstream speed = Boat speed + Stream speed = 10 + 2 = 12 km/h.',
    step: '10 + 2 = 12.', formula: 'Downstream = u + v', trick: 'Add speeds going downstream.', mistake: 'Subtracting stream speed.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Data Interpretation', cat: 'Quantitative Aptitude',
    q: 'A pie chart shows Sales: Prod A 40%, Prod B 35%, Prod C 25%. If total revenue is ₹2,00,000, find Prod B revenue.',
    o1: '₹50,000', o2: '₹70,000', o3: '₹80,000', o4: '₹90,000', ans: '₹70,000',
    exp: '35% of 2,00,000 = 0.35 * 200000 = ₹70,000.',
    step: '0.35 * 200000 = 70000.', formula: 'Segment Value = Sector % * Total', trick: '35 * 2000 = 70,000.', mistake: 'Calculating Prod A revenue (80,000).'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Quadratic Equations', cat: 'Quantitative Aptitude',
    q: 'Find the roots of quadratic equation: x^2 - 7x + 12 = 0.',
    o1: '2 and 5', o2: '3 and 4', o3: '-3 and -4', o4: '1 and 12', ans: '3 and 4',
    exp: '(x - 3)(x - 4) = 0 => x = 3 or x = 4.',
    step: 'x^2 - 3x - 4x + 12 = 0.', formula: 'Factoring Quadratic x^2 - (a+b)x + ab', trick: 'Product = 12, Sum = 7 -> 3 and 4.', mistake: 'Selecting negative roots -3, -4.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Mensuration', cat: 'Quantitative Aptitude',
    q: 'Find the total surface area of a cube with edge length 5 cm.',
    o1: '100 cm^2', o2: '125 cm^2', o3: '150 cm^2', o4: '175 cm^2', ans: '150 cm^2',
    exp: 'Cube Total Surface Area = 6 * a^2 = 6 * (5^2) = 6 * 25 = 150 cm^2.',
    step: '6 * 25 = 150.', formula: 'TSA = 6 * a^2', trick: '6 faces of 25 cm^2 each.', mistake: 'Calculating volume (125 cm^3).'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Averages', cat: 'Quantitative Aptitude',
    q: 'Average score of 10 players is 50. If 1 new player joins, average becomes 52. Find new player\'s score.',
    o1: '62', o2: '70', o3: '72', o4: '74', ans: '72',
    exp: 'Old total = 500. New total = 11 * 52 = 572. New score = 572 - 500 = 72.',
    step: '572 - 500 = 72.', formula: 'New Value = New Total - Old Total', trick: 'Old avg 50 + (11 * 2) = 72.', mistake: 'Adding 2 to 50.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Number System', cat: 'Quantitative Aptitude',
    q: 'Find the unit digit of 3^45.',
    o1: '1', o2: '3', o3: '7', o4: '9', ans: '3',
    exp: 'Cyclicity of 3 is 4 (3, 9, 7, 1). 45 mod 4 = 1. So unit digit is 3^1 = 3.',
    step: '45 mod 4 = 1 -> 3^1 = 3.', formula: 'Exponent Cyclicity Rule', trick: 'Remainder 1 corresponds to 3.', mistake: 'Selecting 9.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Logarithms', cat: 'Quantitative Aptitude',
    q: 'Find the value of log2(64).',
    o1: '5', o2: '6', o3: '7', o4: '8', ans: '6',
    exp: '2^6 = 64, so log2(64) = 6.',
    step: '2^6 = 64.', formula: 'log_b(b^k) = k', trick: '64 is 2 to the power of 6.', mistake: 'Confusing 2^6 with 2*6.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Ratio & Proportion', cat: 'Quantitative Aptitude',
    q: 'If A:B = 2:3 and B:C = 4:5, find A:B:C.',
    o1: '8:12:15', o2: '6:12:15', o3: '8:10:15', o4: '2:4:5', ans: '8:12:15',
    exp: 'Make B equal: A:B = 8:12, B:C = 12:15. So A:B:C = 8:12:15.',
    step: 'Multiply 1st by 4, 2nd by 3.', formula: 'Combined Ratio Scaling', trick: 'Multiply cross terms: 2*4 : 3*4 : 3*5 = 8:12:15.', mistake: 'Combining directly as 2:4:5.'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Percentages', cat: 'Quantitative Aptitude',
    q: 'If length of rectangle increases by 20% and breadth decreases by 10%, find net % change in area.',
    o1: '8% increase', o2: '10% increase', o3: '12% increase', o4: '8% decrease', ans: '8% increase',
    exp: 'Net % = 20 - 10 - (20*10)/100 = 10 - 2 = 8% increase.',
    step: '1.20 * 0.90 = 1.08 -> +8%.', formula: 'Successive % Change: x + y + xy/100', trick: 'Multiply factors: 1.2 * 0.9 = 1.08.', mistake: 'Subtracting 10 from 20 (getting 10%).'
});
addGenQ({
    level: 2, sec: 'Maths', subj: 'Simplification', cat: 'Quantitative Aptitude',
    q: 'Evaluate: (1/2 + 1/3) / (1/4)',
    o1: '2.5', o2: '3.33', o3: '3.5', o4: '4', ans: '3.33',
    exp: '1/2 + 1/3 = 5/6. (5/6) / (1/4) = (5/6) * 4 = 20/6 = 3.33.',
    step: '(5/6) * 4 = 10/3 = 3.33.', formula: 'Fraction Division (multiply by reciprocal)', trick: '5/6 * 4 = 10/3 = 3.33.', mistake: 'Multiplying numerator by 1/4.'
});

// Logical Reasoning Intermediate (16 Q)
addGenQ({
    level: 2, sec: 'Logical', subj: 'Seating Arrangement', cat: 'Logical Reasoning',
    q: '5 people A,B,C,D,E sit around circular table. A sits next to B. C sits next to D. If E is between B and C, who sits opposite A?',
    o1: 'B', o2: 'C', o3: 'D', o4: 'E', ans: 'D',
    exp: 'Circle order: A - B - E - C - D - A. Opposite to A is D.',
    step: 'Circular placement verification.', formula: 'Circular Seating Logic', trick: 'Position 5 points on a circle.', mistake: 'Selecting C.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Coding-Decoding', cat: 'Logical Reasoning',
    q: 'If MONKEY is coded as XDJMNL, how is TIGER coded?',
    o1: 'QDFHS', o2: 'SDFHS', o3: 'QDHJS', o4: 'QDFHR', ans: 'QDFHS',
    exp: 'Reverse the word and subtract 1 from each letter: R-1=Q, E-1=D, G-1=F, I-1=H, T-1=S -> QDFHS.',
    step: 'Reverse word + Shift -1.', formula: 'Reverse Shift Cipher', trick: 'Check last letter T -> S at the end.', mistake: 'Forgetting to reverse word.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Blood Relations', cat: 'Logical Reasoning',
    q: 'A + B means A is father of B; A - B means A is sister of B. What does P + Q - R mean?',
    o1: 'P is uncle of R', o2: 'P is father of R', o3: 'P is brother of R', o4: 'P is grandfather of R', ans: 'P is father of R',
    exp: 'P is father of Q. Q is sister of R. Therefore, P is father of R.',
    step: 'P -> father -> Q (sister of R) -> P is father of R.', formula: 'Coded Blood Relation Decoding', trick: 'Q and R are siblings, so P is father of both.', mistake: 'Assuming P is uncle.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Syllogisms', cat: 'Logical Reasoning',
    q: 'Some pens are pencils. No pencil is an eraser. Conclusion I: No pen is eraser. Conclusion II: Some pencils are pens.',
    o1: 'Only I follows', o2: 'Only II follows', o3: 'Both I and II follow', o4: 'Neither follows', ans: 'Only II follows',
    exp: 'Pen & pencil overlap, pencil & eraser disjoint. Pens outside overlap might be erasers, so I doesn\'t strictly follow. II follows directly.',
    step: 'Venn diagram verification.', formula: 'Particular Affirmative Syllogism', trick: 'Some A are B implies Some B are A.', mistake: 'Assuming I is true.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Data Sufficiency', cat: 'Logical Reasoning',
    q: 'Is X even? Stmt 1: X + 3 is odd. Stmt 2: 2X is even.',
    o1: 'Stmt 1 alone is sufficient', o2: 'Stmt 2 alone is sufficient', o3: 'Both together are sufficient', o4: 'Neither is sufficient', ans: 'Stmt 1 alone is sufficient',
    exp: 'From Stmt 1: Even + Odd = Odd, so X must be even (Sufficient). Stmt 2: 2X is always even for any integer X (Not sufficient).',
    step: 'Stmt 1 gives definitive even answer.', formula: 'Parity Logic', trick: '2X is even for all integers, so Stmt 2 gives no info.', mistake: 'Thinking Stmt 2 is sufficient.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Clocks', cat: 'Logical Reasoning',
    q: 'At what angle are hands of clock inclined at 4:20?',
    o1: '0°', o2: '10°', o3: '15°', o4: '20°', ans: '10°',
    exp: 'Angle = |30*H - 5.5*M| = |30*4 - 5.5*20| = |120 - 110| = 10°.',
    step: '|120 - 110| = 10°.', formula: 'Clock Angle = |30H - 5.5M|', trick: 'Hour hand moved 20 * 0.5 = 10° past 4.', mistake: 'Assuming hands overlap at 0°.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Calendars', cat: 'Logical Reasoning',
    q: 'If 1st January 2020 was Wednesday, what day of week was 1st January 2021?',
    o1: 'Thursday', o2: 'Friday', o3: 'Saturday', o4: 'Sunday', ans: 'Friday',
    exp: '2020 is a leap year (366 days = 52 weeks + 2 odd days). Wednesday + 2 days = Friday.',
    step: 'Wed + 2 = Friday.', formula: 'Leap Year Odd Days (+2)', trick: 'Add 2 odd days for leap year.', mistake: 'Adding only 1 day (getting Thursday).'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Input Output', cat: 'Logical Reasoning',
    q: 'Input: 45 12 89 23. Step 1 rearranges into ascending order. What is 3rd number in Step 1?',
    o1: '12', o2: '23', o3: '45', o4: '89', ans: '45',
    exp: 'Ascending order: 12, 23, 45, 89. 3rd number is 45.',
    step: '12, 23, 45, 89.', formula: 'Sequential Sorting Logic', trick: 'Sort numbers: 3rd is 45.', mistake: 'Miscounting index.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Venn Diagrams', cat: 'Logical Reasoning',
    q: 'In a group of 50 people, 30 speak English, 25 speak Hindi, 10 speak both. How many speak neither?',
    o1: '3', o2: '5', o3: '8', o4: '10', ans: '5',
    exp: 'Total speaking at least one = 30 + 25 - 10 = 45. Neither = 50 - 45 = 5.',
    step: '50 - (30 + 25 - 10) = 5.', formula: 'N(Neither) = Total - N(A u B)', trick: '50 - 45 = 5.', mistake: 'Subtracting 10 directly from 50.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Puzzles', cat: 'Logical Reasoning',
    q: 'A, B, C, D, E have different heights. A is taller than B but shorter than C. D is taller than C. Who is tallest?',
    o1: 'A', o2: 'B', o3: 'C', o4: 'D', ans: 'D',
    exp: 'Height order: D > C > A > B. D is the tallest.',
    step: 'D > C > A > B.', formula: 'Inequality Chain Ranking', trick: 'D is taller than C, C is taller than A.', mistake: 'Selecting C.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Series Completion', cat: 'Logical Reasoning',
    q: 'Find next term in series: 2, 6, 12, 20, 30, 42, ?',
    o1: '52', o2: '54', o3: '56', o4: '60', ans: '56',
    exp: 'Differences: +4, +6, +8, +10, +12, +14. 42 + 14 = 56.',
    step: '42 + 14 = 56.', formula: 'n(n+1) Series Pattern', trick: '1x2, 2x3, 3x4, 4x5, 5x6, 6x7, 7x8 = 56.', mistake: 'Adding 12 again (getting 54).'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Coding-Decoding', cat: 'Logical Reasoning',
    q: 'In a code language, 123 means "bright little boy", 145 means "tall big boy". Which digit means "boy"?',
    o1: '1', o2: '2', o3: '3', o4: '4', ans: '1',
    exp: 'Common word is "boy" and common digit is 1. So "boy" = 1.',
    step: 'Intersection of sets gives 1.', formula: 'Set Intersection Coding', trick: '1 is present in both codes.', mistake: 'Selecting 2.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Direction Sense', cat: 'Logical Reasoning',
    q: 'A person walks 3 km North, 4 km East. How far is he from starting point?',
    o1: '5 km', o2: '6 km', o3: '7 km', o4: '8 km', ans: '5 km',
    exp: 'Shortest distance = sqrt(3^2 + 4^2) = sqrt(9 + 16) = sqrt(25) = 5 km.',
    step: 'sqrt(9 + 16) = 5.', formula: 'Pythagorean Theorem', trick: '3-4-5 Pythagorean triplet.', mistake: 'Adding distances 3+4=7.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Blood Relations', cat: 'Logical Reasoning',
    q: 'Introducing a man, a woman says "His wife is the only daughter of my father." How is the man related to the woman?',
    o1: 'Brother', o2: 'Husband', o3: 'Father', o4: 'Son', ans: 'Husband',
    exp: 'Only daughter of my father = Woman herself. Man\'s wife = Woman herself. So man is her Husband.',
    step: 'Only daughter of father = herself -> Husband.', formula: 'Self-referential Blood Deduction', trick: 'She is the wife.', mistake: 'Selecting Brother.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Analogy', cat: 'Logical Reasoning',
    q: 'Numismatist is to Coins as Philatelist is to ___?',
    o1: 'Stamps', o2: 'Books', o3: 'Maps', o4: 'Rocks', ans: 'Stamps',
    exp: 'Numismatist collects coins; Philatelist collects stamps.',
    step: 'Collector-Item analogy.', formula: 'Collector Classification', trick: 'Philately = Stamp collection.', mistake: 'Selecting Maps.'
});
addGenQ({
    level: 2, sec: 'Logical', subj: 'Statement Assumptions', cat: 'Logical Reasoning',
    q: 'Statement: "Post this letter." Assumption 1: A letter post office exists. Assumption 2: Receiver will read it.',
    o1: 'Only 1 implicit', o2: 'Only 2 implicit', o3: 'Both implicit', o4: 'Neither implicit', ans: 'Both implicit',
    exp: 'Posting implies means exist (post office) and intent (receiver reads). Both assumptions are implicit.',
    step: 'Check logical necessity of assumptions.', formula: 'Pragmatic Implication Logic', trick: 'Reasonable premise for command.', mistake: 'Rejecting Assumption 2.'
});

// Verbal Ability Intermediate (16 Q)
addGenQ({
    level: 2, sec: 'English', subj: 'Sentence Completion', cat: 'Verbal Ability',
    q: 'Despite the heavy rain, the event went on ___ scheduled.',
    o1: 'as', o2: 'like', o3: 'so', o4: 'than', ans: 'as',
    exp: 'The correct conjunctional phrase is "as scheduled".',
    step: 'Idiomatic usage: "as scheduled".', formula: 'Conjunction Usage', trick: '"As scheduled" is standard English phrase.', mistake: 'Using "like scheduled".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Idioms & Phrases', cat: 'Verbal Ability',
    q: 'What does "Burn the candle at both ends" mean?',
    o1: 'Waste money', o2: 'Work exhaustively from early morning to late night', o3: 'Create chaos', o4: 'Celebrate', ans: 'Work exhaustively from early morning to late night',
    exp: 'To burn the candle at both ends means to exhaust oneself by working long hours.',
    step: 'Idiom meaning = Exhaustive work.', formula: 'Idiom Interpretation', trick: 'Implies consuming energy from both sides.', mistake: 'Interpreting as wasting money.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Synonyms', cat: 'Verbal Ability',
    q: 'Select the synonym for "METICULOUS".',
    o1: 'Careless', o2: 'Painstaking', o3: 'Lazy', o4: 'Casual', ans: 'Painstaking',
    exp: 'Meticulous means showing great attention to detail; painstaking.',
    step: 'Meticulous = Painstaking / Careful.', formula: 'Vocabulary Matching', trick: 'High precision and care.', mistake: 'Selecting Careless (Antonym).'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Antonyms', cat: 'Verbal Ability',
    q: 'Select the antonym for "CANDID".',
    o1: 'Frank', o2: 'Honest', o3: 'Secretive', o4: 'Direct', ans: 'Secretive',
    exp: 'Candid means frank and open; Secretive is its antonym.',
    step: 'Candid <-> Secretive.', formula: 'Antonym Pair', trick: 'Open vs Hidden.', mistake: 'Selecting Frank.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Grammar & Subject-Verb', cat: 'Verbal Ability',
    q: 'Neither the manager nor the employees ___ aware of the policy change.',
    o1: 'was', o2: 'were', o3: 'is', o4: 'has been', ans: 'were',
    exp: 'When using "Neither...nor", verb agrees with closer subject ("employees" -> plural -> "were").',
    step: 'Closer subject "employees" is plural -> were.', formula: 'Proximity Rule for Subject-Verb Agreement', trick: 'Look at noun closest to verb.', mistake: 'Using "was" due to "manager".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'One-Word Substitution', cat: 'Verbal Ability',
    q: 'A person who looks at the dark side of everything is called a ___?',
    o1: 'Optimist', o2: 'Pessimist', o3: 'Altruist', o4: 'Atheist', ans: 'Pessimist',
    exp: 'A pessimist tends to see the worst aspect of things.',
    step: 'Dark side observer = Pessimist.', formula: 'Personality Terminology', trick: 'Pessimist <-> Optimist.', mistake: 'Selecting Optimist.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Error Spotting', cat: 'Verbal Ability',
    q: 'Find error part: He is senior than me in the organization.',
    o1: 'He is', o2: 'senior than', o3: 'me in', o4: 'the organization', ans: 'senior than',
    exp: 'Comparative adjectives ending in -ior (senior, junior, superior) take "to" instead of "than". Correct: "senior to me".',
    step: 'Senior + to (not than).', formula: 'Latin Comparative Adjective Rule', trick: '-ior adjectives take "to".', mistake: 'Overlooking "than".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Vocabulary', cat: 'Verbal Ability',
    q: 'Select the correct meaning of "PRAGMATIC".',
    o1: 'Idealistic', o2: 'Practical', o3: 'Theoretical', o4: 'Arrogant', ans: 'Practical',
    exp: 'Pragmatic means dealing with things sensibly and realistically (Practical).',
    step: 'Pragmatic = Practical.', formula: 'Vocabulary Precision', trick: 'Real-world practical approach.', mistake: 'Selecting Theoretical.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Para Jumbles', cat: 'Verbal Ability',
    q: 'Rearrange P: in the world Q: India is R: the fastest growing S: economy. Correct order:',
    o1: 'Q-R-S-P', o2: 'P-Q-R-S', o3: 'R-S-Q-P', o4: 'Q-P-R-S', ans: 'Q-R-S-P',
    exp: 'Order: "India is (Q) the fastest growing (R) economy (S) in the world (P)".',
    step: 'Q -> R -> S -> P.', formula: 'Sentence Flow Analysis', trick: 'Subject "India is" starts sequence Q.', mistake: 'Starting with P.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Reading Comprehension', cat: 'Verbal Ability',
    q: 'Which word in passage means "lasting for a very short time"?',
    o1: 'Eternal', o2: 'Ephemeral', o3: 'Permanent', o4: 'Perpetual', ans: 'Ephemeral',
    exp: 'Ephemeral means lasting for a very short time.',
    step: 'Short-lived = Ephemeral.', formula: 'Contextual Definition', trick: 'Ephemeral means transitory.', mistake: 'Selecting Eternal.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Prepositions', cat: 'Verbal Ability',
    q: 'Fill in the blank: She has been working here ___ 2015.',
    o1: 'for', o2: 'since', o3: 'from', o4: 'in', ans: 'since',
    exp: 'Use "since" for a specific point in time with present perfect continuous tense.',
    step: 'Point in time (2015) -> since.', formula: 'Time Preposition Rule', trick: 'Since + starting year.', mistake: 'Using "for" (used for duration).'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Active Passive Voice', cat: 'Verbal Ability',
    q: 'Convert: "They are building a new bridge." to Passive Voice.',
    o1: 'A new bridge was built by them.', o2: 'A new bridge is being built by them.', o3: 'A new bridge is built by them.', o4: 'A new bridge has been built by them.', ans: 'A new bridge is being built by them.',
    exp: 'Present continuous active ("are building") becomes "is being built" in passive voice.',
    step: 'is/are + being + V3.', formula: 'Present Continuous Passive Rule', trick: 'Look for "is being built".', mistake: 'Using past tense "was built".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Direct Indirect Speech', cat: 'Verbal Ability',
    q: 'She said, "Where are you going?" In Indirect speech: She asked where I ___ going.',
    o1: 'am', o2: 'was', o3: 'were', o4: 'had been', ans: 'was',
    exp: 'Question becomes statement; present tense "are" changes to past tense "was".',
    step: 'Asked + where + I + was.', formula: 'Interrogative Reported Speech', trick: 'No inversion in reported question clause.', mistake: 'Keeping "am".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Conditionals', cat: 'Verbal Ability',
    q: 'If I ___ rich, I would travel the world.',
    o1: 'am', o2: 'was', o3: 'were', o4: 'had been', ans: 'were',
    exp: 'Second conditional hypotheticals use subjunctive "were" for all subjects.',
    step: 'If + subject + were -> would + V1.', formula: 'Subjunctive Conditional Rule', trick: 'Use "were" in hypothetical condition.', mistake: 'Using "was".'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Spelling', cat: 'Verbal Ability',
    q: 'Choose the correctly spelled word.',
    o1: 'Embarass', o2: 'Embarrass', o3: 'Embaras', o4: 'Imbarrass', ans: 'Embarrass',
    exp: 'Correct spelling is Embarrass (double r, double s).',
    step: 'E-M-B-A-R-R-A-S-S.', formula: 'Standard Spelling Accuracy', trick: 'Double r and double s.', mistake: 'Writing Embarass.'
});
addGenQ({
    level: 2, sec: 'English', subj: 'Vocabulary', cat: 'Verbal Ability',
    q: 'Select the word opposite in meaning to "GENEROUS".',
    o1: 'Charitable', o2: 'Stingy', o3: 'Kind', o4: 'Bountiful', ans: 'Stingy',
    exp: 'Generous means giving freely; Stingy means ungenerous or mean.',
    step: 'Generous <-> Stingy.', formula: 'Antonym Selection', trick: 'Liberal giving vs Miserly.', mistake: 'Selecting Charitable.'
});


// =============================================================================
// LEVEL 3: ADVANCED (50 Questions)
// =============================================================================

// Quantitative Aptitude Advanced (18 Q)
addGenQ({
    level: 3, sec: 'Maths', subj: 'Probability & Combinatorics', cat: 'Quantitative Aptitude',
    q: 'In how many ways can 5 men and 4 women be arranged in a row such that all women are together?',
    o1: '2,880', o2: '14,400', o3: '17,280', o4: '28,800', ans: '17,280',
    exp: 'Treat 4 women as 1 unit. Total units = 5 men + 1 unit = 6 units (6! = 720). Women can rearrange among themselves in 4! = 24 ways. Total = 720 * 24 = 17,280.',
    step: '6! * 4! = 720 * 24 = 17,280.', formula: 'String Method in Permutations', trick: '6! * 4! = 17,280.', mistake: 'Forgetting 4! internal arrangements.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Remainder Theorem', cat: 'Quantitative Aptitude',
    q: 'Find the remainder when 2^100 is divided by 7.',
    o1: '1', o2: '2', o3: '4', o4: '6', ans: '2',
    exp: '2^3 = 8 ≡ 1 (mod 7). 2^100 = (2^3)^33 * 2^1 ≡ (1)^33 * 2 = 2 (mod 7).',
    step: '2^100 = (8)^33 * 2 ≡ 1 * 2 = 2.', formula: 'Modular Arithmetic & Fermat\'s Little Theorem', trick: 'Reduce 100 mod 3 = 1 -> 2^1 = 2.', mistake: 'Thinking remainder is 1.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Time, Speed & Distance', cat: 'Quantitative Aptitude',
    q: 'Two trains start at same time from A and B toward each other at 50 km/h and 60 km/h. When they meet, faster train has covered 40 km more. Find distance AB.',
    o1: '360 km', o2: '400 km', o3: '440 km', o4: '480 km', ans: '440 km',
    exp: 'Difference in speed = 60 - 50 = 10 km/h. Time taken to meet = 40 / 10 = 4 hours. Distance AB = (50 + 60) * 4 = 110 * 4 = 440 km.',
    step: 'Time = 40 / 10 = 4 h. AB = 110 * 4 = 440 km.', formula: 'Relative Speed & Time', trick: 'Speed ratio 5:6 -> distance difference 1 part = 40 km -> total 11 parts = 440 km.', mistake: 'Calculating for 5 hours.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Work & Efficiency', cat: 'Quantitative Aptitude',
    q: 'A is twice as efficient as B. Working together they finish a job in 14 days. How long will A take alone?',
    o1: '18 days', o2: '21 days', o3: '28 days', o4: '42 days', ans: '21 days',
    exp: 'Efficiency ratio A:B = 2:1. Total rate = 3 units/day. Total work = 3 * 14 = 42 units. A\'s time = 42 / 2 = 21 days.',
    step: '42 / 2 = 21.', formula: 'Work = Combined Efficiency * Time', trick: 'Combined 3 parts * 14 = 42; A = 42 / 2 = 21.', mistake: 'Dividing 14 by 2.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Compound Interest', cat: 'Quantitative Aptitude',
    q: 'The difference between CI and SI on a sum for 2 years at 15% per annum is ₹180. Find the sum.',
    o1: '₹6,000', o2: '₹7,500', o3: '₹8,000', o4: '₹9,000', ans: '₹8,000',
    exp: 'Difference D = P * (R/100)^2 => 180 = P * (15/100)^2 => 180 = P * (225 / 10000) => P = (180 * 10000) / 225 = ₹8,000.',
    step: 'P = 180 * 10000 / 225 = 8000.', formula: 'CI - SI (2 years) = P(R/100)^2', trick: 'P = D * (100/R)^2 = 180 * (400/9) = 8000.', mistake: 'Using 3-year formula.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Data Interpretation', cat: 'Quantitative Aptitude',
    q: 'In a company of 500 employees, 60% are males. If 40% of males and 30% of females are postgraduates, find total PG employees.',
    o1: '160', o2: '180', o3: '200', o4: '220', ans: '180',
    exp: 'Males = 300, Females = 200. PG males = 40% of 300 = 120. PG females = 30% of 200 = 60. Total PG = 120 + 60 = 180.',
    step: '120 + 60 = 180.', formula: 'Weighted Subgroup Percentages', trick: '300 * 0.4 + 200 * 0.3 = 120 + 60 = 180.', mistake: 'Taking 35% of 500 (getting 175).'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Pipes & Cisterns', cat: 'Quantitative Aptitude',
    q: 'Pipe A fills in 12 min, Pipe B in 15 min. Pipe C empties full tank in 6 min. A and B open for 5 min, then C also opens. Time to empty tank?',
    o1: '30 min', o2: '35 min', o3: '45 min', o4: '60 min', ans: '45 min',
    exp: 'In 5 min, A+B fill = 5 * (1/12 + 1/15) = 5 * (9/60) = 45/60 of tank. When C opens, net rate = 1/12 + 1/15 - 1/6 = 9/60 - 10/60 = -1/60 (empties 1/60 per min). Time to empty (45/60) = 45 min.',
    step: '(45/60) / (1/60) = 45 min.', formula: 'Accumulated Volume / Net Drain Rate', trick: 'Filled volume 45/60 is drained at 1/60 per min -> 45 min.', mistake: 'Dividing whole tank by net rate.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Height & Distance', cat: 'Quantitative Aptitude',
    q: 'From top of 60 m tower, angle of depression of object on ground is 30°. Find distance of object from base of tower.',
    o1: '60 m', o2: '60√3 m', o3: '30√3 m', o4: '120 m', ans: '60√3 m',
    exp: 'tan(30°) = Height / Distance => 1/√3 = 60 / D => D = 60√3 m.',
    step: 'D = 60 * √3.', formula: 'tan(θ) = Opposite / Adjacent', trick: 'Adjacent = Opposite * √3 for 30° angle.', mistake: 'Dividing 60 by √3.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Progressions', cat: 'Quantitative Aptitude',
    q: 'Sum of first n terms of an AP is 3n^2 + 5n. Find the 10th term.',
    o1: '56', o2: '62', o3: '68', o4: '74', ans: '62',
    exp: 'T10 = S10 - S9. S10 = 3(100) + 5(10) = 350. S9 = 3(81) + 5(9) = 243 + 45 = 288. T10 = 350 - 288 = 62.',
    step: '350 - 288 = 62.', formula: 'Tn = Sn - S(n-1)', trick: 'Derivative of Sn gives 6n + 2 -> for n=10, 6(10) + 2 = 62.', mistake: 'Calculating S10 directly.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Matrices & Determinants', cat: 'Quantitative Aptitude',
    q: 'Find determinant of 2x2 matrix [[4, 2], [3, 5]].',
    o1: '14', o2: '16', o3: '18', o4: '26', ans: '14',
    exp: 'Det = ad - bc = (4 * 5) - (2 * 3) = 20 - 6 = 14.',
    step: '20 - 6 = 14.', formula: 'det([[a,b],[c,d]]) = ad - bc', trick: 'Diagonal product minus anti-diagonal product.', mistake: 'Adding products 20 + 6 = 26.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Surds & Indices', cat: 'Quantitative Aptitude',
    q: 'Simplify: (64)^(-2/3) * (256)^(1/4)',
    o1: '1/4', o2: '1/2', o3: '1', o4: '2', ans: '1/4',
    exp: '(64)^(-2/3) = (4^3)^(-2/3) = 4^(-2) = 1/16. (256)^(1/4) = (4^4)^(1/4) = 4. Result = (1/16) * 4 = 1/4.',
    step: '1/16 * 4 = 1/4.', formula: 'Exponent Laws (a^m)^n = a^(mn)', trick: 'Convert both bases to 4.', mistake: 'Evaluating 64^(-2/3) as 1/8.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Mensuration 3D', cat: 'Quantitative Aptitude',
    q: 'A metallic sphere of radius 6 cm is melted and recast into small cones of radius 2 cm and height 3 cm. How many cones formed?',
    o1: '48', o2: '64', o3: '72', o4: '96', ans: '72',
    exp: 'Sphere Vol = (4/3)π(6^3) = 288π. Cone Vol = (1/3)π(2^2)(3) = 4π. Number of cones = 288π / 4π = 72.',
    step: '288π / 4π = 72.', formula: 'N = Volume of Sphere / Volume of Cone', trick: '(4 * 216) / (4 * 3) = 72.', mistake: 'Dividing surface areas instead of volumes.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Set Theory', cat: 'Quantitative Aptitude',
    q: 'If n(A) = 20, n(B) = 30, and n(A u B) = 40, find n(A n B).',
    o1: '5', o2: '10', o3: '15', o4: '20', ans: '10',
    exp: 'n(A u B) = n(A) + n(B) - n(A n B) => 40 = 20 + 30 - n(A n B) => n(A n B) = 10.',
    step: '20 + 30 - 40 = 10.', formula: 'Inclusion-Exclusion Principle', trick: 'Intersection = Sum - Union = 50 - 40 = 10.', mistake: 'Subtracting 20 from 40.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Quadratic Equations', cat: 'Quantitative Aptitude',
    q: 'If alpha and beta are roots of x^2 - 5x + 6 = 0, find value of alpha^2 + beta^2.',
    o1: '13', o2: '19', o3: '25', o4: '31', ans: '13',
    exp: 'alpha + beta = 5, alpha*beta = 6. alpha^2 + beta^2 = (alpha+beta)^2 - 2*alpha*beta = 25 - 12 = 13.',
    step: '25 - 12 = 13.', formula: 'Roots Identity: a^2 + b^2 = (a+b)^2 - 2ab', trick: 'Roots are 2 and 3 -> 4 + 9 = 13.', mistake: 'Squaring sum directly to get 25.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Coordinate Geometry', cat: 'Quantitative Aptitude',
    q: 'Find distance between points A(3, 4) and B(7, 7).',
    o1: '4', o2: '5', o3: '6', o4: '7', ans: '5',
    exp: 'Distance = sqrt((7-3)^2 + (7-4)^2) = sqrt(4^2 + 3^2) = sqrt(16 + 9) = sqrt(25) = 5.',
    step: 'sqrt(16 + 9) = 5.', formula: 'd = sqrt((x2-x1)^2 + (y2-y1)^2)', trick: '3-4-5 right triangle projection.', mistake: 'Adding coordinate differences 4+3=7.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Functions', cat: 'Quantitative Aptitude',
    q: 'If f(x) = 2x + 3 and g(x) = x^2, find fog(3).',
    o1: '15', o2: '21', o3: '81', o4: '99', ans: '21',
    exp: 'g(3) = 3^2 = 9. fog(3) = f(g(3)) = f(9) = 2(9) + 3 = 18 + 3 = 21.',
    step: 'f(9) = 18 + 3 = 21.', formula: 'Composite Function f(g(x))', trick: 'Evaluate g(3)=9 first, then f(9)=21.', mistake: 'Evaluating gof(3) instead of fog(3).'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Trigonometry', cat: 'Quantitative Aptitude',
    q: 'Find value of sin^2(30°) + cos^2(30°).',
    o1: '0', o2: '1/2', o3: '1', o4: 'sqrt(3)/2', ans: '1',
    exp: 'By Pythagorean identity sin^2(theta) + cos^2(theta) = 1 for any angle theta.',
    step: '(1/2)^2 + (sqrt(3)/2)^2 = 1/4 + 3/4 = 1.', formula: 'Fundamental Trigonometric Identity', trick: 'sin^2 + cos^2 is always 1.', mistake: 'Miscalculating fractions.'
});
addGenQ({
    level: 3, sec: 'Maths', subj: 'Inequalities', cat: 'Quantitative Aptitude',
    q: 'Solve inequality: |2x - 5| < 7.',
    o1: '-1 < x < 6', o2: '-2 < x < 6', o3: '1 < x < 6', o4: '-1 < x < 12', ans: '-1 < x < 6',
    exp: '-7 < 2x - 5 < 7 => -2 < 2x < 12 => -1 < x < 6.',
    step: '-2 < 2x < 12 -> -1 < x < 6.', formula: '|u| < a <=> -a < u < a', trick: 'Add 5 to bounds: -2 to 12, divide by 2: -1 to 6.', mistake: 'Ignoring negative bound.'
});

// Logical Reasoning Advanced (16 Q)
addGenQ({
    level: 3, sec: 'Logical', subj: 'Complex Seating', cat: 'Logical Reasoning',
    q: '8 friends A..H sit around circular table facing center. A is 3rd to right of B who is 2nd to right of C. F is not neighbor of B. D sits 2nd to left of H. Who is opposite A?',
    o1: 'C', o2: 'D', o3: 'E', o4: 'H', ans: 'H',
    exp: 'Deduction of 8-position circular graph confirms H is directly opposite A.',
    step: 'Position assignment around 8-point circle.', formula: 'Circular Graph Elimination', trick: 'Relative angular placement.', mistake: 'Confusing left/right direction.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Binary Logic', cat: 'Logical Reasoning',
    q: '3 persons A,B,C. One is Truth-teller (always true), one Liar (always false), one Alternator. A says "I am truth-teller". B says "A is liar". C says "B is alternator". Who is truth-teller?',
    o1: 'A', o2: 'B', o3: 'C', o4: 'Cannot be determined', ans: 'B',
    exp: 'If B is truth-teller, B\'s statement "A is liar" is TRUE, so A is liar (A\'s claim "I am truth-teller" is FALSE). C\'s statement makes C alternator. Everything holds.',
    step: 'Truth table scenario testing.', formula: 'Binary Logic Case Evaluation', trick: 'Test B as Truth-teller first.', mistake: 'Assuming A is truth-teller.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Critical Reasoning', cat: 'Logical Reasoning',
    q: 'Claim: Company X sales rose 40% after celebrity ad. Conclusion: Celebrity ads guarantee 40% sales rise. Which weakens conclusion?',
    o1: 'Competitor prices rose by 50% at same time', o2: 'Company X spent 1M on ad', o3: 'Celebrity is popular', o4: 'Sales rose in all regions', ans: 'Competitor prices rose by 50% at same time',
    exp: 'Competitor price rise offers an alternative explanation for Company X\'s sales increase, weakening the causal link to the celebrity ad.',
    step: 'Identify confounding variable.', formula: 'Causal Weakening Principle', trick: 'Look for alternative cause.', mistake: 'Choosing cost of ad.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Cube & Dice', cat: 'Logical Reasoning',
    q: 'A 4x4x4 cube painted red outside is cut into 64 small 1x1x1 cubes. How many small cubes have NO faces painted?',
    o1: '4', o2: '8', o3: '16', o4: '24', ans: '8',
    exp: 'Unpainted inner cubes formula = (n - 2)^3 = (4 - 2)^3 = 2^3 = 8.',
    step: '(4 - 2)^3 = 8.', formula: 'Unpainted Core Cubes = (n-2)^3', trick: '2x2x2 inner core = 8.', mistake: 'Calculating 1-face painted cubes (24).'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Syllogism Complex', cat: 'Logical Reasoning',
    q: 'Statements: All A are B. Some B are C. No C is D. Conclusions: I. Some A may be C. II. No D is B.',
    o1: 'Only I follows', o2: 'Only II follows', o3: 'Both follow', o4: 'Neither follows', ans: 'Only I follows',
    exp: 'Conclusion I is a possibility statement (Some A may be C), which is true as A and C have no negative link. Conclusion II is false since some B can be D outside C.',
    step: 'Possibility logic verification.', formula: 'Modal Syllogistic Deduction', trick: 'Possibility holds if no direct contradiction.', mistake: 'Rejecting possibility statement.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Clocks Advanced', cat: 'Logical Reasoning',
    q: 'A clock gains 5 minutes every hour. If set right at 12 PM, what time will it show at 6 PM real time?',
    o1: '6:25 PM', o2: '6:30 PM', o3: '6:35 PM', o4: '7:00 PM', ans: '6:30 PM',
    exp: 'In 6 real hours, clock gains 6 * 5 = 30 minutes. Displayed time = 6:30 PM.',
    step: '6 * 5 = 30 min gain -> 6:30 PM.', formula: 'Clock Gain = Elapsed Hours * Gain Rate', trick: '30 min gain on 6 hours.', mistake: 'Subtracting 30 minutes.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Calendars Advanced', cat: 'Logical Reasoning',
    q: 'Which year will have identical calendar to 2024?',
    o1: '2048', o2: '2050', o3: '2052', o4: '2056', ans: '2052',
    exp: 'A leap year calendar repeats after 28 years. 2024 + 28 = 2052.',
    step: '2024 + 28 = 2052.', formula: 'Leap Year Repetition Period (28 years)', trick: 'Add 28 to leap year.', mistake: 'Adding 11 years (used for non-leap years).'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Data Sufficiency', cat: 'Logical Reasoning',
    q: 'Find value of positive integer X. Stmt 1: X^2 = 49. Stmt 2: X^3 = 343.',
    o1: 'Stmt 1 alone is sufficient', o2: 'Stmt 2 alone is sufficient', o3: 'Each alone is sufficient', o4: 'Neither is sufficient', ans: 'Each alone is sufficient',
    exp: 'Given X is positive integer: Stmt 1 gives X = 7. Stmt 2 gives X = 7. Each alone is sufficient.',
    step: 'Each statement independently yields X=7.', formula: 'Data Sufficiency Evaluation', trick: 'X positive eliminates -7 in Stmt 1.', mistake: 'Thinking Stmt 1 yields ±7.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Coded Inequalities', cat: 'Logical Reasoning',
    q: 'P @ Q means P >= Q, P # Q means P = Q, P $ Q means P < Q. Given A @ B # C $ D. Conclusion I: A >= C. II: A < D.',
    o1: 'Only I follows', o2: 'Only II follows', o3: 'Both follow', o4: 'Neither follows', ans: 'Only I follows',
    exp: 'A >= B = C < D. Thus A >= C is true (Conclusion I). Relation between A and D cannot be established directly (A >= C < D).',
    step: 'A >= C holds; A vs D indeterminate.', formula: 'Coded Inequality Transitivity', trick: 'B=C so A >= B becomes A >= C.', mistake: 'Assuming II follows.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Puzzles Advanced', cat: 'Logical Reasoning',
    q: '3 boxes labeled Apples, Oranges, Mixed. ALL labels are wrong. You pick 1 fruit from Mixed box and get an Apple. What is in Oranges box?',
    o1: 'Apples', o2: 'Oranges', o3: 'Mixed', o4: 'Cannot be determined', ans: 'Mixed',
    exp: 'Labeled Mixed (wrong) contains Apples. Box labeled Oranges (wrong) cannot contain Oranges or Apples, so it MUST contain Mixed. Box labeled Apples contains Oranges.',
    step: 'Logical deduction from wrong labeling condition.', formula: 'Mislabeling Constraint Elimination', trick: 'Since Oranges box can\'t be Oranges or Apples, it\'s Mixed.', mistake: 'Guessing Oranges.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Flowchart Logic', cat: 'Logical Reasoning',
    q: 'Algorithm: X = 1; Loop: X = X * 2 + 1; Repeat 3 times. What is final X?',
    o1: '7', o2: '15', o3: '31', o4: '63', ans: '15',
    exp: 'Start X=1. Iteration 1: 1*2+1 = 3. Iteration 2: 3*2+1 = 7. Iteration 3: 7*2+1 = 15.',
    step: '1 -> 3 -> 7 -> 15.', formula: 'Iterative Sequence Recurrence', trick: '2^k - 1 progression.', mistake: 'Stopping after 2 iterations.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Matrix Puzzle', cat: 'Logical Reasoning',
    q: 'Find missing number in 3x3 matrix: [[2, 3, 5], [4, 5, 9], [6, 7, ?]]',
    o1: '11', o2: '12', o3: '13', o4: '14', ans: '13',
    exp: 'Row rule: Col 1 + Col 2 = Col 3. Row 3: 6 + 7 = 13.',
    step: '6 + 7 = 13.', formula: 'Matrix Row Addition Pattern', trick: 'Simple addition across columns.', mistake: 'Selecting 12.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Artificial Language', cat: 'Logical Reasoning',
    q: 'If "mook" = blue, "slap" = sky, "mookslap" = blue sky. What means "blue water" if "trop" = water?',
    o1: 'mooktrop', o2: 'slaptrop', o3: 'tropmook', o4: 'tropslap', ans: 'mooktrop',
    exp: 'blue = mook, water = trop. "blue water" = mooktrop.',
    step: 'mook + trop = mooktrop.', formula: 'Morphological Prefix-Suffix Logic', trick: 'Combine translated words in order.', mistake: 'Selecting tropmook.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Spatial Reasoning', cat: 'Logical Reasoning',
    q: 'A paper folded in half and 2 holes punched. When unfolded, how many holes are visible?',
    o1: '2', o2: '4', o3: '6', o4: '8', ans: '4',
    exp: '1 fold doubles the number of punched holes: 2 * 2 = 4 holes.',
    step: '2 * 2 = 4.', formula: 'Paper Folding Symmetry', trick: 'Number of layers * punches = total holes.', mistake: 'Selecting 2.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Direction & Distance Complex', cat: 'Logical Reasoning',
    q: 'A person walks 5 km East, turns 135° left, walks 5√2 km. Where is he relative to start?',
    o1: '5 km North', o2: '5 km South', o3: '5 km East', o4: 'At starting point', ans: '5 km North',
    exp: 'East is 0°. 135° left turn points North-West (-5 km East, +5 km North). Net position: East = 5 - 5 = 0, North = 5. Position: 5 km North.',
    step: 'Vector addition: (5, 0) + (-5, 5) = (0, 5).', formula: 'Vector Displacement Decomposition', trick: '135° NW decomposition gives -5 East, +5 North.', mistake: 'Concluding at starting point.'
});
addGenQ({
    level: 3, sec: 'Logical', subj: 'Statement Arguments', cat: 'Logical Reasoning',
    q: 'Statement: Should plastic bags be banned? Arg 1: Yes, they cause environmental hazard. Arg 2: No, they are convenient.',
    o1: 'Only 1 is strong', o2: 'Only 2 is strong', o3: 'Both are strong', o4: 'Neither is strong', ans: 'Only 1 is strong',
    exp: 'Environmental hazard (Arg 1) is a major public interest argument. Mere convenience (Arg 2) does not outweigh severe environmental harm.',
    step: 'Evaluate strength based on public impact.', formula: 'Argument Strength Evaluation', trick: 'Environmental protection overrides minor convenience.', mistake: 'Considering both equally strong.'
});

// Verbal Ability Advanced (16 Q)
addGenQ({
    level: 3, sec: 'English', subj: 'Advanced Vocabulary', cat: 'Verbal Ability',
    q: 'Select the word that best completes sentence: Her ___ explanation resolved all ambiguities.',
    o1: 'lucid', o2: 'obscure', o3: 'vague', o4: 'ambiguous', ans: 'lucid',
    exp: 'Lucid means expressed clearly; easy to understand.',
    step: 'Lucid = Clear.', formula: 'Contextual Fit Vocabulary', trick: 'Resolving ambiguities requires clarity (lucid).', mistake: 'Selecting obscure.'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Antonyms', cat: 'Verbal Ability',
    q: 'Select the antonym for "LOQUACIOUS".',
    o1: 'Talkative', o2: 'Garrulous', o3: 'Taciturn', o4: 'Voluble', ans: 'Taciturn',
    exp: 'Loquacious means talkative; Taciturn means reserved or uncommunicative (antonym).',
    step: 'Loquacious <-> Taciturn.', formula: 'Advanced Antonym Pairing', trick: 'Talkative vs Silent.', mistake: 'Selecting Garrulous (Synonym).'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Advanced Grammar', cat: 'Verbal Ability',
    q: 'Identify correct sentence: Had I known about the traffic, I ___ earlier.',
    o1: 'would start', o2: 'would have started', o3: 'will have started', o4: 'had started', ans: 'would have started',
    exp: 'Third conditional inversion: "Had I known..., I would have started...".',
    step: 'Had + V3 -> would have + V3.', formula: 'Third Conditional Construction', trick: 'Past hypothetical result requires "would have V3".', mistake: 'Using "would start".'
});
addGenQ({
    level: 3, sec: 'English', subj: 'One-Word Substitution', cat: 'Verbal Ability',
    q: 'A speech delivered without any prior preparation is an ___ speech.',
    o1: 'Extempore', o2: 'Maiden', o3: 'Eulogy', o4: 'Oratory', ans: 'Extempore',
    exp: 'Extempore (or impromptu) means spoken or done without preparation.',
    step: 'Unprepared speech = Extempore.', formula: 'Rhetoric Terminology', trick: 'Ex-tempore = Out of time/preparation.', mistake: 'Selecting Maiden (first speech).'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Idioms & Phrases', cat: 'Verbal Ability',
    q: 'What does "To steal someone\'s thunder" mean?',
    o1: 'To rob someone', o2: 'To take credit for someone else\'s achievements', o3: 'To shout loudly', o4: 'To cause rain', ans: 'To take credit for someone else\'s achievements',
    exp: 'To steal someone\'s thunder means to take praise or attention away from someone by doing or saying what they intended to.',
    step: 'Idiom meaning = Take credit.', formula: 'Idiomatic Phrase Interpretation', trick: 'Preempt someone\'s idea.', mistake: 'Interpreting literally.'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Sentence Improvement', cat: 'Verbal Ability',
    q: 'Improve underlined part: He insisted *on me to go* there.',
    o1: 'on my going', o2: 'on me going', o3: 'for me to go', o4: 'to me going', ans: 'on my going',
    exp: 'Verb "insist" takes preposition "on" followed by possessive + gerund ("on my going").',
    step: 'Insist + on + possessive + gerund.', formula: 'Gerund Preposition Construction', trick: 'Insist on + possessive pronoun + -ing.', mistake: 'Using infinitive "to go".'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Synonyms', cat: 'Verbal Ability',
    q: 'Select synonym for "OBSEQUIOUS".',
    o1: 'Servile', o2: 'Arrogant', o3: 'Domineering', o4: 'Assertive', ans: 'Servile',
    exp: 'Obsequious means obedient or attentive to a servile degree.',
    step: 'Obsequious = Servile / Subservient.', formula: 'Advanced Vocabulary Synonym', trick: 'Excessively eager to please.', mistake: 'Selecting Arrogant (Antonym).'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Para Completion', cat: 'Verbal Ability',
    q: 'Sentence: Technology has transformed education. ___ Consequently, online learning is now ubiquitous.',
    o1: 'However, books are still printed.', o2: 'Digital classrooms have replaced traditional methods.', o3: 'Sports are essential.', o4: 'Teachers dislike computers.', ans: 'Digital classrooms have replaced traditional methods.',
    exp: 'Sentence 2 provides the logical bridge between technology transforming education and online learning becoming ubiquitous.',
    step: 'Logical cause-effect bridge.', formula: 'Cohesive Paragraph Flow', trick: 'Connects technology transformation with online ubiquity.', mistake: 'Selecting contrasting statement.'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Vocabulary Precision', cat: 'Verbal Ability',
    q: 'Select word that means "Fear of confined places":',
    o1: 'Acrophobia', o2: 'Claustrophobia', o3: 'Agoraphobia', o4: 'Hydrophobia', ans: 'Claustrophobia',
    exp: 'Claustrophobia is extreme fear of confined or crowded spaces.',
    step: 'Confined space fear = Claustrophobia.', formula: 'Phobia Terminology', trick: 'Claustro = enclosed space.', mistake: 'Selecting Agoraphobia (open spaces).'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Error Spotting', cat: 'Verbal Ability',
    q: 'Identify error: The news are true and confirmed by officials.',
    o1: 'The news', o2: 'are true', o3: 'and confirmed', o4: 'by officials', ans: 'are true',
    exp: '"News" is an uncountable noun that takes a singular verb. Correct: "The news is true".',
    step: 'News + singular verb = News is.', formula: 'Uncountable Noun Agreement', trick: 'News takes "is", not "are".', mistake: 'Overlooking plural appearance of "news".'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Foreign Words in English', cat: 'Verbal Ability',
    q: 'What does "Status quo" mean?',
    o1: 'Existing state of affairs', o2: 'Financial status', o3: 'Social prestige', o4: 'Future outlook', ans: 'Existing state of affairs',
    exp: 'Status quo refers to the existing state of affairs, particularly regarding social or political issues.',
    step: 'Status quo = Existing condition.', formula: 'Latin Expression Translation', trick: 'Current state.', mistake: 'Confusing with social rank.'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Direct Indirect Speech', cat: 'Verbal Ability',
    q: 'The captain said, "Bravo! You have played well." In Indirect speech: The captain applauded them saying that they ___ played well.',
    o1: 'have', o2: 'had', o3: 'were', o4: 'would have', ans: 'had',
    exp: 'Exclamatory reported speech: Present perfect "have played" shifts to past perfect "had played".',
    step: 'Have played -> Had played.', formula: 'Exclamatory Reporting Tense Shift', trick: 'Present perfect backshifts to past perfect.', mistake: 'Keeping "have".'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Analogy Verbal', cat: 'Verbal Ability',
    q: 'EPHEMERAL : PERMANENT :: ___ : ___',
    o1: 'Transient : Momentary', o2: 'Candid : Secretive', o3: 'Lucid : Clear', o4: 'Wise : Smart', ans: 'Candid : Secretive',
    exp: 'Ephemeral and Permanent are antonyms. Candid and Secretive are also antonyms.',
    step: 'Antonym pair match.', formula: 'Analogy Structural Relationship', trick: 'Find the antonym pair.', mistake: 'Selecting Synonym pair Transient : Momentary.'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Vocabulary', cat: 'Verbal Ability',
    q: 'Select the word that means "Excessive admiration of oneself":',
    o1: 'Narcissism', o2: 'Altruism', o3: 'Optimism', o4: 'Skepticism', ans: 'Narcissism',
    exp: 'Narcissism is excessive interest in or admiration of oneself.',
    step: 'Self-admiration = Narcissism.', formula: 'Psychological Terminology', trick: 'Narcissus story origin.', mistake: 'Selecting Altruism (concern for others).'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Sentence Construction', cat: 'Verbal Ability',
    q: 'Choose correct option: Not only did he pass the exam ___ he also secured the first rank.',
    o1: 'and', o2: 'but', o3: 'so', o4: 'then', ans: 'but',
    exp: 'Correlative conjunction pair is "Not only... but also".',
    step: 'Not only... but also.', formula: 'Correlative Conjunction Pair', trick: 'Matches "Not only".', mistake: 'Using "and".'
});
addGenQ({
    level: 3, sec: 'English', subj: 'Word Usage', cat: 'Verbal Ability',
    q: 'Choose the correct word: The medicine had a positive ___ on the patient.',
    o1: 'affect', o2: 'effect', o3: 'affected', o4: 'effective', ans: 'effect',
    exp: 'Use noun "effect" to mean a result or impact. "Affect" is usually a verb.',
    step: 'Noun position after positive -> "effect".', formula: 'Affect vs Effect Usage', trick: 'An effect (noun), to affect (verb).', mistake: 'Using "affect".'
});

module.exports = generalPlacementQuestions;
