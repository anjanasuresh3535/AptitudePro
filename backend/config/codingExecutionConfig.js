// backend/config/codingExecutionConfig.js
//
// Configuration for isolated code execution. Accenture uses the hosted Judge0
// sandbox by default; Wipro retains the existing local Docker executor.
//
// SECURITY MODEL
// Student code is untrusted and is NEVER executed inside the Node.js/Express
// process. Wipro runs code in throw-away Docker containers. Accenture sends
// code and test inputs to a configured Judge0 sandbox, which executes programs
// in isolated workers with per-submission resource limits.
// The Docker controls include:
//   - no network
//   - read-only root filesystem
//   - dropped Linux capabilities
//   - no privilege escalation
//   - hard memory / CPU / PID / wall-clock limits
//   - a temporary work directory that is deleted immediately afterwards
// The application host and its environment variables are never passed to
// student code. Judge0's remote workers do not receive application credentials.

const path = require('path');

const codingExecutionConfig = {
    // Master switch. 'auto' means: use Docker if the daemon responds, otherwise
    // report the execution service as unavailable (it is NEVER a fallback to
    // running student code directly on the host).
    enabled: process.env.CODING_EXECUTION_ENABLED !== 'false', // true | false | 'auto'
    backend: 'docker',

    // Accenture uses a hosted Judge0 sandbox so it does not depend on Docker
    // Desktop being installed or running on the web server. Wipro continues to
    // use the existing isolated Docker executor unless explicitly changed.
    accentureBackend: process.env.ACCENTURE_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',

    // Cognizant mirrors Accenture: a hosted Judge0 sandbox by default, local
    // Docker when explicitly selected. Isolated from the Wipro/Accenture config.
    cognizantBackend: process.env.COGNIZANT_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',

    // Capgemini coding practice also uses the hosted isolated Judge0 backend.
    capgeminiBackend: process.env.CAPGEMINI_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',

    // HCLTech coding practice is isolated through the hosted Judge0 sandbox by default.
    hcltechBackend: process.env.HCLTECH_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',

    // Tech Mahindra practice uses the same isolated hosted Judge0 service.
    techMahindraBackend: process.env.TECH_MAHINDRA_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',
    // IBM practice reuses the existing isolated hosted Judge0 executor.
    ibmBackend: process.env.IBM_CODING_BACKEND === 'docker' ? 'docker' : 'judge0',

    judge0: {
        baseUrl: (process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com').replace(/\/+$/, ''),
        authToken: process.env.JUDGE0_AUTH_TOKEN || '',
        // Public hosted sandboxes can take longer when their worker queue is busy.
        requestTimeoutMs: parseInt(process.env.JUDGE0_REQUEST_TIMEOUT_MS || '30000', 10),
        pollIntervalMs: parseInt(process.env.JUDGE0_POLL_INTERVAL_MS || '250', 10),
        maxConcurrentCases: parseInt(process.env.JUDGE0_MAX_CONCURRENT_CASES || '4', 10)
    },

    docker: {
        binary: process.env.CODING_DOCKER_BIN || 'docker',
        // Hard-coded to 'none' on purpose: student code must never reach the
        // network. This is not configurable because it is a security boundary.
        network: 'none',
        // Client-side timeout is only a UX affordance; the server re-checks the
        // real deadline. Keep the full hour in the limit attribute so the
        // displayed countdown matches the server deadline exactly.
        startupTimeoutMs: parseInt(process.env.CODING_DOCKER_STARTUP_TIMEOUT_MS || '6000', 10)
    },

    // Per-language container images. Override via env for offline/air-gapped
    // deployments where images are pre-loaded on the host.
    images: {
        C: process.env.CODING_IMAGE_C || 'gcc:13',
        'C++': process.env.CODING_IMAGE_CPP || 'gcc:13',
        Java: process.env.CODING_IMAGE_JAVA || 'eclipse-temurin:17-jdk',
        Python: process.env.CODING_IMAGE_PYTHON || 'python:3.12-slim'
    },

    limits: {
        // Wall-clock limit for a single test case (seconds).
        perCaseTimeoutSec: parseInt(process.env.CODING_CASE_TIMEOUT || '5', 10),
        // Wall-clock limit for the whole container invocation (seconds).
        totalTimeoutSec: parseInt(process.env.CODING_TOTAL_TIMEOUT || '30', 10),
        // Container memory ceiling.
        memoryMb: parseInt(process.env.CODING_MEMORY_MB || '256', 10),
        // CPU quota.
        cpus: process.env.CODING_CPUS || '0.5',
        // Maximum number of OS processes inside the container.
        pids: parseInt(process.env.CODING_PIDS || '64', 10),
        // Maximum accepted source size (characters).
        maxSourceChars: 100000,
        // Maximum accepted stdout size per test case (bytes). Anything larger is
        // truncated and treated as a failure so a runaway program cannot fill RAM.
        maxOutputBytes: 64 * 1024,
        // Maximum number of test cases executed per problem.
        maxTestCases: 20
    },

    // Scoring: XP is derived server-side from tests passed.
    scoring: {
        xpPerProblemAccepted: 60,
        xpPerHiddenTestPassed: 10,
        xpPerSampleTestPassed: 5
    },

    // Output comparison. 'token' trims trailing whitespace per line and ignores a
    // trailing newline; 'exact' requires byte-identical output.
    comparison: {
        defaultStrategy: 'token'
    },

    tempDir: process.env.CODING_TEMP_DIR || path.join(require('os').tmpdir(), 'aptitudepro-coding')
};

module.exports = codingExecutionConfig;
