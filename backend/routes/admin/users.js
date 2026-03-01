const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/users - Get all users (paginated)
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cin: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json({ users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// POST /api/admin/users - Create user
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const user = new User({ ...rest, password: password || 'TempPass123!' });
    await user.save();
    const saved = await User.findById(user._id).select('-password');
    res.status(201).json(saved);
  } catch (err) { next(err); }
});

// GET /api/admin/users/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
      .populate('student.departmentId', 'name code')
      .populate('student.programId', 'name code')
      .populate('student.classId', 'name code')
      .populate('teacher.departmentId', 'name code');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/admin/users/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id - Deactivate (soft delete)
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) { next(err); }
});

module.exports = router;
