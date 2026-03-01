const Attendance = require('../models/Attendance');

// @desc    Mark attendance (Manual)
// @route   POST /api/attendance
// @access  Private (Teacher)
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

// @desc    Auto-mark attendance when joining session
// @route   POST /api/attendance/auto
// @access  Private (Student)
exports.autoMarkAttendance = async (req, res) => {
    try {
        const { videoSessionId, classId } = req.body;
        
        const attendance = await Attendance.findOneAndUpdate(
            { 
              studentId: req.user._id, 
              videoSessionId 
            },
            { 
              classId,
              status: 'present', 
              autoDetected: true, 
              joinedAt: new Date(),
              date: new Date().setHours(0,0,0,0)
            },
            { new: true, upsert: true }
        );

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
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
