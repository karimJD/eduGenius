const mongoose = require('mongoose');

const StudentQuizAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    quizTitle: { type: String, required: true },
    isPracticeQuiz: { type: Boolean, default: true }, // True for AI-generated practice
    questions: [
      {
        question: { type: String },
        type: { type: String, enum: ['mcq', 'true-false', 'short-answer'] },
        options: [{ type: String }],
        studentAnswer: { type: String },
        correctAnswer: { type: String },
        isCorrect: { type: Boolean },
        explanation: { type: String }, // Shown after answering
        points: { type: Number, default: 1 },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    
    startedAt: { type: Date },
    completedAt: { type: Date },
    timeSpent: { type: Number, default: 0 }, // Seconds
    
    aiGenerationParams: {
      numberOfQuestions: { type: Number },
      difficulty: { type: String },
      topics: [{ type: String }],
      generatedAt: { type: Date },
    },
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

StudentQuizAttemptSchema.index({ studentId: 1 });
StudentQuizAttemptSchema.index({ classId: 1 });
StudentQuizAttemptSchema.index({ isPracticeQuiz: 1 });
StudentQuizAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StudentQuizAttempt', StudentQuizAttemptSchema);
