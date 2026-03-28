const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    type: {
      type: String,
      enum: ['general', 'assignment', 'exam', 'event', 'reminder'],
      default: 'general',
    },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    publishAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    readBy: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

AnnouncementSchema.index({ classId: 1, createdAt: -1 });
AnnouncementSchema.index({ teacherId: 1 });
AnnouncementSchema.index({ isPinned: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
