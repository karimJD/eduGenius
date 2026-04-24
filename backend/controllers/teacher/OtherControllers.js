const Announcement = require('../../models/Announcement');

/**
 * GET /api/teacher/announcements/recent
 * Fetch recent announcements created by the teacher across all classes
 */
const getRecentAnnouncements = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const now = new Date();

    console.log('[DEBUG] getRecentAnnouncements for teacherId:', teacherId);
    console.log('[DEBUG] Current time:', now);

    const query = {
      $or: [
        { teacherId },
        { 
          $and: [
            { targetType: { $in: ['all', 'all_teachers'] } },
            { isPublished: true },
            { $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }] },
            { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }] }
          ]
        }
      ]
    };

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(10)
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'name code');

    console.log('[DEBUG] Found announcements:', announcements.length);
    res.json(announcements);
  } catch (err) {
    console.error('[DEBUG] Error in getRecentAnnouncements:', err);
    next(err);
  }
};

module.exports = {
  getRecentAnnouncements
};
