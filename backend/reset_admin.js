const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ email: 'admin@edugenius.com' });
    if (!admin) {
      console.log('Admin not found, creating new admin...');
      await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@edugenius.com',
        password: 'adminpassword123',
        role: 'admin',
        cin: '11111111'
      });
      console.log('Admin created.');
    } else {
      admin.password = 'adminpassword123';
      await admin.save();
      console.log('Admin password reset to: adminpassword123');
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

resetAdmin();
