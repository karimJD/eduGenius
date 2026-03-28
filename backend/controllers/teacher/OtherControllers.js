const Announcement = require('../../models/Announcement');

/**
 * GET /api/teacher/announcements/recent
 * Fetch recent announcements created by the teacher across all classes
 */
const getRecentAnnouncements = async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    const announcements = await Announcement.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('classId', 'name code');

    res.json(announcements);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecentAnnouncements
};
