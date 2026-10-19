const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');

const { isAdmin, validateAdminCsrf } = require('../middleware/admin');
const audit = require('../services/audit');

const User = require('../models/User');
const Question = require('../models/Question');
const Result = require('../models/Result');
const UserStats = require('../models/UserStats');
const AdminLog = require('../models/AdminLog');
const XPHistory = require('../models/XPHistory');
const SectionProgress = require('../models/SectionProgress');

// Apply isAdmin to ALL routes in this router
router.use(isAdmin);

// Flash message middleware — expose flash from session to views, then clear it
router.use((req, res, next) => {
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;
    next();
});

// ---------------------------------------------------------------------------
// ObjectId validation helper
// ---------------------------------------------------------------------------
function validateId(id, res) {
    if (!isValidObjectId(id)) {
        res.status(400).render('error', { title: 'Bad Request', message: 'Invalid ID.', error: '' });
        return false;
    }
    return true;
}

// ===========================================================================
// GET /admin — Dashboard
// ===========================================================================
router.get('/', async (req, res) => {
    try {
        const [
            totalUsers,
            totalAdmins,
            totalQuestions,
            totalAttempts,
            completedAttempts,
            avgAccuracyAgg,
            totalXpAgg,
            topSections,
            recentUsers,
            recentAttempts,
            userTrend,
            attemptTrend,
            accuracyBySection,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'admin' }),
            Question.countDocuments({ active: { $ne: false } }),
            Result.countDocuments({}),
            Result.countDocuments({ evaluationStatus: { $ne: 'pending' } }),
            Result.aggregate([{ $group: { _id: null, avg: { $avg: '$accuracy' } } }]),
            UserStats.aggregate([{ $group: { _id: null, total: { $sum: '$xp' } } }]),
            Result.aggregate([
                { $group: { _id: '$section', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),
            User.find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email role createdAt isActive')
                .lean(),
            Result.find({})
                .sort({ testDate: -1 })
                .limit(5)
                .populate('userId', 'name email')
                .lean(),
            User.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 },
            ]),
            Result.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$testDate' }, month: { $month: '$testDate' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 },
            ]),
            Result.aggregate([
                {
                    $group: {
                        _id: '$section',
                        avg: { $avg: '$accuracy' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { avg: -1 } },
            ]),
        ]);

        const avgAccuracy = avgAccuracyAgg[0]?.avg?.toFixed(1) ?? 0;
        const totalXP = totalXpAgg[0]?.total ?? 0;

        res.render('admin/dashboard', {
            totalUsers,
            totalAdmins,
            totalQuestions,
            totalAttempts,
            completedAttempts,
            avgAccuracy,
            totalXP,
            topSections,
            recentUsers,
            recentAttempts,
            userTrend,
            attemptTrend,
            accuracyBySection,
        });
    } catch (err) {
        console.error('[Admin] Dashboard error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load dashboard.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/users — User list with search, role filter, sort, pagination
// ===========================================================================
router.get('/users', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = (req.query.search || '').trim();
        const role = req.query.role || '';
        const sort = req.query.sort || 'newest';

        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role === 'user' || role === 'admin') {
            filter.role = role;
        }

        // Sort order
        let sortObj = {};
        if (sort === 'oldest') sortObj = { createdAt: 1 };
        else if (sort === 'name') sortObj = { name: 1 };
        else sortObj = { createdAt: -1 }; // default: newest

        const total = await User.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const users = await User.find(filter)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-password')
            .lean();

        res.render('admin/users', {
            users,
            total,
            page,
            totalPages,
            search,
            role,
            sort,
            csrfToken: res.locals.csrfToken,
        });
    } catch (err) {
        console.error('[Admin] Users list error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load users.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/users/:id — User detail
// ===========================================================================
router.get('/users/:id', async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const user = await User.findById(req.params.id).select('-password').lean();
        if (!user) {
            return res.status(404).render('error', { title: 'Not Found', message: 'User not found.', error: '' });
        }

        const results = await Result.find({ userId: user._id })
            .sort({ testDate: -1 })
            .limit(10)
            .lean();

        const sectionProgress = await SectionProgress.find({ userId: user._id }).lean();

        res.render('admin/user-detail', { user, results, sectionProgress, csrfToken: res.locals.csrfToken });
    } catch (err) {
        console.error('[Admin] User detail error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load user detail.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/users/:id/role — Update user role
// ===========================================================================
router.post('/users/:id/role', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const { newRole } = req.body;
        if (!['user', 'admin'].includes(newRole)) {
            return res.status(400).render('error', { title: 'Bad Request', message: 'Invalid role.', error: '' });
        }

        // Prevent admin from demoting themselves if they are the only admin
        if (req.params.id === String(req.user._id) && newRole !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                req.session.flash = { type: 'error', message: 'Cannot demote the only admin account.' };
                return res.redirect(`/admin/users/${req.params.id}`);
            }
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).render('error', { title: 'Not Found', message: 'User not found.', error: '' });
        }

        const previousRole = targetUser.role;
        targetUser.role = newRole;
        await targetUser.save();

        await audit.log({
            adminId: req.user._id,
            action: 'CHANGE_ROLE',
            targetUserId: targetUser._id,
            details: { previousRole, newRole },
        });

        req.session.flash = { type: 'success', message: `Role updated to "${newRole}" successfully.` };
        res.redirect(`/admin/users/${req.params.id}`);
    } catch (err) {
        console.error('[Admin] Change role error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to update role.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/users/:id/toggle-active — Toggle user isActive flag
// ===========================================================================
router.post('/users/:id/toggle-active', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        // Prevent admin from deactivating themselves
        if (req.params.id === String(req.user._id)) {
            req.session.flash = { type: 'error', message: 'You cannot deactivate your own account.' };
            return res.redirect(`/admin/users/${req.params.id}`);
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).render('error', { title: 'Not Found', message: 'User not found.', error: '' });
        }

        const previousState = targetUser.isActive;
        targetUser.isActive = !targetUser.isActive;
        await targetUser.save();

        await audit.log({
            adminId: req.user._id,
            action: 'TOGGLE_ACTIVE',
            targetUserId: targetUser._id,
            details: { previousState, newState: targetUser.isActive },
        });

        req.session.flash = {
            type: 'success',
            message: `User ${targetUser.isActive ? 'activated' : 'deactivated'} successfully.`,
        };
        res.redirect(`/admin/users/${req.params.id}`);
    } catch (err) {
        console.error('[Admin] Toggle active error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to toggle active status.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/users/:id/delete — Delete a user
// NOTE: Result and SectionProgress records are intentionally left orphaned.
// Deleting them would destroy historical data needed for analytics and audit
// purposes. Orphaned records can be cleaned up via a separate admin utility
// if required.
// ===========================================================================
router.post('/users/:id/delete', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        if (req.body.confirm !== 'DELETE') {
            req.session.flash = { type: 'error', message: 'Deletion not confirmed. Type DELETE to confirm.' };
            return res.redirect(`/admin/users/${req.params.id}`);
        }

        // Prevent admin from deleting themselves
        if (req.params.id === String(req.user._id)) {
            req.session.flash = { type: 'error', message: 'You cannot delete your own account.' };
            return res.redirect(`/admin/users/${req.params.id}`);
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).render('error', { title: 'Not Found', message: 'User not found.', error: '' });
        }

        await User.findByIdAndDelete(req.params.id);

        await audit.log({
            adminId: req.user._id,
            action: 'DELETE_USER',
            targetUserId: targetUser._id,
            details: { name: targetUser.name, email: targetUser.email },
        });

        req.session.flash = { type: 'success', message: `User "${targetUser.name}" deleted successfully.` };
        res.redirect('/admin/users');
    } catch (err) {
        console.error('[Admin] Delete user error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to delete user.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/questions — Question list with filters and pagination
// ===========================================================================
router.get('/questions', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const search = (req.query.search || '').trim();
        const section = (req.query.section || '').trim();
        const company = (req.query.company || '').trim();
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : null;
        const activeFilter = req.query.active;

        const filter = {};
        if (search) {
            filter.question = { $regex: search, $options: 'i' };
        }
        if (section) filter.section = section;
        if (company) filter.company = { $regex: company, $options: 'i' };
        if (difficulty && [1, 2, 3].includes(difficulty)) filter.difficultyLevel = difficulty;
        if (activeFilter === 'true') filter.active = true;
        else if (activeFilter === 'false') filter.active = false;

        const total = await Question.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const questions = await Question.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.render('admin/questions', {
            questions,
            total,
            page,
            totalPages,
            search,
            section,
            company,
            difficulty: req.query.difficulty || '',
            active: activeFilter || '',
            csrfToken: res.locals.csrfToken,
        });
    } catch (err) {
        console.error('[Admin] Questions list error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load questions.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/questions/export — Export all active questions as JSON
// NOTE: This route must be declared BEFORE /questions/:id/edit to avoid
// 'export' being treated as an :id parameter.
// ===========================================================================
router.get('/questions/export', async (req, res) => {
    try {
        const questions = await Question.find({ active: { $ne: false } })
            .select('-sqlSolution')
            .lean();

        res.setHeader('Content-Disposition', 'attachment; filename="questions.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json(questions);
    } catch (err) {
        console.error('[Admin] Questions export error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to export questions.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/questions/new — New question form
// ===========================================================================
router.get('/questions/new', async (req, res) => {
    try {
        const sections = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
        res.render('admin/question-form', {
            question: null,
            mode: 'new',
            sections,
            csrfToken: res.locals.csrfToken,
        });
    } catch (err) {
        console.error('[Admin] New question form error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load form.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/questions/new — Create new question
// ===========================================================================
router.post('/questions/new', validateAdminCsrf, async (req, res) => {
    try {
        const { question, option1, option2, option3, option4, answer, section, subject, difficultyLevel } = req.body;

        // Validate required fields
        if (!question || !option1 || !option2 || !option3 || !option4 || !answer || !section || !subject || !difficultyLevel) {
            req.session.flash = { type: 'error', message: 'All required fields must be filled.' };
            return res.redirect('/admin/questions/new');
        }

        // Validate answer is one of the options
        const options = [option1, option2, option3, option4];
        if (!options.includes(answer)) {
            req.session.flash = { type: 'error', message: 'Answer must match one of the four options.' };
            return res.redirect('/admin/questions/new');
        }

        const newQuestion = await Question.create({
            question,
            option1,
            option2,
            option3,
            option4,
            answer,
            section,
            subject,
            difficultyLevel: parseInt(difficultyLevel),
            active: true,
            createdBy: req.user._id,
        });

        await audit.log({
            adminId: req.user._id,
            action: 'CREATE_QUESTION',
            targetUserId: null,
            details: { questionId: newQuestion._id, section, subject },
        });

        req.session.flash = { type: 'success', message: 'Question created successfully.' };
        res.redirect('/admin/questions');
    } catch (err) {
        console.error('[Admin] Create question error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to create question.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/questions/:id/edit — Edit question form
// ===========================================================================
router.get('/questions/:id/edit', async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const question = await Question.findById(req.params.id).lean();
        if (!question) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Question not found.', error: '' });
        }

        const sections = ['Maths', 'Logical', 'English', 'Mixed', 'Programming'];
        res.render('admin/question-form', {
            question,
            mode: 'edit',
            sections,
            csrfToken: res.locals.csrfToken,
        });
    } catch (err) {
        console.error('[Admin] Edit question form error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load form.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/questions/:id/edit — Update question
// ===========================================================================
router.post('/questions/:id/edit', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const { question, option1, option2, option3, option4, answer, section, subject, difficultyLevel } = req.body;

        // Validate required fields
        if (!question || !option1 || !option2 || !option3 || !option4 || !answer || !section || !subject || !difficultyLevel) {
            req.session.flash = { type: 'error', message: 'All required fields must be filled.' };
            return res.redirect(`/admin/questions/${req.params.id}/edit`);
        }

        // Validate answer is one of the options
        const options = [option1, option2, option3, option4];
        if (!options.includes(answer)) {
            req.session.flash = { type: 'error', message: 'Answer must match one of the four options.' };
            return res.redirect(`/admin/questions/${req.params.id}/edit`);
        }

        const updated = await Question.findByIdAndUpdate(
            req.params.id,
            { question, option1, option2, option3, option4, answer, section, subject, difficultyLevel: parseInt(difficultyLevel) },
            { new: true }
        );

        if (!updated) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Question not found.', error: '' });
        }

        await audit.log({
            adminId: req.user._id,
            action: 'EDIT_QUESTION',
            targetUserId: null,
            details: { questionId: updated._id, section, subject },
        });

        req.session.flash = { type: 'success', message: 'Question updated successfully.' };
        res.redirect(`/admin/questions/${req.params.id}/edit`);
    } catch (err) {
        console.error('[Admin] Update question error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to update question.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/questions/:id/toggle-active — Toggle question active state
// ===========================================================================
router.post('/questions/:id/toggle-active', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const q = await Question.findById(req.params.id);
        if (!q) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Question not found.', error: '' });
        }

        const previousState = q.active;
        q.active = !q.active;
        await q.save();

        await audit.log({
            adminId: req.user._id,
            action: 'TOGGLE_QUESTION_ACTIVE',
            targetUserId: null,
            details: { questionId: q._id, previousState, newState: q.active },
        });

        req.session.flash = {
            type: 'success',
            message: `Question ${q.active ? 'activated' : 'deactivated'} successfully.`,
        };
        res.redirect('back');
    } catch (err) {
        console.error('[Admin] Toggle question active error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to toggle question status.', error: err.message });
    }
});

// ===========================================================================
// POST /admin/questions/:id/delete — Soft-delete a question
// Soft-delete (active: false) is used instead of physical deletion to preserve
// the integrity of historical Result records that reference this question.
// ===========================================================================
router.post('/questions/:id/delete', validateAdminCsrf, async (req, res) => {
    try {
        if (!validateId(req.params.id, res)) return;

        const q = await Question.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
        if (!q) {
            return res.status(404).render('error', { title: 'Not Found', message: 'Question not found.', error: '' });
        }

        await audit.log({
            adminId: req.user._id,
            action: 'SOFT_DELETE_QUESTION',
            targetUserId: null,
            details: { questionId: q._id },
        });

        req.session.flash = { type: 'success', message: 'Question deactivated (soft-deleted) successfully.' };
        res.redirect('/admin/questions');
    } catch (err) {
        console.error('[Admin] Delete question error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to delete question.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/results — Results list with filters and pagination
// ===========================================================================
router.get('/results', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const { section, startDate, endDate, minAccuracy, maxAccuracy } = req.query;
        const userSearch = (req.query.userId || '').trim();

        // Build base filter
        const filter = {};
        if (section) filter.section = section;
        if (startDate || endDate) {
            filter.testDate = {};
            if (startDate) filter.testDate.$gte = new Date(startDate);
            if (endDate) filter.testDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
        if (minAccuracy !== undefined && minAccuracy !== '') filter.accuracy = { ...filter.accuracy, $gte: parseFloat(minAccuracy) };
        if (maxAccuracy !== undefined && maxAccuracy !== '') filter.accuracy = { ...filter.accuracy, $lte: parseFloat(maxAccuracy) };

        // If user search provided, find matching user ids first
        let userIds = null;
        if (userSearch) {
            const matchedUsers = await User.find({
                $or: [
                    { name: { $regex: userSearch, $options: 'i' } },
                    { email: { $regex: userSearch, $options: 'i' } },
                ],
            }).select('_id').lean();
            userIds = matchedUsers.map(u => u._id);
            filter.userId = { $in: userIds };
        }

        const total = await Result.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        const results = await Result.find(filter)
            .sort({ testDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name email')
            .lean();

        res.render('admin/results', {
            results,
            total,
            page,
            totalPages,
            section: section || '',
            startDate: startDate || '',
            endDate: endDate || '',
            minAccuracy: minAccuracy || '',
            maxAccuracy: maxAccuracy || '',
            userSearch,
            csrfToken: res.locals.csrfToken,
        });
    } catch (err) {
        console.error('[Admin] Results list error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load results.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/results/export — Export results as CSV
// NOTE: Declared before /results/:id to avoid route parameter collision.
// ===========================================================================
router.get('/results/export', async (req, res) => {
    try {
        const { section, startDate, endDate, minAccuracy, maxAccuracy } = req.query;
        const userSearch = (req.query.userId || '').trim();

        const filter = {};
        if (section) filter.section = section;
        if (startDate || endDate) {
            filter.testDate = {};
            if (startDate) filter.testDate.$gte = new Date(startDate);
            if (endDate) filter.testDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }
        if (minAccuracy !== undefined && minAccuracy !== '') filter.accuracy = { ...filter.accuracy, $gte: parseFloat(minAccuracy) };
        if (maxAccuracy !== undefined && maxAccuracy !== '') filter.accuracy = { ...filter.accuracy, $lte: parseFloat(maxAccuracy) };

        if (userSearch) {
            const matchedUsers = await User.find({
                $or: [
                    { name: { $regex: userSearch, $options: 'i' } },
                    { email: { $regex: userSearch, $options: 'i' } },
                ],
            }).select('_id').lean();
            filter.userId = { $in: matchedUsers.map(u => u._id) };
        }

        const results = await Result.find(filter)
            .sort({ testDate: -1 })
            .populate('userId', 'name email')
            .lean();

        // Build CSV
        const csvHeaders = [
            'testDate', 'userName', 'userEmail', 'section', 'score', 'totalQuestions',
            'correct', 'wrong', 'skipped', 'accuracy', 'xpEarned', 'xpLost', 'netXP', 'timeTaken',
        ];

        const escapeCSV = (val) => {
            if (val === undefined || val === null) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = results.map(r => [
            escapeCSV(r.testDate ? new Date(r.testDate).toISOString() : ''),
            escapeCSV(r.userId?.name || ''),
            escapeCSV(r.userId?.email || ''),
            escapeCSV(r.section),
            escapeCSV(r.score),
            escapeCSV(r.totalQuestions),
            escapeCSV(r.correct),
            escapeCSV(r.wrong),
            escapeCSV(r.skipped),
            escapeCSV(r.accuracy),
            escapeCSV(r.xpEarned),
            escapeCSV(r.xpLost),
            escapeCSV(r.netXP),
            escapeCSV(r.timeTaken),
        ].join(','));

        const csv = [csvHeaders.join(','), ...rows].join('\n');

        res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } catch (err) {
        console.error('[Admin] Results export error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to export results.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/analytics — Analytics page
// ===========================================================================
router.get('/analytics', async (req, res) => {
    try {
        const [xpDistribution, levelDist, sectionPerf, xpTimeline] = await Promise.all([
            UserStats.aggregate([
                {
                    $bucket: {
                        groupBy: '$xp',
                        boundaries: [0, 100, 500, 1000, 2500, 5000, 10000],
                        default: 'other',
                        output: { count: { $sum: 1 } },
                    },
                },
            ]),
            // Pass raw XP data grouped by level field; level derivation can be done client-side in the view
            UserStats.aggregate([
                { $group: { _id: '$level', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            SectionProgress.aggregate([
                {
                    $group: {
                        _id: '$section',
                        avgXP: { $avg: '$xp' },
                        avgAcc: { $avg: '$accuracy' },
                        total: { $sum: 1 },
                    },
                },
            ]),
            XPHistory.aggregate([
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        totalXP: { $sum: '$netXP' },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
                { $limit: 12 },
            ]),
        ]);

        res.render('admin/analytics', {
            xpDistribution,
            levelDist,
            sectionPerf,
            xpTimeline,
        });
    } catch (err) {
        console.error('[Admin] Analytics error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load analytics.', error: err.message });
    }
});

// ===========================================================================
// GET /admin/audit-log — Audit log with pagination
// ===========================================================================
router.get('/audit-log', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;

        const total = await AdminLog.countDocuments({});
        const totalPages = Math.ceil(total / limit);

        const logs = await AdminLog.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('adminId', 'name email')
            .populate('targetUserId', 'name email')
            .lean();

        res.render('admin/audit-log', {
            logs,
            total,
            page,
            totalPages,
        });
    } catch (err) {
        console.error('[Admin] Audit log error:', err);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load audit log.', error: err.message });
    }
});

module.exports = router;
