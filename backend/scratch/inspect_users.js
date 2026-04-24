const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function inspectUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ role: { $in: ['teacher', 'admin'] } });
        console.log(`Found ${users.length} teachers/admins:\n`);

        users.forEach((u, i) => {
            console.log(`--- User ${i + 1} ---`);
            console.log(`ID: ${u._id}`);
            console.log(`Name: ${u.firstName} ${u.lastName}`);
            console.log(`Role: ${u.role}`);
            console.log('\n');
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspectUsers();
