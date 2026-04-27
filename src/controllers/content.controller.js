const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Content, User } = require('../models');
const { scheduleContent } = require('../services/scheduling.service');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * POST /api/content/upload
 * Teacher uploads a new content item
 */
const uploadContent = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 400, 'File is required.');
    }

    const { title, subject, description, start_time, end_time, rotation_duration } = req.body;

    if (!title || !title.trim()) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return errorResponse(res, 400, 'Title is required.');
    }

    if (!subject || !subject.trim()) {
      fs.unlinkSync(req.file.path);
      return errorResponse(res, 400, 'Subject is required.');
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const fileType = ext === 'jpg' ? 'jpeg' : ext; // normalize

    // Build accessible URL for the file
    const fileUrl = `/uploads/${req.file.filename}`;

    const content = await Content.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      subject: subject.trim().toLowerCase(),
      file_url: fileUrl,
      file_type: fileType,
      file_size: req.file.size,
      uploaded_by: req.user.id,
      status: 'pending',
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      rotation_duration: rotation_duration ? parseInt(rotation_duration) : 5,
    });

    // Auto-create a schedule entry if timing is provided
    if (start_time && end_time) {
      await scheduleContent(content.id, content.subject, content.rotation_duration);
    }

    return successResponse(res, 201, 'Content uploaded successfully. Awaiting principal approval.', { content });
  } catch (error) {
    // If DB fails, clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * GET /api/content/my
 * Teacher views their own uploaded content with status
 */
const getMyContent = async (req, res, next) => {
  try {
    const { status, subject, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { uploaded_by: req.user.id };
    if (status) where.status = status;
    if (subject) where.subject = subject.toLowerCase();

    const { count, rows } = await Content.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return successResponse(res, 200, 'Your content fetched.', {
      content: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/content/all    (Principal only)
 * Principal views all uploaded content
 */
const getAllContent = async (req, res, next) => {
  try {
    const { status, subject, teacher_id, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (subject) where.subject = subject.toLowerCase();
    if (teacher_id) where.uploaded_by = teacher_id;

    const { count, rows } = await Content.findAndCountAll({
      where,
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return successResponse(res, 200, 'All content fetched.', {
      content: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/content/pending   (Principal only)
 * Principal views only pending content
 */
const getPendingContent = async (req, res, next) => {
  try {
    const content = await Content.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'ASC']],
    });

    return successResponse(res, 200, 'Pending content fetched.', { content });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/content/:id
 * Get a single content item by ID
 */
const getContentById = async (req, res, next) => {
  try {
    const content = await Content.findByPk(req.params.id, {
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approver', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!content) {
      return errorResponse(res, 404, 'Content not found.');
    }

    // Teachers can only view their own content
    if (req.user.role === 'teacher' && content.uploaded_by !== req.user.id) {
      return errorResponse(res, 403, 'Access denied.');
    }

    return successResponse(res, 200, 'Content fetched.', { content });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadContent,
  getMyContent,
  getAllContent,
  getPendingContent,
  getContentById,
};
