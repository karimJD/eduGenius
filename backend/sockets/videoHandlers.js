const VideoSession = require('../models/VideoSession');

// In-memory active session tracking
const activeSessions = new Map(); // sessionId -> { participants: Map }

/**
 * Set up Socket.IO video session handlers
 * @param {import('socket.io').Server} io
 */
const setupVideoHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * Handle user joining a session
     * payload: { sessionId, userId, userName, role }
     */
    socket.on('join-session', async ({ sessionId, userId, userName, role }) => {
      try {
        socket.join(`session:${sessionId}`);
        const now = new Date();

        // Initialize session in memory
        if (!activeSessions.has(sessionId)) {
          activeSessions.set(sessionId, { participants: new Map() });
        }
        const session = activeSessions.get(sessionId);
        session.participants.set(userId, { userId, userName, role, joinedAt: now, socketId: socket.id });

        // Persist to DB
        await VideoSession.findByIdAndUpdate(sessionId, {
          $push: {
            participants: {
              userId,
              userName,
              role,
              joinedAt: now,
              connectionLogs: [{ action: 'join', timestamp: now }],
            },
          },
          $inc: { 'statistics.totalParticipants': 1 },
        });

        // Emit updated participant list to teacher
        const participants = Array.from(session.participants.values());
        io.to(`session:${sessionId}`).emit('participant-update', { participants });

        // Real-time attendance stats
        const studentCount = participants.filter(p => p.role === 'student').length;
        io.to(`session:${sessionId}`).emit('attendance-update', {
          sessionId,
          currentParticipants: studentCount,
        });

        console.log(`${userName} (${role}) joined session ${sessionId}`);
      } catch (err) {
        console.error('join-session error:', err);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    /**
     * Handle user leaving a session
     * payload: { sessionId, userId }
     */
    socket.on('leave-session', async ({ sessionId, userId }) => {
      try {
        const now = new Date();
        socket.leave(`session:${sessionId}`);

        const session = activeSessions.get(sessionId);
        if (session) {
          const participant = session.participants.get(userId);
          if (participant) {
            const duration = Math.round((now - participant.joinedAt) / 60000);
            session.participants.delete(userId);

            // Persist leave time to DB
            await VideoSession.findOneAndUpdate(
              { _id: sessionId, 'participants.userId': userId },
              {
                $set: { 'participants.$.leftAt': now, 'participants.$.duration': duration },
                $push: { 'participants.$.connectionLogs': { action: 'leave', timestamp: now } },
              }
            );
          }
        }

        const participants = session ? Array.from(session.participants.values()) : [];
        io.to(`session:${sessionId}`).emit('participant-update', { participants });
      } catch (err) {
        console.error('leave-session error:', err);
      }
    });

    /**
     * Handle reconnection
     * payload: { sessionId, userId, userName, role }
     */
    socket.on('reconnect-session', async ({ sessionId, userId, userName, role }) => {
      try {
        const now = new Date();
        socket.join(`session:${sessionId}`);
        const session = activeSessions.get(sessionId);
        if (session) {
          session.participants.set(userId, { userId, userName, role, joinedAt: now, socketId: socket.id });
        }
        await VideoSession.findOneAndUpdate(
          { _id: sessionId, 'participants.userId': userId },
          { $push: { 'participants.$.connectionLogs': { action: 'reconnect', timestamp: now } } }
        );
        const participants = session ? Array.from(session.participants.values()) : [];
        io.to(`session:${sessionId}`).emit('participant-update', { participants });
      } catch (err) {
        console.error('reconnect-session error:', err);
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupVideoHandlers, activeSessions };
