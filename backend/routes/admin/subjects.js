const express = require('express');
const router = express.Router();
const Subject = require('../../models/Subject');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/subjects
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { search, semester } = req.query;
    const filter = { isActive: true };
    if (semester) filter.semester = Number(semester);
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const subjects = await Subject.find(filter)
      .populate('teachingUnitId', 'name code')
      .sort({ name: 1 });
    res.json(subjects);
  } catch (err) { next(err); }
});

// POST /api/admin/subjects
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (err) { next(err); }
});

// PUT /api/admin/subjects/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json(subject);
  } catch (err) { next(err); }
});

// DELETE /api/admin/subjects/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    res.json({ message: 'Subject deactivated', subject });
  } catch (err) { next(err); }
});

module.exports = router;
