const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { getGrades, getProgressReports, getAttendance } = require('../../controllers/student/PerformanceController');

router.get('/grades', auth, getGrades);
router.get('/progress', auth, getProgressReports);
router.get('/attendance', auth, getAttendance);

module.exports = router;
