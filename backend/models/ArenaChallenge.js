const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  xp:     { type: Number, required: true },
  label:  { type: String, required: true },
  icon:   { type: String, default: 'shield' },
  reward: { type: String, default: '' },
}, { _id: false });

const ArenaChallengeSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title:   { type: String, required: true },
  weekStart: { type: Date, required: true },
  weekEnd:   { type: Date, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  milestones: { type: [MilestoneSchema], default: [
    { xp: 100, label: 'Apprenti',  icon: 'shield', reward: '+10 XP bonus' },
    { xp: 300, label: 'Érudit',    icon: 'book',   reward: '+25 XP bonus' },
    { xp: 600, label: 'Maître',    icon: 'crown',  reward: '+50 XP bonus' },
  ]},
  questsConfig: {
    questsPerDay:           { type: Number, default: 3 },
    questionsPerQuest:      { type: Number, default: 5 },
    xpPerCorrectAnswer:     { type: Number, default: 10 },
    xpBonusCompletion:      { type: Number, default: 20 },
    xpBonus100Percent:      { type: Number, default: 30 },
    streakBonusMultiplier:  { type: Number, default: 1.5 },
    secondsPerQuestion:     { type: Number, default: 20 },
  },
}, { timestamps: true });

ArenaChallengeSchema.index({ classId: 1, weekStart: -1 });

module.exports = mongoose.model('ArenaChallenge', ArenaChallengeSchema);
