// backend/services/coding/index.js
//
// Orchestrates the coding evaluation pipeline:
//
//   submission -> validation -> sandbox execution -> output comparison
//              -> verdict -> score (server-derived)
//
// Everything here is server-authoritative. The client never supplies a userId,
// a verdict, a score or a test result.

const config = require('../../config/codingExecutionConfig');
const { getExecutionStatus } = require('./availability');
// Called as executor.executeInSandbox(...) rather than destructured, so the
// sandbox can be replaced in tests without touching production behaviour.
const dockerExecutor = require('./dockerExecutor');
const judge0Executor = require('./judge0Executor');
const { STATUS } = dockerExecutor;
const { compareOutput } = require('./compare');
const { resolveLanguage } = require('./languages');

/**
 * Evaluate a single submission for one problem.
 *
 * @param {Object}  question            Question document (loaded server-side)
 * @param {string}  language            language chosen by the student
 * @param {string}  source              submitted source code
 * @param {boolean} executionAvailable  whether the sandbox can run right now
 */
async function evaluateSubmission({ question, language, source, executionAvailable, sampleOnly = false, backend = 'docker' }) {
    const lang = resolveLanguage(language);
    const rawCases = (question.testCases || []).map(tc => ({
        input: tc.input,
        output: tc.output,
        isHidden: !!tc.isHidden
    }));
    const cases = sampleOnly ? rawCases.filter(tc => !tc.isHidden) : rawCases.slice();
    if (sampleOnly && cases.length === 0 && (question.sampleInput || question.sampleOutput)) {
        cases.push({
            input: question.sampleInput || '',
            output: question.sampleOutput || '',
            isHidden: false
        });
    }
    const sampleCount = cases.filter(c => !c.isHidden).length;
    const hiddenCount = cases.filter(c => c.isHidden).length;

    const base = {
        language: lang ? lang.id : String(language || ''),
        totalTests: cases.length,
        sampleTests: sampleCount,
        hiddenTests: hiddenCount,
        passedTests: 0,
        passedSampleTests: 0,
        passedHiddenTests: 0,
        runtimeMs: 0,
        score: 0,
        outputs: [],
        // Per-test pass flags ONLY - no hidden input/output ever leaves the server.
        caseResults: cases.map(() => ({ passed: false, isHidden: false }))
    };

    if (!lang) {
        return { ...base, status: STATUS.UNSUPPORTED_LANGUAGE, message: 'That language is not supported.' };
    }
    if (typeof source !== 'string' || !source.trim()) {
        return { ...base, status: 'skipped', message: 'No code was submitted for this problem.' };
    }
    if (source.length > config.limits.maxSourceChars) {
        return { ...base, status: STATUS.NOT_EXECUTED, message: 'Source code is too long.' };
    }
    if (!executionAvailable) {
        return {
            ...base,
            status: STATUS.NOT_EXECUTED,
            message: 'Code execution is currently unavailable, so this submission was stored but not run.'
        };
    }

    const execStatus = await getExecutionStatus({ backend });
    if (execStatus.available === true) {
        const langInfo = execStatus.languages && execStatus.languages[lang.id];
        if (langInfo && langInfo.available === false) {
            return {
                ...base,
                status: STATUS.NOT_EXECUTED,
                message: lang.id + ' is not available in the execution environment on this machine.'
            };
        }
    }

    const executor = backend === 'judge0' ? judge0Executor : dockerExecutor;
    const raw = await executor.executeInSandbox({ language: lang.id, source, testCases: cases });

    if (raw.status === STATUS.COMPILE_ERROR) {
        return { ...base, status: STATUS.COMPILE_ERROR, message: raw.message };
    }
    if (raw.status === STATUS.TIME_LIMIT_EXCEEDED) {
        return { ...base, status: STATUS.TIME_LIMIT_EXCEEDED, message: raw.message };
    }
    if (raw.status === STATUS.MEMORY_LIMIT_EXCEEDED) {
        return { ...base, status: STATUS.MEMORY_LIMIT_EXCEEDED, message: raw.message };
    }
    if (raw.status === STATUS.UNSUPPORTED_LANGUAGE) {
        return { ...base, status: STATUS.UNSUPPORTED_LANGUAGE, message: raw.message };
    }
    if (!Array.isArray(raw.caseResults)) {
        return { ...base, status: STATUS.NOT_EXECUTED, message: raw.message || 'The submission could not be executed.' };
    }
    const strategy = question.comparisonStrategy || config.comparison.defaultStrategy;
    let passed = 0;
    let passedSample = 0;
    let passedHidden = 0;
    let sawTimeout = false;
    let sawMemory = false;
    let sawOutputLimit = false;
    let sawRuntimeError = false;

    const caseResults = raw.caseResults.map((cr, i) => {
        const spec = cases[i];
        const isHidden = !!spec.isHidden;

        // A test counts as passed only when the program exited cleanly AND the
        // output matches. A timeout or non-zero exit can never be a pass.
        let ok = false;
        if (cr.exitCode === 0 && !cr.truncated) {
            ok = compareOutput(cr.stdout, spec.output, strategy);
        }

        if (cr.truncated) sawOutputLimit = true;
        if (cr.exitCode === 137) sawMemory = true;
        else if (cr.exitCode === 124) sawTimeout = true;
        else if (cr.exitCode !== 0 && cr.exitCode !== null) sawRuntimeError = true;

        if (ok) {
            passed++;
            if (isHidden) passedHidden++;
            else passedSample++;
        }

        // Only the boolean outcome is stored - never the input or expected output.
        return { passed: ok, isHidden };
    });
    const outputs = sampleOnly
        ? raw.caseResults.filter((_, i) => !cases[i]?.isHidden).map(cr => String(cr.stdout || '').slice(0, 4096))
        : [];

    const total = cases.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    let status;
    let message;
    if (sawTimeout) {
        status = STATUS.TIME_LIMIT_EXCEEDED;
        message = 'The program exceeded the time limit on at least one test case.';
    } else if (sawMemory) {
        status = STATUS.MEMORY_LIMIT_EXCEEDED;
        message = 'The program exceeded the memory limit on at least one test case.';
    } else if (sawOutputLimit && passed === 0) {
        status = STATUS.OUTPUT_LIMIT_EXCEEDED;
        message = 'The program produced more output than is allowed.';
    } else if (passed === total && total > 0) {
        status = STATUS.ACCEPTED;
        message = 'All test cases passed.';
    } else if (sawRuntimeError && passed === 0) {
        status = STATUS.RUNTIME_ERROR;
        message = 'The program stopped with an error on every test case.';
    } else {
        status = STATUS.WRONG_ANSWER;
        message = 'Some test cases did not produce the expected output.';
    }

    return {
        ...base,
        status,
        message,
        caseResults,
        outputs,
        passedTests: passed,
        passedSampleTests: passedSample,
        passedHiddenTests: passedHidden,
        totalTests: total,
        runtimeMs: raw.durationMs || 0,
        score
    };
}

/**
 * XP derived purely from server-side results (Phase 16).
 */
function calculateCodingXp({ problems }) {
    let xp = 0;
    for (const p of problems) {
        const st = p.status || p.evaluationStatus;
        if (st === STATUS.ACCEPTED) xp += config.scoring.xpPerProblemAccepted;
        xp += (p.passedHiddenTests || 0) * config.scoring.xpPerHiddenTestPassed;
        xp += (p.passedSampleTests || 0) * config.scoring.xpPerSampleTestPassed;
    }
    return xp;
}

async function isExecutionAvailable() {
    const status = await getExecutionStatus({ backend: 'docker' });
    return status.available === true;
}

module.exports = {
    evaluateSubmission,
    calculateCodingXp,
    isExecutionAvailable,
    getExecutionStatus,
    executeC: dockerExecutor.executeC,
    executeCpp: dockerExecutor.executeCpp,
    executeJava: dockerExecutor.executeJava,
    executePython: dockerExecutor.executePython,
    STATUS,
    config
};
