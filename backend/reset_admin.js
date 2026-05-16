const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const email = 'admin@edugenius.com';
    const newPassword = 'adminpassword123';
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Admin user not found!');
      process.exit(1);
    }
    
    user.password = newPassword; // The pre-save hook will hash it
    await user.save();
    
    console.log(`Password for ${email} has been reset to: ${newPassword}`);
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetPassword();
