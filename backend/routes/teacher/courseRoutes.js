const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../../models/Course');
const Class = require('../../models/Class');
const WorkSubmission = require('../../models/WorkSubmission');
const multer = require('multer');
const { uploadToS3 } = require('../../utils/s3');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper: verify teacher owns class
async function verifyClassOwnership(classId, teacherId) {
  // Check if teacher is in the Class record (as teacher or advisor)
  const cls = await Class.findOne({
    _id: classId,
    $or: [
      { 'teachers.teacherId': teacherId },
      { 'academicAdvisorId': teacherId }
    ]
  });
  if (cls) return true;

  // OR check if teacher already has a course for this class
  const course = await Course.findOne({ classId, teacherId });
  return !!course;
}

// GET /api/teacher/courses — all my courses
router.get('/', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    // Find all classes where user is teacher or advisor
    const classes = await Class.find({
      $or: [
        { 'teachers.teacherId': teacherId },
        { academicAdvisorId: teacherId }
      ]
    }).select('_id');
    const classIds = classes.map(c => c._id);

    const courses = await Course.find({ classId: { $in: classIds } })
      .populate('classId', 'name code')
      .sort({ updatedAt: -1 });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/courses/:classId — course for a specific class
router.get('/:classId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    let course = await Course.findOne({
      classId: req.params.classId,
    });

    if (!course) {
      // Auto-create an empty course if none exists for this class
      const cls = await Class.findById(req.params.classId);
      course = await Course.create({
        title: cls.name,
        classId: cls._id,
        teacherId: req.user._id,
        chapters: [],
      });
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/courses/:classId/chapters — add chapter
router.post('/:classId/chapters', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, description } = req.body;
    const order = course.chapters.length + 1;
    course.chapters.push({ title, description, order, materials: [], exercises: [], isPublished: false });
    await course.save();

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teacher/courses/:classId/chapters/:chId — update chapter title/description
router.put('/:classId/chapters/:chId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const { title, description } = req.body;
    if (title !== undefined) chapter.title = title;
    if (description !== undefined) chapter.description = description;

    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teacher/courses/:classId/chapters/:chId
router.delete('/:classId/chapters/:chId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    course.chapters = course.chapters.filter((ch) => ch._id.toString() !== req.params.chId);
    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher/courses/:classId/chapters/:chId/publish — toggle publish
router.patch('/:classId/chapters/:chId/publish', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    chapter.isPublished = !chapter.isPublished;
    if (chapter.isPublished) chapter.publishedAt = new Date();

    await course.save();
    res.json({ isPublished: chapter.isPublished });
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/courses/:classId/chapters/:chId/materials — add material (URL-based)
router.post('/:classId/chapters/:chId/materials', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const { name, type, url } = req.body;
    chapter.materials.push({ name, type: type || 'link', url, uploadedAt: new Date() });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/courses/:classId/chapters/:chId/upload — upload file to S3
router.post('/:classId/chapters/:chId/upload', upload.single('file'), async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Determine type from mimetype
    let type = 'other';
    if (req.file.mimetype === 'application/pdf') type = 'pdf';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';
    else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('officedocument')) type = 'doc';
    else if (req.file.mimetype.includes('presentation') || req.file.mimetype.includes('powerpoint')) type = 'pptx';

    // Upload to S3
    const url = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Save to chapter materials
    chapter.materials.push({
      name: req.body.name || req.file.originalname,
      type,
      url,
      size: req.file.size,
      uploadedAt: new Date()
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error('S3 Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload to S3', details: err.message });
  }
});

// DELETE /api/teacher/courses/:classId/chapters/:chId/materials/:mId
router.delete('/:classId/chapters/:chId/materials/:mId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    chapter.materials = chapter.materials.filter((m) => m._id.toString() !== req.params.mId);
    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// --- EXERCISES & SUBMISSIONS ---

// POST /api/teacher/courses/:classId/chapters/:chId/exercises/upload — upload exercise to S3
router.post('/:classId/chapters/:chId/exercises/upload', upload.single('file'), async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    let type = 'other';
    if (req.file.mimetype === 'application/pdf') type = 'pdf';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';
    else if (req.file.mimetype.includes('word') || req.file.mimetype.includes('officedocument')) type = 'doc';

    const url = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);

    chapter.exercises.push({
      name: req.body.name || req.file.originalname,
      type,
      url,
      size: req.file.size,
      uploadedAt: new Date()
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error('S3 Exercise Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload exercise to S3', details: err.message });
  }
});

// DELETE /api/teacher/courses/:classId/chapters/:chId/exercises/:exId
router.delete('/:classId/chapters/:chId/exercises/:exId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    chapter.exercises = chapter.exercises.filter((ex) => ex._id.toString() !== req.params.exId);
    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/courses/:classId/chapters/:chId/submissions — get all submissions for this chapter
router.get('/:classId/chapters/:chId/submissions', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const submissions = await WorkSubmission.find({ 
      chapterId: req.params.chId 
    }).populate('studentId', 'firstName lastName email profilePicture');

    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
