const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../../models/Course');
const Class = require('../../models/Class');

// Helper: verify teacher owns class
async function verifyClassOwnership(classId, teacherId) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  return !!cls;
}

// GET /api/teacher/courses — all my courses
router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find({ teacherId: req.user._id })
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
      teacherId: req.user._id,
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

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, description } = req.body;
    const order = course.chapters.length + 1;
    course.chapters.push({ title, description, order, materials: [], isPublished: false });
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

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
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

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
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

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
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

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
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

// DELETE /api/teacher/courses/:classId/chapters/:chId/materials/:mId
router.delete('/:classId/chapters/:chId/materials/:mId', async (req, res, next) => {
  try {
    const owned = await verifyClassOwnership(req.params.classId, req.user._id);
    if (!owned) return res.status(403).json({ error: 'Access denied' });

    const course = await Course.findOne({ classId: req.params.classId, teacherId: req.user._id });
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

module.exports = router;
