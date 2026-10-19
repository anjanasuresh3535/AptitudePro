const config = require('../../config/codingExecutionConfig');

const config0 = config.judge0;
const languageCache = { value: null, at: 0 };
const LANGUAGE_CACHE_MS = 60000;

function endpointUrl(path) {
    const base = new URL(config0.baseUrl);
    const hostname = base.hostname.replace(/^\[|\]$/g, '');
    const local = ['localhost', '127.0.0.1', '::1'].includes(hostname);
    if (base.protocol !== 'https:' && !(local && base.protocol === 'http:')) {
        throw new Error('Judge0 must use HTTPS unless the configured service is local.');
    }
    return new URL(path.replace(/^\/+/, ''), `${config0.baseUrl}/`).toString();
}

function headers(json = false) {
    const result = {};
    if (json) result['Content-Type'] = 'application/json';
    if (config0.authToken) result['X-Auth-Token'] = config0.authToken;
    return result;
}

async function requestJson(path, { method = 'GET', body, timeoutMs = config0.requestTimeoutMs } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(endpointUrl(path), {
            method,
            headers: headers(body !== undefined),
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal
        });
        const raw = await response.text();
        let parsed;
        try { parsed = raw ? JSON.parse(raw) : null; } catch (_) { parsed = null; }
        if (!response.ok) {
            const error = new Error(`Judge0 returned HTTP ${response.status}`);
            error.statusCode = response.status;
            throw error;
        }
        return parsed;
    } finally {
        clearTimeout(timer);
    }
}

async function getLanguages({ force = false } = {}) {
    if (!force && languageCache.value && Date.now() - languageCache.at < LANGUAGE_CACHE_MS) {
        return languageCache.value;
    }
    const languages = await requestJson('/languages');
    if (!Array.isArray(languages)) throw new Error('Judge0 returned an invalid languages list.');
    languageCache.value = languages;
    languageCache.at = Date.now();
    return languages;
}

module.exports = { requestJson, getLanguages, endpointUrl };
