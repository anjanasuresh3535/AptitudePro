// backend/services/coding/availability.js
//
// Detects whether isolated code execution can actually run on this host.
//
// The important distinction: the docker CLI being on PATH is NOT sufficient.
// The Docker *daemon* must respond. A stopped Docker Desktop means the CLI
// exists but every run would fail, so we report "unavailable" rather than
// pretending execution works.
//
// There is deliberately NO local fallback that executes student code directly on
// the host - that would run untrusted code with access to the application's
// environment, filesystem and database credentials.

const { execFile } = require('child_process');
const config = require('../../config/codingExecutionConfig');
const judge0Executor = require('./judge0Executor');

const cache = new Map();
const CACHE_MS = 20000;

/**
 * Run a docker CLI call with a hard wall-clock ceiling.
 *
 * A hung docker CLI (e.g. Docker Desktop still booting) must never be able to
 * block a web request, so the child is force-killed and a hard timeout is
 * enforced independently of the child's cooperation.
 */
function run(cmd, args, timeoutMs) {
    return new Promise(resolve => {
        let settled = false;
        const finish = (value) => { if (!settled) { settled = true; resolve(value); } };

        let child;
        try {
            child = execFile(cmd, args, {
                timeout: timeoutMs,
                killSignal: 'SIGKILL',
                windowsHide: true,
                maxBuffer: 1024 * 1024
            }, (err, stdout, stderr) => {
                finish({ ok: !err, stdout: String(stdout || ''), stderr: String(stderr || ''), error: err || null });
            });
        } catch (e) {
            finish({ ok: false, stdout: '', stderr: '', error: e });
            return;
        }

        const killer = setTimeout(() => {
            try { child.kill('SIGKILL'); } catch (e) { /* already gone */ }
            finish({
                ok: false, stdout: '', stderr: '',
                error: Object.assign(new Error('docker CLI timed out'), { killed: true })
            });
        }, timeoutMs);

        if (killer.unref) killer.unref();
    });
}

function publicReason({ docker, languages }) {
    if (docker && docker.available) {
        const ready = Object.values(languages || {}).filter(l => l && l.available);
        if (ready.length === 0) {
            return 'The execution environment is running, but the language runtimes are not installed yet. Your code can still be saved, and it will be tested once those runtimes are available.';
        }
        return null;
    }
    const message = (docker && docker.reason) || '';
    if (/pipe|Desktop engine is not running/i.test(message)) {
        return 'Docker execution is unavailable because Docker Engine is not running. Start Docker Desktop, then return to this assessment to run your code. Your saved draft is safe.';
    }
    if (docker && docker.cliInstalled === false) {
        return 'Docker execution is not configured on this server. Contact the administrator to enable it. Your saved draft is safe.';
    }
    return 'Docker execution is unavailable because the executor could not be reached. Your saved draft is safe.';
}

async function inspectImage(image) {
    const res = await run(config.docker.binary, ['image', 'inspect', image, '--format', '{{.Id}}'], 8000);
    return res.ok === true;
}

/**
 * Confirm the official compiler/interpreter exists inside the language image.
 * Images that are not present locally are reported unavailable — they are never pulled here.
 */
async function probeLanguage(langId, image) {
    if (!(await inspectImage(image))) {
        return { available: false, image, compiler: false };
    }

    const checks = {
        C: 'command -v gcc >/dev/null && gcc --version >/dev/null',
        'C++': 'command -v g++ >/dev/null && g++ --version >/dev/null',
        Java: 'command -v javac >/dev/null && command -v java >/dev/null',
        Python: 'command -v python3 >/dev/null && python3 --version >/dev/null'
    };
    const cmd = checks[langId];
    if (!cmd) return { available: false, image, compiler: false };

    const res = await run(config.docker.binary, [
        'run', '--rm',
        '--network', 'none',
        '--read-only',
        '--cap-drop', 'ALL',
        '--security-opt', 'no-new-privileges:true',
        image,
        'sh', '-c', cmd
    ], config.docker.startupTimeoutMs);

    return { available: res.ok === true, image, compiler: res.ok === true };
}

async function detectDocker() {
    const res = await run(config.docker.binary, ['version', '--format', '{{.Server.Version}}'], config.docker.startupTimeoutMs);
    if (!res.ok) {
        const message = (res.stderr || (res.error && res.error.message) || '').toString();
        const engineNotRunning = /pipe|Desktop engine is not running/i.test(message);
        const cliMissing = !!(res.error && res.error.code === 'ENOENT');
        return {
            available: false,
            cliInstalled: !cliMissing,
            reason: engineNotRunning
                ? 'Docker Desktop engine is not running.'
                : cliMissing
                    ? 'Docker CLI is not installed or configured.'
                    : 'Docker could not be reached or its configuration is invalid.'
        };
    }
    return { available: true, cliInstalled: true, version: res.stdout.trim(), reason: null };
}

/**
 * Full availability report. Safe to call on every page render; cached briefly.
 */
async function detectJudge0({ force = false } = {}) {
    try {
        const languages = await judge0Executor.getLanguageMap({ force });
        const available = Object.values(languages).some(language => language.available);
        return {
            available,
            languages,
            reason: available ? null : 'The configured Judge0 service does not provide any supported language.'
        };
    } catch (_) {
        return {
            available: false,
            languages: {},
            reason: 'The remote Judge0 sandbox is unavailable. Your saved draft is safe; try again shortly.'
        };
    }
}

async function getExecutionStatus({ force = false, backend = 'docker' } = {}) {
    const cached = cache.get(backend);
    if (!force && cached && (Date.now() - cached.at) < CACHE_MS) return cached.value;

    let status;

    if (config.enabled === false) {
        status = {
            available: false,
            reason: 'Code execution is temporarily unavailable.',
            backend,
            languages: {}
        };
    } else if (backend === 'judge0') {
        const judge0 = await detectJudge0({ force });
        status = {
            available: judge0.available,
            reason: judge0.reason,
            backend,
            judge0,
            languages: judge0.languages
        };
    } else {
        const docker = await detectDocker();
        let languages = {};
        if (docker.available) {
            const ids = Object.keys(config.images);
            const probed = await Promise.all(ids.map(async id => [id, await probeLanguage(id, config.images[id])]));
            languages = Object.fromEntries(probed);
        } else {
            languages = Object.fromEntries(Object.keys(config.images).map(id => [id, { available: false, image: config.images[id], compiler: false }]));
        }

        const anyLanguage = Object.values(languages).some(l => l && l.available);
        status = {
            available: docker.available && anyLanguage,
            reason: publicReason({ docker, languages }),
            backend: 'docker',
            docker,
            languages
        };
    }

    cache.set(backend, { value: status, at: Date.now() });
    return status;
}

/** Test seam: allows tests to inject a deterministic availability result. */
function __setStatusOverride(status) {
    const value = { value: status, at: Date.now() };
    cache.set('docker', value);
    cache.set('judge0', value);
}

function __clearOverride() {
    cache.clear();
}

module.exports = { getExecutionStatus, detectDocker, detectJudge0, inspectImage, probeLanguage, __setStatusOverride, __clearOverride };
