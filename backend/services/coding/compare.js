// backend/services/coding/compare.js
//
// Output comparison for coding submissions.
//
// Two strategies:
//   'exact'  - byte-for-byte identical (used for whitespace-sensitive problems)
//   'token'  - compares line by line after trimming trailing whitespace on each
//              line, and ignores leading/trailing blank lines plus a single
//              trailing newline. This absorbs the Windows (\r\n) vs Linux (\n)
//              difference without collapsing internal spacing.
//
// The strategy is configurable per problem so formatting-sensitive problems can
// still demand exact output.

function normaliseNewlines(s) {
    return String(s == null ? '' : s).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** Strip a UTF-8 BOM which some editors add. */
function stripBom(s) {
    return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
}

function compareExact(actual, expected) {
    const a = stripBom(normaliseNewlines(actual));
    const e = normaliseNewlines(expected);
    return a === e;
}

function compareToken(actual, expected) {
    const a = stripBom(normaliseNewlines(actual)).split('\n').map(l => l.replace(/[ \t]+$/, ''));
    const e = stripBom(normaliseNewlines(expected)).split('\n').map(l => l.replace(/[ \t]+$/, ''));

    // Drop leading/trailing blank lines only - internal blank lines are significant.
    while (a.length && a[0].trim() === '') a.shift();
    while (e.length && e[0].trim() === '') e.shift();
    while (a.length && a[a.length - 1].trim() === '') a.pop();
    while (e.length && e[e.length - 1].trim() === '') e.pop();

    if (a.length !== e.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== e[i]) return false;
    }
    return true;
}

/**
 * Compare actual vs expected output.
 * @param {string} actual
 * @param {string} expected
 * @param {'exact'|'token'} strategy
 */
function compareOutput(actual, expected, strategy = 'token') {
    if (strategy === 'exact') return compareExact(actual, expected);
    return compareToken(actual, expected);
}

module.exports = { compareOutput, compareExact, compareToken, normaliseNewlines };