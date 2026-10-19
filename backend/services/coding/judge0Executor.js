const config = require('../../config/codingExecutionConfig');
const { resolveLanguage } = require('./languages');
const judge0 = require('./judge0Client');
const { STATUS, sanitizeMessage } = require('./dockerExecutor');

const preferredLanguage = {
    C: /^C \(GCC /i,
    'C++': /^C\+\+ \(GCC /i,
    Java: /^Java \(JDK 17/i,
    Python: /^Python \(3\.12/i
};

function versionOf(name) {
    const match = String(name).match(/\((?:[^0-9]*)([0-9]+(?:\.[0-9]+)*)/);
    return match ? match[1].split('.').map(Number) : [];
}

function versionCompare(left, right) {
    const a = versionOf(left);
    const b = versionOf(right);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const difference = (a[i] || 0) - (b[i] || 0);
        if (difference) return difference;
    }
    return 0;
}

function resolveRemoteLanguages(remoteLanguages) {
    const result = {};
    for (const id of ['C', 'C++', 'Java', 'Python']) {
        const preferred = remoteLanguages.filter(item => preferredLanguage[id].test(item.name || ''));
        const candidates = preferred.length ? preferred : remoteLanguages.filter(item => {
            const name = String(item.name || '');
            if (id === 'C') return /^C \(/i.test(name);
            if (id === 'C++') return /^C\+\+ \(/i.test(name);
            if (id === 'Java') return /^Java \(/i.test(name);
            return /^Python \(/i.test(name);
        });
        candidates.sort((a, b) => versionCompare(b.name, a.name));
        if (candidates[0] && Number.isInteger(candidates[0].id)) {
            result[id] = { available: true, languageId: candidates[0].id, name: candidates[0].name };
        } else {
            result[id] = { available: false, languageId: null, name: null };
        }
    }
    return result;
}

async function getLanguageMap({ force = false } = {}) {
    return resolveRemoteLanguages(await judge0.getLanguages({ force }));
}

async function runOne({ languageId, source, input }) {
    const limits = config.limits;
    const result = await judge0.requestJson('/submissions?wait=true&base64_encoded=false', {
        method: 'POST',
        body: {
            language_id: languageId,
            source_code: source,
            stdin: String(input == null ? '' : input),
            cpu_time_limit: limits.perCaseTimeoutSec,
            wall_time_limit: Math.max(limits.perCaseTimeoutSec + 2, limits.perCaseTimeoutSec * 2),
            memory_limit: limits.memoryMb * 1024,
            max_processes_and_or_threads: limits.pids,
            max_file_size: Math.ceil(limits.maxOutputBytes / 1024),
            enable_network: false
        }
    });
    return result;
}

async function runCases(languageId, source, cases) {
    const results = new Array(cases.length);
    let nextIndex = 0;
    const workerCount = Math.max(1, Math.min(cases.length, config.judge0.maxConcurrentCases || 1));
    await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < cases.length) {
            const index = nextIndex++;
            results[index] = await runOne({ languageId, source, input: cases[index].input });
        }
    }));
    return results;
}

async function executeInSandbox({ language: langInput, source, testCases }) {
    const language = resolveLanguage(langInput);
    if (!language) return { status: STATUS.UNSUPPORTED_LANGUAGE, message: 'That language is not supported.' };
    if (typeof source !== 'string' || !source.trim()) return { status: STATUS.NOT_EXECUTED, message: 'No code was provided.' };
    if (source.length > config.limits.maxSourceChars) return { status: STATUS.NOT_EXECUTED, message: 'Source code is too long.' };
    if (!Array.isArray(testCases) || testCases.length === 0) return { status: STATUS.NOT_EXECUTED, message: 'This problem has no test cases configured.' };

    const cases = testCases.slice(0, config.limits.maxTestCases);
    try {
        const languageMap = await getLanguageMap();
        const remoteLanguage = languageMap[language.id];
        if (!remoteLanguage || !remoteLanguage.available) {
            return { status: STATUS.NOT_EXECUTED, message: `${language.id} is not available in the configured execution service.` };
        }

        const started = Date.now();
        const remoteResults = await runCases(remoteLanguage.languageId, source, cases);

        const compileFailure = remoteResults.find(item => item && item.status && item.status.id === 6);
        if (compileFailure) {
            return {
                status: STATUS.COMPILE_ERROR,
                message: sanitizeMessage(compileFailure.compile_output || compileFailure.stderr || 'Compilation failed.')
            };
        }

        const caseResults = remoteResults.map(item => {
            const id = item && item.status && Number(item.status.id);
            if (!id || id === 1 || id === 2 || id === 13 || id === 14) {
                throw new Error('Judge0 could not complete this execution.');
            }
            const stdout = String(item.stdout || '');
            const truncated = Buffer.byteLength(stdout, 'utf8') > config.limits.maxOutputBytes;
            const boundedOutput = truncated ? Buffer.from(stdout, 'utf8').subarray(0, config.limits.maxOutputBytes).toString('utf8') : stdout;
            const exitCode = id === 5 ? 124 : Number.isInteger(item.exit_code) ? item.exit_code : id === 3 || id === 4 ? 0 : 1;
            return { exitCode, stdout: boundedOutput, truncated };
        });

        return {
            status: STATUS.ACCEPTED,
            caseResults,
            durationMs: Date.now() - started
        };
    } catch (_) {
        return {
            status: STATUS.NOT_EXECUTED,
            message: 'The remote code execution service could not complete the run. Your draft is safe; please try again.'
        };
    }
}

module.exports = { executeInSandbox, getLanguageMap, resolveRemoteLanguages, runCases };
