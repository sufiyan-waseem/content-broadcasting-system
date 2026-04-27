const { User } = require('../models');
const { getActiveContent, getAllLiveContentByTeacher } = require('../services/scheduling.service');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * GET /content/live/:teacherId
 * PUBLIC endpoint – returns the currently active content for a teacher.
 * Supports optional ?subject= query param to filter by subject.
 *
 * Edge cases handled:
 *  - Teacher not found         → 404
 *  - No approved content       → empty response (not an error)
 *  - Approved but not in window→ empty response
 *  - Invalid/unknown subject   → empty response (not an error per spec)
 */
const getLiveContent = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { subject } = req.query;

    // Validate teacher exists
    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' },
      attributes: ['id', 'name', 'email'],
    });

    if (!teacher) {
      return errorResponse(res, 404, 'Teacher not found.');
    }

    const activeContent = await getActiveContent(teacherId, subject || null);

    if (!activeContent) {
      return res.status(200).json({
        success: true,
        message: 'No content available.',
        data: {
          teacher: { id: teacher.id, name: teacher.name },
          content: null,
        },
      });
    }

    return successResponse(res, 200, 'Live content fetched.', {
      teacher: { id: teacher.id, name: teacher.name },
      content: {
        id: activeContent.id,
        title: activeContent.title,
        description: activeContent.description,
        subject: activeContent.subject,
        file_url: activeContent.file_url,
        file_type: activeContent.file_type,
        rotation_duration: activeContent.rotation_duration,
        start_time: activeContent.start_time,
        end_time: activeContent.end_time,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /content/live/:teacherId/all
 * PUBLIC – returns ALL currently live content for a teacher (across all subjects)
 */
const getAllLiveContent = async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findOne({
      where: { id: teacherId, role: 'teacher' },
      attributes: ['id', 'name', 'email'],
    });

    if (!teacher) {
      return errorResponse(res, 404, 'Teacher not found.');
    }

    const liveContent = await getAllLiveContentByTeacher(teacherId);

    if (!liveContent || liveContent.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No content available.',
        data: { teacher: { id: teacher.id, name: teacher.name }, content: [] },
      });
    }

    return successResponse(res, 200, 'All live content fetched.', {
      teacher: { id: teacher.id, name: teacher.name },
      count: liveContent.length,
      content: liveContent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /content/live/subjects
 * PUBLIC – returns list of unique subjects that currently have live content
 */
const getLiveSubjects = async (req, res, next) => {
  try {
    const { Op, sequelize: sq } = require('sequelize');
    const { Content } = require('../models');
    const now = new Date();

    const subjects = await Content.findAll({
      attributes: ['subject'],
      where: {
        status: 'approved',
        start_time: { [Op.lte]: now },
        end_time: { [Op.gte]: now },
      },
      group: ['subject'],
      raw: true,
    });

    return successResponse(res, 200, 'Live subjects fetched.', {
      subjects: subjects.map((s) => s.subject),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLiveContent, getAllLiveContent, getLiveSubjects };
