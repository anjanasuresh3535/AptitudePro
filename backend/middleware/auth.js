function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }

    const wantsJson = req.method === 'POST' || req.xhr || (req.headers.accept || '').includes('application/json');

    if (wantsJson) {
        return res.status(401).json({ success: false, message: 'Please login to continue' });
    }

    return res.redirect('/login');
}

module.exports = isAuthenticated;
