const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(20);
    
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Mark notification read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) return res.status(404).json({ message: 'Not found' });
        
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        notification.isRead = true;
        notification.readAt = Date.now();
        await notification.save();

        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
