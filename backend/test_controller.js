const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { getTeacherSchedule } = require('./controllers/teacher/ScheduleController');
const User = require('./models/User');

async function testController() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ role: 'teacher' });
        if (!user) {
            console.log('No teacher found');
            process.exit(1);
        }

        const req = { user };
        const res = {
            status: (code) => {
                console.log('Status:', code);
                return res;
            },
            json: (data) => {
                console.log('Data:', JSON.stringify(data, null, 2));
            }
        };

        await getTeacherSchedule(req, res);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testController();
