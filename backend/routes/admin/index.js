const express = require('express');
const router = express.Router();

// Mount all admin sub-routes
router.use('/users', require('./users'));
router.use('/students', require('./students'));
router.use('/teachers', require('./teachers'));
router.use('/departments', require('./departments'));
router.use('/programs', require('./programs'));
router.use('/classes', require('./classes'));
router.use('/schedules', require('./schedules'));
router.use('/video', require('./video'));
router.use('/attendance', require('./attendance'));
router.use('/grades', require('./grades'));
router.use('/reports', require('./reports'));
router.use('/settings', require('./settings'));

module.exports = router;
