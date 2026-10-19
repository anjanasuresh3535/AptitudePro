/**
 * Admin middleware – protects all /admin routes.
 *
 * Security model:
 *  1. User must be authenticated (session.userId present).
 *  2. User must have role === 'admin' on the live User document
 *     (not just from the session, so role demotions take effect immediately).
 *  3. User must have isActive !== false.
 *  4. A synchronizer CSRF token is generated once per session and
 *     embedded in res.locals so every admin EJS template can include it.
 *
 * CSRF validation is done in validateAdminCsrf (exported separately so
 * individual POST routes can apply it without re-importing admin.js twice).
 */

const crypto = require('crypto');
const User   = require('../models/User');

// ── helpers ──────────────────────────────────────────────────────────────────

function generateCsrfToken() {
    return crypto.randomBytes(32).toString('hex');
}

function getCsrfToken(req) {
    if (!req.session.adminCsrfToken) {
        req.session.adminCsrfToken = generateCsrfToken();
    }
    return req.session.adminCsrfToken;
}

// ── exported middleware ───────────────────────────────────────────────────────

/**
 * isAdmin – mount this on every admin route or the admin router itself.
 */
async function isAdmin(req, res, next) {
    // 1. Must be logged in
    if (!req.session || !req.session.userId) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        return res.redirect('/login');
    }

    try {
        // 2. Re-read role from DB on every request (so demotions take effect immediately)
        const user = await User.findById(req.session.userId).select('name email role isActive').lean();

        if (!user) {
            req.session.destroy(() => {});
            return res.redirect('/login');
        }

        if (user.isActive === false) {
            req.session.destroy(() => {});
            return res.status(403).render('error', {
                title: 'Account Suspended',
                message: 'Your account has been suspended.',
                error: 'Contact support if you believe this is a mistake.'
            });
        }

        if (user.role !== 'admin') {
            if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'Admin access required.',
                error: 'You do not have permission to view this page.'
            });
        }

        // 3. Keep session role in sync in case it drifted
        req.session.role = 'admin';
        req.user = user;

        // 4. Make current admin user available to all admin views
        res.locals.adminUser = user;

        // 5. Generate / refresh CSRF token and expose to views
        res.locals.csrfToken = getCsrfToken(req);

        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        next(err);
    }
}

/**
 * validateAdminCsrf – apply to every state-changing (POST/PUT/DELETE) admin
 * route to prevent cross-site request forgery.
 */
function validateAdminCsrf(req, res, next) {
    const token = req.body._csrf || req.headers['x-csrf-token'] || req.query._csrf;
    const sessionToken = req.session && req.session.adminCsrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        return res.status(403).render('error', {
            title: 'Invalid Request',
            message: 'CSRF validation failed.',
            error: 'Please go back and try again.'
        });
    }
    next();
}

module.exports = { isAdmin, validateAdminCsrf };
