const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkDatabase() {
  try {
    console.log(`Connecting to: ${process.env.MONGODB_URI}`);
    await mongoose.connect(process.env.MONGODB_URI);
    
    const count = await User.countDocuments();
    console.log(`Total users in DB: ${count}`);
    
    if (count > 0) {
        const users = await User.find({}, 'email role firstName lastName password').lean();
        console.log('--- Users in Database ---');
        users.forEach(u => {
          console.log(`${u.email} (${u.role}): ${u.firstName} ${u.lastName} [Hash: ${u.password}]`);
        });
    } else {
        console.log('No users found in database.');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDatabase();
