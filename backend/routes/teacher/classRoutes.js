const express = require('express');
const router = express.Router();
const Class = require('../../models/Class');
const Submission = require('../../models/Submission');
const Attendance = require('../../models/Attendance');

// GET /api/teacher/classes
router.get('/', async (req, res, next) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id })
      .populate('departmentId', 'name')
      .populate('studentIds', 'firstName lastName email')
      .sort({ name: 1 });
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/classes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id })
      .populate('departmentId', 'name')
      .populate('studentIds', 'firstName lastName email studentId');

    if (!cls) return res.status(404).json({ error: 'Class not found or access denied' });

    res.json(cls);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/classes/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!cls) return res.status(404).json({ error: 'Class not found or access denied' });

    // Attendance rate
    const attendanceRecords = await Attendance.find({ classId: cls._id });
    let attendanceRate = 0;
    if (attendanceRecords.length > 0) {
      const rates = attendanceRecords.map((a) => a.statistics?.attendanceRate || 0);
      attendanceRate =
        Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100) / 100;
    }

    res.json({
      totalStudents: cls.studentIds?.length || 0,
      attendanceRate,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
