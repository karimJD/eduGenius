const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { getDashboardStats, getRecentActivity, getPendingExercises, getTodaySchedule } = require('../../controllers/student/DashboardController');

router.get('/stats', auth, getDashboardStats);
router.get('/pending-exercises', auth, getPendingExercises);
router.get('/recent', auth, getRecentActivity);
router.get('/today-schedule', auth, getTodaySchedule);

module.exports = router;
