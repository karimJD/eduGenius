const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
  {
    firstName: 'System',
    lastName: 'Admin',
    cin: '11111111',
    email: 'admin@edugenius.com',
    password: 'adminpassword123',
    role: 'admin'
  },
  {
    firstName: 'Demo',
    lastName: 'Teacher',
    cin: '22222222',
    email: 'teacher@edugenius.com',
    password: 'teacherpassword123',
    role: 'teacher'
  },
  {
    firstName: 'Demo',
    lastName: 'Student',
    cin: '33333333',
    email: 'student@edugenius.com',
    password: 'studentpassword123',
    role: 'student'
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log(`Connected to MongoDB at ${process.env.MONGODB_URI}`);
    for (const u of users) {
      if (await User.findOne({ email: u.email })) {
        console.log(`User ${u.email} already exists.`);
      } else {
        await User.create(u);
        console.log(`User ${u.email} created.`);
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
