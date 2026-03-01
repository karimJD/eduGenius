const mongoose = require('mongoose');

const ExamQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'true-false', 'short-answer'],
      default: 'mcq',
    },
    options: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
    points: { type: Number, default: 1 },
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [ExamQuestionSchema],
    settings: {
      duration: { type: Number, default: 60 }, // minutes
      attempts: { type: Number, default: 1 },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      shuffleQuestions: { type: Boolean, default: false },
      showResults: { type: Boolean, default: true },
      showCorrectAnswers: { type: Boolean, default: false }, // Usually hidden for exams
    },
    passingScore: { type: Number, default: 50 }, // percentage
    proctoring: {
      enabled: { type: Boolean, default: false },
      webcam: { type: Boolean, default: false },
      fullscreen: { type: Boolean, default: false },
    },
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Exam', ExamSchema);
