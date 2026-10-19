const ejs = require('ejs');
const fs  = require('fs');
const template = fs.readFileSync('frontend/views/quiz.ejs', 'utf8');

const data = {
    testTitle: 'Infosys Pseudo Code Test',
    section: 'Programming',
    difficultyLabel: { full: 'Level 1' },
    totalQ: 2,
    remainingSeconds: 600,
    timeLimitSec: 600,
    levelInfo: { icon: '🌟' },
    levelData: { tier: 'Bronze' },
    xp: 0, xpPer: 10, penalty: 5, skipPenalty: 2,
    levelNum: 1,
    user: { name: 'Tester' },
    error: null,
    noticeMessage: null,
    disclaimer: '',
    learningPath: 'college',
    placementType: 'company',
    company: 'Infosys',
    questions: [
        {
            qid: 'abc123',
            question_text: '#include <stdio.h>\nint main() {\n    int i;\n    for (i = 0; i < 3; i++) {\n        printf("%d ", i);\n    }\n    return 0;\n}',
            option_a: '0 1 2 ',
            option_b: '1 2 3 ',
            option_c: '0 1 2 3 ',
            option_d: 'Error',
            correct_option: 'A',
            category: 'Pseudo Code',
            questionType: 'mcq',
            isPseudoCode: true,
            isWriting: false
        },
        {
            qid: 'xyz456',
            question_text: 'Write a short essay (150-200 words) discussing whether remote work has a positive or negative impact on team collaboration.',
            option_a: 'Clarity and Coherence',
            option_b: 'Grammar and Vocabulary',
            option_c: 'Relevance and Content',
            option_d: 'Professional Tone',
            correct_option: 'A',
            category: 'English Writing',
            questionType: 'fill_in_blank',
            isPseudoCode: false,
            isWriting: true
        }
    ]
};

try {
    const html = ejs.render(template, data, { filename: 'frontend/views/quiz.ejs' });
    console.log('✅ EJS render OK  —  output length:', html.length, 'chars');
    // Check pseudo-code elements
    if (html.includes('code-block-wrapper')) {
        console.log('✅ code-block-wrapper found (pseudo-code block rendered)');
    } else {
        console.error('❌ code-block-wrapper NOT found');
    }
    if (html.includes('writing-textarea')) {
        console.log('✅ writing-textarea found (writing editor rendered)');
    } else {
        console.error('❌ writing-textarea NOT found');
    }
    if (html.includes('wc_1')) {
        console.log('✅ word counter element found');
    } else {
        console.error('❌ word counter NOT found');
    }
    if (html.includes('150\u20131')) {
        console.log('✅ word count range extracted correctly');
    }
    // Make sure MCQ rubric-style options are NOT shown for writing
    const writingSection = html.split('writing-textarea')[1] || '';
    if (writingSection.includes('option-letter')) {
        console.error('❌ MCQ option-letter found inside writing section — bug!');
    } else {
        console.log('✅ No MCQ options rendered for writing question');
    }
} catch (err) {
    console.error('❌ EJS render ERROR:', err.message);
    process.exit(1);
}
