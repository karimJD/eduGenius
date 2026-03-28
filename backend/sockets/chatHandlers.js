const Message = require('../models/Message');

/**
 * Set up real-time chat Socket.IO handlers
 * Events:
 *   join-chat  : { roomId }  — join a private or class chat room
 *   send-message : { roomId, content, type, receiverId?, classId? } — save + broadcast
 *   typing       : { roomId, userName }
 *   stop-typing  : { roomId }
 */
const setupChatHandlers = (io) => {
  io.on('connection', (socket) => {
    // Join a chat room (private chat ID or class ID)
    socket.on('join-chat', ({ roomId }) => {
      if (!roomId) return;
      socket.join(`chat:${roomId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', ({ roomId }) => {
      socket.leave(`chat:${roomId}`);
    });

    // Send a message: persist to DB and broadcast to room
    socket.on('send-message', async ({ roomId, content, type, receiverId, classId, senderId, senderName }) => {
      try {
        const msg = await Message.create({
          senderId,
          receiverId: receiverId || undefined,
          classId: classId || undefined,
          content,
          type: type || 'text',
        });

        const payload = {
          _id: msg._id,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt,
          senderId: {
            _id: senderId,
            firstName: senderName?.split(' ')[0] || '',
            lastName: senderName?.split(' ').slice(1).join(' ') || '',
          },
        };

        // Broadcast to everyone in room (including sender for confirmation)
        io.to(`chat:${roomId}`).emit('new-message', payload);
      } catch (err) {
        console.error('send-message socket error:', err);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(`chat:${roomId}`).emit('user-typing', { userName });
    });

    socket.on('stop-typing', ({ roomId }) => {
      socket.to(`chat:${roomId}`).emit('user-stop-typing');
    });
  });
};

module.exports = { setupChatHandlers };
