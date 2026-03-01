const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Attendance = require('../../models/Attendance');
const Grade = require('../../models/Grade');
const VideoSession = require('../../models/VideoSession');
const Class = require('../../models/Class');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/reports/dashboard - Dashboard overview stats
router.get('/dashboard', authenticate, adminAuth, async (req, res, next) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, liveSessions] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Class.countDocuments({ isActive: true }),
      VideoSession.countDocuments({ status: 'live' }),
    ]);
    // Today's attendance rate
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAttendances = await Attendance.find({ sessionDate: { $gte: today } });
    let todayAttendanceRate = 0;
    if (todayAttendances.length > 0) {
      const rates = todayAttendances.map(a => a.statistics.attendanceRate || 0);
      todayAttendanceRate = Math.round(rates.reduce((s, r) => s + r, 0) / rates.length * 100) / 100;
    }
    res.json({ totalStudents, totalTeachers, totalClasses, liveSessions, todayAttendanceRate });
  } catch (err) { next(err); }
});

// GET /api/admin/reports/attendance-summary - Attendance summary report
router.get('/attendance-summary', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, startDate, endDate } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (startDate || endDate) {
      filter.sessionDate = {};
      if (startDate) filter.sessionDate.$gte = new Date(startDate);
      if (endDate) filter.sessionDate.$lte = new Date(endDate);
    }
    const attendance = await Attendance.find(filter)
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .sort({ sessionDate: -1 });
    res.json({ total: attendance.length, records: attendance });
  } catch (err) { next(err); }
});

// GET /api/admin/reports/grade-summary - Grade summary by class/subject
router.get('/grade-summary', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, subjectId, examSession } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (examSession) filter.examSession = examSession;
    const grades = await Grade.find(filter)
      .populate('studentId', 'firstName lastName cin')
      .populate('subjectId', 'name code coefficient')
      .sort({ totalGrade: -1 });
    const passed = grades.filter(g => g.isPassed).length;
    const failed = grades.filter(g => !g.isPassed && !g.isAbsent).length;
    const absent = grades.filter(g => g.isAbsent).length;
    const avg = grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + (g.totalGrade || 0), 0) / grades.length * 100) / 100
      : 0;
    res.json({ total: grades.length, passed, failed, absent, average: avg, grades });
  } catch (err) { next(err); }
});

// GET /api/admin/reports/pv - Generate PV data
router.get('/pv', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, subjectId, examSession } = req.query;
    if (!classId || !subjectId || !examSession) {
      return res.status(400).json({ error: 'classId, subjectId, and examSession are required' });
    }
    const [classDoc, subjectDoc, grades] = await Promise.all([
      Class.findById(classId).populate('departmentId', 'name').populate('programId', 'name'),
      require('../../models/Subject').findById(subjectId).populate('teachingUnitId', 'name'),
      Grade.find({ classId, subjectId, examSession })
        .populate('studentId', 'firstName lastName cin studentId')
        .populate('validatedBy', 'firstName lastName')
        .sort({ 'studentId.lastName': 1 }),
    ]);
    res.json({
      header: {
        institution: 'Université Tunisienne',
        class: classDoc,
        subject: subjectDoc,
        examSession,
        generatedAt: new Date(),
      },
      grades,
      statistics: {
        total: grades.length,
        passed: grades.filter(g => g.isPassed).length,
        failed: grades.filter(g => !g.isPassed && !g.isAbsent).length,
        absent: grades.filter(g => g.isAbsent).length,
        average: grades.length > 0
          ? Math.round(grades.reduce((s, g) => s + (g.totalGrade || 0), 0) / grades.length * 100) / 100 : 0,
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
