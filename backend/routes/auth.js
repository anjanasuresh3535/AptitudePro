const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserStats = require('../models/UserStats');

const SALT_ROUNDS = 10;

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

function dateOnly(date) {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
}

// Same 5 requirements enforced client-side in public/js/register.js -
// duplicated here on purpose: client-side checks are UX convenience
// only and must never be the actual security boundary.
const MIN_PW_LENGTH = 8;

function getPasswordValidationError(password) {
    if (!password || password.length < MIN_PW_LENGTH) {
        return `Password must be at least ${MIN_PW_LENGTH} characters!`;
    }
    if (!/[a-z]/.test(password)) {
        return 'Password must contain a lowercase letter!';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Password must contain an uppercase letter!';
    }
    if (!/[0-9]/.test(password)) {
        return 'Password must contain a number!';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Password must contain a special character!';
    }
    return null;
}

// ============================================
// LOGIN PAGE (GET)
// ============================================
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    // Read the flash values, then remove them from the session BEFORE
    // rendering. express-session only persists req.session to the store
    // when the response ends (res.end), so the clear must happen before
    // res.render() triggers that save - otherwise the "cleared" values
    // never actually reach MongoDB and the old message reappears on the
    // next request.
    const error = req.session.error || null;
    const success = req.session.success || null;
    delete req.session.error;
    delete req.session.success;

    res.render('login', { error, success });
});

// ============================================
// LOGIN FORM (POST)
// ============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: (email || '').toLowerCase().trim() });

        if (!user) {
            req.session.error = '❌ Invalid email or password!';
            return res.redirect('/login');
        }

        const passwordMatches = await bcrypt.compare(password || '', user.password);

        if (!passwordMatches) {
            req.session.error = '❌ Invalid email or password!';
            return res.redirect('/login');
        }

        const today = todayStr();
        const yesterday = yesterdayStr();

        let stats = await UserStats.findOne({ userId: user._id });
        let newStreak = 1;

        if (stats) {
            const lastLogin = dateOnly(stats.lastLogin);
            if (lastLogin === yesterday) {
                newStreak = stats.streak + 1;
            } else if (lastLogin === today) {
                newStreak = stats.streak;
            } else {
                newStreak = 1;
            }

            stats.streak = newStreak;
            stats.lastLogin = new Date();
            await stats.save();
        } else {
            // Defensive fallback - every user should already have a
            // UserStats document created at registration, but this
            // keeps login from breaking if one is ever missing.
            stats = await UserStats.create({
                userId: user._id,
                streak: 1,
                lastLogin: new Date()
            });
        }

        req.session.userId = user._id.toString();
        req.session.role = user.role;
        req.session.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        req.session.save(() => {
            if (user.role === 'admin') {
                return res.redirect('/admin');
            }
            res.redirect('/dashboard');
        });

    } catch (error) {
        console.error('Login error:', error);
        req.session.error = '❌ Login failed. Please try again.';
        res.redirect('/login');
    }
});

// ============================================
// REGISTER PAGE (GET)
// ============================================
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    // Same one-time-flash fix as /login: clear before render, not after.
    const error = req.session.error || null;
    const success = req.session.success || null;
    delete req.session.error;
    delete req.session.success;

    res.render('register', { error, success });
});

// ============================================
// REGISTER FORM (POST)
// ============================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, confirm } = req.body;

        if (!name || !email || !password) {
            req.session.error = '❌ All fields are required!';
            return res.redirect('/register');
        }

        const passwordError = getPasswordValidationError(password);
        if (passwordError) {
            req.session.error = '❌ ' + passwordError;
            return res.redirect('/register');
        }

        if (password !== confirm) {
            req.session.error = '❌ Passwords do not match!';
            return res.redirect('/register');
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
            req.session.error = '❌ Email already registered!';
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        await UserStats.create({
            userId: user._id,
            xp: 0,
            streak: 0,
            lastLogin: new Date()
        });

        req.session.success = '✅ Registration successful! You can now login.';
        res.redirect('/login');

    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            // MongoDB duplicate-key error - a race where two registrations
            // for the same email landed at nearly the same time.
            req.session.error = '❌ Email already registered!';
            return res.redirect('/register');
        }
        req.session.error = '❌ Registration failed. Please try again.';
        res.redirect('/register');
    }
});

// ============================================
// LOGOUT
// ============================================
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;
