const express = require('express');
const router = express.Router();
const Schedule = require('../../models/Schedule');
const { authenticate, adminAuth } = require('../../middleware/auth');
const { generateMeetingUrl } = require('../../services/video/meetingService');

// GET /api/admin/schedules
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { targetType, targetId, academicYear, semester, isPublished } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (academicYear) filter.academicYearId = academicYear;
    if (semester) filter.semester = Number(semester);
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    const schedules = await Schedule.find(filter)
      .populate('academicYearId', 'year')
      .populate('entries.subjectId', 'name code')
      .populate('entries.teacherId', 'firstName lastName')
      .populate('entries.classId', 'name code')
      .sort({ createdAt: -1 });
    res.json(schedules);
  } catch (err) { next(err); }
});

// POST /api/admin/schedules - Create schedule with auto-generated meeting URLs
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const data = { ...req.body };
    // Auto-generate meeting URLs for entries without one
    if (Array.isArray(data.entries)) {
      data.entries = data.entries.map(entry => ({
        ...entry,
        meetingUrl: entry.meetingUrl || generateMeetingUrl(),
        meetingProvider: entry.meetingProvider || 'jitsi',
      }));
    }
    const schedule = new Schedule(data);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (err) { next(err); }
});

// GET /api/admin/schedules/:id
router.get('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('academicYearId', 'year')
      .populate('entries.subjectId', 'name code hoursDistribution')
      .populate('entries.teacherId', 'firstName lastName')
      .populate('entries.classId', 'name code');
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json(schedule);
  } catch (err) { next(err); }
});

// PUT /api/admin/schedules/:id
router.put('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json(schedule);
  } catch (err) { next(err); }
});

// POST /api/admin/schedules/:id/publish
router.post('/:id/publish', authenticate, adminAuth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule published', schedule });
  } catch (err) { next(err); }
});

// GET /api/admin/schedules/:id/conflicts - Check for conflicts
router.get('/:id/conflicts', authenticate, adminAuth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    const conflicts = [];
    // Check teacher conflicts for same day/time
    for (const entry of schedule.entries) {
      if (!entry.teacherId) continue;
      const overlapping = await Schedule.findOne({
        _id: { $ne: schedule._id },
        academicYearId: schedule.academicYearId,
        semester: schedule.semester,
        'entries.dayOfWeek': entry.dayOfWeek,
        'entries.teacherId': entry.teacherId,
        'entries.startTime': entry.startTime,
      });
      if (overlapping) {
        conflicts.push({
          type: 'teacher',
          message: `Teacher conflict on day ${entry.dayOfWeek} at ${entry.startTime}`,
          entry,
        });
      }
    }
    res.json({ hasConflicts: conflicts.length > 0, conflicts });
  } catch (err) { next(err); }
});

// DELETE /api/admin/schedules/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
