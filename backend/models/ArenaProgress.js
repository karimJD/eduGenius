const mongoose = require('mongoose');

const DailyActivitySchema = new mongoose.Schema({
  date:             { type: Date, required: true },
  xpEarned:         { type: Number, default: 0 },
  questsCompleted:  { type: Number, default: 0 },
}, { _id: false });

const ArenaProgressSchema = new mongoose.Schema({
  challengeId:          { type: mongoose.Schema.Types.ObjectId, ref: 'ArenaChallenge', required: true },
  studentId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User',           required: true },
  classId:              { type: mongoose.Schema.Types.ObjectId, ref: 'Class',          required: true },
  totalXP:              { type: Number, default: 0 },
  completedQuestsCount: { type: Number, default: 0 },
  currentStreak:        { type: Number, default: 0 },
  longestStreak:        { type: Number, default: 0 },
  lastActiveDate:       { type: Date, default: null },
  milestonesReached:    [{ type: String }],
  dailyActivity:        [DailyActivitySchema],
}, { timestamps: true });

ArenaProgressSchema.index({ challengeId: 1, studentId: 1 }, { unique: true });
ArenaProgressSchema.index({ challengeId: 1, totalXP: -1 }); // leaderboard query

module.exports = mongoose.model('ArenaProgress', ArenaProgressSchema);
