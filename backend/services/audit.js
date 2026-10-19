/**
 * audit.js – thin helper to record admin actions in AdminLog.
 *
 * Never throws – audit failures must not break the primary action.
 * Never stores passwords, tokens or secret metadata.
 *
 * Supports two calling signatures:
 *   1. Object payload: audit.log({ adminId, action, targetUserId, description, details, metadata })
 *   2. Express req style: audit.log(req, action, opts)
 */

const AdminLog = require('../models/AdminLog');

async function log(arg1, arg2, opts = {}) {
    try {
        let adminId = null;
        let action = '';
        let targetUserId = null;
        let description = '';
        let metadata = null;

        if (arg1 && typeof arg1 === 'object' && arg1.action) {
            // Signature 1: audit.log({ adminId, action, targetUserId, details, description, metadata })
            adminId = arg1.adminId || null;
            action = arg1.action;
            targetUserId = arg1.targetUserId || null;
            description = arg1.description || '';
            metadata = arg1.details || arg1.metadata || null;
        } else if (arg1 && typeof arg1 === 'object' && (arg1.session || arg1.user)) {
            // Signature 2: audit.log(req, action, opts)
            adminId = (arg1.user && arg1.user._id) || (arg1.session && arg1.session.userId) || null;
            action = arg2 || 'UNKNOWN';
            targetUserId = opts.targetUserId || null;
            description = opts.description || '';
            metadata = opts.metadata || opts.details || null;
        } else if (typeof arg1 === 'string') {
            action = arg1;
            adminId = (opts && opts.adminId) || null;
            targetUserId = (opts && opts.targetUserId) || null;
            description = (opts && opts.description) || '';
            metadata = (opts && (opts.metadata || opts.details)) || null;
        }

        if (!adminId) {
            console.warn('[AuditLog] No adminId available for audit entry:', action);
            return;
        }

        await AdminLog.create({
            adminId,
            action,
            targetUserId: targetUserId || null,
            description: description || '',
            metadata: metadata || null
        });
    } catch (err) {
        console.error('[AuditLog] Failed to write audit entry:', err.message);
    }
}

module.exports = { log };
