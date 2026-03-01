const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { authenticate, adminAuth } = require('../../middleware/auth');
const { generateEmployeeId } = require('../../utils/helpers');

// GET /api/admin/teachers
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, department, rank, search } = req.query;
    const filter = { role: 'teacher' };
    if (department) filter['teacher.departmentId'] = department;
    if (rank) filter['teacher.academicRank'] = rank;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { cin: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const teachers = await User.find(filter)
      .select('-password')
      .populate('teacher.departmentId', 'name code')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ teachers, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/admin/teachers
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const data = { ...req.body, role: 'teacher' };
    if (!data.employeeId) data.employeeId = generateEmployeeId();
    if (!data.teacher) data.teacher = {};
    const teacher = new User(data);
    await teacher.save();
    const saved = await User.findById(teacher._id).select('-password');
    res.status(201).json(saved);
  } catch (err) { next(err); }
});

// GET /api/admin/teachers/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .select('-password')
      .populate('teacher.departmentId', 'name code');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) { next(err); }
});

// PUT /api/admin/teachers/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { password, role, ...rest } = req.body;
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      rest,
      { new: true, runValidators: true }
    ).select('-password');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (err) { next(err); }
});

// DELETE /api/admin/teachers/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json({ message: 'Teacher deactivated', teacher });
  } catch (err) { next(err); }
});

module.exports = router;
