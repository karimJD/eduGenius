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
        'assignment',
        'quiz',
        'grade',
        'message',
        'deadline'
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    link: { type: String, default: null }, // Frontend route to navigate to
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Extra data (quizId, classId, etc.)
    actionUrl: { type: String }, // Link to related resource
    actionText: { type: String }, // e.g., "View Assignment"
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    relatedType: { type: String }, // quiz, assignment, announcement, etc.
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    expiresAt: { type: Date }, // Auto-delete after this date
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Notification', NotificationSchema);
