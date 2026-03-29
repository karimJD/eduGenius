const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Schedule = require('./models/Schedule');
const Class = require('./models/Class');

async function inspectTargetId(teacherId) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const schedules = await Schedule.find({
            $or: [
                { targetType: 'teacher', targetId: teacherId },
                { 'entries.teacherId': teacherId }
            ]
        });

        for (const s of schedules) {
            console.log(`\nSchedule: ${s.title} (${s._id}) targetType: ${s.targetType}, targetId: ${s.targetId}`);
            if (s.targetType === 'class') {
                const cls = await Class.findById(s.targetId);
                if (cls) {
                    console.log(`  Target is a valid Class: ${cls.name} (${cls._id})`);
                } else {
                    console.log(`  Target is NOT a valid Class in the database!`);
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

const teacherId = '69a49680f61e4435b226f2db';
inspectTargetId(teacherId);
