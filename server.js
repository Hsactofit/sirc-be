require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
// app.use(cors());
// const cors = require('cors');

// Allow only localhost (any port) and sirc.travyfy.com
const allowlist = [
    /^http:\/\/localhost(?::\d+)?$/,  // http://localhost, any port
    /^https:\/\/sirc\.travyfy\.com$/, // https://sirc.travyfy.com
];

const corsOptions = {
    origin(origin, callback) {
        // Allow non-browser tools (no Origin header): curl, Postman, server-to-server
        if (!origin) return callback(null, true);

        const allowed = allowlist.some((re) => re.test(origin));
        if (allowed) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // set true only if you use cookies/auth headers across origins
};

app.use(cors(corsOptions));
// Preflight
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for promotion poster)
app.use('/public', express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/Meetings'));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Meeting Scheduler API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 9080;
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`\n📧 Email service: ${process.env.EMAIL_USER ? 'Configured ✅' : 'Not configured ⚠️'}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST   /api/auth/login`);
    console.log(`  POST   /api/auth/register`);
    console.log(`  GET    /api/meetings`);
    console.log(`  GET    /api/meetings/stats`);
    console.log(`  GET    /api/meetings/:id`);
    console.log(`  POST   /api/meetings`);
    console.log(`  PUT    /api/meetings/:id`);
    console.log(`  DELETE /api/meetings/:id`);
    console.log(`  POST   /api/meetings/:id/party-joined`);
    console.log(`  POST   /api/meetings/bulk-upload`);
    console.log(`\n⚡ Ready to accept requests!\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
});

module.exports = app;