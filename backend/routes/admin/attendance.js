const express = require('express');
const router = express.Router();
const Attendance = require('../../models/Attendance');
const { authenticate, adminAuth } = require('../../middleware/auth');
const { getClassAttendanceReport } = require('../../services/video/attendanceService');

// GET /api/admin/attendance - Get attendance records with filters
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, subjectId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }
    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .populate('videoSessionId', 'title meetingUrl')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ sessionDate: -1 });
    res.json({ records, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/admin/attendance/class/:classId - Class attendance report
router.get('/class/:classId', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    const report = await getClassAttendanceReport(req.params.classId, start, end);
    res.json(report);
  } catch (err) { next(err); }
});

// GET /api/admin/attendance/student/:studentId - Student attendance
router.get('/student/:studentId', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { startDate, endDate, subjectId } = req.query;
    const filter = { 'records.studentId': req.params.studentId };
    if (subjectId) filter.subjectId = subjectId;
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }
    const attendances = await Attendance.find(filter)
      .populate('subjectId', 'name code')
      .populate('classId', 'name code')
      .sort({ sessionDate: -1 });
    const studentReport = attendances.map(att => {
      const record = att.records.find(r => r.studentId.toString() === req.params.studentId);
      return { date: att.sessionDate, subject: att.subjectId, class: att.classId, record };
    });
    res.json({ studentId: req.params.studentId, records: studentReport });
  } catch (err) { next(err); }
});

// POST /api/admin/attendance/:id/adjust - Manually adjust attendance
router.post('/:id/adjust', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { studentId, newStatus, reason } = req.body;
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) return res.status(404).json({ error: 'Attendance record not found' });
    const studentRecord = attendance.records.find(r => r.studentId.toString() === studentId);
    if (!studentRecord) return res.status(404).json({ error: 'Student record not found' });
    // Log adjustment
    attendance.adjustments.push({
      studentId,
      previousStatus: studentRecord.status,
      newStatus,
      reason,
      adjustedBy: req.user._id,
      adjustedAt: new Date(),
    });
    studentRecord.status = newStatus;
    // Recalculate statistics
    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    attendance.records.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
    attendance.statistics = {
      ...attendance.statistics,
      ...counts,
      attendanceRate: Math.round(((counts.present + counts.late) / attendance.records.length) * 100 * 100) / 100,
    };
    await attendance.save();
    res.json({ message: 'Attendance adjusted', attendance });
  } catch (err) { next(err); }
});

module.exports = router;
