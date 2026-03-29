const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Schedule = require('./models/Schedule');

async function inspectTeacherSchedules(teacherId) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const schedules = await Schedule.find({
            $or: [
                { targetType: 'teacher', targetId: teacherId },
                { 'entries.teacherId': teacherId }
            ]
        });

        console.log(`Found ${schedules.length} schedules for teacher ${teacherId}`);
        schedules.forEach(s => {
            console.log(`\nSchedule: ${s.title} (${s._id}) targetType: ${s.targetType}`);
            s.entries.forEach((e, i) => {
                if (e.teacherId && e.teacherId.toString() === teacherId) {
                    console.log(`  Entry ${i}: subjectId: ${e.subjectId}, classId: ${e.classId}, day: ${e.dayOfWeek}`);
                }
            });
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

const teacherId = '69a49680f61e4435b226f2db';
inspectTeacherSchedules(teacherId);
