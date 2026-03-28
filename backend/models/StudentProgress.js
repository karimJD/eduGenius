const mongoose = require('mongoose');

const StudentProgressSchema = new mongoose.Schema(
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
    chaptersProgress: [
      {
        chapterId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        status: {
          type: String,
          enum: ['not-started', 'in-progress', 'completed'],
          default: 'not-started',
        },
        startedAt: { type: Date },
        completedAt: { type: Date },
        timeSpent: { type: Number, default: 0 }, // Total minutes spent
        materials: [
          {
            materialId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            viewed: { type: Boolean, default: false },
            viewedAt: { type: Date },
            timeSpent: { type: Number, default: 0 }, // Minutes spent on this material
            downloadedAt: { type: Date },
          },
        ],
      },
    ],
    overallProgress: {
      type: Number,
      default: 0, // Percentage (0-100)
    },
    totalTimeSpent: {
      type: Number,
      default: 0, // Total minutes
    },
    lastAccessedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

StudentProgressSchema.index({ studentId: 1, classId: 1 }, { unique: true });
StudentProgressSchema.index({ studentId: 1 });
StudentProgressSchema.index({ classId: 1 });

module.exports = mongoose.model('StudentProgress', StudentProgressSchema);
