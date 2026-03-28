const express = require('express');
const router = express.Router();

const dashboardRoutes = require('./dashboardRoutes');
const classRoutes = require('./classRoutes');
const courseRoutes = require('./courseRoutes');
const aiToolsRoutes = require('./aiToolsRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const performanceRoutes = require('./performanceRoutes');
const otherRoutes = require('./otherRoutes');

router.use('/dashboard', dashboardRoutes);
router.use('/classes', classRoutes);
router.use('/courses', courseRoutes);
router.use('/ai', aiToolsRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/performance', performanceRoutes);
router.use('/other', otherRoutes); // Covers profile, schedule, announcements

module.exports = router;
