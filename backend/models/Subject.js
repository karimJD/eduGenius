const mongoose = require('mongoose');

const { Schema } = mongoose;

const SubjectSchema = new Schema(
  {
    name: { type: String, required: true },
    nameArabic: { type: String },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    teachingUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingUnit',
      required: true,
    },
    semester: { type: Number },
    credits: { type: Number },
    coefficient: { type: Number },
    hoursDistribution: {
      lecture: { type: Number },   // cours magistral
      tutorial: { type: Number },  // travaux dirigés (TD)
      practical: { type: Number }, // travaux pratiques (TP)
      total: { type: Number },
    },
    evaluation: {
      examWeight: { type: Number, default: 70 },
      continuousWeight: { type: Number, default: 30 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', SubjectSchema);
