const Message = require('../models/Message');
const Class = require('../models/Class');
const User = require('../models/User');

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
    socket.on('send-message', async ({ roomId, content, messageType, receiverId, classId, senderId, senderName }) => {
      try {
        // 1. Create the primary message (either private or class-wide)
        const msg = await Message.create({
          senderId,
          receiverId: receiverId || null,
          classId: classId || null,
          content,
          messageType: messageType || (classId ? 'class' : 'private'),
        });

        const payload = {
          _id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
          senderId: {
            _id: senderId,
            firstName: senderName?.split(' ')[0] || '',
            lastName: senderName?.split(' ').slice(1).join(' ') || '',
          },
        };

        // Broadcast to the primary room (the one the sender is currently viewing)
        io.to(`chat:${roomId}`).emit('new-message', payload);

        // 2. BROADCAST LOGIC: If Admin sends to Class, create individual private messages for students
        if (messageType === 'class' && classId) {
          const sender = await User.findById(senderId);
          if (sender && ['admin', 'super_admin'].includes(sender.role)) {
            const classDoc = await Class.findById(classId).populate('students.studentId');
            if (classDoc && classDoc.students) {
              const broadcastPromises = classDoc.students.map(async (s) => {
                const studentId = s.studentId?._id || s.studentId;
                if (!studentId || studentId.toString() === senderId.toString()) return;

                // Create individual private message
                const privateMsg = await Message.create({
                  senderId,
                  receiverId: studentId,
                  content,
                  messageType: 'private',
                });

                const privatePayload = {
                  ...payload,
                  _id: privateMsg._id,
                  messageType: 'private',
                  receiverId: studentId,
                };

                // Emit to the private room of the student and admin
                const privateRoomId = [senderId, studentId.toString()].sort().join('-');
                io.to(`chat:${privateRoomId}`).emit('new-message', privatePayload);
              });
              await Promise.all(broadcastPromises);
            }
          }
        }
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
