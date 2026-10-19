const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        required: true,
        enum: ['registration', 'login', 'logout', 'quiz_started', 'quiz_completed', 'result_viewed', 'level_up', 'other']
    },
    section: {
        type: String,
        enum: ['Maths', 'Logical', 'English', 'Mixed'],
        default: null
    },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

userActivitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.UserActivity || mongoose.model('UserActivity', userActivitySchema);
