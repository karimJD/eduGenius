const Attendance = require('../models/Attendance');
const VideoSession = require('../models/VideoSession');

// @desc    Get archived sessions for attendance tracking
// @route   GET /api/attendance/sessions
// @access  Private (Teacher/Admin)
exports.getAttendanceSessions = async (req, res) => {
    try {
        let query = { status: 'ended' };
        
        if (req.user.role === 'teacher') {
            query.teacherId = req.user._id;
        }

        const sessions = await VideoSession.find(query)
            .populate('classId', 'name code')
            .sort({ actualEnd: -1, scheduledStart: -1 });

        // Basic summary stats mapping
        const formattedSessions = sessions.map(session => ({
            _id: session._id,
            title: session.title,
            className: session.classId?.name,
            classCode: session.classId?.code,
            date: session.actualStart || session.scheduledStart,
            duration: session.actualStart && session.actualEnd 
                ? Math.round((new Date(session.actualEnd) - new Date(session.actualStart)) / 60000) 
                : 0,
            participantsCount: session.participants?.filter(p => p.role === 'student').length || 0,
        }));

        res.json(formattedSessions);
    } catch (error) {
        console.error('getAttendanceSessions error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper: Daily.co API call
async function dailyRequest(path, method = 'GET', body = null) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const DAILY_API_BASE = 'https://api.daily.co/v1';

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${DAILY_API_BASE}${path}`, opts);
  if (!res.ok) {
      console.error('Daily API Error', await res.text());
      return { data: [] }; // Return empty data on error so we don't crash
  }
  return res.json();
}

// @desc    Get detailed attendance calculated for a specific session
// @route   GET /api/attendance/sessions/:id/details
// @access  Private (Teacher/Admin)
exports.getSessionAttendanceDetail = async (req, res) => {
    try {
        const sessionId = req.params.id;
        const session = await VideoSession.findById(sessionId).populate('classId');
        
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const Class = require('../models/Class');
        const classInfo = await Class.findById(session.classId._id).populate('students', 'firstName lastName email');
        
        if (!classInfo) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Fetch logs directly from Daily.co API
        const dailyMeetings = await dailyRequest(`/meetings?room=${session.meetingId}`);
        const meetings = dailyMeetings.data || [];
        
        // Aggregate all participants from all meeting chunks in this room
        const allParticipants = [];
        meetings.forEach(m => {
           if (m.participants) {
               allParticipants.push(...m.participants);
           }
        });

        const sessionStart = new Date(session.actualStart || session.scheduledStart);
        const sessionEnd = new Date(session.actualEnd || new Date());
        const sessionDurationMinutes = Math.max(1, Math.round((sessionEnd - sessionStart) / 60000));

        const details = classInfo.students.map(student => {
            // Find all daily sessions for this student
            // We configured user_id to match MongoDB _id when generating the token
            const studentSessions = allParticipants.filter(p => p.user_id === student._id.toString());

            let status = 'absent';
            let joinTime = null;
            let totalTimeSpent = 0; // minutes

            if (studentSessions.length > 0) {
                // Find first join time (Daily returns timestamps in seconds)
                studentSessions.sort((a, b) => a.join_time - b.join_time);
                joinTime = new Date(studentSessions[0].join_time * 1000);
                
                // Sum all durations across reconnects
                const durationSeconds = studentSessions.reduce((acc, curr) => acc + curr.duration, 0);
                totalTimeSpent = Math.round(durationSeconds / 60);

                // Algorithme de calcul du statut
                const attendancePercentage = totalTimeSpent / sessionDurationMinutes;
                const minutesLate = Math.round((joinTime - sessionStart) / 60000);

                if (attendancePercentage > 0.70) {
                    status = 'present';
                } else if (minutesLate > 10) {
                    status = 'late';
                } else if (totalTimeSpent > 5) {
                    status = 'late';
                }
            }

            return {
                studentId: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                status,
                joinTime,
                totalTimeSpent,
                attendancePercentage: Math.min(100, Math.round((totalTimeSpent / sessionDurationMinutes) * 100))
            };
        });

        res.json({
            session: {
                _id: session._id,
                title: session.title,
                date: sessionStart,
                duration: sessionDurationMinutes
            },
            attendance: details
        });

    } catch (error) {
        console.error('getSessionAttendanceDetail error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Existing manual mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { studentId, classId, videoSessionId, date, status, notes } = req.body;
        const attendance = await Attendance.findOneAndUpdate(
            { studentId, videoSessionId: videoSessionId || null, date: new Date(date).setHours(0,0,0,0) },
            { status, notes, classId, autoDetected: false },
            { new: true, upsert: true }
        );
        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Existing get attendance
exports.getAttendance = async (req, res) => {
    try {
        const { classId, studentId, date } = req.query;
        let query = {};
        if (classId) query.classId = classId;
        if (studentId) query.studentId = studentId;
        if (date) query.date = new Date(date).setHours(0,0,0,0);

        const records = await Attendance.find(query)
            .populate('studentId', 'firstName lastName email')
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
