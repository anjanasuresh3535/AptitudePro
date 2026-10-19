// Central model loader - lets other files do
//   const { User, UserStats } = require('../models');
// instead of requiring each model file individually. Existing code
// (routes/auth.js) uses direct requires like require('../models/User')
// and continues to work unchanged - this file is purely additive.

const User = require('./User');
const UserStats = require('./UserStats');
const Question = require('./Question');
const Result = require('./Result');
const SectionProgress = require('./SectionProgress');
const XPHistory = require('./XPHistory');
const ArchivedResult = require('./ArchivedResult');
const RankHistory = require('./RankHistory');
const UserActivity = require('./UserActivity');
const AdminLog = require('./AdminLog');
const CodingSubmission = require('./CodingSubmission');

module.exports = {
    User,
    UserStats,
    Question,
    Result,
    SectionProgress,
    XPHistory,
    ArchivedResult,
    RankHistory,
    UserActivity,
    AdminLog,
    CodingSubmission
};
