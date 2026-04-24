const Message = require('../models/Message');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, classId, content, messageType } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: messageType === 'private' ? receiverId : null,
      classId: messageType !== 'private' ? classId : null,
      content,
      messageType: messageType || 'private',
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
            messageType: 'private'
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

// @desc    Get active conversations
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          messageType: 'private',
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", currentUserId] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$content" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", currentUserId] },
                    { $eq: ["$isRead", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          role: "$user.role"
        }
      },
      { $sort: { lastMessageTime: -1 } }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// @desc    Mark messages as read
// @route   PATCH /api/messages/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    await Message.updateMany(
      { senderId, receiverId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};
