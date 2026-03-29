const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');
const Class = require('./models/Class');
const User = require('./models/User');

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const teacherId = '69a49680f61e4435b226f2db';
  console.log('Checking for Teacher ID:', teacherId);

  // Check Courses
  const courses = await Course.find({ teacherId: new mongoose.Types.ObjectId(teacherId) });
  console.log(`Found ${courses.length} courses for this teacher.`);
  courses.forEach(c => {
    console.log(`- Course: ${c.title}, ClassId: ${c.classId}`);
  });

  // Check Classes
  const classes = await Class.find({ 'teachers.teacherId': new mongoose.Types.ObjectId(teacherId) });
  console.log(`Found ${classes.length} classes where teacher is directly assigned.`);
  
  // All Classes summary
  const allCls = await Class.find({}).limit(5);
  console.log('Sample of all classes (first 5):');
  allCls.forEach(c => {
    console.log(`- Class: ${c.name}, teachers: ${JSON.stringify(c.teachers)}`);
  });

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
