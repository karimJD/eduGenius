const express = require('express');
const router = express.Router();
const StudyProgram = require('../../models/StudyProgram');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/programs
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { department, type, search } = req.query;
    const filter = {};
    if (department) filter.departmentId = department;
    if (type) filter.programType = type;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
    const programs = await StudyProgram.find(filter)
      .populate('departmentId', 'name code')
      .populate('coordinatorId', 'firstName lastName')
      .sort({ name: 1 });
    res.json(programs);
  } catch (err) { next(err); }
});

// POST /api/admin/programs
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const program = new StudyProgram(req.body);
    await program.save();
    res.status(201).json(program);
  } catch (err) { next(err); }
});

// GET /api/admin/programs/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const program = await StudyProgram.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('coordinatorId', 'firstName lastName email')
      .populate('teachingUnits.unitId');
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err) { next(err); }
});

// PUT /api/admin/programs/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const program = await StudyProgram.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json(program);
  } catch (err) { next(err); }
});

// DELETE /api/admin/programs/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const program = await StudyProgram.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!program) return res.status(404).json({ error: 'Program not found' });
    res.json({ message: 'Program deactivated', program });
  } catch (err) { next(err); }
});

module.exports = router;
