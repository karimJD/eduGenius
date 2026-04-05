const express = require('express');
const router = express.Router();
const Course = require('../../models/Course');
const Class = require('../../models/Class');
const Submission = require('../../models/Submission');
const Attendance = require('../../models/Attendance');
const Schedule = require('../../models/Schedule');

// GET /api/teacher/classes
router.get('/', async (req, res, next) => {
  try {
    console.log('[GET /api/teacher/classes] Teacher ID:', req.user._id);
    
    // Get class IDs from courses where this teacher is assigned
    const teacherCourses = await Course.find({ teacherId: req.user._id, classId: { $ne: null } }).select('classId');
    const classIdsFromCourses = teacherCourses.map(c => c.classId);
    console.log('[GET /api/teacher/classes] Class IDs from courses:', classIdsFromCourses);

    const classes = await Class.find({
      $or: [
        { 'teachers.teacherId': req.user._id },
        { 'academicAdvisorId': req.user._id },
        { _id: { $in: classIdsFromCourses } }
      ]
    })
      .populate('departmentId', 'name')
      .populate('students.studentId', 'firstName lastName email')
      .sort({ name: 1 });
    
    console.log('[GET /api/teacher/classes] Classes found:', classes.length);
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/classes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const teacherCourses = await Course.find({ teacherId: req.user._id, classId: req.params.id });
    const isAssignedViaCourse = teacherCourses.length > 0;

    const cls = await Class.findOne({
      _id: req.params.id,
      $or: [
        { 'teachers.teacherId': req.user._id },
        { 'academicAdvisorId': req.user._id },
        { _id: { $in: isAssignedViaCourse ? [req.params.id] : [] } }
      ]
    })
      .populate('departmentId', 'name')
      .populate('students.studentId', 'firstName lastName email studentId')
      .populate('teachers.subjectId', 'name code');

    if (!cls) return res.status(404).json({ error: 'Class not found or access denied' });

    // Fetch all published schedules that might contain entries for this class
    const schedules = await Schedule.find({
      $or: [
        { targetType: 'class', targetId: req.params.id },
        { 'entries.classId': req.params.id }
      ],
      isPublished: true
    })
    .populate('entries.subjectId', 'name code')
    .populate('entries.teacherId', 'firstName lastName email')
    .lean();

    // Extract and aggregate all entries belonging to this class
    const allEntries = [];
    const seenEntryIds = new Set();

    schedules.forEach(s => {
      s.entries.forEach(entry => {
        // Determine if this entry belongs to the current class
        const entryClassId = entry.classId ? entry.classId.toString() : (s.targetType === 'class' ? s.targetId.toString() : null);
        
        if (entryClassId === req.params.id && !seenEntryIds.has(entry._id.toString())) {
          allEntries.push(entry);
          seenEntryIds.add(entry._id.toString());
        }
      });
    });
    
    // Map entries if schedule exists
    const clsObj = cls.toObject();
    clsObj.schedule = allEntries;

    res.json(clsObj);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/classes/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const teacherCourses = await Course.find({ teacherId: req.user._id, classId: req.params.id });
    const isAssignedViaCourse = teacherCourses.length > 0;

    const cls = await Class.findOne({
      _id: req.params.id,
      $or: [
        { 'teachers.teacherId': req.user._id },
        { 'academicAdvisorId': req.user._id },
        { _id: { $in: isAssignedViaCourse ? [req.params.id] : [] } }
      ]
    });
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
      totalStudents: cls.students?.length || 0,
      attendanceRate,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
