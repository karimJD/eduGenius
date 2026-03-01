const express = require('express');
const router = express.Router();
const { sendMessage, getMessages } = require('../controllers/MessageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getMessages).post(sendMessage);

module.exports = router;
