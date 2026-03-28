const express = require('express');
const router = express.Router();
const AcademicYear = require('../../models/AcademicYear');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/academic-years
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const years = await AcademicYear.find().sort({ year: -1 });
    res.json(years);
  } catch (err) { next(err); }
});

// GET /api/admin/academic-years/current
router.get('/current', authenticate, adminAuth, async (req, res, next) => {
  try {
    const year = await AcademicYear.findOne({ isCurrent: true });
    if (!year) return res.status(404).json({ error: 'No active academic year found' });
    res.json(year);
  } catch (err) { next(err); }
});

// POST /api/admin/academic-years
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { year, startDate, endDate, semesters, isCurrent } = req.body;
    // If new year is current, unset others
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }
    const academicYear = new AcademicYear({ year, startDate, endDate, semesters, isCurrent: !!isCurrent });
    await academicYear.save();
    res.status(201).json(academicYear);
  } catch (err) { next(err); }
});

// PUT /api/admin/academic-years/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    if (req.body.isCurrent) {
      await AcademicYear.updateMany({ _id: { $ne: req.params.id } }, { isCurrent: false });
    }
    const updated = await AcademicYear.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Academic year not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
