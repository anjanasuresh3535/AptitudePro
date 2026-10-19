// Cognizant coding problems. Object format — the seed maps these onto the shared
// Question schema (questionType 'coding'). Hidden test cases are marked
// isHidden:true and are never exposed to the client (publicProblem strips them).
// Starter code is keyed by AptitudePro language id: C, C++, Java, Python.

const coding = [
    {
        slug: 'reverse-array', title: 'Reverse an Array', topic: 'Arrays', difficultyLevel: 1, difficulty: 'Easy',
        statement: 'Read an integer n, then n space-separated integers. Print them in reverse order on one line, space-separated.',
        inputFormat: 'Line 1: n\nLine 2: n integers separated by spaces',
        outputFormat: 'The integers in reverse order, space-separated',
        constraints: '1 <= n <= 100000; each integer fits in a 32-bit signed int.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    // read n integers and print them in reverse\n    return 0;\n}\n',
            'C++': '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // read n integers and print them in reverse\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // read n integers and print them in reverse\n    }\n}\n',
            Python: 'n = int(input())\narr = list(map(int, input().split()))\n# print the array in reverse, space-separated\n'
        },
        publicTests: [{ input: '5\n1 2 3 4 5\n', output: '5 4 3 2 1' }, { input: '3\n10 20 30\n', output: '30 20 10' }],
        hiddenTests: [{ input: '1\n7\n', output: '7' }, { input: '6\n-1 -2 -3 -4 -5 -6\n', output: '-6 -5 -4 -3 -2 -1' }, { input: '4\n0 0 1 0\n', output: '0 1 0 0' }],
        explanation: 'Store the values, then emit them from last to first.'
    },
    {
        slug: 'string-palindrome', title: 'Palindrome Check', topic: 'Strings', difficultyLevel: 1, difficulty: 'Easy',
        statement: 'Read a single word (lowercase letters only). Print YES if it reads the same forwards and backwards, otherwise print NO.',
        inputFormat: 'One line containing a word',
        outputFormat: 'YES or NO',
        constraints: '1 <= length <= 1000; lowercase English letters only.',
        starterCode: {
            C: '#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char s[1001];\n    scanf("%1000s", s);\n    // print YES if s is a palindrome else NO\n    return 0;\n}\n',
            'C++': '#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // print YES if s is a palindrome else NO\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        // print YES if s is a palindrome else NO\n    }\n}\n',
            Python: 's = input().strip()\n# print YES if s is a palindrome else NO\n'
        },
        publicTests: [{ input: 'level\n', output: 'YES' }, { input: 'cognizant\n', output: 'NO' }],
        hiddenTests: [{ input: 'a\n', output: 'YES' }, { input: 'abba\n', output: 'YES' }, { input: 'madam\n', output: 'YES' }, { input: 'python\n', output: 'NO' }],
        explanation: 'Compare characters from both ends moving inward.'
    },
    {
        slug: 'fibonacci-nth', title: 'Nth Fibonacci Number', topic: 'Series', difficultyLevel: 2, difficulty: 'Medium',
        statement: 'Read an integer n (0 <= n <= 60). Print the nth Fibonacci number where F(0) = 0 and F(1) = 1. Use 64-bit integers.',
        inputFormat: 'One integer n',
        outputFormat: 'F(n)',
        constraints: '0 <= n <= 60.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    // compute F(n) iteratively with long long\n    return 0;\n}\n',
            'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    // compute F(n) iteratively\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // compute F(n) with long\n    }\n}\n',
            Python: 'n = int(input())\n# compute F(n) iteratively and print it\n'
        },
        publicTests: [{ input: '0\n', output: '0' }, { input: '10\n', output: '55' }],
        hiddenTests: [{ input: '1\n', output: '1' }, { input: '20\n', output: '6765' }, { input: '50\n', output: '12586269025' }],
        explanation: 'Iterate with two rolling 64-bit variables to avoid exponential recursion.'
    },
    {
        slug: 'prime-check', title: 'Prime or Not', topic: 'Number Theory', difficultyLevel: 2, difficulty: 'Medium',
        statement: 'Read an integer n (1 <= n <= 10^9). Print PRIME if n is prime, otherwise print NOT PRIME.',
        inputFormat: 'One integer n',
        outputFormat: 'PRIME or NOT PRIME',
        constraints: '1 <= n <= 10^9.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    long long n;\n    scanf("%lld", &n);\n    // trial division up to sqrt(n)\n    return 0;\n}\n',
            'C++': '#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    // trial division up to sqrt(n)\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long n = sc.nextLong();\n        // trial division up to sqrt(n)\n    }\n}\n',
            Python: 'n = int(input())\n# trial division up to int(sqrt(n)) and print PRIME or NOT PRIME\n'
        },
        publicTests: [{ input: '7\n', output: 'PRIME' }, { input: '9\n', output: 'NOT PRIME' }],
        hiddenTests: [{ input: '1\n', output: 'NOT PRIME' }, { input: '2\n', output: 'PRIME' }, { input: '999983\n', output: 'PRIME' }, { input: '1000000\n', output: 'NOT PRIME' }],
        explanation: 'n < 2 is not prime; otherwise test divisors up to sqrt(n).'
    },
    {
        slug: 'linear-search-index', title: 'Find the Target (Linear Search)', topic: 'Searching', difficultyLevel: 1, difficulty: 'Easy',
        statement: 'Read n, then n integers, then a target value. Print the index (0-based) of the FIRST occurrence of the target, or -1 if it is absent.',
        inputFormat: 'Line 1: n\nLine 2: n integers\nLine 3: target',
        outputFormat: 'First index of target, or -1',
        constraints: '1 <= n <= 100000.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    // read the array and the target, then print the first index or -1\n    return 0;\n}\n',
            'C++': '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // read the array and the target, then print the first index or -1\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // read the array and the target, then print the first index or -1\n    }\n}\n',
            Python: 'n = int(input())\narr = list(map(int, input().split()))\ntarget = int(input())\n# print first index of target or -1\n'
        },
        publicTests: [{ input: '5\n4 2 7 1 9\n7\n', output: '2' }, { input: '3\n1 2 3\n5\n', output: '-1' }],
        hiddenTests: [{ input: '4\n5 5 5 5\n5\n', output: '0' }, { input: '1\n8\n8\n', output: '0' }, { input: '6\n3 1 4 1 5 9\n9\n', output: '5' }],
        explanation: 'Scan left to right and return the first matching index.'
    },
    {
        slug: 'sort-ascending', title: 'Sort the Array (Ascending)', topic: 'Sorting', difficultyLevel: 2, difficulty: 'Medium',
        statement: 'Read n, then n integers. Print them sorted in ascending order on one line, space-separated. Implement any sorting algorithm you know (bubble, selection, insertion, or a built-in sort).',
        inputFormat: 'Line 1: n\nLine 2: n integers',
        outputFormat: 'Sorted integers, space-separated',
        constraints: '1 <= n <= 100000.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    // read, sort and print the array\n    return 0;\n}\n',
            'C++': '#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    // read, sort and print the array\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // read, sort and print the array\n    }\n}\n',
            Python: 'n = int(input())\narr = list(map(int, input().split()))\n# sort and print space-separated\n'
        },
        publicTests: [{ input: '5\n5 3 8 1 2\n', output: '1 2 3 5 8' }, { input: '3\n3 3 1\n', output: '1 3 3' }],
        hiddenTests: [{ input: '1\n42\n', output: '42' }, { input: '6\n-3 5 -1 0 2 -7\n', output: '-7 -3 -1 0 2 5' }, { input: '4\n4 4 4 4\n', output: '4 4 4 4' }],
        explanation: 'Any O(n log n) sort or a built-in sort is acceptable.'
    },
    {
        slug: 'balanced-parentheses', title: 'Balanced Parentheses (Stack)', topic: 'Stack', difficultyLevel: 2, difficulty: 'Medium',
        statement: 'Read a string consisting only of the characters ( ) { } [ ]. Print BALANCED if every opening bracket is closed by the same type in the correct order, otherwise print NOT BALANCED.',
        inputFormat: 'One line containing brackets only',
        outputFormat: 'BALANCED or NOT BALANCED',
        constraints: '0 <= length <= 100000.',
        starterCode: {
            C: '#include <stdio.h>\n\nint main(void) {\n    char s[1001];\n    scanf("%1000s", s);\n    // use an array as a stack\n    return 0;\n}\n',
            'C++': '#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    // use a stack<char>\n    return 0;\n}\n',
            Java: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        // use a Deque<Character> as a stack\n    }\n}\n',
            Python: 's = input().strip()\n# use a list as a stack; print BALANCED or NOT BALANCED\n'
        },
        publicTests: [{ input: '{[()]}\n', output: 'BALANCED' }, { input: '{[(])}\n', output: 'NOT BALANCED' }],
        hiddenTests: [{ input: '(\n', output: 'NOT BALANCED' }, { input: '()\n', output: 'BALANCED' }, { input: '[]{}()\n', output: 'BALANCED' }, { input: '((()))\n', output: 'BALANCED' }, { input: '({)}\n', output: 'NOT BALANCED' }],
        explanation: 'Push opening brackets; each closing bracket must match the most recent unmatched opening bracket.'
    }
];

module.exports = coding;
