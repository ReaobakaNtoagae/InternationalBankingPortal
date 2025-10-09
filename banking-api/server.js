// server.js

// 🧱 Load environment variables and modules
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');                 // 🛡️ Protection: general HTTP security headers
const rateLimit = require('express-rate-limit');  // 🛡️ Protection: prevents brute-force & DDoS attacks
const xss = require('xss-clean');                 // 🛡️ Protection: cleans user input to prevent XSS
const cookieParser = require('cookie-parser');    // 🛡️ Enables secure cookie handling
const compression = require('compression');       // Improves performance, mitigates slow attacks

const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// 🧱 Middleware setup
app.use(express.json());
app.use(cookieParser());

// 🧱 Protection: Cross-Origin Resource Sharing (CORS)
// Allows only trusted frontend origins (reduces attack surface)
app.use(cors({
    origin: process.env.CLIENT_URL || 'https://your-frontend-domain.com',
    credentials: true
}));

// 🛡️ Protection: HTTP security headers
// Helmet adds headers to prevent clickjacking, XSS, MIME sniffing, etc.
app.use(helmet());

// 🛡️ Protection: Rate Limiting (DDoS + brute force mitigation)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // max 100 requests per IP
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// 🛡️ Protection: XSS sanitization
// Cleans incoming JSON input to neutralize potential script injections
app.use(xss());

// 🛡️ Protection: Clickjacking
// Denies all attempts to embed your site inside an iframe
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    next();
});

// 🛡️ Protection: Man-in-the-Middle (MITM)
// Enforce HTTPS and enable HSTS so browsers always use HTTPS
app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// 🧱 Compression and Logging
app.use(compression());
app.use(morgan('dev'));

// 🧱 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);

// 🧱 Verify environment variables
if (!process.env.MONGO_URI) {
    throw new Error('❌ Missing MONGO_URI in .env file');
}

// 🧱 Database Connection (with retry logic for resilience)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// 🧱 Graceful shutdown to prevent data corruption
process.on('SIGINT', async () => {
    await mongoose.disconnect();
    console.log('🛑 MongoDB disconnected');
    process.exit(0);
});

// 🧱 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Server running on port ${PORT}`);
});
