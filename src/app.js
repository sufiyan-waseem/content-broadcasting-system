const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

// ─── Route Imports ──────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const approvalRoutes = require('./routes/approval.routes');
const broadcastRoutes = require('./routes/broadcast.routes');

const app = express();

// ─── Security & Utility Middlewares ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded files
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Uploads Folder ──────────────────────────────────────────────────
// Uploaded files are served publicly at /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Content Broadcasting System API is running.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/approval', approvalRoutes);

// Public broadcasting routes (no /api prefix – matches spec: GET /content/live/:teacherId)
app.use('/content/live', broadcastRoutes);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
