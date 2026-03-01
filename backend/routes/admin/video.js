const express = require('express');
const router = express.Router();
const VideoSession = require('../../models/VideoSession');
const { authenticate, adminAuth, authorize } = require('../../middleware/auth');
const { createMeeting } = require('../../services/video/meetingService');
const { calculateAttendance, getLiveAttendance } = require('../../services/video/attendanceService');

// POST /api/admin/video/sessions - Create session from schedule entry
router.post('/sessions', authenticate, authorize(['super_admin', 'admin', 'teacher']), async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId, scheduledStart, scheduledEnd, title, scheduleId } = req.body;
    const meetingData = createMeeting({ title, classId, teacherId, startTime: new Date(scheduledStart), endTime: new Date(scheduledEnd) });
    const session = new VideoSession({
      title,
      classId,
      subjectId,
      teacherId,
      scheduleId,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      meetingUrl: meetingData.meetingUrl,
      meetingId: meetingData.meetingId,
      status: 'scheduled',
    });
    await session.save();
    res.status(201).json(session);
  } catch (err) { next(err); }
});

// POST /api/admin/video/sessions/:id/start - Start a session
router.post('/sessions/:id/start', authenticate, authorize(['super_admin', 'admin', 'teacher']), async (req, res, next) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(
      req.params.id,
      { status: 'live', actualStart: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session started', session });
  } catch (err) { next(err); }
});

// POST /api/admin/video/sessions/:id/end - End session and calculate attendance
router.post('/sessions/:id/end', authenticate, authorize(['super_admin', 'admin', 'teacher']), async (req, res, next) => {
  try {
    const session = await VideoSession.findByIdAndUpdate(
      req.params.id,
      { status: 'ended', actualEnd: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    // Calculate and save attendance
    const attendance = await calculateAttendance(session);
    res.json({ message: 'Session ended and attendance calculated', session, attendance });
  } catch (err) { next(err); }
});

// GET /api/admin/video/sessions/live - Get all live sessions
router.get('/sessions/live', authenticate, adminAuth, async (req, res, next) => {
  try {
    const liveSessions = await getLiveAttendance();
    res.json(liveSessions);
  } catch (err) { next(err); }
});

// GET /api/admin/video/sessions/:id/attendance - Get session attendance
router.get('/sessions/:id/attendance', authenticate, adminAuth, async (req, res, next) => {
  try {
    const Attendance = require('../../models/Attendance');
    const attendance = await Attendance.findOne({ videoSessionId: req.params.id })
      .populate('records.studentId', 'firstName lastName cin')
      .populate('teacherId', 'firstName lastName');
    if (!attendance) return res.status(404).json({ error: 'Attendance not found for this session' });
    res.json(attendance);
  } catch (err) { next(err); }
});

// GET /api/admin/video/sessions - Get all sessions
router.get('/sessions', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { classId, teacherId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;
    const total = await VideoSession.countDocuments(filter);
    const sessions = await VideoSession.find(filter)
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ scheduledStart: -1 });
    res.json({ sessions, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

module.exports = router;
