const express = require('express');
const router = express.Router();
const Grade = require('../../models/Grade');
const { authenticate, adminAuth } = require('../../middleware/auth');
const { getMentionFromGrade, calculateAverage } = require('../../utils/helpers');

// GET /api/admin/grades
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, subjectId, examSession, academicYearId, studentId } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (examSession) filter.examSession = examSession;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (studentId) filter.studentId = studentId;
    const grades = await Grade.find(filter)
      .populate('studentId', 'firstName lastName cin studentId')
      .populate('subjectId', 'name code coefficient evaluation')
      .populate('validatedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(grades);
  } catch (err) { next(err); }
});

// POST /api/admin/grades - Create/update grade
router.post('/', authenticate, authorize(['super_admin', 'admin', 'teacher']), async (req, res, next) => {
  try {
    const { studentId, subjectId, examSession, continuousAssessment, practicalWork, examGrade, academicYearId, classId } = req.body;
    // Calculate total grade using evaluation weights
    const Subject = require('../../models/Subject');
    const subject = await Subject.findById(subjectId);
    let totalGrade;
    if (subject && examGrade !== undefined) {
      const examWeight = subject.evaluation?.examWeight || 70;
      const continuousWeight = subject.evaluation?.continuousWeight || 30;
      const ccGrade = continuousAssessment || 0;
      totalGrade = Math.round(((examGrade * examWeight + ccGrade * continuousWeight) / 100) * 100) / 100;
    } else {
      totalGrade = examGrade;
    }
    const mention = totalGrade !== undefined ? getMentionFromGrade(totalGrade) : null;
    const isPassed = totalGrade !== undefined ? totalGrade >= 10 : false;
    const grade = await Grade.findOneAndUpdate(
      { studentId, subjectId, examSession },
      { studentId, subjectId, examSession, continuousAssessment, practicalWork, examGrade, totalGrade, academicYearId, classId, mention, isPassed },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(grade);
  } catch (err) { next(err); }
});

// Placeholder authorize middleware
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// PUT /api/admin/grades/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { totalGrade, examGrade, continuousAssessment } = req.body;
    const mention = totalGrade !== undefined ? getMentionFromGrade(totalGrade) : undefined;
    const update = { ...req.body };
    if (mention) update.mention = mention;
    if (totalGrade !== undefined) update.isPassed = totalGrade >= 10;
    const grade = await Grade.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json(grade);
  } catch (err) { next(err); }
});

// POST /api/admin/grades/bulk - Bulk grade entry
router.post('/bulk', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { grades } = req.body;
    if (!Array.isArray(grades)) return res.status(400).json({ error: 'grades must be an array' });
    const results = { saved: [], errors: [] };
    for (const g of grades) {
      try {
        const mention = g.totalGrade !== undefined ? getMentionFromGrade(g.totalGrade) : null;
        const saved = await Grade.findOneAndUpdate(
          { studentId: g.studentId, subjectId: g.subjectId, examSession: g.examSession },
          { ...g, mention, isPassed: g.totalGrade >= 10 },
          { upsert: true, new: true }
        );
        results.saved.push(saved._id);
      } catch (err) {
        results.errors.push({ studentId: g.studentId, error: err.message });
      }
    }
    res.json(results);
  } catch (err) { next(err); }
});

// POST /api/admin/grades/:id/validate - Validate grade (set PV number)
router.post('/:id/validate', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { pvNumber } = req.body;
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { validatedBy: req.user._id, validatedAt: new Date(), pvNumber },
      { new: true }
    );
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json(grade);
  } catch (err) { next(err); }
});

// DELETE /api/admin/grades/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json({ message: 'Grade deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
