/**
 * LockBin Server
 * Privacy-first encrypted file and text sharing backend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const textRoutes = require('./routes/text.routes');
const fileRoutes = require('./routes/file.routes');
const { startCleanupScheduler } = require('./cleanup');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logging (no plaintext logging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  const stats = store.getStats();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    secrets: stats.totalSecrets,
    memory: Math.round(stats.memoryUsage / 1024 / 1024) + ' MB'
  });
});

// API Routes
app.use('/api/text', textRoutes);
app.use('/api/file', fileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'File too large. Maximum size is 20 MB.' 
    });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🔒 LockBin Server                               ║
  ║   Privacy-first encrypted sharing                 ║
  ║                                                   ║
  ║   Server running on port ${PORT}                    ║
  ║   No database - all data in memory/temp files    ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
  
  // Start cleanup scheduler
  startCleanupScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] Received SIGINT, shutting down...');
  process.exit(0);
});
