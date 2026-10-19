// Cognizant aptitude MCQ bank. Tuple format mirrors accentureCognitiveBank:
// [topic, subject, question, options[4], answerText, explanation, difficultyLevel]
// The correct answer is stored as TEXT (matches Question.answer convention).
module.exports = [
    // Number systems
    ['Number Systems', 'Quantitative Aptitude', 'What is the remainder when 2^31 is divided by 5?', ['1', '2', '3', '4'], '3', 'Powers of 2 mod 5 repeat every 4: 2,4,3,1. 31 mod 4 = 3, so the remainder is 3.', 2],
    ['Number Systems', 'Quantitative Aptitude', 'What is the HCF of 36 and 84?', ['6', '12', '18', '24'], '12', '36 = 2^2*3^2, 84 = 2^2*3*7. HCF = 4*3 = 12.', 1],
    ['Number Systems', 'Quantitative Aptitude', 'What is the LCM of 12, 15 and 20?', ['30', '45', '60', '120'], '60', 'LCM(12,15,20) = 60.', 1],
    ['Number Systems', 'Quantitative Aptitude', 'Which of the following is a prime number?', ['87', '91', '97', '99'], '97', '97 has no divisors other than 1 and itself. 87=3*29, 91=7*13, 99=9*11.', 1],
    ['Number Systems', 'Quantitative Aptitude', 'What is the sum of the first 20 natural numbers?', ['190', '200', '210', '220'], '210', 'n(n+1)/2 = 20*21/2 = 210.', 1],
    ['Number Systems', 'Quantitative Aptitude', 'The binary number 1010 equals which decimal number?', ['8', '10', '12', '14'], '10', '1010b = 8 + 2 = 10.', 1],
    ['Number Systems', 'Quantitative Aptitude', 'What is the unit digit of 7^95?', ['1', '3', '7', '9'], '3', 'Unit digits of powers of 7 cycle 7,9,3,1. 95 mod 4 = 3, so the digit is 3.', 3],
    // Percentages
    ['Percentages', 'Quantitative Aptitude', 'What is 25% of 480?', ['100', '110', '120', '130'], '120', '480/4 = 120.', 1],
    ['Percentages', 'Quantitative Aptitude', 'A price rises from Rs. 80 to Rs. 100. What is the percentage increase?', ['20%', '25%', '30%', '80%'], '25%', 'Increase = 20 on base 80 = 25%.', 1],
    ['Percentages', 'Quantitative Aptitude', 'If x is 20% less than y, then y is how much percent more than x?', ['20%', '22%', '25%', '30%'], '25%', 'x = 0.8y, so y = 1.25x, i.e. 25% more.', 2],
    ['Percentages', 'Quantitative Aptitude', 'An item is marked 40% above cost and sold at a 20% discount. What is the profit percent?', ['8%', '10%', '12%', '20%'], '12%', 'SP = 1.4 * 0.8 = 1.12 CP, so 12% profit.', 2],
    ['Percentages', 'Quantitative Aptitude', 'A salary is reduced by 10% and then increased by 10%. The net change is:', ['No change', '1% decrease', '1% increase', '2% decrease'], '1% decrease', '0.9 * 1.1 = 0.99, a 1% decrease.', 2],
    ['Percentages', 'Quantitative Aptitude', "If A's income is 25% more than B's, then B's income is what percent less than A's?", ['20%', '25%', '30%', '15%'], '20%', 'A = 1.25B, so B = 0.8A, i.e. 20% less.', 2],
    ['Percentages', 'Quantitative Aptitude', 'Express 3/8 as a percentage.', ['35%', '36.5%', '37.5%', '38%'], '37.5%', '3/8 = 0.375 = 37.5%.', 1],
    // Time and work
    ['Time and Work', 'Quantitative Aptitude', 'A can finish a job in 10 days and B in 15 days. Working together, they finish it in:', ['5 days', '6 days', '8 days', '12 days'], '6 days', '1/10 + 1/15 = 1/6, so 6 days.', 2],
    ['Time and Work', 'Quantitative Aptitude', 'A can do a job in 12 days, B in 24 days. Together they take:', ['6 days', '7 days', '8 days', '9 days'], '8 days', '1/12 + 1/24 = 1/8, so 8 days.', 1],
    ['Time and Work', 'Quantitative Aptitude', 'A pipe fills a tank in 4 hours; a drain empties it in 8 hours. With both open, the tank fills in:', ['6 hours', '7 hours', '8 hours', '12 hours'], '8 hours', '1/4 - 1/8 = 1/8, so 8 hours.', 2],
    ['Time and Work', 'Quantitative Aptitude', 'A and B together take 8 days; A alone takes 12 days. B alone takes:', ['16 days', '20 days', '24 days', '32 days'], '24 days', '1/8 - 1/12 = 1/24, so 24 days.', 2],
    ['Time and Work', 'Quantitative Aptitude', '12 workers finish a job in 18 days. How many days will 9 workers take (same efficiency)?', ['21', '22', '24', '27'], '24', 'Work = 216 worker-days; 216/9 = 24 days.', 2],
    ['Time Speed Distance', 'Quantitative Aptitude', 'A train at 72 km/h crosses a pole. If the train is 200 m long, how long does it take?', ['8 s', '10 s', '12 s', '15 s'], '10 s', '72 km/h = 20 m/s; 200/20 = 10 s.', 2],
    ['Time Speed Distance', 'Quantitative Aptitude', 'A man walks at 5 km/h for 20 minutes. How far does he go?', ['1.25 km', '1.5 km', '1.67 km', '2 km'], '1.67 km', '5 * (1/3) = 1.67 km (5/3 km).', 1],
    // Probability
    ['Probability', 'Quantitative Aptitude', 'A fair die is rolled. What is the probability of getting an even number?', ['1/6', '1/3', '1/2', '2/3'], '1/2', 'Three evens out of six faces = 1/2.', 1],
    ['Probability', 'Quantitative Aptitude', 'A card is drawn from a standard 52-card deck. What is the probability that it is a king?', ['1/26', '1/13', '1/4', '4/13'], '1/13', '4 kings / 52 cards = 1/13.', 1],
    ['Probability', 'Quantitative Aptitude', 'Two fair coins are tossed. What is the probability that both show heads?', ['1/2', '1/3', '1/4', '3/4'], '1/4', 'HH is 1 of 4 equally likely outcomes.', 1],
    ['Probability', 'Quantitative Aptitude', 'A bag has 3 red and 5 blue balls. One ball is drawn at random. Probability it is red:', ['1/8', '3/8', '5/8', '3/5'], '3/8', '3 favourable out of 8 total = 3/8.', 1],
    ['Probability', 'Quantitative Aptitude', 'Two dice are rolled. What is the probability that the sum is 7?', ['1/9', '1/6', '5/36', '7/36'], '1/6', 'Six combinations give 7 out of 36 outcomes = 1/6.', 2],
    ['Probability', 'Quantitative Aptitude', 'A card is drawn from a 52-card deck. Probability that it is a face card (J, Q, K):', ['1/13', '3/13', '4/13', '12/13'], '3/13', '12 face cards / 52 = 3/13.', 2],
    ['Probability', 'Quantitative Aptitude', 'If the probability that it rains tomorrow is 0.3, what is the probability that it does NOT rain?', ['0.3', '0.5', '0.7', '1.3'], '0.7', 'P(not rain) = 1 - 0.3 = 0.7.', 1],
    // Permutations and combinations
    ['Permutations and Combinations', 'Quantitative Aptitude', 'In how many ways can the letters of the word SMART be arranged?', ['60', '100', '120', '720'], '120', '5 distinct letters: 5! = 120.', 1],
    ['Permutations and Combinations', 'Quantitative Aptitude', 'What is the value of 5C2?', ['5', '10', '15', '20'], '10', '5C2 = 5!/(2!3!) = 10.', 1],
    ['Permutations and Combinations', 'Quantitative Aptitude', 'What is the value of 5P2?', ['10', '15', '20', '25'], '20', '5P2 = 5*4 = 20.', 1],
    ['Permutations and Combinations', 'Quantitative Aptitude', 'How many ways can 3 people be chosen from a group of 7?', ['21', '35', '42', '210'], '35', '7C3 = 35.', 2],
    ['Permutations and Combinations', 'Quantitative Aptitude', 'In how many ways can the letters of LEVEL be arranged?', ['20', '30', '60', '120'], '30', '5!/(2!2!) = 30.', 2],
    ['Permutations and Combinations', 'Quantitative Aptitude', '10 people shake hands once with each other. How many handshakes occur?', ['45', '90', '100', '55'], '45', '10C2 = 45.', 2],
    ['Permutations and Combinations', 'Quantitative Aptitude', 'How many 3-digit numbers can be formed from digits 1-5 without repetition?', ['60', '100', '120', '125'], '60', '5*4*3 = 60.', 2],
    // Applied maths
    ['Averages', 'Quantitative Aptitude', 'What is the average of the first 10 even natural numbers (2,4,...,20)?', ['10', '11', '12', '22'], '11', 'Sum = 110; average = 11. (Average of first n evens = n+1.)', 1],
    ['Interest', 'Quantitative Aptitude', 'Simple interest on Rs. 1000 at 10% per annum for 3 years is:', ['Rs. 200', 'Rs. 300', 'Rs. 331', 'Rs. 1300'], 'Rs. 300', 'SI = PNR/100 = 1000*3*10/100 = 300.', 1],
    ['Interest', 'Quantitative Aptitude', 'Compound interest on Rs. 1000 at 10% per annum for 2 years (compounded annually) is:', ['Rs. 200', 'Rs. 210', 'Rs. 220', 'Rs. 1210'], 'Rs. 210', 'A = 1000*1.21 = 1210; CI = 210.', 2],
    ['Profit and Loss', 'Quantitative Aptitude', 'An article costing Rs. 400 is sold for Rs. 340. The loss percent is:', ['10%', '12%', '15%', '20%'], '15%', 'Loss = 60 on 400 = 15%.', 1],
    ['Time Speed Distance', 'Quantitative Aptitude', 'A car covers equal distances at 30 km/h and 60 km/h. Its average speed is:', ['40 km/h', '45 km/h', '50 km/h', '35 km/h'], '40 km/h', 'Average = 2ab/(a+b) = 2*30*60/90 = 40 km/h.', 2],
    ['Mensuration', 'Quantitative Aptitude', 'A rectangle is 12 cm long and 5 cm wide. Its diagonal is:', ['11 cm', '13 cm', '15 cm', '17 cm'], '13 cm', 'sqrt(144+25) = 13.', 1],
    ['Algebra', 'Quantitative Aptitude', 'If 5x - 3 = 12, then x equals:', ['2', '3', '4', '5'], '3', '5x = 15, x = 3.', 1]
];
