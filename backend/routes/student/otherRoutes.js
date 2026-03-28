const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { getSchedule, getProfile, updateProfile, getAnnouncements } = require('../../controllers/student/OtherControllers');

router.get('/schedule', auth, getSchedule);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/announcements', auth, getAnnouncements);

module.exports = router;
