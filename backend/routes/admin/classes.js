const express = require('express');
const router = express.Router();
const Class = require('../../models/Class');
const User = require('../../models/User');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/classes
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { department, program, academicYear, level, search } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (program) filter.programId = program;
    if (academicYear) filter.academicYearId = academicYear;
    if (level) filter.level = level;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const classes = await Class.find(filter)
      .populate('departmentId', 'name code')
      .populate('programId', 'name code')
      .populate('academicYearId', 'year')
      .populate('academicAdvisorId', 'firstName lastName')
      .sort({ name: 1 });
    res.json(classes);
  } catch (err) { next(err); }
});

// POST /api/admin/classes
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const cls = new Class(req.body);
    await cls.save();
    res.status(201).json(cls);
  } catch (err) { next(err); }
});

// GET /api/admin/classes/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('programId', 'name code')
      .populate('academicYearId', 'year')
      .populate('students.studentId', 'firstName lastName cin studentId')
      .populate('academicAdvisorId', 'firstName lastName');
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) { next(err); }
});

// PUT /api/admin/classes/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) { next(err); }
});

// POST /api/admin/classes/:id/students - Enroll student
router.post('/:id/students', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const alreadyEnrolled = cls.students.some(s => s.studentId.toString() === studentId);
    if (alreadyEnrolled) return res.status(400).json({ error: 'Student already enrolled' });
    cls.students.push({ studentId, enrollmentDate: new Date() });
    cls.currentEnrollment = cls.students.filter(s => s.status === 'enrolled').length;
    await cls.save();
    res.json({ message: 'Student enrolled', class: cls });
  } catch (err) { next(err); }
});

// DELETE /api/admin/classes/:id/students/:studentId - Remove student
router.delete('/:id/students/:studentId', authenticate, adminAuth, async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const studentEntry = cls.students.find(s => s.studentId.toString() === req.params.studentId);
    if (studentEntry) studentEntry.status = 'withdrawn';
    cls.currentEnrollment = cls.students.filter(s => s.status === 'enrolled').length;
    await cls.save();
    res.json({ message: 'Student withdrawn', class: cls });
  } catch (err) { next(err); }
});

// DELETE /api/admin/classes/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ message: 'Class deactivated', class: cls });
  } catch (err) { next(err); }
});

module.exports = router;
