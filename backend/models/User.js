const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ACADEMIC_RANKS } = require('../utils/tunisiaData');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // --- Required Core Fields ---
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    cin: {
      type: String,
      required: true,
      unique: true,
      match: [/^[0-9]{8}$/, 'CIN must be exactly 8 digits'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: [
        'super_admin',
        'admin',
        'department_head',
        'program_coordinator',
        'teacher',
        'student',
        'staff',
      ],
      default: 'student',
    },

    // --- Optional Personal Fields ---
    firstNameArabic: { type: String },
    lastNameArabic: { type: String },
    studentId: { type: String, unique: true, sparse: true },
    employeeId: { type: String, unique: true, sparse: true },
    phoneNumber: {
      type: String,
      match: [/^\+216[0-9]{8}$/, 'Invalid Tunisian phone number format'],
    },
    parentPhoneNumber: { type: String },
    profileImage: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String },
    governorateOfBirth: { type: String },
    nationality: { type: String, default: 'Tunisian' },
    gender: { type: String, enum: ['male', 'female'] },

    address: {
      street: { type: String },
      postalCode: { type: String },
      city: { type: String },
      governorate: { type: String },
    },

    // --- Student Subdocument ---
    student: {
      fileNumber: { type: String },
      enrollmentDate: { type: Date },
      departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
      programId: { type: Schema.Types.ObjectId, ref: 'StudyProgram' },
      level: { type: String },
      classId: { type: Schema.Types.ObjectId, ref: 'Class' },
      hasScholarship: { type: Boolean },
      scholarshipType: { type: String },
      hasHousing: { type: Boolean },
      academicYear: { type: String },
    },

    // --- Teacher Subdocument ---
    teacher: {
      employeeId: { type: String },
      academicRank: { type: String, enum: ACADEMIC_RANKS },
      departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
      specializations: [{ type: String }],
      diplomas: [
        {
          type: { type: String },
          field: { type: String },
          university: { type: String },
          year: { type: Number },
          honors: { type: String },
        },
      ],
      teachingHoursPerWeek: { type: Number },
      hireDate: { type: Date },
    },

    // --- Auth tokens ---
    refreshToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// Virtual: full name
UserSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match entered password to hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ cin: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
