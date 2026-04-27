const { Op } = require('sequelize');
const { Content, ContentSlot, ContentSchedule } = require('../models');

/**
 * ─────────────────────────────────────────────────────────────────
 * SCHEDULING LOGIC (THE HEART OF THE SYSTEM)
 * ─────────────────────────────────────────────────────────────────
 *
 * How rotation works (no cron job needed – pure math):
 *
 * Given N content items in a subject, each with a duration D(i) minutes:
 *
 * 1. We find all APPROVED content items for a teacher+subject
 *    that have a valid time window (start_time <= now <= end_time).
 *
 * 2. We compute:
 *      totalCycleDuration = sum of all D(i)
 *
 * 3. We compute:
 *      elapsedSinceEpoch = (now - UNIX_EPOCH) in minutes
 *      positionInCycle   = elapsedSinceEpoch % totalCycleDuration
 *
 * 4. We iterate through sorted content items, subtracting each D(i)
 *    until positionInCycle falls within an item's window.
 *    That item is the currently active one.
 *
 * This gives us a SEAMLESS, CONTINUOUS, LOOP rotation purely
 * based on the current time — no state, no DB writes needed.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Returns the currently active content for a specific teacher and subject.
 *
 * @param {string} teacherId - UUID of the teacher
 * @param {string|null} subject - Subject name to filter by (optional)
 * @returns {Object|null} - Active content object or null
 */
const getActiveContent = async (teacherId, subject = null) => {
  const now = new Date();

  // Build query filters
  const where = {
    uploaded_by: teacherId,
    status: 'approved',
    start_time: { [Op.lte]: now },
    end_time: { [Op.gte]: now },
  };

  if (subject) {
    where.subject = subject.toLowerCase();
  }

  // Fetch all currently active+approved content for this teacher (sorted by created_at for stable order)
  const activeContent = await Content.findAll({
    where,
    order: [['created_at', 'ASC']],
    include: [
      {
        model: ContentSchedule,
        as: 'schedule',
        required: false,
      },
    ],
  });

  if (!activeContent || activeContent.length === 0) {
    return null;
  }

  // If only one content item, return it directly (no rotation needed)
  if (activeContent.length === 1) {
    return activeContent[0];
  }

  // ─── ROTATION MATH ──────────────────────────────────────────
  // Sort by rotation_order if schedule exists, else by creation date
  const sorted = [...activeContent].sort((a, b) => {
    const orderA = a.schedule?.rotation_order ?? 0;
    const orderB = b.schedule?.rotation_order ?? 0;
    return orderA - orderB;
  });

  // Compute total cycle duration (in minutes)
  const totalCycleDuration = sorted.reduce((sum, item) => {
    const duration = item.schedule?.duration ?? item.rotation_duration ?? 5;
    return sum + duration;
  }, 0);

  if (totalCycleDuration === 0) {
    return sorted[0]; // Fallback: no duration defined
  }

  // Minutes since UNIX epoch, modulo total cycle
  const msNow = now.getTime();
  const minutesSinceEpoch = Math.floor(msNow / 60000);
  const positionInCycle = minutesSinceEpoch % totalCycleDuration;

  // Find which content slot the current position falls into
  let cursor = 0;
  for (const item of sorted) {
    const duration = item.schedule?.duration ?? item.rotation_duration ?? 5;
    if (positionInCycle < cursor + duration) {
      return item;
    }
    cursor += duration;
  }

  // Fallback (should never reach here)
  return sorted[0];
};

/**
 * Returns ALL currently live content items for a teacher (across all subjects).
 * Useful for overview endpoints.
 *
 * @param {string} teacherId
 * @returns {Array} List of active content items grouped by subject
 */
const getAllLiveContentByTeacher = async (teacherId) => {
  const now = new Date();

  const activeContent = await Content.findAll({
    where: {
      uploaded_by: teacherId,
      status: 'approved',
      start_time: { [Op.lte]: now },
      end_time: { [Op.gte]: now },
    },
    order: [['subject', 'ASC'], ['created_at', 'ASC']],
  });

  return activeContent;
};

/**
 * Ensures a ContentSlot exists for the given subject (upsert pattern).
 * Called automatically when a teacher uploads content.
 *
 * @param {string} subject
 * @returns {ContentSlot}
 */
const ensureSlotExists = async (subject) => {
  const [slot] = await ContentSlot.findOrCreate({
    where: { subject: subject.toLowerCase() },
    defaults: { subject: subject.toLowerCase() },
  });
  return slot;
};

/**
 * Creates or updates a ContentSchedule entry for a content item.
 *
 * @param {string} contentId
 * @param {string} subject
 * @param {number} duration - minutes per rotation slot
 * @returns {ContentSchedule}
 */
const scheduleContent = async (contentId, subject, duration = 5) => {
  const slot = await ensureSlotExists(subject);

  // Find the current max rotation_order for this slot
  const maxOrderEntry = await ContentSchedule.findOne({
    where: { slot_id: slot.id },
    order: [['rotation_order', 'DESC']],
  });

  const nextOrder = maxOrderEntry ? maxOrderEntry.rotation_order + 1 : 0;

  const [schedule, created] = await ContentSchedule.findOrCreate({
    where: { content_id: contentId },
    defaults: {
      content_id: contentId,
      slot_id: slot.id,
      rotation_order: nextOrder,
      duration,
    },
  });

  return schedule;
};

module.exports = {
  getActiveContent,
  getAllLiveContentByTeacher,
  ensureSlotExists,
  scheduleContent,
};
