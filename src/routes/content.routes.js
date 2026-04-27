const express = require('express');
const router = express.Router();
const {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  getContentById,
} = require('../controllers/content.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');

// POST /api/content/upload  – Teacher only
router.post(
  '/upload',
  authenticate,
  authorize('teacher'),
  upload.single('file'),
  handleUploadError,
  uploadContent
);

// GET  /api/content/my      – Teacher views own content (with filters & pagination)
router.get('/my', authenticate, authorize('teacher'), getMyContent);

// GET  /api/content/pending – Principal views pending content
router.get('/pending', authenticate, authorize('principal'), getPendingContent);

// GET  /api/content/all     – Principal views all content (with filters & pagination)
router.get('/all', authenticate, authorize('principal'), getAllContent);

// GET  /api/content/:id     – Both roles (teacher sees own only)
router.get('/:id', authenticate, getContentById);

module.exports = router;
