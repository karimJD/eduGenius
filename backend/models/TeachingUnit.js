const mongoose = require('mongoose');
const { UNIT_TYPES } = require('../utils/tunisiaData');

const { Schema } = mongoose;

const TeachingUnitSchema = new Schema(
  {
    name: { type: String, required: true },
    nameArabic: { type: String },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    programIds: [{ type: Schema.Types.ObjectId, ref: 'StudyProgram' }],
    unitType: { type: String, enum: UNIT_TYPES, required: true },
    subjects: [
      {
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
        coefficient: { type: Number },
        teachingHours: { type: Number },
      },
    ],
    totalCredits: { type: Number },
    totalCoefficient: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeachingUnit', TeachingUnitSchema);
