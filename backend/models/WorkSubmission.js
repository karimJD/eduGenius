const mongoose = require('mongoose');

const WorkSubmissionSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
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

// Unique index to prevent multiple submissions for the same exercise by the same student
WorkSubmissionSchema.index({ exerciseId: 1, studentId: 1 }, { unique: true });
WorkSubmissionSchema.index({ classId: 1, subjectId: 1 });

module.exports = mongoose.model('WorkSubmission', WorkSubmissionSchema);
