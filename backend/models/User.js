const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
    },
    password: {
        type: String,
        required: true
        // Always a bcrypt hash - routes/auth.js hashes with bcrypt.hash()
        // before calling User.create(), never stores plaintext.
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
        // Account status - lets a future admin panel disable an account
        // without deleting it. Not used by any route yet.
    }
}, {
    timestamps: true
});

// Convenience method - routes/auth.js currently calls bcrypt.compare()
// directly and doesn't need this, but it's a natural fit on the model.
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
