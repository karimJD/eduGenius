const VideoSession = require('../models/VideoSession');

// Helper: Daily.co API call
async function dailyRequest(path, method = 'GET', body = null) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  const DAILY_API_BASE = 'https://api.daily.co/v1';

  if (!DAILY_API_KEY) {
    console.error('DAILY_API_KEY is missing from environment variables');
    throw new Error('Configuration error: Daily API key not found');
  }

  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  
  try {
    const res = await fetch(`${DAILY_API_BASE}${path}`, opts);
    if (!res.ok) {
      const err = await res.text();
      console.error(`Daily.co API error ${res.status}: ${err}`);
      throw new Error(`Daily.co API error ${res.status}: ${err}`);
    }
    return res.json();
  } catch (error) {
    console.error('Fetch error in dailyRequest:', error);
    throw error;
  }
}

// @desc    Create a video session (creates Daily.co room)
// @route   POST /api/sessions
// @access  Teacher / Admin
exports.createSession = async (req, res) => {
  try {
    const { title, description, classId, scheduledStart } = req.body;

    if (!classId) {
      console.error('Validation error: classId is missing from request body');
      return res.status(400).json({ message: 'L’identifiant de la classe (classId) est requis.' });
    }

    // Create Daily.co room
    const roomName = `edu-${Date.now()}`;
    const dailyRoom = await dailyRequest('/rooms', 'POST', {
      name: roomName,
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8h expiry
      },
    });

    console.log('Daily.co room created:', dailyRoom.name, dailyRoom.url);

    const sessionData = {
      title,
      description,
      classId,
      teacherId: req.user._id,
      scheduledStart: scheduledStart || new Date(),
      meetingUrl: dailyRoom.url,
      meetingId: dailyRoom.name,
      status: 'scheduled',
    };
    
    console.log('Creating VideoSession in DB:', sessionData);

    const session = await VideoSession.create(sessionData);

    res.status(201).json(session);
  } catch (error) {
    console.error('CRITICAL createSession error:', error);
    res.status(500).json({ 
        message: error.message || 'Server Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
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
    }
    // student case handled by student-specific route

    const sessions = await VideoSession.find(query)
      .populate('classId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .sort({ scheduledStart: 1 });

    res.json(sessions);
  } catch (error) {
    console.error('getSessions error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a Daily.co meeting token for the current user
// @route   POST /api/sessions/:id/token
// @access  Private
exports.getMeetingToken = async (req, res) => {
  try {
    const session = await VideoSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const isTeacher = session.teacherId.toString() === req.user._id.toString()
      || req.user.role === 'admin';

    const tokenData = await dailyRequest('/meeting-tokens', 'POST', {
      properties: {
        room_name: session.meetingId,
        is_owner: isTeacher,
        user_name: `${req.user.firstName} ${req.user.lastName}`,
        user_id: req.user._id.toString(),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4h
        enable_screenshare: isTeacher,
        start_video_off: false,
        start_audio_off: false,
      },
    });

    res.json({
      token: tokenData.token,
      roomUrl: session.meetingUrl,
      roomName: session.meetingId,
      isOwner: isTeacher,
      session: {
        _id: session._id,
        title: session.title,
        status: session.status,
        classId: session.classId,
      },
    });
  } catch (error) {
    console.error('getMeetingToken error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Start session (status -> live)
// @route   PUT /api/sessions/:id/start
// @access  Teacher / Admin
exports.startSession = async (req, res) => {
  try {
    const session = await VideoSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = 'live';
    session.actualStart = new Date();
    await session.save();
    res.json(session);
  } catch (error) {
    console.error('startSession error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    End session (status -> ended), optionally delete Daily.co room
// @route   PUT /api/sessions/:id/end
// @access  Teacher / Admin
exports.endSession = async (req, res) => {
  try {
    const session = await VideoSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.status = 'ended';
    session.actualEnd = new Date();
    await session.save();

    // Optionally delete the Daily.co room to free up resources
    try {
      await dailyRequest(`/rooms/${session.meetingId}`, 'DELETE');
    } catch (e) {
      console.warn('Could not delete Daily.co room (may already be deleted):', e.message);
    }

    res.json(session);
  } catch (error) {
    console.error('endSession error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
