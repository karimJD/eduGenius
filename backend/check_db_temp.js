const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function checkUsers() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in .env');
        process.exit(1);
    }
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'email role firstName lastName').lean();
    console.log('Users in database:', JSON.stringify(users, null, 2));

    const admin = await User.findOne({ email: 'admin@edugenius.com' });
    if (admin) {
      console.log('Admin found. Role:', admin.role);
    } else {
      console.log('Admin NOT found in database.');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUsers();
