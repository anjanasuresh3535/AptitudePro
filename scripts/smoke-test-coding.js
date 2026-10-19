/**
 * scripts/smoke-test-coding-v2.js
 * Updated smoke test — checks for CodeMirror integration specifically.
 */
const ejs  = require('ejs');
const path = require('path');
const fs   = require('fs');

const tmpl = fs.readFileSync(
    path.join(__dirname, '../frontend/views/wipro-coding.ejs'), 'utf8'
);

const mockData = {
    title: 'Wipro Coding Assessment',
    testTitle: 'Wipro Coding Assessment',
    problems: [
        {
            id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
            title: 'Maximum Subarray Sum',
            statement: 'Given an integer array, find the contiguous subarray with the largest sum.',
            inputFormat: 'Line 1: N\nLine 2: N space-separated integers',
            outputFormat: 'Single integer: the maximum subarray sum',
            constraints: '1 ≤ N ≤ 100000\n-10^4 ≤ A[i] ≤ 10^4',
            sampleInput: '9\n-2 1 -3 4 -1 2 1 -5 4',
            sampleOutput: '6',
            explanation: 'The subarray [4, -1, 2, 1] has the largest sum = 6.',
            topic: 'Arrays',
            difficulty: 'Medium',
            difficultyLevel: 2,
            hiddenCaseCount: 4,
            languages: ['C', 'C++', 'Java', 'Python'],
            allowedLanguages: ['C', 'C++', 'Java', 'Python'],
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            samples: []
        },
        {
            id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
            title: 'Longest Substring Without Repeating Characters',
            statement: 'Given a string s, find the length of the longest substring without repeating characters.',
            inputFormat: 'A single string s',
            outputFormat: 'An integer: the length of the longest non-repeating substring',
            constraints: '1 ≤ |s| ≤ 100000',
            sampleInput: 'abcabcbb',
            sampleOutput: '3',
            explanation: 'The answer is "abc" with length 3.',
            topic: 'Strings',
            difficulty: 'Medium',
            difficultyLevel: 2,
            hiddenCaseCount: 4,
            languages: ['C', 'C++', 'Java', 'Python'],
            allowedLanguages: ['C', 'C++', 'Java', 'Python'],
            timeLimitMs: 2000,
            memoryLimitMb: 256,
            samples: []
        }
    ],
    totalQ: 2,
    timeLimitSec: 3600,
    remainingSeconds: 3600,
    deadline: Date.now() + 3600000,
    attemptId: 'cod_smoke_001',
    languages: ['C', 'C++', 'Java', 'Python'],
    languageAvailability: { C: true, 'C++': true, Java: true, Python: true },
    startersJson: JSON.stringify({
        'C': '#include <stdio.h>\n\nint main() {\n    // your code\n    return 0;\n}\n',
        'C++': '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code\n    return 0;\n}\n',
        'Java': 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // your code\n    }\n}\n',
        'Python': 'import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # your code\n    pass\n\nsolve()\n'
    }).replace(/</g, '\\u003c'),
    executionAvailable: false,
    executionReason: 'Docker not running',
    comparisonStrategy: 'token',
    disclaimer: 'Practice assessment only.',
    xp: 500,
    levelNum: 5,
    levelInfo: { name: 'Intermediate' },
    user: { name: 'Test User' },
    userId: 'test123'
};

try {
    const html = ejs.render(tmpl, mockData, {
        filename: path.join(__dirname, '../frontend/views/wipro-coding.ejs')
    });

    const checks = [
        // CodeMirror integration
        ['CodeMirror CSS (codemirror.min.css)',    html.includes('codemirror.min.css')],
        ['Dracula theme CSS',                      html.includes('dracula.min.css')],
        ['CodeMirror JS (codemirror.min.js)',      html.includes('codemirror.min.js')],
        ['clike mode (C/C++/Java)',                html.includes('clike.min.js')],
        ['python mode',                            html.includes('python.min.js')],
        ['matchbrackets addon',                    html.includes('matchbrackets.min.js')],
        ['active-line addon',                      html.includes('active-line.min.js')],
        ['CodeMirror CSS overrides (.CodeMirror)', html.includes('.CodeMirror {')],
        ['CodeMirror gutter styles',               html.includes('CodeMirror-gutters')],
        ['Dracula cursor override',                html.includes('CodeMirror-cursor')],
        // Editor structure
        ['cmEditorHost div',                       html.includes('cmEditorHost')],
        ['prob-qid-ref hidden inputs',             html.includes('prob-qid-ref')],
        ['No raw textarea elements',               !html.includes('<textarea')],
        // Page structure
        ['Timer element',                          html.includes('timerDisplay')],
        ['Problem tabs',                           html.includes('prob-tab')],
        ['Problem view 0',                         html.includes('pview-0')],
        ['Problem view 1',                         html.includes('pview-1')],
        ['Language tabs',                          html.includes('lang-tab')],
        ['Java tab',                               html.includes('data-lang="Java"')],
        ['Python tab',                             html.includes('data-lang="Python"')],
        ['Finish Test button',                     html.includes('finishBtn')],
        ['Finish modal',                           html.includes('finishModal')],
        ['Submit form',                            html.includes('codingForm')],
        ['Submit POST action',                     html.includes('/wipro/coding/submit')],
        ['startersData JSON block',                html.includes('startersData')],
        ['problemsData JSON block',                html.includes('problemsData')],
        ['wipro-coding-v2.js',                     html.includes('wipro-coding-v2.js')],
        ['Problem 1 title in HTML',                html.includes('Maximum Subarray Sum')],
        ['Problem 2 title in HTML',                html.includes('Longest Substring')],
        ['Execution unavailable banner',           html.includes('exec-notice off')],
        // Security: no MCQ elements
        ['No A/B/C/D option buttons',              !html.includes('option1') && !html.includes('option2')],
        // No old wipro-coding.js reference
        ['No old wipro-coding.js',                 !html.includes('src="/js/wipro-coding.js"')],
    ];

    console.log('✅ Template rendered — ' + html.length + ' bytes\n');
    let allOk = true;
    checks.forEach(([name, ok]) => {
        console.log((ok ? '   ✅' : '   ❌') + ' ' + name);
        if (!ok) allOk = false;
    });

    if (allOk) {
        console.log('\n✅ ALL ' + checks.length + ' CHECKS PASSED — CodeMirror integration complete.');
        process.exit(0);
    } else {
        console.log('\n❌ Some checks failed.');
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Render error:', err.message);
    process.exit(1);
}
