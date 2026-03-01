const mongoose = require('mongoose');

const { Schema } = mongoose;

const ScheduleSchema = new Schema(
  {
    title: { type: String, required: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    semester: { type: Number, enum: [1, 2], required: true },
    targetType: {
      type: String,
      enum: ['class', 'teacher', 'room'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    entries: [
      {
        dayOfWeek: { type: Number, enum: [0, 1, 2, 3, 4] }, // 0=Sun...4=Thu
        startTime: { type: String },
        endTime: { type: String },
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
        teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
        classId: { type: Schema.Types.ObjectId, ref: 'Class' },
        room: { type: String },
        sessionType: {
          type: String,
          enum: ['lecture', 'tutorial', 'practical'],
        },
        meetingUrl: { type: String },
        meetingProvider: {
          type: String,
          enum: ['jitsi', 'zoom', 'custom'],
          default: 'jitsi',
        },
        notes: { type: String },
      },
    ],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', ScheduleSchema);
