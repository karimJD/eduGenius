const mongoose = require('mongoose');
const { SESSION_TYPES } = require('../utils/tunisiaData');

const { Schema } = mongoose;

const GradeSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    examSession: { type: String, enum: SESSION_TYPES, required: true },
    examDate: { type: Date },
    continuousAssessment: { type: Number, min: 0, max: 20 }, // Contrôle Continu
    practicalWork: { type: Number, min: 0, max: 20 },        // TP
    examGrade: { type: Number, min: 0, max: 20 },            // Examen
    totalGrade: { type: Number, min: 0, max: 20 },
    isAbsent: { type: Boolean, default: false },
    isPassed: { type: Boolean },
    mention: { type: String },
    validatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    validatedAt: { type: Date },
    pvNumber: { type: String }, // Procès-Verbal number
  },
  { timestamps: true }
);

// Compound unique index: one grade per student per subject per session
GradeSchema.index(
  { studentId: 1, subjectId: 1, examSession: 1 },
  { unique: true }
);

module.exports = mongoose.model('Grade', GradeSchema);
