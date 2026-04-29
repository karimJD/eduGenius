const mongoose = require('mongoose');
const ArenaChallenge = require('../models/ArenaChallenge');
const ArenaQuest = require('../models/ArenaQuest');
const Class = require('../models/Class');
const Course = require('../models/Course');
const User = require('../models/User');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const now = new Date();
  const toMidnight = (d) => {
    const day = new Date(d);
    day.setUTCHours(0, 0, 0, 0);
    return day;
  };
  const today = toMidnight(now);
  console.log('Normalized Today (UTC):', today.toISOString());

  const challengeCount = await ArenaChallenge.countDocuments();
  console.log('Total ArenaChallenges:', challengeCount);

  const activeChallenges = await ArenaChallenge.find({ status: 'active' });
  console.log('Active Challenges:', activeChallenges.length);
  activeChallenges.forEach(c => {
    console.log(`- Challenge: ${c.title}, WeekStart: ${c.weekStart.toISOString()}, ClassId: ${c.classId}`);
  });

  const questsToday = await ArenaQuest.find({ date: today }).populate('studentId', 'firstName lastName').populate('courseId', 'title isPublished');
  console.log('Quests for Today:');
  questsToday.forEach(q => {
    console.log(`- Quest ${q.questIndex} for ${q.studentId?.firstName} ${q.studentId?.lastName}: Subject: ${q.subjectName}, CourseId: ${q.courseId?._id}, CoursePublished: ${q.courseId?.isPublished}`);
  });

  const studentsWithClass = await User.countDocuments({ role: 'student', 'student.classId': { $exists: true } });
  console.log('Students with Class assigned:', studentsWithClass);

  const demoStudent = await User.findOne({ firstName: 'Demo', lastName: 'Student' });
  if (demoStudent) {
    console.log('Demo Student Data:');
    console.log(`- ID: ${demoStudent._id}`);
    console.log(`- Role: ${demoStudent.role}`);
    console.log(`- ClassId in Profile: ${demoStudent.student?.classId}`);
  } else {
    console.log('Demo Student not found by name.');
  }

  const allClasses = await Class.find({});
  console.log('Classes in DB:');
  for (const c of allClasses) {
    console.log(`- Class: ${c.name}, ID: ${c._id}, Students Count: ${c.students?.length || 0}`);
    if (c.students) {
      c.students.forEach(s => {
        console.log(`  - StudentId: ${s.studentId}, Status: ${s.status}`);
      });
    }
  }

  const questsCount = await ArenaQuest.countDocuments({ date: today });
  console.log('ArenaQuests today:', questsCount);

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
