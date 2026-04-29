/**
 * Setup AI Tools Socket Handlers
 * @param {import('socket.io').Server} io
 */
const setupAIToolsHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`AI Tools: User ${socket.id} connected`);

    // Join user to their personal room for receiving AI events
    socket.on('subscribeToUserEvents', ({ userId }) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      console.log(
        `User ${userId} subscribed to events via socket ${socket.id}`,
      );
    });

    socket.on('disconnect', () => {
      console.log(`AI Tools: User ${socket.id} disconnected`);
    });
  });
};

/**
 * Emit summary generation completion to user
 * @param {import('socket.io').Server} io
 * @param {string} userId - The user ID
 * @param {object} summary - The generated summary data
 */
const emitSummaryGenerated = (io, userId, summary) => {
  io.to(`user:${userId}`).emit('summaryGenerated', {
    success: true,
    data: summary,
    message: 'Résumé généré avec succès',
  });
};

/**
 * Emit summary generation error to user
 * @param {import('socket.io').Server} io
 * @param {string} userId - The user ID
 * @param {string} error - Error message
 */
const emitSummaryError = (io, userId, error) => {
  io.to(`user:${userId}`).emit('summaryError', {
    success: false,
    message: error,
  });
};

module.exports = {
  setupAIToolsHandlers,
  emitSummaryGenerated,
  emitSummaryError,
};
