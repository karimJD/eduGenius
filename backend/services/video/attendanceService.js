const VideoSession = require('../../models/VideoSession');
const Attendance = require('../../models/Attendance');
const Class = require('../../models/Class');
const User = require('../../models/User');

/**
 * Calculate attendance for a video session and persist to Attendance model
 * @param {object} videoSession - Mongoose VideoSession document
 * @returns {object} Attendance document
 */
const calculateAttendance = async (videoSession) => {
  // Get class with enrolled students
  const classDoc = await Class.findById(videoSession.classId).populate(
    'students.studentId'
  );
  if (!classDoc) throw new Error('Class not found for attendance calculation');

  const enrolledStudents = classDoc.students
    .filter((s) => s.status === 'enrolled')
    .map((s) => s.studentId);

  // Calculate total session duration in minutes
  const sessionStart = videoSession.actualStart || videoSession.scheduledStart;
  const sessionEnd = videoSession.actualEnd || videoSession.scheduledEnd;
  const totalMinutes =
    Math.round((new Date(sessionEnd) - new Date(sessionStart)) / 60000) || 1;

  const requiredMinutes = Math.ceil(
    (videoSession.attendanceThreshold / 100) * totalMinutes
  );

  // Build participant map keyed by userId string
  const participantMap = {};
  for (const p of videoSession.participants || []) {
    const uid = p.userId?.toString();
    if (!uid) continue;
    if (!participantMap[uid]) {
      participantMap[uid] = {
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.duration || 0,
        connectionLogs: p.connectionLogs || [],
      };
    } else {
      // If participant has multiple entries (reconnects), sum duration
      participantMap[uid].duration += p.duration || 0;
    }
  }

  // Build attendance records for each enrolled student
  const records = [];
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;

  for (const student of enrolledStudents) {
    if (!student) continue;
    const uid = student._id.toString();
    const participation = participantMap[uid];

    if (!participation || !participation.joinedAt) {
      absentCount++;
      records.push({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentId || student.cin,
        status: 'absent',
        duration: 0,
        attendancePercentage: 0,
      });
      continue;
    }

    const attendancePercentage =
      Math.round((participation.duration / totalMinutes) * 100 * 100) / 100;

    // Determine late: joined after grace period
    const joinedAt = new Date(participation.joinedAt);
    const lateThreshold = new Date(
      new Date(sessionStart).getTime() +
        videoSession.gracePeriod * 60 * 1000
    );
    const isLate = joinedAt > lateThreshold;
    const lateMinutes = isLate
      ? Math.round((joinedAt - new Date(sessionStart)) / 60000)
      : 0;

    let status;
    if (attendancePercentage >= videoSession.attendanceThreshold) {
      status = isLate ? 'late' : 'present';
      if (isLate) lateCount++;
      else presentCount++;
    } else {
      status = 'absent';
      absentCount++;
    }

    records.push({
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentNumber: student.studentId || student.cin,
      status,
      joinTime: participation.joinedAt,
      leaveTime: participation.leftAt,
      duration: participation.duration,
      attendancePercentage,
      lateMinutes,
    });
  }

  const totalStudents = records.length;
  const attendanceRate =
    totalStudents > 0
      ? Math.round(((presentCount + lateCount) / totalStudents) * 100 * 100) /
        100
      : 0;
  const lateRate =
    totalStudents > 0
      ? Math.round((lateCount / totalStudents) * 100 * 100) / 100
      : 0;

  // Upsert Attendance record
  const attendance = await Attendance.findOneAndUpdate(
    { videoSessionId: videoSession._id },
    {
      videoSessionId: videoSession._id,
      sessionDate: sessionStart,
      subjectId: videoSession.subjectId,
      classId: videoSession.classId,
      teacherId: videoSession.teacherId,
      scheduledStart: videoSession.scheduledStart,
      scheduledEnd: videoSession.scheduledEnd,
      actualStart: videoSession.actualStart,
      actualEnd: videoSession.actualEnd,
      totalDuration: totalMinutes,
      records,
      statistics: {
        totalStudents,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        excused: 0,
        attendanceRate,
        lateRate,
      },
      generatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return attendance;
};

/**
 * Get attendance report for a class between two dates
 * @param {string} classId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {object} Report with per-student statistics
 */
const getClassAttendanceReport = async (classId, startDate, endDate) => {
  const attendances = await Attendance.find({
    classId,
    sessionDate: { $gte: startDate, $lte: endDate },
  })
    .populate('subjectId', 'name code')
    .sort({ sessionDate: 1 });

  // Group by student
  const studentStats = {};
  for (const att of attendances) {
    for (const record of att.records) {
      const sid = record.studentId.toString();
      if (!studentStats[sid]) {
        studentStats[sid] = {
          studentId: record.studentId,
          studentName: record.studentName,
          studentNumber: record.studentNumber,
          totalSessions: 0,
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
        };
      }
      studentStats[sid].totalSessions++;
      studentStats[sid][record.status]++;
    }
  }

  // Calculate rate for each student
  const studentReports = Object.values(studentStats).map((s) => ({
    ...s,
    attendanceRate:
      s.totalSessions > 0
        ? Math.round(((s.present + s.late) / s.totalSessions) * 100 * 100) / 100
        : 0,
  }));

  return {
    classId,
    period: { startDate, endDate },
    totalSessions: attendances.length,
    studentReports,
  };
};

/**
 * Get live attendance for all currently live sessions
 * @returns {Array} Array with session details and real-time attendance
 */
const getLiveAttendance = async () => {
  const liveSessions = await VideoSession.find({ status: 'live' })
    .populate('classId', 'name code')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'firstName lastName');

  return liveSessions.map((session) => {
    const participants = session.participants.filter(
      (p) => !p.leftAt && p.role === 'student'
    );
    return {
      sessionId: session._id,
      title: session.title,
      class: session.classId,
      subject: session.subjectId,
      teacher: session.teacherId,
      startedAt: session.actualStart,
      currentParticipants: participants.length,
      meetingUrl: session.meetingUrl,
    };
  });
};

module.exports = {
  calculateAttendance,
  getClassAttendanceReport,
  getLiveAttendance,
};
