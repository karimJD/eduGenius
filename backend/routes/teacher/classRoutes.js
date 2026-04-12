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
    const teacherId = req.user._id;
    console.log('[GET /api/teacher/classes] Teacher ID:', teacherId);
    
    // 1. Find all classes where this teacher is mentioned in their 'teachers' array
    const classesFromClassRecords = await Class.find({
      $or: [
        { 'teachers.teacherId': teacherId },
        { 'academicAdvisorId': teacherId }
      ]
    })
      .populate('departmentId', 'name')
      .populate('teachers.subjectId', 'name code')
      .lean();

    // 2. Find all Schedule entries involving this teacher
    const schedules = await Schedule.find({
      'entries.teacherId': teacherId,
      isPublished: true
    })
      .populate('entries.subjectId', 'name code')
      .lean();

    // 3. Extract (classId, subjectId) pairs from schedules
    const scheduleAssignments = new Map(); // Map<classId, Set<subjectIdString>>

    schedules.forEach(s => {
      s.entries.forEach(entry => {
        if (entry.teacherId?.toString() === teacherId.toString() && entry.subjectId) {
          const cid = entry.classId ? entry.classId.toString() : (s.targetType === 'class' ? s.targetId.toString() : null);
          if (cid) {
            if (!scheduleAssignments.has(cid)) scheduleAssignments.set(cid, new Map());
            const subjectsInClass = scheduleAssignments.get(cid);
            subjectsInClass.set(entry.subjectId._id.toString(), entry.subjectId);
          }
        }
      });
    });

    // 4. Combine assignments
    const finalClassesMap = new Map();

    // Add classes from Class records first
    classesFromClassRecords.forEach(cls => {
      const cid = cls._id.toString();
      const myClassSubjects = cls.teachers
        .filter(t => t.teacherId.toString() === teacherId.toString())
        .map(t => t.subjectId);
      
      const subjectMap = new Map();
      myClassSubjects.forEach(s => { if (s) subjectMap.set(s._id.toString(), s); });

      finalClassesMap.set(cid, {
        ...cls,
        isAdvisor: cls.academicAdvisorId?.toString() === teacherId.toString(),
        subjectMap
      });
    });

    // Augment with schedule assignments
    for (const [cid, subjectsFromSchedule] of scheduleAssignments.entries()) {
      if (finalClassesMap.has(cid)) {
        const classData = finalClassesMap.get(cid);
        subjectsFromSchedule.forEach((sub, sid) => {
          classData.subjectMap.set(sid, sub);
        });
      } else {
        // Teacher not in Class record but has schedule entries? Fetch the class and add it.
        const cls = await Class.findById(cid).populate('departmentId', 'name').lean();
        if (cls) {
          finalClassesMap.set(cid, {
            ...cls,
            isAdvisor: cls.academicAdvisorId?.toString() === teacherId.toString(),
            subjectMap: subjectsFromSchedule
          });
        }
      }
    }

    // 5. Format results
    const formattedClasses = Array.from(finalClassesMap.values()).map(cls => {
      const { subjectMap, ...rest } = cls;
      return {
        ...rest,
        assignedSubjects: Array.from(subjectMap.values()).map(s => ({ subjectId: s }))
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    res.json(formattedClasses);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/classes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const classId = req.params.id;

    // Check if assigned via courses OR schedules
    const teacherCourses = await Course.find({ teacherId, classId });
    const hasSchedules = await Schedule.exists({
      $or: [
        { targetType: 'class', targetId: classId },
        { 'entries.classId': classId }
      ],
      'entries.teacherId': teacherId,
      isPublished: true
    });

    const isAssigned = teacherCourses.length > 0 || hasSchedules;

    const cls = await Class.findOne({
      _id: classId,
      $or: [
        { 'teachers.teacherId': teacherId },
        { 'academicAdvisorId': teacherId },
        ...(isAssigned ? [{ _id: classId }] : [])
      ]
    })
      .populate('departmentId', 'name')
      .populate('students.studentId', 'firstName lastName email studentId')
      .populate('teachers.subjectId', 'name code');

    if (!cls) return res.status(404).json({ error: 'Class not found or access denied' });

    // Aggregate assigned subjects (from Class and Schedules)
    const schedulesForSubjects = await Schedule.find({
      $or: [
        { targetType: 'class', targetId: classId },
        { 'entries.classId': classId }
      ],
      'entries.teacherId': teacherId,
      isPublished: true
    }).populate('entries.subjectId', 'name code').lean();

    const subjectMap = new Map();
    // From Class record
    cls.teachers
      .filter(t => t.teacherId.toString() === teacherId.toString())
      .forEach(t => { if (t.subjectId) subjectMap.set(t.subjectId._id.toString(), t.subjectId); });
    
    // From Schedules
    schedulesForSubjects.forEach(s => {
      s.entries.forEach(entry => {
        if (entry.teacherId?.toString() === teacherId.toString() && entry.subjectId) {
          subjectMap.set(entry.subjectId._id.toString(), entry.subjectId);
        }
      });
    });

    // Populate schedule entries for UI
    const allEntries = [];
    const seenEntryIds = new Set();
    schedulesForSubjects.forEach(s => {
      s.entries.forEach(entry => {
        const entryClassId = entry.classId ? entry.classId.toString() : (s.targetType === 'class' ? s.targetId.toString() : null);
        if (entryClassId === classId && !seenEntryIds.has(entry._id.toString())) {
          allEntries.push(entry);
          seenEntryIds.add(entry._id.toString());
        }
      });
    });
    
    const clsObj = cls.toObject();
    clsObj.schedule = allEntries;
    clsObj.assignedSubjects = Array.from(subjectMap.values()).map(s => ({ subjectId: s }));
    clsObj.isAdvisor = cls.academicAdvisorId?.toString() === teacherId.toString();

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
