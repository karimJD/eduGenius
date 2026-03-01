const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
});

const SelfQuizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    questions: [QuestionSchema],
    score: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    quizType: {
      type: String,
      enum: ['quick', 'deep', 'exam'],
      default: 'quick',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SelfQuiz', SelfQuizSchema);
