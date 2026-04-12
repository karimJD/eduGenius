const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../../models/Course');
const Class = require('../../models/Class');
const Schedule = require('../../models/Schedule');
const WorkSubmission = require('../../models/WorkSubmission');
const multer = require('multer');
const { uploadToS3 } = require('../../utils/s3');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Helper: verify teacher owns class & subject
async function verifyClassOwnership(classId, teacherId, subjectId = null) {
  // 1. Check if teacher is explicitly assigned in the Class record
  const cls = await Class.findById(classId);
  if (!cls) return false;

  const isAcademicAdvisor = cls.academicAdvisorId?.toString() === teacherId.toString();
  const isAssignedInClass = cls.teachers?.some(t => 
    t.teacherId.toString() === teacherId.toString() && 
    (!subjectId || t.subjectId.toString() === subjectId.toString())
  );

  if (isAcademicAdvisor || isAssignedInClass) return true;

  // 2. If subjectId is provided, check if teacher is assigned via a Schedule
  if (subjectId) {
    const schedules = await Schedule.find({
      $or: [
        { targetType: 'class', targetId: classId },
        { 'entries.classId': classId }
      ],
      'entries.teacherId': teacherId,
      'entries.subjectId': subjectId,
      isPublished: true
    });
    if (schedules.length > 0) return true;
  }

  return false;
}

// GET /api/teacher/courses — all my courses
router.get('/', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const courses = await Course.find({ teacherId })
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .sort({ updatedAt: -1 });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/courses/:classId — course for a specific class & subject
// Expects ?subjectId=...
router.get('/:classId', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ error: 'Subject ID is required' });

    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    let course = await Course.findOne({
      classId: req.params.classId,
      subjectId: subjectId
    }).populate('subjectId', 'name code');

    if (!course) {
      // Auto-create an empty course for this (class, subject)
      const cls = await Class.findById(req.params.classId);
      course = await Course.create({
        title: `${cls.name} - Subject Course`,
        classId: cls._id,
        teacherId: req.user._id,
        subjectId: subjectId,
        chapters: [],
      });
      course = await course.populate('subjectId', 'name code');
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
});

// Update mid-layer routes to find course by (classId, subjectId) if needed
// Actually, since these are nested under /:classId, we should ensure they target the right subject.
// A simpler way is to pass courseId, but the existing UI uses classId.
// I'll update the queries to use req.query.subjectId if available.

const findTargetCourse = async (classId, teacherId, subjectId) => {
  const query = { classId };
  if (subjectId) query.subjectId = subjectId;
  else query.teacherId = teacherId; // Fallback for legacy
  return Course.findOne(query);
};

// PATCH /api/teacher/courses/:classId/...
// I will update the logic to include subjectId from query in each route.

router.patch('/:classId/chapters/:chId/exercises/:exId/due-date', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const chapter = course.chapters.id(req.params.chId);
    if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

    const exercise = chapter.exercises.id(req.params.exId);
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    exercise.dueDate = req.body.dueDate;
    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher/courses/:classId/chapters/:chId/submissions/:subId/grade — grade an exercise submission
router.patch('/:classId/chapters/:chId/submissions/:subId/grade', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const submission = await WorkSubmission.findById(req.params.subId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    await submission.save();

    res.json(submission);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/courses/:classId/chapters — add chapter
router.post('/:classId/chapters', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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

// GET /api/teacher/courses/:classId/chapters/:chId/submissions
router.get('/:classId/chapters/:chId/submissions', async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const submissions = await WorkSubmission.find({
      chapterId: req.params.chId,
      classId: req.params.classId,
      subjectId: subjectId
    }).populate('studentId', 'firstName lastName profileImage email');

    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/courses/:classId/chapters/:chId/exercises/upload — upload exercise to S3
router.post('/:classId/chapters/:chId/exercises/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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
    const { subjectId } = req.query;
    const owned = await verifyClassOwnership(req.params.classId, req.user._id, subjectId);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await findTargetCourse(req.params.classId, req.user._id, subjectId);
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

module.exports = router;
