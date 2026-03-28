const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement');
const Class = require('../../models/Class');

// Helper: verify teacher owns class
async function verifyOwnership(classId, teacherId) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  return !!cls;
}

const { getRecentAnnouncements } = require('../../controllers/teacher/OtherControllers');

// GET /api/teacher/announcements/recent
router.get('/recent', getRecentAnnouncements);

// GET /api/teacher/announcements/:classId
router.get('/:classId', async (req, res, next) => {
  try {
    const owned = await verifyOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const announcements = await Announcement.find({
      classId: req.params.classId,
      teacherId: req.user._id,
    }).sort({ isPinned: -1, createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/announcements/:classId
router.post('/:classId', async (req, res, next) => {
  try {
    const owned = await verifyOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const { title, content, priority, type, isPinned, publishAt, expiresAt } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      classId: req.params.classId,
      teacherId: req.user._id,
      priority: priority || 'normal',
      type: type || 'general',
      isPinned: isPinned || false,
      publishAt,
      expiresAt,
    });

    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teacher/announcements/:id
router.put('/:id', async (req, res, next) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ error: 'Not found or access denied' });
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teacher/announcements/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.id,
      teacherId: req.user._id,
    });
    if (!announcement) return res.status(404).json({ error: 'Not found or access denied' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher/announcements/:id/pin
router.patch('/:id/pin', async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({
      _id: req.params.id,
      teacherId: req.user._id,
    });
    if (!announcement) return res.status(404).json({ error: 'Not found or access denied' });

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();
    res.json({ isPinned: announcement.isPinned });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
