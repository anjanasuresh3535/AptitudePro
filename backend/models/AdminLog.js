const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true // e.g. "updated_question", "deactivated_user"
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    description: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

adminLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
