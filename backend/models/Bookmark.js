const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['material', 'announcement', 'quiz', 'assignment'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    note: {
      type: String, // Personal note about bookmark
    },
    tags: [
      { type: String }, // Custom tags for organization
    ],
  },
  {
    timestamps: true,
  }
);

BookmarkSchema.index({ studentId: 1 });
BookmarkSchema.index({ studentId: 1, resourceType: 1 });
BookmarkSchema.index({ studentId: 1, classId: 1 });

module.exports = mongoose.model('Bookmark', BookmarkSchema);
