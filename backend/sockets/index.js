const { Server } = require('socket.io');
const { setupVideoHandlers } = require('./videoHandlers');
const { setupAttendanceHandlers } = require('./attendanceHandlers');

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initializeSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Attach handlers (note: both attach to 'connection' event independently)
  setupVideoHandlers(io);
  setupAttendanceHandlers(io);

  console.log('Socket.IO initialized');
  return io;
};

module.exports = { initializeSocketIO };
