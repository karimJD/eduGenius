const mongoose = require('mongoose');

const { Schema } = mongoose;

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true },
    nameArabic: { type: String },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    headOfDepartmentId: { type: Schema.Types.ObjectId, ref: 'User' },
    headOfDepartmentName: { type: String },
    teachers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    email: { type: String },
    phone: { type: String },
    statistics: {
      totalTeachers: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      totalPrograms: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', DepartmentSchema);
