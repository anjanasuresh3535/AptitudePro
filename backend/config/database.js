const mongoose = require('mongoose');
const config = require('./env');

const RETRY_DELAY_MS = 5000;
const MAX_RETRY_ATTEMPTS = 10;

let retryCount = 0;
let hasConnectedOnce = false;
let isConnecting = false;
let isShuttingDown = false;

mongoose.set('strictQuery', true);

async function connectDB() {
    if (isConnecting) {
        return; // a connection attempt is already in flight - don't stack another one
    }
    isConnecting = true;

    const options = {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 1
    };

    try {
        await mongoose.connect(config.mongodbUri, options);
    } catch (error) {
        isConnecting = false;
        retryCount++;
        console.error(`❌ MongoDB connection attempt ${retryCount} failed: ${error.message}`);

        if (retryCount >= MAX_RETRY_ATTEMPTS) {
            console.error(`❌ Exceeded ${MAX_RETRY_ATTEMPTS} connection attempts. Exiting.`);
            process.exit(1);
        }

        console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        setTimeout(connectDB, RETRY_DELAY_MS);
    }
}

mongoose.connection.on('connected', () => {
    isConnecting = false;
    hasConnectedOnce = true;
    retryCount = 0;
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
});

mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
    isConnecting = false;
    if (hasConnectedOnce && !isShuttingDown) {
        console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        setTimeout(connectDB, RETRY_DELAY_MS);
    }
});

async function closeDB() {
    isShuttingDown = true;
    await mongoose.connection.close(false);
}

async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    try {
        await closeDB();
        console.log('✅ MongoDB connection closed. Exiting.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { connectDB, closeDB, mongoose };
