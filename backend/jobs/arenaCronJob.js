/**
 * Arena Daily Quest Generator — runs at 00:01 UTC every day
 *
 * For every active ArenaChallenge, it finds all enrolled students in the
 * challenge's class and pre-generates their 3 ArenaQuest slots for that day.
 * Quests are assigned round-robin across available subjects/courses.
 *
 * This way when students open the Arena they see their quests instantly,
 * without needing to wait for on-demand generation.
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const ArenaChallenge = require('../models/ArenaChallenge');
const ArenaQuest     = require('../models/ArenaQuest');
const Class          = require('../models/Class');
const Course         = require('../models/Course');
const User           = require('../models/User');

// ─── Helpers ────────────────────────────────────────────────────────────────

const toMidnight = (d = new Date()) => {
  const day = new Date(d);
  day.setUTCHours(0, 0, 0, 0);
  return day;
};

const getWeekStart = () => {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

const getWeekEnd = () => {
  const start = getWeekStart();
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

// ─── Core generation logic ───────────────────────────────────────────────────

/**
 * Generate daily quests for all students across all active classes.
 * Idempotent — skips students who already have quests for today.
 * @returns {{ classesProcessed, studentsProcessed, questsCreated }}
 */
const generateDailyQuestsForAllClasses = async () => {
  const today = toMidnight();
  console.log(`[Arena Cron] Generating daily quests for ${today.toISOString()}`);

  // 1. Find or create active challenges for every class
  const allClasses = await Class.find({}).select('_id name').lean();

  let classesProcessed = 0;
  let studentsProcessed = 0;
  let questsCreated = 0;

  for (const cls of allClasses) {
    const classId = cls._id;

    // Get or create this week's challenge
    const weekStart = getWeekStart();
    let challenge = await ArenaChallenge.findOne({ classId, weekStart });
    if (!challenge) {
      const weekEnd = getWeekEnd();
      const df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
      challenge = await ArenaChallenge.create({
        classId,
        title: `Défi Arène — Semaine du ${df.format(weekStart)}`,
        weekStart,
        weekEnd,
      });
      // End previous challenges
      await ArenaChallenge.updateMany(
        { classId, _id: { $ne: challenge._id }, status: 'active' },
        { status: 'ended' }
      );
    }

    // 2. Get available courses for this class
    const courses = await Course.find({ classId })
      .populate('subjectId', 'name code')
      .lean();
    const validCourses = courses.filter(c => c.subjectId);

    if (validCourses.length === 0) {
      console.log(`[Arena Cron] Class ${cls.name}: no courses, skipping`);
      continue;
    }

    // 3. Get all enrolled students in this class
    const classDoc = await Class.findById(classId).lean();
    const enrolledStudents = (classDoc.students || []).filter(
      s => s.status === 'enrolled' || s.status === 'active'
    );

    // Also include students from User model with student.classId
    const usersInClass = await User.find({ 'student.classId': classId, role: 'student' })
      .select('_id').lean();

    const studentIdSet = new Set([
      ...enrolledStudents.map(s => s.studentId?.toString()),
      ...usersInClass.map(u => u._id.toString()),
    ].filter(Boolean));

    classesProcessed++;

    for (const studentIdStr of studentIdSet) {
      const studentId = new mongoose.Types.ObjectId(studentIdStr);

      // Check existing quests for today
      const existingQuests = await ArenaQuest.find({
        studentId,
        challengeId: challenge._id,
        date: today,
      }).lean();

      const existingIndexes = new Set(existingQuests.map(q => q.questIndex));
      const toCreate = [];

      for (let i = 1; i <= challenge.questsConfig.questsPerDay; i++) {
        if (existingIndexes.has(i)) continue;
        const course = validCourses[(i - 1) % validCourses.length];
        toCreate.push({
          challengeId: challenge._id,
          studentId,
          classId,
          subjectId: course.subjectId._id,
          courseId: course._id,
          subjectName: course.subjectId.name,
          date: today,
          questIndex: i,
          status: 'pending',
        });
      }

      if (toCreate.length > 0) {
        await ArenaQuest.insertMany(toCreate);
        questsCreated += toCreate.length;
      }

      studentsProcessed++;
    }

    console.log(`[Arena Cron] Class "${cls.name}": ${studentIdSet.size} students processed`);
  }

  console.log(`[Arena Cron] Done — ${classesProcessed} classes, ${studentsProcessed} students, ${questsCreated} quests created`);
  return { classesProcessed, studentsProcessed, questsCreated };
};

// ─── Cron schedule: every day at 00:01 UTC ──────────────────────────────────

const startArenaCronJob = () => {
  // '1 0 * * *' = 00:01 UTC every day
  cron.schedule('1 0 * * *', async () => {
    try {
      await generateDailyQuestsForAllClasses();
    } catch (err) {
      console.error('[Arena Cron] Error during quest generation:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[Arena Cron] Daily quest generator scheduled at 00:01 UTC');
};

module.exports = { startArenaCronJob, generateDailyQuestsForAllClasses };
