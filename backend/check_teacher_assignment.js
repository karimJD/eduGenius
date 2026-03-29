const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('./models/Class');
const User = require('./models/User');

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'teacher@edugenius.com' });
  if (!user) {
    console.log('User teacher@edugenius.com NOT FOUND');
    process.exit(1);
  }
  console.log(`User ID: ${user._id}`);

  const classes = await Class.find({ 
    $or: [
      { 'teachers.teacherId': user._id },
      { 'academicAdvisorId': user._id }
    ]
  });

  console.log(`Found ${classes.length} classes for this user.`);
  classes.forEach(c => {
    console.log(`- Class: ${c.name} (${c._id})`);
  });

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
