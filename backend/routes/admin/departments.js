const express = require('express');
const router = express.Router();
const Department = require('../../models/Department');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/departments
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const departments = await Department.find(filter)
      .populate('headOfDepartmentId', 'firstName lastName')
      .sort({ name: 1 });
    res.json(departments);
  } catch (err) { next(err); }
});

// POST /api/admin/departments
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const dept = new Department(req.body);
    await dept.save();
    res.status(201).json(dept);
  } catch (err) { next(err); }
});

// GET /api/admin/departments/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id)
      .populate('headOfDepartmentId', 'firstName lastName email')
      .populate('teachers', 'firstName lastName email teacher.academicRank');
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) { next(err); }
});

// PUT /api/admin/departments/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (err) { next(err); }
});

// DELETE /api/admin/departments/:id - Soft delete
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deactivated', dept });
  } catch (err) { next(err); }
});

module.exports = router;
