const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'true-false', 'short-answer'],
      default: 'mcq',
    },
    options: [{ type: String }], // For MCQ and true-false
    correctAnswer: { type: mongoose.Schema.Types.Mixed, required: true }, // index (MCQ), boolean (T/F), string (short)
    points: { type: Number, default: 1 },
    explanation: { type: String, default: '' },
  },
  { _id: true }
);

const QuizSettingsSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: null }, // minutes, null = no limit
    attempts: { type: Number, default: 1 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    shuffleQuestions: { type: Boolean, default: false },
    showResults: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: true },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
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
      default: null,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [QuestionSchema],
    settings: { type: QuizSettingsSchema, default: () => ({}) },
    isAIGenerated: { type: Boolean, default: false },
    generatedFrom: { type: String, default: null }, // courseId or chapterId that was used
    isPublished: { type: Boolean, default: false },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'mixed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Quiz', QuizSchema);
