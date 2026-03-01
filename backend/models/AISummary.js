const mongoose = require('mongoose');

const AISummarySchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // null = full course summary
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: { type: String, required: true },
    summaryType: {
      type: String,
      enum: ['chapter', 'full', 'cheatSheet', 'shrink'],
      default: 'full',
    },
    generatedAt: { type: Date, default: Date.now },
    customizations: {
      style: { type: String, default: 'default' },
      language: { type: String, default: 'fr' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AISummary', AISummarySchema);
