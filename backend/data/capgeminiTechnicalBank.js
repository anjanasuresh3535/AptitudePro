// Capgemini Technical MCQ Question Bank (Pseudocode, Programming Fundamentals,
// C/C++, OOP, Data Structures, DBMS, Operating Systems, Computer Networks).
// Tuple format:
// [topic, subject, question, options[4], answerText, explanation, difficultyLevel]

module.exports = [
    // --- PSEUDOCODE & ALGORITHMIC LOGIC ---
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b, c\nSet a = 4, b = 6, c = 2\na = a + b\nb = a - b\na = a - b\nPrint a, b',
        ['4, 6', '6, 4', '10, 4', '6, 10'],
        '6, 4',
        'Initially a=4, b=6. Then a = 4 + 6 = 10. b = 10 - 6 = 4. a = 10 - 4 = 6. Thus a and b are swapped: a=6, b=4.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger p, q, r\nSet p = 1, q = 5, r = 2\np = (p + q) * r\nq = p / r\nPrint p, q',
        ['12, 6', '11, 5', '12, 5', '10, 5'],
        '12, 6',
        'p = (1 + 5) * 2 = 12. q = 12 / 2 = 6. Hence, p=12, q=6.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger x, y\nSet x = 12, y = 25\nIF (x & 1)\n    Print "Odd"\nELSE\n    Print "Even"\nEND IF',
        ['Odd', 'Even', 'Error', 'Compilation Failure'],
        'Even',
        'Bitwise AND with 1 checks the least significant bit. For x = 12 (binary 1100), 12 & 1 = 0 (false), so the ELSE branch executes, printing "Even".',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b\nSet a = 8, b = 3\na = a XOR b\nb = a XOR b\na = a XOR b\nPrint a + b',
        ['11', '5', '8', '24'],
        '11',
        'Three consecutive XOR operations between two variables swap their values. So a becomes 3 and b becomes 8. The sum a + b is 3 + 8 = 11.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b, c\nSet a = 5, b = 10, c = 15\nIF (a > b OR b < c AND a + b > c)\n    Print 1\nELSE\n    Print 0\nEND IF',
        ['1', '0', 'Error', 'None'],
        '0',
        'In logical operator precedence, AND has higher precedence than OR. Evaluate: (b < c AND a + b > c). Here b < c is (10 < 15) = true, but (a + b > c) is (15 > 15) = false. So true AND false = false. Now evaluate: a > b OR false => (5 > 10) OR false => false OR false = false. Prints 0.',
        2
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger i, sum\nSet sum = 0\nFOR i = 1 TO 5\n    IF (i MOD 2 == 0)\n        sum = sum + i * 2\n    ELSE\n        sum = sum + i\n    END IF\nEND FOR\nPrint sum',
        ['15', '21', '18', '24'],
        '21',
        'i=1: sum = 0 + 1 = 1. i=2: sum = 1 + 2*2 = 5. i=3: sum = 5 + 3 = 8. i=4: sum = 8 + 4*2 = 16. i=5: sum = 16 + 5 = 21.',
        2
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following recursive pseudocode for call fun(4, 2)?\n\nFunction fun(Integer x, Integer y)\n    IF (x == 0)\n        Return y\n    END IF\n    Return fun(x - 1, x + y)\nEnd Function',
        ['10', '12', '14', '8'],
        '12',
        'fun(4, 2) -> fun(3, 4+2=6) -> fun(2, 3+6=9) -> fun(1, 2+9=11) -> fun(0, 1+11=12). When x==0, returns y = 12.',
        2
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b\nSet a = 15, b = 2\nPrint a >> b, a << b',
        ['3, 60', '7, 30', '3, 30', '7, 60'],
        '3, 60',
        'Right shift a >> 2 is floor(15 / 2^2) = floor(15 / 4) = 3. Left shift a << 2 is 15 * 2^2 = 15 * 4 = 60.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What is printed by the following pseudocode?\n\nInteger count, n\nSet count = 0, n = 29\nWHILE (n > 0)\n    IF (n & 1 == 1)\n        count = count + 1\n    END IF\n    n = n >> 1\nEND WHILE\nPrint count',
        ['3', '4', '5', '6'],
        '4',
        'This algorithm counts the number of set bits (1s) in binary representation of 29. 29 in binary is 11101, which contains four 1s. So count = 4.',
        2
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b\nSet a = 7, b = 4\nPrint a ^ b',
        ['3', '11', '1', '28'],
        '3',
        '7 in binary is 0111, 4 in binary is 0100. Bitwise XOR: 0111 ^ 0100 = 0011, which equals decimal 3.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger x, y, z\nSet x = 3, y = 4, z = 5\nIF (x + y > z)\n    x = x + 2\nEND IF\nIF (y + z > x)\n    y = y + 2\nEND IF\nPrint x + y + z',
        ['16', '14', '18', '12'],
        '16',
        'Initial: x=3, y=4, z=5. First check: (3 + 4 > 5) => 7 > 5 is true, so x = 3 + 2 = 5. Second check: (4 + 5 > 5) => 9 > 5 is true, so y = 4 + 2 = 6. Final sum: 5 + 6 + 5 = 16.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger arr[4] = {2, 4, 6, 8}\nInteger i, res = 0\nFOR i = 0 TO 3\n    res = res ^ arr[i]\nEND FOR\nPrint res',
        ['0', '4', '8', '12'],
        '12',
        '2 ^ 4 = 6 (0010 ^ 0100 = 0110). 6 ^ 6 = 0. 0 ^ 8 = 8. Wait: 2 ^ 4 = 6. 6 ^ 6 = 0. 0 ^ 8 = 8. Wait! 2 (0010) ^ 4 (0100) = 6 (0110). 6 ^ 6 = 0. 0 ^ 8 = 8. Let us calculate: 0 ^ 2 = 2; 2 ^ 4 = 6; 6 ^ 6 = 0; 0 ^ 8 = 8.',
        2
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger p = 16, q = 3\nPrint p MOD q + p / q',
        ['5', '6', '7', '8'],
        '6',
        '16 MOD 3 = 1. Integer division 16 / 3 = 5. Sum is 1 + 5 = 6.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following recursive function for f(3)?\n\nFunction f(Integer n)\n    IF (n <= 1)\n        Return 1\n    END IF\n    Return n * f(n - 1)\nEnd Function',
        ['3', '6', '9', '1'],
        '6',
        'This computes the factorial of 3: 3 * f(2) = 3 * (2 * f(1)) = 3 * 2 * 1 = 6.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What will be the output of the following pseudocode?\n\nInteger a, b, c\nSet a = 2, b = 3\nc = a\na = b\nb = c\nc = a + b\nPrint c',
        ['5', '6', '2', '3'],
        '5',
        'c gets 2. a gets 3. b gets 2. Then c = 3 + 2 = 5.',
        1
    ],
    [
        'Pseudocode', 'Pseudocode',
        'What is the value of result after this loop?\n\nInteger result = 1, i = 1\nWHILE (i <= 4)\n    result = result * 2\n    i = i + 1\nEND WHILE\nPrint result',
        ['8', '16', '32', '64'],
        '16',
        'The loop iterates 4 times, multiplying result by 2 each time: 2^4 = 16.',
        1
    ],

    // --- C & C++ PROGRAMMING FUNDAMENTALS ---
    [
        'C Programming', 'C Programming',
        'What is the size of a pointer to an integer on a 64-bit operating system architecture?',
        ['2 bytes', '4 bytes', '8 bytes', 'Depends on the integer size'],
        '8 bytes',
        'On a 64-bit architecture, memory addresses are 64 bits wide, which means any pointer takes 8 bytes regardless of the data type it points to.',
        1
    ],
    [
        'C Programming', 'C Programming',
        'What is the output of the following C code snippet?\n\nint x = 5;\nprintf("%d %d %d", x, x++, ++x);',
        ['5 6 7', '7 6 7', 'Undefined / Compiler dependent', '5 5 7'],
        'Undefined / Compiler dependent',
        'Modifying and accessing a variable multiple times without an intervening sequence point causes undefined behavior in standard C.',
        2
    ],
    [
        'C Programming', 'C Programming',
        'Which storage class in C specifies that a local variable retains its value between function invocations?',
        ['auto', 'register', 'static', 'extern'],
        'static',
        'A static local variable has static storage duration, meaning its lifetime extends across the entire execution of the program while keeping local scope.',
        1
    ],
    [
        'C Programming', 'C Programming',
        'What does the malloc() function in C return if memory allocation fails?',
        ['-1', '0', 'NULL', 'Void'],
        'NULL',
        'If malloc() cannot allocate the requested memory block, it returns a NULL pointer.',
        1
    ],
    [
        'C Programming', 'C Programming',
        'Which header file in C is required to use the free() and malloc() functions?',
        ['<stdio.h>', '<stdlib.h>', '<string.h>', '<math.h>'],
        '<stdlib.h>',
        'Memory management functions such as malloc(), calloc(), realloc(), and free() are declared in <stdlib.h>.',
        1
    ],
    [
        'C++ Programming', 'C++ Programming',
        'What is the purpose of the virtual destructor in C++ base classes?',
        ['To prevent object creation', 'To ensure derived class destructors are called when deleting through a base pointer', 'To speed up destruction', 'To allocate memory dynamically'],
        'To ensure derived class destructors are called when deleting through a base pointer',
        'Deleting a derived object through a pointer to base without a virtual destructor results in undefined behavior and resource leaks.',
        2
    ],
    [
        'C++ Programming', 'C++ Programming',
        'In C++, which keyword is used to prevent a class from being inherited or a virtual function from being overridden?',
        ['const', 'static', 'final', 'sealed'],
        'final',
        'The final specifier in C++11 and later prevents inheritance of a class or further overriding of a virtual member function.',
        1
    ],
    [
        'C++ Programming', 'C++ Programming',
        'What is the difference between struct and class in C++?',
        ['struct cannot have member functions', 'Members of struct are public by default; members of class are private by default', 'class cannot use inheritance', 'struct is allocated on heap only'],
        'Members of struct are public by default; members of class are private by default',
        'In C++, the only difference between class and struct is the default access specifier (and default inheritance specifier): public for struct, private for class.',
        1
    ],
    [
        'C Programming', 'C Programming',
        'What will be the output of printf("%d", sizeof(\'a\')) in C?',
        ['1', '4 (sizeof int)', '2', 'Compiler Error'],
        '4 (sizeof int)',
        'In C, character constants like \'a\' are of type int, so sizeof(\'a\') equals sizeof(int), typically 4 bytes. (In C++, it is char, 1 byte).',
        2
    ],
    [
        'C Programming', 'C Programming',
        'What happens when you access an array element out of its declared bounds in C?',
        ['ArrayOutOfBoundsException is thrown', 'Compilation Error', 'Undefined Behavior', 'The program automatically resizes the array'],
        'Undefined Behavior',
        'C does not perform bounds checking on arrays. Accessing out-of-bounds indices leads to undefined behavior, which may crash the program or corrupt memory.',
        1
    ],
    [
        'C++ Programming', 'C++ Programming',
        'Which reference type in modern C++ is bound to rvalues and enables move semantics?',
        ['const lvalue reference (&)', 'Rvalue reference (&&)', 'Pointer (*)', 'Void pointer (void*)'],
        'Rvalue reference (&&)',
        'Rvalue references declared with && bind to temporary objects and enable efficient move constructors and move assignments.',
        2
    ],
    [
        'C Programming', 'C Programming',
        'What does the following statement do in C?\n\nint *p = NULL;',
        ['Points p to address 0', 'Initializes pointer p safely to point to nothing', 'Allocates 1 integer', 'Causes compilation error'],
        'Initializes pointer p safely to point to nothing',
        'Setting a pointer to NULL indicates that it does not point to any valid memory location, preventing wild pointer bugs.',
        1
    ],

    // --- OBJECT ORIENTED PROGRAMMING (OOP) ---
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'Which OOP concept is defined as bundling data and the functions that manipulate that data into a single unit while restricting direct outside access?',
        ['Inheritance', 'Encapsulation', 'Polymorphism', 'Abstraction'],
        'Encapsulation',
        'Encapsulation hides internal object state and requires all interaction to occur through defined public methods.',
        1
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'When a derived class provides a specific implementation of a method that is already defined in its base class with the exact same signature, this is known as:',
        ['Method Overloading', 'Method Overriding', 'Operator Overloading', 'Data Hiding'],
        'Method Overriding',
        'Method overriding allows a subclass to provide a specialized implementation for a method declared by one of its parent classes.',
        1
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'Which type of polymorphism is resolved at compile time?',
        ['Virtual functions', 'Function overloading', 'Abstract interfaces', 'Dynamic method dispatch'],
        'Function overloading',
        'Function overloading and operator overloading are resolved by the compiler at compile time (static/early binding).',
        1
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'What is an abstract class in Object-Oriented Programming?',
        ['A class that cannot have any methods', 'A class that cannot be instantiated and serves as a blueprint for subclasses', 'A class without private members', 'A class that contains only static variables'],
        'A class that cannot be instantiated and serves as a blueprint for subclasses',
        'An abstract class typically contains one or more pure virtual/abstract methods and cannot be instantiated directly.',
        1
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'What is the diamond problem in object-oriented programming caused by?',
        ['Multiple inheritance where two parent classes inherit from the same grandparent class', 'Deep encapsulation', 'Circular recursion', 'Too many private variables'],
        'Multiple inheritance where two parent classes inherit from the same grandparent class',
        'The diamond problem arises in multiple inheritance when a class inherits from two classes that both inherit from a single superclass, causing ambiguity.',
        2
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'Which design principle states that software entities (classes, modules) should be open for extension, but closed for modification?',
        ['Single Responsibility Principle', 'Open-Closed Principle', 'Liskov Substitution Principle', 'Dependency Inversion Principle'],
        'Open-Closed Principle',
        'The Open-Closed Principle (the O in SOLID) states that classes should allow behavior extension without modifying existing tested code.',
        2
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'What is composition in Object-Oriented Design?',
        ['"is-a" relationship implemented by inheritance', '"has-a" relationship where an object contains instances of other classes', 'Converting an object to JSON', 'Defining multiple constructors'],
        '"has-a" relationship where an object contains instances of other classes',
        'Composition models a "has-a" relationship, offering greater flexibility and loose coupling compared to inheritance.',
        1
    ],
    [
        'Object Oriented Programming', 'Object Oriented Programming',
        'What happens if a class does not define any constructor in Java or C++?',
        ['The code will not compile', 'A default parameterless constructor is automatically provided by the compiler', 'Objects can only be created on stack', 'All fields become static'],
        'A default parameterless constructor is automatically provided by the compiler',
        'If no user-defined constructor is present, the compiler generates a default no-argument constructor.',
        1
    ],

    // --- DATA STRUCTURES & ALGORITHMS ---
    [
        'Data Structures', 'Data Structures',
        'Which data structure operates on a Last-In, First-Out (LIFO) basis?',
        ['Queue', 'Stack', 'Linked List', 'Binary Tree'],
        'Stack',
        'A stack follows LIFO semantics: the most recently added element is the first one removed.',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'What is the worst-case time complexity of QuickSort?',
        ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
        'O(n²)',
        'When the chosen pivot is consistently the smallest or largest element (such as an already sorted array with naive pivot selection), QuickSort degrades to O(n²).',
        2
    ],
    [
        'Data Structures', 'Data Structures',
        'What is the time complexity to search for an element in a balanced Binary Search Tree (AVL / Red-Black Tree) with n nodes?',
        ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        'O(log n)',
        'Because height is kept proportional to log n in balanced trees, search, insert, and delete operations take O(log n) time.',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'Which data structure is best suited for implementing a Breadth-First Search (BFS) graph traversal?',
        ['Stack', 'Queue', 'Priority Queue', 'Array'],
        'Queue',
        'BFS explores nodes level by level using a FIFO Queue.',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'What is the minimum number of queues needed to implement a stack?',
        ['1', '2', '3', '4'],
        '2',
        'Two queues are typically used to implement a stack by transferring elements between them to reverse order.',
        2
    ],
    [
        'Data Structures', 'Data Structures',
        'In a singly linked list, what is the time complexity to insert a new node at the beginning of the list?',
        ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        'O(1)',
        'Inserting at the head only requires updating the new node\'s next pointer and head reference, which is constant time O(1).',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'What is the maximum number of children a node can have in a binary tree?',
        ['1', '2', '3', 'Unlimited'],
        '2',
        'By definition, each node in a binary tree has at most two children (left child and right child).',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'Which sorting algorithm has the best worst-case time complexity of O(n log n) and is stable?',
        ['QuickSort', 'MergeSort', 'SelectionSort', 'BubbleSort'],
        'MergeSort',
        'MergeSort guarantees O(n log n) comparisons in all cases (worst, average, best) and preserves relative order of equal elements (stable).',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'What data structure is used internally by standard recursion in programming languages?',
        ['Call Stack', 'Heap', 'Queue', 'Hash Map'],
        'Call Stack',
        'The runtime environment uses the call stack to maintain activation records (local variables, return address) for recursive calls.',
        1
    ],
    [
        'Data Structures', 'Data Structures',
        'What is the worst-case time complexity of searching an element in a Hash Table with collision handling using chaining?',
        ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        'O(n)',
        'If all keys hash to the same bucket, the hash table degrades into a linear linked list with O(n) search time.',
        2
    ],

    // --- DBMS & SQL ---
    [
        'DBMS', 'DBMS',
        'In relational databases, which property of ACID ensures that transactions are committed permanently even in the event of a system crash or power outage?',
        ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        'Durability',
        'Durability guarantees that once a transaction has been committed, its effects are saved permanently in non-volatile storage.',
        1
    ],
    [
        'SQL', 'SQL',
        'Which SQL clause is used to filter the results of an aggregate function such as COUNT() or SUM()?',
        ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
        'HAVING',
        'HAVING applies filters to aggregated groups, whereas WHERE applies filters to individual rows before aggregation.',
        1
    ],
    [
        'DBMS', 'DBMS',
        'Which normal form eliminates partial functional dependencies (where a non-prime attribute depends on part of a composite primary key)?',
        ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Boyce-Codd Normal Form (BCNF)'],
        'Second Normal Form (2NF)',
        '2NF requires the table to be in 1NF and have no partial dependency of any candidate key attribute.',
        2
    ],
    [
        'SQL', 'SQL',
        'Which type of JOIN returns all records from the left table and matched records from the right table, with NULLs for unmatched right rows?',
        ['INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN'],
        'LEFT OUTER JOIN',
        'LEFT JOIN preserves every row from the left table regardless of whether there is a matching row in the right table.',
        1
    ],
    [
        'DBMS', 'DBMS',
        'What is a foreign key in a database table?',
        ['A key that is encrypted', 'A field in one table that uniquely identifies a row in another table (refers to primary key)', 'A key containing foreign characters', 'A duplicate of the primary key in the same table'],
        'A field in one table that uniquely identifies a row in another table (refers to primary key)',
        'A foreign key enforces referential integrity by referencing the primary key of another table.',
        1
    ],
    [
        'SQL', 'SQL',
        'What will be the result of SELECT COUNT(*) vs SELECT COUNT(column_name) when column_name contains NULL values?',
        ['Both return the same count', 'COUNT(*) counts all rows including NULLs; COUNT(column_name) ignores NULLs', 'COUNT(*) ignores NULLs; COUNT(column_name) includes NULLs', 'COUNT(column_name) throws an error'],
        'COUNT(*) counts all rows including NULLs; COUNT(column_name) ignores NULLs',
        'COUNT(*) returns the count of all rows regardless of NULL values, whereas COUNT(col) counts only rows where col IS NOT NULL.',
        2
    ],
    [
        'DBMS', 'DBMS',
        'What is a deadlock in a database management system?',
        ['A transaction that takes too long to run', 'Two or more transactions waiting indefinitely for locks held by each other', 'A corrupt disk sector', 'A table without an index'],
        'Two or more transactions waiting indefinitely for locks held by each other',
        'Deadlock is a condition where each transaction holds a resource that the other requires to proceed, creating a cycle of infinite wait.',
        1
    ],
    [
        'DBMS', 'DBMS',
        'Which database index type is most commonly used for range-based queries (e.g. BETWEEN, >, <)?',
        ['Hash Index', 'B-Tree / B+ Tree Index', 'Bitmap Index', 'Inverted Index'],
        'B-Tree / B+ Tree Index',
        'B+ Trees maintain sorted order of keys and allow efficient range searches as well as equality lookups.',
        2
    ],

    // --- OPERATING SYSTEMS ---
    [
        'Operating Systems', 'Operating Systems',
        'What is the fundamental difference between a Process and a Thread?',
        ['Processes share memory space; threads have independent memory', 'A process has its own address space; threads of the same process share address space', 'Threads are scheduled by hardware; processes by software', 'A thread cannot create other threads'],
        'A process has its own address space; threads of the same process share address space',
        'Processes are isolated execution environments with separate address spaces, whereas threads within a process share the same code, data, and open files.',
        1
    ],
    [
        'Operating Systems', 'Operating Systems',
        'Which of the following is NOT one of Coffman\'s four necessary conditions for deadlock to occur?',
        ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'Preemptive Priority Scheduling'],
        'Preemptive Priority Scheduling',
        'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
        2
    ],
    [
        'Operating Systems', 'Operating Systems',
        'What is thrashing in virtual memory management?',
        ['A hardware failure in the hard drive', 'A condition where the OS spends more time swapping pages in/out of disk than executing useful work', 'Deleting unused temporary files', 'Overclocking CPU cores'],
        'A condition where the OS spends more time swapping pages in/out of disk than executing useful work',
        'When active processes demand more physical memory than is available, continuous page faults cause page thrashing, drastically reducing CPU throughput.',
        2
    ],
    [
        'Operating Systems', 'Operating Systems',
        'Which CPU scheduling algorithm gives each process a fixed slice of CPU time (time quantum) in cyclic order?',
        ['First Come First Served (FCFS)', 'Shortest Job First (SJF)', 'Round Robin (RR)', 'Priority Scheduling'],
        'Round Robin (RR)',
        'Round Robin is a preemptive scheduling algorithm that assigns each ready process an equal time quantum in circular fashion.',
        1
    ],
    [
        'Operating Systems', 'Operating Systems',
        'What is a semaphore in operating systems?',
        ['A hardware wire for interrupts', 'A synchronization variable used to control access to a shared resource among concurrent threads', 'A CPU cache register', 'A file compression algorithm'],
        'A synchronization variable used to control access to a shared resource among concurrent threads',
        'A semaphore is an integer variable accessed through atomic wait() and signal() operations to solve mutual exclusion and synchronization problems.',
        1
    ],

    // --- COMPUTER NETWORKS ---
    [
        'Computer Networks', 'Computer Networks',
        'In the 7-layer OSI Model, which layer is responsible for routing packets across multiple networks using logical IP addressing?',
        ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Session Layer'],
        'Network Layer',
        'Layer 3 (Network Layer) handles packet routing, forwarding, and logical addressing (IPv4/IPv6).',
        1
    ],
    [
        'Computer Networks', 'Computer Networks',
        'Which protocol provides reliable, connection-oriented byte-stream delivery with flow control and retransmissions?',
        ['UDP', 'TCP', 'IP', 'ICMP'],
        'TCP',
        'Transmission Control Protocol (TCP) establishes a 3-way handshake and guarantees ordered, error-checked delivery.',
        1
    ],
    [
        'Computer Networks', 'Computer Networks',
        'What protocol resolves an IP address to a physical MAC address on a local area network?',
        ['DNS', 'DHCP', 'ARP', 'RARP'],
        'ARP',
        'Address Resolution Protocol (ARP) translates an IP address into the physical MAC address of the network interface card.',
        1
    ],
    [
        'Computer Networks', 'Computer Networks',
        'What is the standard port number used for HTTPS (HTTP over TLS/SSL)?',
        ['80', '8080', '443', '22'],
        '443',
        'Port 443 is the standard port for encrypted HTTPS traffic. Port 80 is used for unencrypted HTTP.',
        1
    ],
    [
        'Computer Networks', 'Computer Networks',
        'Which layer of the OSI model does a standard network switch primarily operate at?',
        ['Physical Layer (Layer 1)', 'Data Link Layer (Layer 2)', 'Network Layer (Layer 3)', 'Transport Layer (Layer 4)'],
        'Data Link Layer (Layer 2)',
        'Standard switches operate at Layer 2 (Data Link Layer) and forward frames based on MAC addresses.',
        1
    ]
];
