const { Content, User } = require('../models');
const { scheduleContent } = require('../services/scheduling.service');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * PATCH /api/approval/:id/approve    (Principal only)
 * Approves a content item
 */
const approveContent = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id);

    if (!content) {
      return errorResponse(res, 404, 'Content not found.');
    }

    if (content.status === 'approved') {
      return errorResponse(res, 400, 'Content is already approved.');
    }

    if (content.status === 'rejected') {
      return errorResponse(res, 400, 'Cannot approve rejected content. Teacher must re-upload.');
    }

    await content.update({
      status: 'approved',
      approved_by: req.user.id,
      approved_at: new Date(),
      rejection_reason: null,
    });

    // Ensure it has a schedule entry if timing fields are set
    if (content.start_time && content.end_time) {
      await scheduleContent(content.id, content.subject, content.rotation_duration || 5);
    }

    return successResponse(res, 200, 'Content approved successfully.', { content });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/approval/:id/reject    (Principal only)
 * Rejects a content item with a mandatory reason
 */
const rejectContent = async (req, res, next) => {
  try {
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return errorResponse(res, 400, 'Rejection reason is mandatory.');
    }

    const content = await Content.findByPk(req.params.id);

    if (!content) {
      return errorResponse(res, 404, 'Content not found.');
    }

    if (content.status === 'rejected') {
      return errorResponse(res, 400, 'Content is already rejected.');
    }

    await content.update({
      status: 'rejected',
      rejection_reason: rejection_reason.trim(),
      approved_by: null,
      approved_at: null,
    });

    return successResponse(res, 200, 'Content rejected.', { content });
  } catch (error) {
    next(error);
  }
};

module.exports = { approveContent, rejectContent };
