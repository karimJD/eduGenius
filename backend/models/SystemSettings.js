const mongoose = require('mongoose');

const { Schema } = mongoose;

const SystemSettingsSchema = new Schema(
  {
    institutionName: { type: String, required: true },
    institutionNameArabic: { type: String },
    institutionLogo: { type: String },
    academicSettings: {
      currentAcademicYearId: {
        type: Schema.Types.ObjectId,
        ref: 'AcademicYear',
      },
      currentSemester: { type: Number, enum: [1, 2] },
      gradingScale: { type: Number, default: 20 },
      passingGrade: { type: Number, default: 10 },
    },
    authSettings: {
      passwordMinLength: { type: Number, default: 8 },
      sessionTimeout: { type: Number, default: 120 }, // minutes
    },
    aiSettings: {
      quizGenerationEnabled: { type: Boolean, default: true },
      summaryGenerationEnabled: { type: Boolean, default: true },
    },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

// Singleton: ensure only one document exists
SystemSettingsSchema.pre('save', async function (next) {
  const count = await mongoose.model('SystemSettings').countDocuments();
  if (count > 0 && this.isNew) {
    const error = new Error('Only one SystemSettings document is allowed');
    error.statusCode = 400;
    return next(error);
  }
  this.updatedAt = new Date();
  next();
});

/**
 * Get or create the singleton settings document
 */
SystemSettingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      institutionName: 'Université Tunisienne',
    });
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
