const express = require('express');
const router = express.Router();
const VideoSession = require('../../models/VideoSession');
const Class = require('../../models/Class');

// Helper: verify teacher owns class
async function verifyOwnership(classId, teacherId) {
  const cls = await Class.findOne({ _id: classId, teacherId });
  return cls;
}

// GET /api/teacher/attendance/report — Comprehensive attendance report & filters
router.get('/report', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { classId, subjectId } = req.query;

    // 1. Fetch available classes & subjects from teacher's courses
    const Course = require('../../models/Course');
    const courses = await Course.find({ teacherId })
      .populate('classId', 'name code')
      .populate('subjectId', 'name code');

    // 2. Fetch sessions based on filters
    let sessionQuery = { teacherId, status: { $in: ['live', 'ended'] } };
    if (classId) sessionQuery.classId = classId;
    if (subjectId) sessionQuery.subjectId = subjectId;

    const sessions = await VideoSession.find(sessionQuery)
      .populate('classId', 'name code')
      .populate('subjectId', 'name')
      .sort({ scheduledStart: -1 });

    // 3. If classId is provided, calculate student stats
    let studentStats = [];
    if (classId) {
      const cls = await Class.findById(classId).populate('students.studentId', 'firstName lastName email profileImage');
      if (cls) {
        studentStats = cls.students.map(st => {
          const student = st.studentId;
          const stats = {
            studentId: student._id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            profileImage: student.profileImage,
            present: 0,
            late: 0,
            absent: 0,
            totalSessions: sessions.length
          };

          sessions.forEach(sess => {
            const record = sess.attendance.find(a => a.studentId.toString() === student._id.toString());
            if (record) {
              if (record.status === 'present') stats.present++;
              else if (record.status === 'late') stats.late++;
              else stats.absent++;
            } else {
              stats.absent++;
            }
          });

          stats.attendanceRate = sessions.length > 0 ? Math.round(((stats.present + stats.late) / sessions.length) * 100) : 0;
          return stats;
        });
      }
    }

    res.json({
      courses,
      sessions,
      studentStats
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/attendance/:classId — list sessions with attendance for a class
router.get('/:classId', async (req, res, next) => {
  try {
    const cls = await verifyOwnership(req.params.classId, req.user._id);
    if (!cls) return res.status(403).json({ error: 'Access denied' });

    const sessions = await VideoSession.find({
      classId: req.params.classId,
      teacherId: req.user._id,
      status: { $in: ['live', 'ended'] },
    })
      .select('title scheduledStart scheduledEnd status attendance statistics')
      .sort({ scheduledStart: -1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/attendance/:classId — mark attendance for a session (or create manual session)
router.post('/:classId', async (req, res, next) => {
  try {
    const cls = await verifyOwnership(req.params.classId, req.user._id);
    if (!cls) return res.status(403).json({ error: 'Access denied' });

    const { sessionId, records } = req.body;

    let session;
    if (sessionId) {
      session = await VideoSession.findOne({
        _id: sessionId,
        classId: req.params.classId,
        teacherId: req.user._id,
      });
      if (!session) return res.status(404).json({ error: 'Session not found or access denied' });
    } else {
      // Manual attendance session (no video)
      const { title, sessionDate } = req.body;
      session = await VideoSession.create({
        title: title || `Manual Attendance — ${new Date(sessionDate || Date.now()).toLocaleDateString()}`,
        classId: req.params.classId,
        // subjectId is required by schema — use a placeholder string ref
        subjectId: req.body.subjectId || '000000000000000000000000',
        teacherId: req.user._id,
        scheduledStart: sessionDate || new Date(),
        scheduledEnd: sessionDate || new Date(),
        meetingUrl: 'manual',
        status: 'ended',
      });
    }

    // Map attendance records
    session.attendance = records.map((r) => ({
      studentId: r.studentId,
      status: r.status || 'absent',
      calculatedAt: new Date(),
    }));

    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const total = records.length;

    session.statistics = {
      ...session.statistics,
      totalParticipants: total,
      attendanceRate: total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0,
      lateCount: late,
      absentCount: absent,
    };

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher/attendance/record/:sessionId — update a single student's status
router.patch('/record/:sessionId', async (req, res, next) => {
  try {
    const session = await VideoSession.findOne({
      _id: req.params.sessionId,
      teacherId: req.user._id,
    });
    if (!session) return res.status(404).json({ error: 'Not found or access denied' });

    const { studentId, status } = req.body;
    const record = session.attendance.find((a) => a.studentId.toString() === studentId);
    if (record) {
      record.status = status;
    } else {
      session.attendance.push({ studentId, status, calculatedAt: new Date() });
    }

    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
