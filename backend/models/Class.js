const mongoose = require('mongoose');

const { Schema } = mongoose;

const ClassSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    programId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyProgram',
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    level: { type: String, required: true },
    groupNumber: { type: Number },
    teachers: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
        teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      }
    ],
    students: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        enrollmentDate: { type: Date },
        status: {
          type: String,
          enum: ['enrolled', 'suspended', 'withdrawn'],
          default: 'enrolled',
        },
      },
    ],
    capacity: { type: Number },
    currentEnrollment: { type: Number, default: 0 },
    academicAdvisorId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassSchema.index({ departmentId: 1, programId: 1 });

module.exports = mongoose.model('Class', ClassSchema);
