const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { getDashboardStats, getRecentActivity } = require('../../controllers/student/DashboardController');

router.get('/stats', auth, getDashboardStats);
router.get('/recent', auth, getRecentActivity);

module.exports = router;
