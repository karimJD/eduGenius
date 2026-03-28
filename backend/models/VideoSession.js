const mongoose = require('mongoose');

const { Schema } = mongoose;

const VideoSessionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule' },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    meetingUrl: { type: String },
    meetingId: { type: String },
    recordingUrl: { type: String },
    attendanceThreshold: { type: Number, default: 70 }, // percentage
    gracePeriod: { type: Number, default: 15 },          // minutes
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        role: { type: String, enum: ['teacher', 'student'] },
        joinedAt: { type: Date },
        leftAt: { type: Date },
        duration: { type: Number }, // minutes
        connectionLogs: [
          {
            action: {
              type: String,
              enum: ['join', 'leave', 'reconnect'],
            },
            timestamp: { type: Date },
          },
        ],
      },
    ],
    attendance: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: {
          type: String,
          enum: ['present', 'late', 'absent', 'excused'],
          default: 'absent',
        },
        joinTime: { type: Date },
        leaveTime: { type: Date },
        duration: { type: Number },
        attendancePercentage: { type: Number },
        calculatedAt: { type: Date },
      },
    ],
    statistics: {
      totalParticipants: { type: Number, default: 0 },
      maxConcurrent: { type: Number, default: 0 },
      averageDuration: { type: Number },
      attendanceRate: { type: Number },
      lateCount: { type: Number },
      absentCount: { type: Number },
    },
    recording: {
      isRecorded: { type: Boolean, default: false },
      recordingFile: { type: String },
      recordingSize: { type: Number },
      recordingDuration: { type: Number },
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

VideoSessionSchema.index({ classId: 1 });
VideoSessionSchema.index({ teacherId: 1 });
VideoSessionSchema.index({ status: 1 });
VideoSessionSchema.index({ 'participants.userId': 1 });

module.exports = mongoose.model('VideoSession', VideoSessionSchema);
