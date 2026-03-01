const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    answer: { type: mongoose.Schema.Types.Mixed }, // index, boolean, or string
    isCorrect: { type: Boolean, default: null }, // null = not graded yet (short-answer)
    pointsEarned: { type: Number, default: 0 },
    feedback: { type: String, default: '' }, // Teacher feedback for short-answer
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    // Reference to either quiz or exam (one will be set)
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      default: null,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [AnswerSchema],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    attemptNumber: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    timeSpent: { type: Number, default: 0 }, // seconds
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'graded'],
      default: 'in-progress',
    },
    // AI-generated explanation of mistakes
    mistakeExplanation: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Validate that either quizId or examId is set
SubmissionSchema.pre('save', function (next) {
  if (!this.quizId && !this.examId) {
    return next(new Error('Submission must reference either a quiz or an exam'));
  }
  next();
});

module.exports = mongoose.model('Submission', SubmissionSchema);
