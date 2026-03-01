const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, classId, content, type } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: type === 'private' ? receiverId : null,
      classId: type !== 'private' ? classId : null,
      content,
      type: type || 'private',
      // Attachments handling would go here with uploadMiddleware
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get messages
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { userId, classId } = req.query;

    let query = {};

    if (classId) {
        // Class messages or announcements
        query = { classId };
    } else if (userId) {
        // Private chat history with specific user
        query = {
            $or: [
                { senderId: req.user._id, receiverId: userId },
                { senderId: userId, receiverId: req.user._id }
            ],
            type: 'private'
        };
    } else {
        // Recent chats (simplified)
        // In a real app, aggregation to get unique conversations
        query = { 
            $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
        };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'firstName lastName profileImage')
      .populate('receiverId', 'firstName lastName profileImage')
      .sort({ createdAt: 1 }); // chronological for chat

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
