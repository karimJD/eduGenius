const express = require('express');
const router = express.Router();
const { getNotifications, markRead } = require('../controllers/NotificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markRead);

module.exports = router;
