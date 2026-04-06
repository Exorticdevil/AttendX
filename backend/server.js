require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const attendanceRoutes = require('./routes/attendance');
const qrRoutes = require('./routes/qr');

const app = express();

// --- SECURITY & MIDDLEWARE ---
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'https://attend-x-delta.vercel.app',
      'http://localhost:3000'
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- RATE LIMITERS ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

const qrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // Increased slightly for testing
  message: { error: 'QR generation limit exceeded. Max 10 per minute.' }
});

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/qr', qrLimiter, qrRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString() 
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('🔥 Error Stack:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// --- DATABASE CONNECTION & START ---
const PORT = process.env.PORT || 5000;

// FIXED: Using MONGO_URI to match your .env file
const DB_URI = process.env.MONGO_URI; 

if (!DB_URI) {
  console.error("❌ ERROR: MONGO_URI is missing from your .env file!");
  process.exit(1);
}

mongoose.connect(DB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully to Atlas');
    
    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 TIP: Check if your IP is whitelisted in MongoDB Atlas Network Access.');
    process.exit(1);
  });

module.exports = app;
