const mongoose = require('mongoose');

const ArenaQuestSchema = new mongoose.Schema({
  challengeId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ArenaChallenge', required: true },
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',           required: true },
  classId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Class',          required: true },
  subjectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  courseId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  subjectName:    { type: String, default: '' },
  quizAttemptId:  { type: mongoose.Schema.Types.ObjectId, ref: 'StudentQuizAttempt', default: null },
  date:           { type: Date, required: true }, // normalized to midnight UTC
  questIndex:     { type: Number, required: true }, // 1, 2 or 3
  status:         { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  xpEarned:       { type: Number, default: 0 },
  score:          { type: Number, default: 0 },       // correct answers
  totalQuestions: { type: Number, default: 0 },
  timeTaken:      { type: Number, default: 0 },       // seconds
}, { timestamps: true });

ArenaQuestSchema.index({ studentId: 1, challengeId: 1, date: 1 });
ArenaQuestSchema.index({ challengeId: 1, date: 1 });

module.exports = mongoose.model('ArenaQuest', ArenaQuestSchema);
