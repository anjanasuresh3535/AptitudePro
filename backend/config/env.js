const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  No .env file found - copy .env.example to .env and fill in real values.');
}

const REQUIRED_VARS = ['MONGODB_URI', 'SESSION_SECRET'];

const missing = REQUIRED_VARS.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Set them in your .env file before starting the app.');
    process.exit(1);
}

const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI,
    sessionSecret: process.env.SESSION_SECRET,
    activeResultLimit: parseInt(process.env.ACTIVE_RESULT_LIMIT || '100', 10)
};

if (config.sessionSecret === 'replace-with-a-strong-secret' && config.nodeEnv === 'production') {
    console.error('❌ SESSION_SECRET is still the default placeholder. Refusing to start in production.');
    process.exit(1);
}

module.exports = config;
