const express = require('express');
const router = express.Router();
const { getLiveContent, getAllLiveContent, getLiveSubjects } = require('../controllers/broadcast.controller');
const rateLimit = require('express-rate-limit');

// Rate limiter for public broadcasting endpoint (bonus feature)
const broadcastLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// GET  /content/live/subjects            – List subjects with live content (no auth)
router.get('/subjects', broadcastLimiter, getLiveSubjects);

// GET  /content/live/:teacherId          – MAIN: current active content for teacher (no auth)
router.get('/:teacherId', broadcastLimiter, getLiveContent);

// GET  /content/live/:teacherId/all      – All live content for teacher across subjects (no auth)
router.get('/:teacherId/all', broadcastLimiter, getAllLiveContent);

module.exports = router;
