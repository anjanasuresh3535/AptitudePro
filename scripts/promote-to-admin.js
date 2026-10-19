#!/usr/bin/env node
/**
 * promote-to-admin.js
 *
 * One-time CLI script to promote an existing registered user to the admin role.
 *
 * Usage:
 *   node scripts/promote-to-admin.js <email>
 *
 * Example:
 *   node scripts/promote-to-admin.js alice@example.com
 *
 * Safety:
 *  - Only promotes an EXISTING user (no account creation).
 *  - Requires the user to already exist with role 'user'.
 *  - Does NOT accept a password on the command line.
 *  - Does NOT create a public endpoint.
 *  - Safe to run multiple times; re-promoting an existing admin is a no-op.
 */

'use strict';

const path = require('path');

// Load env config from the project root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const readline = require('readline');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/aptitudepro';

// Load User model
const User = require('../backend/models/User');

const email = process.argv[2];

if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/promote-to-admin.js <email>');
    process.exit(1);
}

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(question, answer => {
        rl.close();
        resolve(answer.trim());
    }));
}

async function run() {
    console.log('\n🔐 AptitudePro – Admin Promotion Tool\n');
    console.log(`  Target email : ${email}`);
    console.log(`  MongoDB      : ${MONGO_URI.replace(/:\/\/[^@]+@/, '://***@')}\n`);

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
    } catch (err) {
        console.error('❌ Could not connect to MongoDB:', err.message);
        process.exit(1);
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('name email role isActive');

        if (!user) {
            console.error(`❌ No user found with email: ${email}`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`  Found user   : ${user.name} (${user.email})`);
        console.log(`  Current role : ${user.role}`);
        console.log(`  Account      : ${user.isActive === false ? 'Suspended' : 'Active'}\n`);

        if (user.role === 'admin') {
            console.log('ℹ️  This user is already an admin. Nothing to do.');
            await mongoose.disconnect();
            process.exit(0);
        }

        const confirm = await ask(`⚠️  Promote "${user.name}" to admin? Type YES to confirm: `);
        if (confirm.toUpperCase() !== 'YES') {
            console.log('\nAborted. No changes made.');
            await mongoose.disconnect();
            process.exit(0);
        }

        await User.updateOne({ _id: user._id }, { $set: { role: 'admin', isActive: true } });

        console.log(`\n✅ "${user.name}" has been promoted to admin successfully.`);
        console.log('   They can now log in and access /admin\n');
    } catch (err) {
        console.error('❌ Promotion failed:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

run();
