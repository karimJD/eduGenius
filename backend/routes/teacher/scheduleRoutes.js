const express = require('express');
const router = express.Router();
const { getTeacherSchedule } = require('../../controllers/teacher/ScheduleController');

// GET /api/teacher/schedule
router.get('/', getTeacherSchedule);

module.exports = router;
