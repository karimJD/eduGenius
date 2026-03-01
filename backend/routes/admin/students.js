const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Grade = require('../../models/Grade');
const { authenticate, adminAuth } = require('../../middleware/auth');
const { generateStudentId } = require('../../utils/helpers');

// GET /api/admin/students - Get all students with filters
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, department, level, status, search } = req.query;
    const filter = { role: 'student' };
    if (department) filter['student.departmentId'] = department;
    if (level) filter['student.level'] = level;
    if (status !== undefined) filter.isActive = status === 'active';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { cin: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'student.fileNumber': { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const students = await User.find(filter)
      .select('-password')
      .populate('student.departmentId', 'name code')
      .populate('student.programId', 'name code')
      .populate('student.classId', 'name code')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ students, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/admin/students - Create student
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const data = { ...req.body, role: 'student' };
    if (!data.studentId) {
      data.studentId = generateStudentId();
    }
    if (!data.student) data.student = {};
    if (!data.student.enrollmentDate) data.student.enrollmentDate = new Date();
    const student = new User(data);
    await student.save();
    const saved = await User.findById(student._id).select('-password');
    res.status(201).json(saved);
  } catch (err) { next(err); }
});

// POST /api/admin/students/bulk-import - Import students from CSV data
router.post('/bulk-import', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { students: studentsData } = req.body;
    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return res.status(400).json({ error: 'No student data provided' });
    }
    const results = { created: [], errors: [] };
    for (const data of studentsData) {
      try {
        const studentData = { ...data, role: 'student' };
        if (!studentData.studentId) studentData.studentId = generateStudentId();
        const student = new User(studentData);
        await student.save();
        results.created.push({ cin: data.cin, name: `${data.firstName} ${data.lastName}` });
      } catch (err) {
        results.errors.push({ cin: data.cin, error: err.message });
      }
    }
    res.json({ message: `Imported ${results.created.length} students`, results });
  } catch (err) { next(err); }
});

// GET /api/admin/students/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' })
      .select('-password')
      .populate('student.departmentId', 'name code')
      .populate('student.programId', 'name code')
      .populate('student.classId', 'name code');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
});

// GET /api/admin/students/:id/grades
router.get('/:id/grades', authenticate, adminAuth, async (req, res, next) => {
  try {
    const grades = await Grade.find({ studentId: req.params.id })
      .populate('subjectId', 'name code')
      .populate('academicYearId', 'year')
      .sort({ createdAt: -1 });
    res.json(grades);
  } catch (err) { next(err); }
});

// PUT /api/admin/students/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { password, role, ...rest } = req.body;
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      rest,
      { new: true, runValidators: true }
    ).select('-password');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) { next(err); }
});

// DELETE /api/admin/students/:id - Deactivate
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student deactivated', student });
  } catch (err) { next(err); }
});

module.exports = router;
