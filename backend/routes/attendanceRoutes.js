const express = require('express');
const router = express.Router();
const { 
    markAttendance, 
    getAttendance, 
    getAttendanceSessions,
    getSessionAttendanceDetail
} = require('../controllers/AttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Main attendance records
router.route('/')
    .get(getAttendance)
    .post(authorize('teacher', 'admin'), markAttendance);

// New Sequence Diagram Routes for Attendance Dashboard
router.get('/sessions', authorize('teacher', 'admin'), getAttendanceSessions);
router.get('/sessions/:id/details', authorize('teacher', 'admin'), getSessionAttendanceDetail);

module.exports = router;
