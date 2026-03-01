const mongoose = require('mongoose');

const { Schema } = mongoose;

const AcademicYearSchema = new Schema(
  {
    year: { type: String, required: true, unique: true }, // e.g. "2024-2025"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    semesters: [
      {
        number: { type: Number, enum: [1, 2] },
        name: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        examStartDate: { type: Date },
        examEndDate: { type: Date },
        makeUpExamStartDate: { type: Date },
        makeUpExamEndDate: { type: Date },
      },
    ],
    isCurrent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicYear', AcademicYearSchema);
