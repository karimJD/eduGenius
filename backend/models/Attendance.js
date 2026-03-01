const mongoose = require('mongoose');
const { SESSION_TYPES } = require('../utils/tunisiaData');

const { Schema } = mongoose;

const AttendanceSchema = new Schema(
  {
    videoSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'VideoSession',
      required: true,
      unique: true,
    },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule' },
    sessionDate: { type: Date, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: 'Class' },
    className: { type: String },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    teacherName: { type: String },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    totalDuration: { type: Number }, // minutes
    records: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        studentName: { type: String },
        studentNumber: { type: String },
        status: {
          type: String,
          enum: ['present', 'late', 'absent', 'excused'],
          default: 'absent',
        },
        joinTime: { type: Date },
        leaveTime: { type: Date },
        duration: { type: Number },
        attendancePercentage: { type: Number },
        lateMinutes: { type: Number },
        excuseReason: { type: String },
        excuseDocument: { type: String },
        verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    statistics: {
      totalStudents: { type: Number, default: 0 },
      present: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      excused: { type: Number, default: 0 },
      attendanceRate: { type: Number },
      lateRate: { type: Number },
    },
    adjustments: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        previousStatus: { type: String },
        newStatus: { type: String },
        reason: { type: String },
        adjustedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        adjustedAt: { type: Date },
      },
    ],
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ classId: 1, sessionDate: -1 });
AttendanceSchema.index({ studentId: 1 });
AttendanceSchema.index({ videoSessionId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
