// backend/services/coding/dockerExecutor.js
//
// Runs student code inside a throw-away, heavily restricted Docker container.
//
// SECURITY CONTROLS (all enforced via docker run flags)
//   --network none              no network access
//   --read-only                 read-only root filesystem
//   --tmpfs /tmp                small scratch space
//   --cap-drop ALL              no Linux capabilities
//   --security-opt no-new-privileges:true
//   --memory / --memory-swap    hard memory ceiling
//   --cpus                      CPU quota
//   --pids-limit                process-count ceiling
//   --rm                        container removed after the run
//   Only a per-run temp directory is mounted, and it is deleted afterwards.
//   Expected outputs and sibling hidden inputs are NEVER written into the
//   sandbox. Each test case runs in a fresh directory that contains only the
//   compiled artifact (or original source) and a single input.txt.
//   The application's environment (including MONGODB_URI / SESSION_SECRET) is
//   explicitly cleared so nothing leaks into the container.

const fsp = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');

const config = require('../../config/codingExecutionConfig');
const { resolveLanguage } = require('./languages');

const STATUS = {
    ACCEPTED: 'accepted',
    WRONG_ANSWER: 'wrong_answer',
    COMPILE_ERROR: 'compile_error',
    RUNTIME_ERROR: 'runtime_error',
    TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
    MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
    OUTPUT_LIMIT_EXCEEDED: 'output_limit_exceeded',
    NOT_EXECUTED: 'not_executed',
    UNSUPPORTED_LANGUAGE: 'unsupported_language'
};

function buildCompileScript(language) {
    if (!language || !language.compile) throw new Error('invalid language');
    return [
        `if ! { ${language.compile}; }; then`,
        `  echo COMPILE_ERROR > status.txt;`,
        `  exit 0;`,
        `fi`,
        `echo COMPILED > status.txt;`,
        `exit 0;`
    ].join('\n');
}

function buildRunScript(language, perCaseTimeoutSec) {
    if (!language || !language.run) throw new Error('invalid language');
    if (!Number.isInteger(perCaseTimeoutSec) || perCaseTimeoutSec < 1) throw new Error('invalid timeout');
    return [
        `timeout ${perCaseTimeoutSec} ${language.run} < input.txt > out.txt 2> err.txt;`,
        `echo $? > exit.txt;`,
        `exit 0;`
    ].join('\n');
}

/**
 * Legacy multi-case runner used only by unit tests that assert integer
 * interpolation. Production execution uses one isolated run per test case so
 * hidden inputs cannot be read from a sibling file.
 */
function buildRunnerScript(language, caseCount, perCaseTimeoutSec) {
    if (!Number.isInteger(caseCount) || caseCount < 1) throw new Error('invalid case count');
    if (!Number.isInteger(perCaseTimeoutSec) || perCaseTimeoutSec < 1) throw new Error('invalid timeout');
    return [
        buildCompileScript(language),
        `i=1;`,
        `while [ $i -le ${caseCount} ]; do`,
        `  timeout ${perCaseTimeoutSec} ${language.run} < tests/case_$i.in > out_$i.txt 2> err_$i.txt;`,
        `  echo $? > exit_$i.txt;`,
        `  i=$((i+1));`,
        `done`,
        `echo DONE >> status.txt;`,
        `exit 0;`
    ].join('\n');
}

/**
 * Build the full `docker run` argument vector. Pure function (no side effects)
 * so the security posture can be unit-tested without a daemon.
 */
function toDockerPath(workdir) {
    if (!workdir) return workdir;
    return String(workdir).replace(/\\/g, '/');
}

function buildDockerArgs({ image, workdir, runnerScript, limits, network, tmpfsOpts }) {
    const posixWorkdir = toDockerPath(workdir);
    return [
        'run', '--rm',
        '--network', network,
        '--memory', `${limits.memoryMb}m`,
        '--memory-swap', `${limits.memoryMb}m`,
        '--cpus', String(limits.cpus),
        '--pids-limit', String(limits.pids),
        '--read-only',
        '--tmpfs', tmpfsOpts || '/tmp:rw,noexec,nosuid,size=16m',
        '--cap-drop', 'ALL',
        '--security-opt', 'no-new-privileges:true',
        '--workdir', '/app',
        '-v', `${posixWorkdir}:/app`,
        image,
        'sh', '-c', runnerScript
    ];
}

function runDocker(args, timeoutMs) {
    return new Promise(resolve => {
        let settled = false;
        const finish = (v) => { if (!settled) { settled = true; resolve(v); } };

        let child;
        try {
            child = execFile(config.docker.binary, args, {
                timeout: timeoutMs,
                killSignal: 'SIGKILL',
                windowsHide: true,
                // Never inherit the app environment into the child process.
                env: { PATH: process.env.PATH || '', SystemRoot: process.env.SystemRoot || '' },
                maxBuffer: 1024 * 1024
            }, (err, stdout, stderr) => {
                finish({ ok: !err, stdout: String(stdout || ''), stderr: String(stderr || ''), error: err || null });
            });
        } catch (e) {
            finish({ ok: false, stdout: '', stderr: '', error: e });
            return;
        }

        // Hard ceiling: a wedged docker CLI must never hang the request.
        const killer = setTimeout(() => {
            try { child.kill('SIGKILL'); } catch (e) { /* already gone */ }
            finish({
                ok: false, stdout: '', stderr: '',
                error: Object.assign(new Error('docker run timed out'), { killed: true })
            });
        }, timeoutMs);

        if (killer.unref) killer.unref();
    });
}

/** Remove host paths and anything that looks like infrastructure detail. */
function sanitizeMessage(text) {
    if (!text) return '';
    return String(text)
        .split(/\r?\n/)
        .filter(line => line.trim().length > 0)
        .slice(0, 12)
        .map(line => line
            .replace(/[A-Za-z]:\\[^\s"']*/g, '<path>')
            .replace(/\/app\/[^\s"']*/g, '<path>')
            .replace(/\/(?:home|tmp|var|usr|etc|root)\/[^\s"']*/g, '<path>')
            .replace(/mongodb(\+srv)?:\/\/\S+/gi, '<redacted>')
            .replace(/(password|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi, '$1=<redacted>')
            .slice(0, 300))
        .join('\n');
}

async function readIfExists(file, limit) {
    try {
        const buf = await fsp.readFile(file);
        if (buf.length > limit) {
            return { text: buf.subarray(0, limit).toString('utf8'), truncated: true };
        }
        return { text: buf.toString('utf8'), truncated: false };
    } catch (e) {
        return { text: '', truncated: false };
    }
}

async function removeDir(dir) {
    try { await fsp.rm(dir, { recursive: true, force: true }); } catch (e) { /* best effort */ }
}

async function copyArtifacts(fromDir, toDir, language) {
    const entries = await fsp.readdir(fromDir);
    const wanted = new Set();
    if (language.id === 'C' || language.id === 'C++') wanted.add('main');
    if (language.id === 'Java') {
        entries.filter(f => f.endsWith('.class')).forEach(f => wanted.add(f));
    }
    if (language.id === 'Python') wanted.add(language.sourceFile);

    let copied = 0;
    for (const name of wanted) {
        try {
            await fsp.copyFile(path.join(fromDir, name), path.join(toDir, name));
            copied++;
        } catch (e) { /* missing artifact */ }
    }
    return copied;
}

/**
 * Execute one submission against its test cases inside the sandbox.
 * Never throws for student-code failures; returns a structured result instead.
 */
async function executeInSandbox({ language: langInput, source, testCases }) {
    const language = resolveLanguage(langInput);
    if (!language) {
        return { status: STATUS.UNSUPPORTED_LANGUAGE, message: 'That language is not supported.' };
    }
    if (typeof source !== 'string' || !source.trim()) {
        return { status: STATUS.NOT_EXECUTED, message: 'No code was provided.' };
    }
    if (source.length > config.limits.maxSourceChars) {
        return { status: STATUS.NOT_EXECUTED, message: 'Source code is too long.' };
    }
    if (!Array.isArray(testCases) || testCases.length === 0) {
        return { status: STATUS.NOT_EXECUTED, message: 'This problem has no test cases configured.' };
    }

    const cases = testCases.slice(0, config.limits.maxTestCases);
    await fsp.mkdir(config.tempDir, { recursive: true });
    const compileDir = await fsp.mkdtemp(path.join(config.tempDir, 'cmp-'));
    const dirs = [compileDir];

    try {
        await fsp.writeFile(path.join(compileDir, language.sourceFile), source, 'utf8');

        const image = config.images[language.id];
        const compileScript = buildCompileScript(language);
        const compileArgs = buildDockerArgs({
            image,
            workdir: compileDir,
            runnerScript: compileScript,
            limits: config.limits,
            network: config.docker.network,
            tmpfsOpts: '/tmp:rw,nosuid,size=32m'
        });

        const started = Date.now();
        const compileRes = await runDocker(compileArgs, (config.limits.totalTimeoutSec + 10) * 1000);
        const base = {
            passedTests: 0,
            totalTests: cases.length,
            durationMs: Date.now() - started
        };

        if (compileRes.error && compileRes.error.killed) {
            return { ...base, status: STATUS.TIME_LIMIT_EXCEEDED, message: 'The program exceeded the total time limit and was stopped.' };
        }
        if (!compileRes.ok && !(await readIfExists(path.join(compileDir, 'status.txt'), 256)).text) {
            return {
                ...base,
                status: STATUS.NOT_EXECUTED,
                message: 'The execution service could not start a sandbox for this language.'
            };
        }

        const statusFile = (await readIfExists(path.join(compileDir, 'status.txt'), 256)).text.trim();
        if (statusFile.startsWith('COMPILE_ERROR') || !statusFile.startsWith('COMPILED')) {
            const err = (await readIfExists(path.join(compileDir, 'compile.err'), 4096)).text
                || compileRes.stderr;
            return { ...base, status: STATUS.COMPILE_ERROR, message: sanitizeMessage(err) || 'Compilation failed.' };
        }

        const caseResults = [];
        const runTimeout = (config.limits.perCaseTimeoutSec + 8) * 1000;

        for (let i = 0; i < cases.length; i++) {
            const runDir = await fsp.mkdtemp(path.join(config.tempDir, 'run-'));
            dirs.push(runDir);

            if (language.id === 'Python') {
                await fsp.writeFile(path.join(runDir, language.sourceFile), source, 'utf8');
            } else {
                const copied = await copyArtifacts(compileDir, runDir, language);
                if (copied === 0) {
                    return { ...base, status: STATUS.COMPILE_ERROR, message: 'Compilation did not produce a runnable program.' };
                }
            }

            // Only this case's stdin is present. Expected output is never written.
            await fsp.writeFile(path.join(runDir, 'input.txt'), String(cases[i].input ?? ''), 'utf8');

            const runArgs = buildDockerArgs({
                image,
                workdir: runDir,
                runnerScript: buildRunScript(language, config.limits.perCaseTimeoutSec),
                limits: config.limits,
                network: config.docker.network,
                tmpfsOpts: '/tmp:rw,noexec,nosuid,size=16m'
            });

            const runRes = await runDocker(runArgs, runTimeout);
            if (runRes.error && runRes.error.killed) {
                caseResults.push({ exitCode: 124, truncated: false, stdout: '', stderr: '' });
            } else {
                const exitFile = (await readIfExists(path.join(runDir, 'exit.txt'), 16)).text.trim();
                const outFile = await readIfExists(path.join(runDir, 'out.txt'), config.limits.maxOutputBytes);
                const errFile = (await readIfExists(path.join(runDir, 'err.txt'), 2048)).text;
                const exitCode = exitFile === '' ? (runRes.ok ? 0 : 1) : parseInt(exitFile, 10);
                caseResults.push({
                    exitCode,
                    truncated: outFile.truncated,
                    stdout: outFile.text,
                    stderr: errFile ? sanitizeMessage(errFile) : ''
                });
            }

            await removeDir(runDir);
        }

        return {
            ...base,
            durationMs: Date.now() - started,
            status: STATUS.NOT_EXECUTED,
            message: 'Executed.',
            caseResults
        };
    } catch (err) {
        return {
            status: STATUS.NOT_EXECUTED,
            message: 'The execution service could not run this submission.',
            passedTests: 0,
            totalTests: cases.length,
            durationMs: 0
        };
    } finally {
        for (const dir of dirs) await removeDir(dir);
    }
}

function executeC(source, testCases) {
    return executeInSandbox({ language: 'C', source, testCases });
}
function executeCpp(source, testCases) {
    return executeInSandbox({ language: 'C++', source, testCases });
}
function executeJava(source, testCases) {
    return executeInSandbox({ language: 'Java', source, testCases });
}
function executePython(source, testCases) {
    return executeInSandbox({ language: 'Python', source, testCases });
}

module.exports = {
    executeInSandbox,
    executeC,
    executeCpp,
    executeJava,
    executePython,
    buildDockerArgs,
    buildRunnerScript,
    buildCompileScript,
    buildRunScript,
    sanitizeMessage,
    toDockerPath,
    STATUS
};
