const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getMessages, 
  getConversations, 
  markAsRead 
} = require('../controllers/MessageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/conversations', getConversations);
router.patch('/read', markAsRead);
router.route('/').get(getMessages).post(sendMessage);

module.exports = router;
