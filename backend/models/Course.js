const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['pdf', 'video', 'doc', 'pptx', 'link', 'other'],
      required: true,
    },
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, default: 0 }, // bytes
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ChapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    order: { type: Number, required: true },
    materials: [MaterialSchema],
    exercises: [MaterialSchema],
  },
  { _id: true }
);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    // Raw content (legacy - for AI processing)
    content: { type: String, default: '' },
    // AI-generated summary (legacy)
    summary: { type: String, default: '' },
    // Legacy quiz embedded in course
    quiz: [
      {
        question: String,
        options: [String],
        correctAnswerIndex: Number,
      },
    ],
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    chapters: [ChapterSchema],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Course', CourseSchema);
