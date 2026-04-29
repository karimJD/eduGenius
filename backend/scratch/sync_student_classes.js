const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');
require('dotenv').config();

async function sync() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const classes = await Class.find({}).lean();
  let updatedCount = 0;

  for (const cls of classes) {
    if (!cls.students) continue;

    const studentIds = cls.students
      .filter(s => s.status === 'enrolled' || s.status === 'active')
      .map(s => s.studentId);

    if (studentIds.length === 0) continue;

    const result = await User.updateMany(
      { 
        _id: { $in: studentIds }, 
        role: 'student', 
        'student.classId': { $ne: cls._id } 
      },
      { $set: { 'student.classId': cls._id } }
    );

    updatedCount += result.modifiedCount;
    if (result.modifiedCount > 0) {
      console.log(`Updated ${result.modifiedCount} students for class: ${cls.name}`);
    }
  }

  console.log(`Sync complete. Total students updated: ${updatedCount}`);
  process.exit(0);
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});
