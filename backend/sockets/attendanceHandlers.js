const Attendance = require('../models/Attendance');
const { activeSessions } = require('./videoHandlers');

/**
 * Set up Socket.IO attendance handlers
 * @param {import('socket.io').Server} io
 */
const setupAttendanceHandlers = (io) => {
  io.on('connection', (socket) => {
    /**
     * Request live attendance data for a session
     * payload: { sessionId }
     */
    socket.on('request-live-attendance', async ({ sessionId }) => {
      try {
        const attendance = await Attendance.findOne({ videoSessionId: sessionId })
          .populate('records.studentId', 'firstName lastName cin');
        socket.emit('live-attendance', { sessionId, attendance });
      } catch (err) {
        console.error('request-live-attendance error:', err);
        socket.emit('error', { message: 'Failed to fetch attendance' });
      }
    });

    /**
     * Teacher manually adjusts student attendance status
     * payload: { attendanceId, studentId, newStatus, reason }
     */
    socket.on('adjust-attendance', async ({ attendanceId, studentId, newStatus, reason, adjustedBy }) => {
      try {
        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
          return socket.emit('error', { message: 'Attendance record not found' });
        }

        const record = attendance.records.find(r => r.studentId.toString() === studentId);
        if (!record) {
          return socket.emit('error', { message: 'Student record not found' });
        }

        const previousStatus = record.status;
        record.status = newStatus;

        // Log adjustment
        attendance.adjustments.push({
          studentId,
          previousStatus,
          newStatus,
          reason,
          adjustedBy,
          adjustedAt: new Date(),
        });

        // Recalculate statistics
        const counts = { present: 0, late: 0, absent: 0, excused: 0 };
        attendance.records.forEach(r => {
          if (counts[r.status] !== undefined) counts[r.status]++;
        });
        const total = attendance.records.length;
        attendance.statistics = {
          ...attendance.statistics,
          ...counts,
          attendanceRate: total > 0 ? Math.round(((counts.present + counts.late) / total) * 100 * 100) / 100 : 0,
        };

        await attendance.save();

        // Broadcast change to all in session
        io.to(`session:${attendance.videoSessionId}`).emit('attendance-changed', {
          studentId,
          previousStatus,
          newStatus,
          statistics: attendance.statistics,
        });
      } catch (err) {
        console.error('adjust-attendance error:', err);
        socket.emit('error', { message: 'Failed to adjust attendance' });
      }
    });
  });
};

module.exports = { setupAttendanceHandlers };
