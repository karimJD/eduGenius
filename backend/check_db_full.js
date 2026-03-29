const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const Class = require('./models/Class');
const User = require('./models/User');

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const allCourses = await Course.find({}).populate('teacherId', 'firstName lastName email').populate('classId', 'name');
  console.log('--- ALL COURSES ---');
  allCourses.forEach(c => {
    console.log(`Course: ${c.title}`);
    console.log(`  Teacher: ${c.teacherId ? (c.teacherId.email + ' (' + c.teacherId._id + ')') : 'NONE'}`);
    console.log(`  Class: ${c.classId ? c.classId.name : 'NONE'}`);
  });

  const allTeacherUsers = await User.find({ role: 'teacher' }).select('firstName lastName email role');
  console.log('--- ALL TEACHER USERS ---');
  allTeacherUsers.forEach(u => {
    console.log(`User: ${u.firstName} ${u.lastName} (${u.email}) - ID: ${u._id}`);
  });

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
