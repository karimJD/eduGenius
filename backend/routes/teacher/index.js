const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');

// Protect all teacher routes
router.use(authenticate);

// Role guard — teachers only
router.use((req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
});

// Mount sub-routes
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/classes', require('./classRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/quizzes', require('./quizRoutes'));
router.use('/grading', require('./gradingRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/announcements', require('./announcementRoutes'));
router.use('/schedule', require('./scheduleRoutes'));

module.exports = router;
