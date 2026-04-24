const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement');
const Class = require('../../models/Class');
const imageUpload = require('../../middleware/imageUploadMiddleware');
const { uploadToS3 } = require('../../utils/s3');

// Helper: verify teacher owns class
// Helper: verify teacher owns class (either via Class model or Schedule)
async function verifyOwnership(classId, teacherId) {
  // Check Class model (direct assignment or advisor)
  const cls = await Class.findOne({ 
    _id: classId,
    $or: [
      { 'teachers.teacherId': teacherId },
      { 'academicAdvisorId': teacherId }
    ]
  });
  if (cls) return true;

  // Check Schedule model
  const Schedule = require('../../models/Schedule');
  const schedule = await Schedule.findOne({
    'entries.classId': classId,
    'entries.teacherId': teacherId
  });
  
  return !!schedule;
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
      $and: [
        {
          $or: [
            { classId: req.params.classId },
            { targetClasses: req.params.classId }
          ]
        },
        {
          $or: [
            { teacherId: req.user._id },
            { isPublished: true }
          ]
        }
      ]
    }).sort({ isPinned: -1, createdAt: -1 })
      .populate('teacherId', 'firstName lastName');

    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/announcements/:classId
router.post('/:classId', imageUpload.single('image'), async (req, res, next) => {
  try {
    const owned = await verifyOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const { 
      title, 
      content, 
      priority, 
      type, 
      isPinned, 
      publishAt, 
      expiresAt,
      isPublished,
      targetType,
      targetClasses
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'announcements');
    }

    // Process targetClasses
    let processedClasses = [];
    if (targetType === 'specific_classes' && targetClasses) {
      try {
        const raw = typeof targetClasses === 'string' ? JSON.parse(targetClasses) : targetClasses;
        // Verify ownership for all target classes (Class model OR Schedule)
        const [ownedClasses, scheduledClasses] = await Promise.all([
          Class.find({
            $or: [
              { 'teachers.teacherId': req.user._id },
              { 'academicAdvisorId': req.user._id }
            ]
          }).select('_id'),
          require('../../models/Schedule').find({
            'entries.teacherId': req.user._id
          }).select('entries.classId')
        ]);

        const teacherClassIds = new Set([
          ...ownedClasses.map(c => c._id.toString()),
          ...scheduledClasses.flatMap(s => s.entries
            .filter(e => e.teacherId?.toString() === req.user._id.toString())
            .map(e => e.classId?.toString())
            .filter(Boolean)
          )
        ]);

        processedClasses = raw.filter(id => teacherClassIds.has(id));
      } catch (e) {
        processedClasses = [req.params.classId];
      }
    } else {
      processedClasses = [req.params.classId];
    }

    const announcement = await Announcement.create({
      title,
      content,
      classId: req.params.classId, // Primary class
      teacherId: req.user._id,
      targetType: targetType === 'specific_classes' ? 'specific_classes' : 'specific_classes', // Teachers only target classes
      targetClasses: processedClasses,
      priority: priority || 'normal',
      type: type || 'general',
      isPinned: isPinned === 'true' || isPinned === true,
      isPublished: isPublished === 'false' ? false : true,
      publishAt: publishAt || null,
      expiresAt: (expiresAt === 'null' || !expiresAt) ? null : expiresAt,
      imageUrl
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
