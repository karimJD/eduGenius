const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const dotenv = require('dotenv');

// Existing routes
const courseRoutes = require('./routes/courseRoutes');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const userRoutes = require('./routes/userRoutes');
const quizRoutes = require('./routes/quizRoutes');
const examRoutes = require('./routes/examRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const aiSummaryRoutes = require('./routes/aiSummaryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const videoSessionRoutes = require('./routes/videoSessionRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiQuizRoutes = require('./routes/aiQuizRoutes');

// New admin routes
const adminRoutes = require('./routes/admin/index');

// New teacher routes
const teacherRoutes = require('./routes/teacher/index');
// Student routes
const studentRoutes = require('./routes/student/index');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');

// Socket.IO
const { initializeSocketIO } = require('./sockets/index');

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai', aiSummaryRoutes);
app.use('/api/ai/quiz', aiQuizRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sessions', videoSessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Teacher routes
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Error handler
app.use(errorHandler);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Initialize Socket.IO
initializeSocketIO(httpServer);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
