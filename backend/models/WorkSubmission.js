const mongoose = require('mongoose');

const WorkSubmissionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    feedback: { type: String, default: '' },
    grade: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup of student submissions for a specific exercise
WorkSubmissionSchema.index({ exerciseId: 1, studentId: 1 });

module.exports = mongoose.model('WorkSubmission', WorkSubmissionSchema);
