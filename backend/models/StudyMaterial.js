const mongoose = require('mongoose');

const StudyMaterialSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['summary', 'flashcard', 'notes'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String }, // For summaries and notes
    flashcards: [
      {
        front: { type: String }, // Question
        back: { type: String }, // Answer
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
        lastReviewed: { type: Date },
        reviewCount: { type: Number, default: 0 },
        masteryLevel: { type: Number, default: 0 }, // 0-5
      },
    ],
    isAIGenerated: { type: Boolean, default: false },
    aiGenerationParams: {
      sourceChapterId: { type: mongoose.Schema.Types.ObjectId },
      summaryLength: { type: String, enum: ['short', 'medium', 'long'] },
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'] },
      topics: [{ type: String }],
      generatedAt: { type: Date },
    },
    isBookmarked: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

StudyMaterialSchema.index({ studentId: 1 });
StudyMaterialSchema.index({ classId: 1 });
StudyMaterialSchema.index({ type: 1 });
StudyMaterialSchema.index({ isBookmarked: 1 });

module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema);
