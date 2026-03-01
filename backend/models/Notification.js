const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'quiz_assigned',
        'exam_assigned',
        'quiz_deadline',
        'exam_deadline',
        'new_message',
        'video_session_starting',
        'grade_published',
        'material_uploaded',
        'announcement',
        'class_joined',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    link: { type: String, default: null }, // Frontend route to navigate to
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Extra data (quizId, classId, etc.)
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
