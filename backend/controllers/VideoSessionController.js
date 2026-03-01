const VideoSession = require('../models/VideoSession');

// @desc    Create video session
// @route   POST /api/sessions
// @access  Private (Teacher)
exports.createSession = async (req, res) => {
  try {
    const { title, description, classId, scheduledAt } = req.body;

    // Generate meeting link (mock logic for now, would integrate with Daily/Agora/Jitsi)
    const meetingId = `session-${Date.now()}`;
    const meetingLink = `https://meet.edugenius.com/${meetingId}`;

    const session = await VideoSession.create({
      title,
      description,
      classId,
      teacherId: req.user._id,
      scheduledAt,
      meetingId,
      meetingLink,
      status: 'scheduled'
    });

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get sessions
// @route   GET /api/sessions
// @access  Private
exports.getSessions = async (req, res) => {
  try {
    const { classId } = req.query;
    let query = {};

    if (classId) {
        query.classId = classId;
    } else if (req.user.role === 'teacher') {
        query.teacherId = req.user._id;
    } else {
        // For student, find sessions for their classes (simplified)
        // Need to query classes student is enrolled in first
    }

    const sessions = await VideoSession.find(query)
      .populate('classId', 'name')
      .populate('teacherId', 'firstName lastName')
      .sort({ scheduledAt: 1 });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Start session
// @route   PUT /api/sessions/:id/start
// @access  Private (Teacher)
exports.startSession = async (req, res) => {
    try {
        const session = await VideoSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        
        if (session.teacherId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        session.status = 'live';
        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    End session
// @route   PUT /api/sessions/:id/end
// @access  Private (Teacher)
exports.endSession = async (req, res) => {
    try {
        const session = await VideoSession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.status = 'completed';
        await session.save();
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
