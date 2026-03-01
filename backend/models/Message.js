const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true }, // MIME type
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for class/announcement messages
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null, // null for private messages
    },
    content: { type: String, default: '' },
    attachments: [AttachmentSchema],
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    messageType: {
      type: String,
      enum: ['private', 'class', 'announcement'],
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat history queries
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ classId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
