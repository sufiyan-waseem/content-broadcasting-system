const express = require('express');
const router = express.Router();
const { approveContent, rejectContent } = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// PATCH /api/approval/:id/approve  – Principal only
router.patch('/:id/approve', authenticate, authorize('principal'), approveContent);

// PATCH /api/approval/:id/reject   – Principal only
router.patch('/:id/reject', authenticate, authorize('principal'), rejectContent);

module.exports = router;
