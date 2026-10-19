// backend/services/sqlEngine.js
//
// Server-side SQL evaluation for the Cognizant SQL round, built on sql.js
// (SQLite compiled to WebAssembly).
//
// SECURITY MODEL
//   The candidate's query is untrusted. It is executed ONLY inside a throw-away,
//   in-memory SQLite database that is created for a single evaluation and
//   destroyed immediately afterwards. That database has no filesystem, no
//   network and no access to the application's environment or MongoDB. Even if
//   a query misbehaves, the blast radius is a discarded in-memory object.
//   On top of that isolation we enforce a read-only guard: a single SELECT/WITH
//   statement only — writes, DDL, ATTACH and PRAGMA are rejected before running.
//   The reference solution is used to derive the expected rows and is NEVER
//   returned to the client. If the engine cannot load, we report 'not_executed'
//   rather than inventing a pass/fail.

let sqlInitPromise = null;

function getSQL() {
    if (!sqlInitPromise) {
        const initSqlJs = require('sql.js');
        sqlInitPromise = initSqlJs().catch(err => { sqlInitPromise = null; throw err; });
    }
    return sqlInitPromise;
}

async function isAvailable() {
    try { await getSQL(); return true; } catch (_) { return false; }
}

function stripComments(sql) {
    return String(sql || '')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/--[^\n]*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const FORBIDDEN = /\b(insert|update|delete|drop|alter|create|truncate|attach|detach|pragma|grant|revoke|commit|rollback|savepoint|vacuum|reindex|into)\b/i;

function assertReadOnly(sql) {
    const cleaned = stripComments(sql);
    if (!cleaned) return { ok: false, reason: 'Please write a SQL query to run (lines starting with "--" are comments).' };
    if (cleaned.length > 20000) return { ok: false, reason: 'That query is too long.' };
    const single = cleaned.replace(/;+\s*$/, '');
    if (single.includes(';')) return { ok: false, reason: 'Only a single statement is allowed.' };
    if (!/^(select|with)\b/i.test(single)) return { ok: false, reason: 'Only SELECT (or WITH ... SELECT) queries are allowed.' };
    if (FORBIDDEN.test(single)) return { ok: false, reason: 'Write or schema statements are not allowed in a read-only query.' };
    return { ok: true, cleaned: single };
}

function round6(x) { return Math.round(x * 1e6) / 1e6; }

function cellKey(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') return 'n:' + round6(value);
    if (value instanceof Uint8Array) return 's:' + Buffer.from(value).toString('utf8').trim().toLowerCase();
    const s = String(value).trim();
    const n = Number(s);
    if (s !== '' && !Number.isNaN(n)) return 'n:' + round6(n);
    return 's:' + s.toLowerCase();
}

function multiset(rows) {
    const m = new Map();
    for (const row of rows) {
        const key = row.map(cellKey).join('\u0001');
        m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
}

// Row order and column aliases are ignored; cell values are compared as a
// multiset of rows, with numbers compared numerically (float-tolerant) and text
// compared case-insensitively after trimming.
function sameResult(expected, actual) {
    if (expected.length !== actual.length) return false;
    if (expected.length && actual.length && expected[0].length !== actual[0].length) return false;
    const me = multiset(expected);
    const ma = multiset(actual);
    if (me.size !== ma.size) return false;
    for (const [key, count] of me) { if (ma.get(key) !== count) return false; }
    return true;
}

const MAX_PREVIEW_ROWS = 100;

async function evaluate({ schemaSql, seedSql, solutionSql, query }) {
    const guard = assertReadOnly(query);
    if (!guard.ok) {
        return { status: 'error', message: guard.reason, rowsReturned: 0, rowsExpected: 0, previewColumns: [], previewRows: [] };
    }
    if (!(await isAvailable())) {
        return { status: 'not_executed', message: 'The SQL evaluation engine is unavailable, so your query was saved but not run.', rowsReturned: 0, rowsExpected: 0, previewColumns: [], previewRows: [] };
    }

    const SQL = await getSQL();
    const build = () => { const db = new SQL.Database(); db.run(schemaSql); db.run(seedSql); return db; };

    let expected = [];
    let db = null;
    try {
        db = build();
        const expRes = db.exec(solutionSql);
        expected = expRes.length ? expRes[0].values : [];
    } catch (err) {
        if (db) { try { db.close(); } catch (_) {} }
        return { status: 'error', message: 'This task could not be graded right now. Please try again shortly.', rowsReturned: 0, rowsExpected: 0, previewColumns: [], previewRows: [] };
    } finally {
        if (db) { try { db.close(); } catch (_) {} }
    }

    let actual = [];
    let columns = [];
    db = null;
    try {
        db = build();
        const actRes = db.exec(guard.cleaned);
        if (actRes.length) { columns = actRes[0].columns || []; actual = actRes[0].values || []; }
    } catch (err) {
        if (db) { try { db.close(); } catch (_) {} }
        const msg = (err && err.message) ? err.message : 'invalid query';
        return { status: 'error', message: ('SQL error: ' + msg).slice(0, 300), rowsReturned: 0, rowsExpected: expected.length, previewColumns: [], previewRows: [] };
    } finally {
        if (db) { try { db.close(); } catch (_) {} }
    }

    const previewRows = actual.slice(0, MAX_PREVIEW_ROWS).map(row => row.map(v => (v instanceof Uint8Array) ? Buffer.from(v).toString('utf8') : v));
    const base = { rowsReturned: actual.length, rowsExpected: expected.length, previewColumns: columns, previewRows };

    if (sameResult(expected, actual)) {
        return { ...base, status: 'accepted', message: 'Correct — your result set matches the expected rows.' };
    }
    return { ...base, status: 'wrong_answer', message: 'Your query ran, but the result set does not match the expected rows.' };
}

module.exports = { evaluate, isAvailable, assertReadOnly, __stripComments: stripComments };
