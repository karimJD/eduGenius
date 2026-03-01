const mongoose = require('mongoose');
const { PROGRAM_TYPES } = require('../utils/tunisiaData');

const { Schema } = mongoose;

const StudyProgramSchema = new Schema(
  {
    name: { type: String, required: true },
    nameArabic: { type: String },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    programType: { type: String, enum: PROGRAM_TYPES, required: true },
    duration: {
      years: { type: Number },
      semesters: { type: Number },
    },
    level: { type: String },
    domain: { type: String },
    mention: { type: String },
    speciality: { type: String },
    teachingUnits: [
      {
        unitId: { type: Schema.Types.ObjectId, ref: 'TeachingUnit' },
        semester: { type: Number },
        mandatory: { type: Boolean, default: true },
        coefficient: { type: Number },
        credits: { type: Number },
      },
    ],
    coordinatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    coordinatorName: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudyProgram', StudyProgramSchema);
