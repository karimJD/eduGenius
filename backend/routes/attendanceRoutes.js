const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, autoMarkAttendance } = require('../controllers/AttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
    .get(getAttendance)
    .post(authorize('teacher', 'admin'), markAttendance);

router.post('/auto', autoMarkAttendance);

module.exports = router;
