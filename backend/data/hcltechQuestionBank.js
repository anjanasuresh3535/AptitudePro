// Original AptitudePro HCLTech placement practice. Content is not official.
// Each tuple: topic, prompt, four distinct options, correct option index, explanation.
const quantitative = [
['Number systems','What is the remainder when 7^4 is divided by 5?',['1','2','3','4'],0,'7 leaves remainder 2; 2^4 = 16, which leaves remainder 1.'],
['HCF and LCM','Find the HCF of 84 and 126.',['14','21','42','63'],2,'84 = 2·2·3·7 and 126 = 2·3·3·7; common factors multiply to 42.'],
['HCF and LCM','What is the least common multiple of 12 and 18?',['24','30','36','72'],2,'12 = 2²·3 and 18 = 2·3², so the LCM is 2²·3² = 36.'],
['Time and work','A completes a task in 12 days and B in 18 days. How long do they take working together at constant rates?',['6 days','7.2 days','8 days','15 days'],1,'Combined rate is 1/12 + 1/18 = 5/36 task per day; time is 36/5 = 7.2 days.'],
['Time and work','Eight workers finish a job in 15 days. At the same rate, how many days would 12 workers need?',['8','10','12','22.5'],1,'Total work is 8 × 15 = 120 worker-days; 120/12 = 10 days.'],
['Speed and distance','A vehicle travels 150 km in 2.5 hours. What is its average speed?',['50 km/h','55 km/h','60 km/h','62.5 km/h'],2,'Average speed = distance/time = 150/2.5 = 60 km/h.'],
['Speed and distance','A 180 m train passes a pole in 12 seconds. What is its speed in km/h?',['45','50','54','60'],2,'Speed is 180/12 = 15 m/s; multiply by 3.6 to get 54 km/h.'],
['Percentages','A value of 640 is increased by 25%. What is the new value?',['760','780','800','820'],2,'25% of 640 is 160, so the new value is 800.'],
['Percentages','A price falls from ₹800 to ₹680. What is the percentage decrease?',['12%','15%','17.5%','20%'],1,'The decrease is ₹120; 120/800 × 100 = 15%.'],
['Profit and loss','An item costs ₹800 and is sold at a 12.5% profit. What is the selling price?',['₹880','₹890','₹900','₹920'],2,'12.5% of ₹800 is ₹100; selling price is ₹900.'],
['Profit and loss','A product marked at ₹1,500 is sold at a 20% discount. What is the sale price?',['₹1,100','₹1,150','₹1,200','₹1,250'],2,'Discount is ₹300; sale price is ₹1,200.'],
['Geometry','Find the area of a triangle with base 12 cm and height 9 cm.',['48 cm²','54 cm²','60 cm²','108 cm²'],1,'Area = ½ × 12 × 9 = 54 cm².'],
['Geometry','A circle has radius 7 cm. Using π = 22/7, what is its circumference?',['22 cm','44 cm','49 cm','154 cm'],1,'Circumference = 2πr = 2 × 22/7 × 7 = 44 cm.'],
['Probability','A fair six-sided die is rolled once. What is the probability of getting a prime number?',['1/3','1/2','2/3','5/6'],1,'The prime faces are 2, 3 and 5: three outcomes out of six.'],
['Permutations and combinations','How many different groups of 3 can be selected from 8 people?',['24','48','56','336'],2,'Order does not matter: 8C3 = 8×7×6/(3×2×1) = 56.']
];

const verbal = [
['Synonyms','Choose the closest synonym for “concise”.',['Brief','Unclear','Forceful','Repeated'],0,'Concise means brief while expressing the needed information.'],
['Antonyms','Choose the antonym of “scarce”.',['Rare','Limited','Abundant','Insufficient'],2,'Abundant means plentiful, the opposite of scarce.'],
['Sentence correction','Choose the grammatically correct sentence.',['Each of the engineers have submitted a report.','Each of the engineers has submitted a report.','Each engineers has submitted a report.','Each of engineer have submitted a report.'],1,'“Each” is singular and takes the singular verb “has”.'],
['Error spotting','Which part contains the error? “Neither the manager nor the analysts was available.”',['Neither the manager','nor the analysts','was available','No error'],2,'With “neither…nor”, the verb agrees with the nearer plural subject “analysts”: use “were”.'],
['Para-jumble','Arrange the sentences into a coherent paragraph: P: The team then tested the revised design. Q: Customer feedback revealed a confusing setup step. R: The change reduced setup errors. S: Designers simplified that step.',['Q-S-P-R','S-Q-R-P','P-Q-S-R','R-P-Q-S'],0,'Feedback identified the issue, designers changed it, the team tested it, and errors fell.'],
['Reading comprehension','Passage: A city library extended its evening hours for a three-month trial. Visits after 6 p.m. increased, while morning visits stayed stable. The library will compare staffing costs with the additional visits before deciding whether to continue. Why was the trial introduced?',['To reduce morning visits','To test extended evening access','To close the library earlier','To reduce book purchases'],1,'The passage says the library extended evening hours as a trial.'],
['Reading comprehension','In the passage, what changed during the trial?',['Morning visits fell','Evening visits increased','Staffing costs disappeared','The trial lasted one year'],1,'It states that visits after 6 p.m. increased and morning visits stayed stable.'],
['Reading comprehension','What will inform the decision to continue evening hours?',['A comparison of staffing costs and additional visits','The number of books purchased','A reduction in morning visits','A survey of other cities only'],0,'The library will compare staffing costs with the additional visits.'],
['Vocabulary','In a project update, “feasible” most nearly means:',['Possible and practical','Already completed','Difficult to explain','Unusually expensive'],0,'Feasible means capable of being done successfully or practically.'],
['Sentence correction','Choose the best correction: “The report, along with its appendices, are ready.”',['The report, along with its appendices, is ready.','The report, along with its appendices, were ready.','The report and its appendices is ready.','The report, along with its appendices, be ready.'],0,'The subject is singular “report”; the phrase “along with its appendices” does not change agreement.'],
['Error spotting','Which part contains the error? “She is senior than her colleague.”',['She is','senior than','her colleague','No error'],1,'The correct comparative construction is “senior to”, not “senior than”.'],
['Para-jumble','Arrange the sentences: P: Finally, the team published a short guide. Q: New staff often asked the same setup questions. R: The support team collected the most common questions. S: It reduced repeated requests.',['Q-R-P-S','R-Q-S-P','P-S-Q-R','S-Q-R-P'],0,'Repeated questions were noticed, collected, used for a guide, and then requests declined.'],
['Synonyms','Choose the closest synonym for “reliable”.',['Dependable','Temporary','Careless','Uncertain'],0,'Reliable means dependable or consistently trustworthy.'],
['Antonyms','Choose the antonym of “expand”.',['Extend','Increase','Contract','Enlarge'],2,'Contract means become smaller, the opposite of expand.'],
['Sentence correction','Choose the correct sentence.',['By the time we arrived, the meeting had begun.','By the time we arrived, the meeting has begin.','By the time we arrive, the meeting had began.','By the time we arrived, the meeting begun.'],0,'Past perfect “had begun” marks the meeting’s earlier start before another past event.']
];

const logical = [
['Number series','Find the next number: 4, 9, 16, 25, 36, ?',['42','45','49','64'],2,'These are consecutive squares 2², 3², 4², 5², 6²; next is 7² = 49.'],
['Letter series','Find the next letter: B, E, I, N, T, ?',['Y','Z','A','B'],2,'Alphabet positions increase by 3, 4, 5, 6, then 7; T(20)+7 wraps to A(1).'],
['Coding-decoding','If each letter is replaced by the next letter in the alphabet, how is “MIND” encoded?',['NJME','LHMC','NJOE','MJNE'],2,'Move each letter forward once: M→N, I→J, N→O, D→E, giving NJOE.'],
['Coding-decoding','In a code, CAT is written as 3-1-20 using letter positions. How is DOG written?',['4-15-7','4-14-7','5-15-8','3-15-7'],0,'D, O and G are the 4th, 15th and 7th letters.'],
['Blood relations','Ravi says, “Mina is the daughter of my mother’s only son.” How is Mina related to Ravi?',['Sister','Daughter','Niece','Cousin'],1,'Ravi is his mother’s only son, so Mina is Ravi’s daughter.'],
['Blood relations','Asha is Dev’s sister. Dev is Nila’s father. How is Asha related to Nila?',['Mother','Aunt','Sister','Grandmother'],1,'Asha is the sister of Nila’s father, so she is Nila’s aunt.'],
['Syllogisms','Statements: All analysts are graduates. No graduate is a minor. Which conclusion follows?',['No analyst is a minor.','All minors are analysts.','Some graduates are minors.','No analyst is a graduate.'],0,'Analysts are within the graduate group, and that group contains no minors.'],
['Syllogisms','Statements: Some designers are writers. All writers are readers. Which conclusion must follow?',['Some designers are readers.','All designers are readers.','No writer is a designer.','Some readers are not writers.'],0,'The designers who are writers are readers because every writer is a reader.'],
['Direction sense','Leena walks 5 km north, then 3 km east, then 5 km south. Where is she from her starting point?',['3 km east','3 km west','5 km north','At the starting point'],0,'The north and south movements cancel, leaving 3 km east.'],
['Direction sense','A person faces west, turns left, then turns left again. Which direction is the person facing?',['North','South','East','West'],2,'Facing west, a left turn points south; a second left turn points east.'],
['Logical puzzle','Four tasks P, Q, R and S are scheduled one per day from Monday to Thursday. P is Monday. Q is immediately before R. S is Thursday. On which day is Q?',['Monday','Tuesday','Wednesday','Thursday'],1,'P is Monday and S Thursday, so Q and R fill Tuesday and Wednesday in that order.'],
['Data sufficiency','Is x even? (1) x is divisible by 4. (2) x is an integer.',['Statement 1 alone is sufficient.','Statement 2 alone is sufficient.','Both together are required.','Even together they are insufficient.'],0,'Every integer divisible by 4 is even; statement 1 alone answers the question.'],
['Number series','Find the next number: 3, 6, 12, 24, ?',['36','42','48','54'],2,'Each term is twice the previous term; next is 48.'],
['Arrangement','Five people stand in a line. Isha is left of Kiran. Kiran is left of Lata. Who must be to the right of Isha?',['Kiran only','Lata only','Both Kiran and Lata','Neither Kiran nor Lata'],2,'The order Isha < Kiran < Lata places both Kiran and Lata to Isha’s right.'],
['Logical deduction','If the alarm rings, the door locks. The door is not locked. What follows logically?',['The alarm rang.','The alarm did not ring.','The door is open.','Nothing can be concluded.'],1,'By contraposition, if the door is not locked, the alarm did not ring.']
];

const computer = [
['C programming','What does the expression 7 / 2 evaluate to in C when both operands are int?',['3','3.5','4','Undefined'],0,'Integer division discards the fractional part.'],
['C programming','Which format specifier is used to print an int with printf?',['%c','%d','%f','%s'],1,'%d is the standard conversion specifier for int.'],
['C programming','What is the value of sizeof(char) in C?',['0','1','Implementation-defined and may be 0','2'],1,'The C standard defines sizeof(char) as 1 byte.'],
['C++ programming','Which C++ feature allows functions with the same name but different parameter lists?',['Inheritance','Overloading','Encapsulation','Casting'],1,'Function overloading selects among same-named functions by their parameter lists.'],
['C++ programming','Which container provides random-access elements and amortized constant-time push_back?',['std::vector','std::list','std::set','std::queue'],0,'std::vector stores contiguous elements and supports amortized O(1) push_back.'],
['C++ programming','What is the purpose of a virtual function in C++?',['To allocate memory on the stack','To enable runtime polymorphism','To prevent inheritance','To make a function static'],1,'Virtual dispatch selects an override based on the runtime object type.'],
['Java fundamentals','Which keyword prevents a Java class from being subclassed?',['static','final','private','volatile'],1,'A final class cannot be extended.'],
['Java fundamentals','What does == compare for two Java object references?',['Always their field values','Whether they refer to the same object','Their hash codes','Their class names'],1,'For references, == tests identity; equals may test logical equality.'],
['Java fundamentals','Which collection preserves insertion order and allows duplicate elements?',['HashSet','TreeSet','ArrayList','Map'],2,'ArrayList preserves element order and permits duplicates.'],
['Python fundamentals','What is the value of len({1, 1, 2, 3}) in Python?',['2','3','4','Error'],1,'A set stores unique elements: {1, 2, 3}.'],
['Python fundamentals','Which Python type is immutable?',['list','dict','set','tuple'],3,'A tuple cannot be modified after creation.'],
['Python fundamentals','What does range(2, 7, 2) produce when iterated?',['2, 4, 6','2, 4, 6, 8','2, 3, 4, 5, 6','4, 6'],0,'The stop value 7 is excluded, and the step is 2.'],
['Data structures','Which data structure follows LIFO order?',['Queue','Stack','Heap','Graph'],1,'A stack removes the most recently added item first.'],
['Data structures','What is the worst-case lookup time in an unbalanced binary search tree with n nodes?',['O(1)','O(log n)','O(n)','O(n log n)'],2,'A tree can degenerate into a chain, requiring a linear scan.'],
['Data structures','Which structure is commonly used for breadth-first search?',['Stack','Queue','Min-heap','Hash set only'],1,'BFS visits nodes in arrival order using a queue.'],
['Algorithms','What is the time complexity of binary search on a sorted array?',['O(1)','O(log n)','O(n)','O(n²)'],1,'Each comparison halves the remaining search interval.'],
['Algorithms','Which sorting algorithm has worst-case O(n log n) time and is stable in its standard implementation?',['Quicksort','Heapsort','Merge sort','Selection sort'],2,'Merge sort runs in O(n log n) and is stable when equal elements retain merge order.'],
['Algorithms','A single loop processes each of n items a fixed number of times. What is its time complexity?',['O(1)','O(log n)','O(n)','O(n²)'],2,'The work grows proportionally with the number of items.'],
['Object-oriented programming','Which principle hides internal state and exposes controlled operations?',['Encapsulation','Compilation','Recursion','Normalization'],0,'Encapsulation bundles state and methods while controlling access.'],
['Object-oriented programming','A subclass supplies a specialized implementation of an inherited method. This is:',['Overriding','Overloading','Composition','Aggregation'],0,'Overriding replaces an inherited method implementation for the subtype.'],
['Object-oriented programming','Which relationship best describes a Car that contains an Engine as a part?',['Is-a','Has-a','Calls-a','Compiles-a'],1,'A car has an engine; this is a has-a/composition-style relationship.'],
['DBMS and SQL','Which key uniquely identifies each row in a relational table?',['Foreign key','Primary key','Composite index only','View'],1,'A primary key uniquely identifies a row.'],
['DBMS and SQL','Which SQL clause filters groups after aggregation?',['WHERE','HAVING','ORDER BY','VALUES'],1,'HAVING filters grouped rows after aggregate calculations.'],
['DBMS and SQL','What does ACID atomicity guarantee?',['Transactions are all-or-nothing','Rows are always sorted','Queries never wait','Every value is encrypted'],0,'Atomicity prevents a partial transaction from being committed.'],
['Operating systems','Which component chooses a process from the ready queue for CPU execution?',['Scheduler','Linker','Assembler','File system'],0,'The CPU scheduler selects a ready process to run.'],
['Operating systems','What is a context switch?',['Changing a process/thread saved state so another can run','Compiling source code','Moving files between folders','Increasing clock frequency'],0,'The OS saves the current execution state and restores another task’s state.'],
['Operating systems','Which condition is necessary for deadlock?',['Circular wait','Infinite memory','Single process only','Read-only access'],0,'Circular wait is one of the necessary Coffman conditions for deadlock.'],
['Computer architecture','How many bits are in one byte?',['4','8','16','32'],1,'One byte contains 8 bits.'],
['Computer architecture','Which memory is volatile and typically used as main working memory?',['SSD','RAM','ROM','Optical disc'],1,'RAM loses its contents when power is removed.'],
['Computer networking','Which protocol provides reliable, ordered byte-stream delivery?',['UDP','IP','TCP','ARP'],2,'TCP provides reliable ordered delivery through acknowledgements and retransmission.']
];

const sections = { quantitative, verbal, logical, computer };
module.exports = { sections };
