const mongoose = require('mongoose');

// Available sections in AptitudePro
const SECTIONS = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
const LEARNING_PATHS = ['school', 'college'];
const PLACEMENT_TYPES = ['general', 'company', 'IT & Software', 'Core Engineering', 'General Placement'];

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    option3: { type: String, required: true },
    option4: { type: String, required: true },
    answer: {
        type: String,
        required: true
        // Stores the correct option's TEXT (matches the original data).
    },
    section: {
        type: String,
        required: true,
        enum: SECTIONS
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    difficultyLevel: {
        type: Number,
        required: true,
        enum: [1, 2, 3] // 1 = Foundation, 2 = Intermediate, 3 = Advanced
    },
    explanation: { type: String, default: '' },
    quickTrick: { type: String, default: '' },
    formulaUsed: { type: String, default: '' },
    stepSolution: { type: String, default: '' },
    commonMistake: { type: String, default: '' },
    fullExplanation: { type: String, default: '' },
    
    // --- Redesign fields (additive & backward-compatible) ---
    learningPath: {
        type: String,
        enum: LEARNING_PATHS,
        default: 'college'
    },
    placementType: {
        type: String,
        default: 'general' // 'general' or 'company'
    },
    company: {
        type: String,
        trim: true,
        default: null // e.g., 'TCS', 'Infosys', 'Wipro', etc.
    },
    
    // --- TCS NQT & Company Expansion Fields (additive & backward-compatible) ---
    exam: { type: String, trim: true, default: null }, // e.g., 'TCS_NQT'
    level: { type: String, trim: true, default: null }, // e.g., 'Foundation', 'Advanced'
    topic: { type: String, trim: true, default: null }, // e.g., 'Numerical Ability', 'Syllogisms'
    subtopic: { type: String, trim: true, default: null },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', null], default: null },
    questionType: { type: String, enum: ['mcq', 'coding', 'fill_in_blank', 'free_response', 'interview_prompt', 'sql'], default: 'mcq' },
    sourceType: {
        type: String,
        enum: ['Original AptitudePro', 'Official Sample', 'Practice Question', 'Candidate Recalled', 'practice', 'official', 'public-sample', 'candidate-reported', 'original-practice', null],
        default: 'Original AptitudePro'
    },
    sourceTitle: { type: String, default: '' },
    sourceURL: { type: String, default: '' },
    sourceReference: { type: String, default: '' },
    sourceYear: { type: String, default: '' },
    active: { type: Boolean, default: true },

    // Coding question support (hidden test cases)
    testCases: [{
        input: { type: String, default: '' },
        output: { type: String, default: '' },
        isHidden: { type: Boolean, default: true },
        explanation: { type: String, default: '' }
    }],

    // --- Coding problem specification (additive & backward-compatible) ---
    problemTitle: { type: String, default: '' },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    problemStatement: { type: String, default: '' },
    starterCode: { type: String, default: '' },
    starterCodeByLanguage: { type: Map, of: String, default: {} },
    prompt: { type: String, default: '' },
    responseType: { type: String, enum: ['text', 'email', 'audio', null], default: null },
    evaluationCriteria: { type: [String], default: [] },
    minWords: { type: Number, default: null },
    maxWords: { type: Number, default: null },
    supportedLanguages: { type: [String], default: [] },
    // 'token' (default) or 'exact' - per-problem output comparison strategy.
    comparisonStrategy: { type: String, enum: ['token', 'exact', null], default: null },
    // Per-problem execution limits. Fall back to codingExecutionConfig defaults.
    timeLimitMs: { type: Number, default: null },
    memoryLimitMb: { type: Number, default: null },

    // --- SQL task support (additive; used by the Cognizant SQL round) ---
    // sqlSolution is the reference answer used to derive expected rows at grade
    // time and must NEVER be sent to the client (routes project it out).
    sqlSchemaDescription: { type: String, default: '' },
    sqlSchema: { type: String, default: '' },
    sqlSeed: { type: String, default: '' },
    sqlStarter: { type: String, default: '' },
    sqlSolution: { type: String, default: '' },
    sqlSampleOutput: { type: String, default: '' },
}, {
    timestamps: true
});

questionSchema.index({ learningPath: 1, difficultyLevel: 1 });
questionSchema.index({ learningPath: 1, placementType: 1, company: 1, difficultyLevel: 1 });
questionSchema.index({ section: 1, difficultyLevel: 1 });
questionSchema.index({ subject: 1 });
questionSchema.index({ category: 1 });
questionSchema.index({ placementType: 1 });
questionSchema.index({ company: 1, exam: 1, level: 1, topic: 1, active: 1 });
questionSchema.index({ company: 1, active: 1 });

module.exports = mongoose.models.Question || mongoose.model('Question', questionSchema);
