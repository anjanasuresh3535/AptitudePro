const config = require('../backend/config/env');
const { connectDB, closeDB, mongoose } = require('../backend/config/database');

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// ============================================
// SECURITY + LOGGING
// ============================================
app.use((req, res, next) => {
    res.locals = res.locals || {};
    res.locals.cspNonce = crypto.randomBytes(24).toString('base64');
    next();
});
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            frameSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            fontSrc: ["'self'", "https:", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ============================================
// VIEW ENGINE
// ============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// GLOBAL FULLSCREEN INJECTION MIDDLEWARE
// Automatically equips every rendered page with the universal
// HTML5 Fullscreen floating quick-action button and controller.
// ============================================
function injectGlobalFullscreen(html, nonce) {
    if (typeof html !== 'string' || !html.includes('</body>')) {
        return html;
    }

    const hasFab = html.includes('global-fullscreen-fab') || html.includes('btnFloatingFullscreen');
    const hasScript = html.includes('/js/fullscreen.js');
    const hasCss = html.includes('/css/fullscreen.css');

    let injection = '';
    if (!hasCss) {
        injection += '<link rel="stylesheet" href="/css/fullscreen.css">\n';
    }
    if (!hasFab) {
        injection += `<!-- GLOBAL FULLSCREEN FLOATING ACTION BUTTON -->
<div class="global-fullscreen-fab-container" id="globalFullscreenFabContainer">
    <button type="button" id="globalFullscreenBtn" class="global-fullscreen-fab" title="Toggle Full Screen (or press F)" aria-label="Toggle Full Screen">
        <svg class="fullscreen-icon-expand" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
        </svg>
        <svg class="fullscreen-icon-compress" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
        </svg>
    </button>
</div>\n`;
    }
    if (!hasScript) {
        const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
        injection += `<script src="/js/fullscreen.js"${nonceAttr}></script>\n`;
    }

    if (injection) {
        return html.replace('</body>', `${injection}</body>`);
    }
    return html;
}

app.use((req, res, next) => {
    const originalRender = res.render.bind(res);
    res.render = function (view, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        if (typeof callback === 'function') {
            return originalRender(view, options, (err, html) => {
                if (err) return callback(err);
                return callback(null, injectGlobalFullscreen(html, res.locals.cspNonce));
            });
        }

        return originalRender(view, options, (err, html) => {
            if (err) return req.next(err);
            res.send(injectGlobalFullscreen(html, res.locals.cspNonce));
        });
    };
    next();
});

// ============================================
// CORE MIDDLEWARE
// ============================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// SESSIONS - stored in MongoDB via connect-mongo
// ============================================
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: config.mongodbUri,
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 * 7 // 7 days
    }),
    cookie: {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use((req, res, next) => {
    // Matches the original app's convention - views read `user`
    // directly (e.g. res.locals.user), not a differently-named local.
    res.locals.user = req.session.user || null;
    next();
});

// ============================================
// ROUTES
// ============================================
const authRoutes = require('../backend/routes/auth');
app.use('/', authRoutes);

const dashboardRoutes = require('../backend/routes/dashboard');
app.use('/dashboard', dashboardRoutes);

const quizRoutes = require('../backend/routes/quiz');
app.use('/quiz', quizRoutes);

const resultRoutes = require('../backend/routes/result');
app.use('/results', resultRoutes);

const placementRoutes = require('../backend/routes/placement');
app.use('/placement', placementRoutes);

const gameRoutes = require('../backend/routes/game');
app.use('/gaming', gameRoutes);

const wiproCodingRoutes = require('../backend/routes/wiproCoding');
app.use('/wipro/coding', wiproCodingRoutes);

const accentureRoutes = require('../backend/routes/accenture');
app.use('/accenture', accentureRoutes);

const cognizantRoutes = require('../backend/routes/cognizant');
app.use('/cognizant', cognizantRoutes);

const capgeminiRoutes = require('../backend/routes/capgemini');
app.use('/capgemini', capgeminiRoutes);
const hcltechRoutes = require('../backend/routes/hcltech');
app.use('/hcltech', hcltechRoutes);
const techMahindraRoutes = require('../backend/routes/techMahindra');
app.use('/tech-mahindra', techMahindraRoutes);
const ibmRoutes = require('../backend/routes/ibm');
app.use('/ibm', ibmRoutes);

const adminRoutes = require('../backend/routes/admin');
app.use('/admin', adminRoutes);

// Homepage - same behavior as the original app.js: logged-in users
// skip straight to the dashboard, everyone else sees the landing page.
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.role === 'admin' || (req.session.user && req.session.user.role === 'admin')) {
            return res.redirect('/admin');
        }
        return res.redirect('/dashboard');
    }
    res.render('index');
});

app.get('/health', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        mongodb: states[mongoose.connection.readyState] || 'unknown',
        database: mongoose.connection.name || null,
        env: config.nodeEnv,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).send('Not Found - this route will exist once the relevant module is added.');
});

// ============================================
// CENTRAL ERROR HANDLER
// Never leaks stack traces or config details to the client, even
// though full detail is still logged server-side for debugging.
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    const isDev = config.nodeEnv !== 'production';
    res.status(err.status || 500).send(
        isDev ? `Internal Server Error: ${err.message}` : 'Internal Server Error'
    );
});

// ============================================
// STARTUP
// ============================================
async function start() {
    await connectDB();

    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => mongoose.connection.once('connected', resolve));
    }

    const CodingSubmission = require('../backend/models/CodingSubmission');
    // Build the replacement idempotency index before removing legacy partial
    // indexes. That preserves coverage while upgrading existing databases.
    await CodingSubmission.createIndexes();
    const indexes = await CodingSubmission.collection.indexes();
    const idempotencyKey = { userId: 1, company: 1, attemptId: 1 };
    for (const index of indexes) {
        const isSameKey = JSON.stringify(index.key) === JSON.stringify(idempotencyKey);
        const filter = index.partialFilterExpression || {};
        const isLegacyCompanyIndex = filter.company === 'Accenture' || filter.company === 'Cognizant';
        if (isSameKey && (index.name === 'company_attempt_idempotency_v2' || (isLegacyCompanyIndex && index.name !== 'company_attempt_idempotency_v3'))) {
            await CodingSubmission.collection.dropIndex(index.name);
        }
    }

    const preferredPort = config.port;
    const maxPortAttempts = config.nodeEnv === 'production' ? 1 : 20;
    const listen = port => {
        const server = app.listen(port, () => {
            config.port = port;
            console.log(`🚀 AptitudePro (MongoDB) running on http://localhost:${port}`);
            if (port !== preferredPort) {
                console.log(`   Port ${preferredPort} was occupied; using the next available port.`);
            }
            console.log(`   Environment: ${config.nodeEnv}`);
        });
        server.once('error', error => {
            if (error.code === 'EADDRINUSE' && config.nodeEnv !== 'production' && port < preferredPort + maxPortAttempts) {
                console.warn(`⚠️  Port ${port} is already in use; trying port ${port + 1}...`);
                listen(port + 1);
                return;
            }
            console.error(error.code === 'EADDRINUSE'
                ? `❌ Port ${port} is already in use. Set PORT to an available port and restart.`
                : `❌ AptitudePro could not start its HTTP server: ${error.message}`);
            // A failed listener cannot serve requests. Close DB intentionally
            // so the disconnect handler does not schedule a reconnect.
            closeDB().finally(() => process.exit(1));
        });
    };
    listen(preferredPort);
}

start().catch(error => {
    console.error('❌ AptitudePro startup failed:', error.message);
    closeDB().finally(() => process.exit(1));
});

module.exports = app;
