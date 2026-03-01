const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const insertAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const adminEmail = 'admin@edugenius.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    });

    await adminUser.save();
    console.log('Admin user successfully created!');
    console.log('Email:', adminEmail);
    console.log('Password:', 'adminpassword123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

insertAdmin();
