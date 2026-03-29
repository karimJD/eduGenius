const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Schedule = require('./models/Schedule');

async function checkSchedules() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const schedules = await Schedule.find();
        let missingCount = 0;
        let totalEntries = 0;

        schedules.forEach(s => {
            s.entries.forEach((e, i) => {
                totalEntries++;
                if (!e.classId) {
                    if (s.targetType !== 'class') {
                        console.log(`Schedule "${s.title}" (${s._id}) entry ${i} missing classId (targetType: ${s.targetType})`);
                        missingCount++;
                    } else if (!s.targetId) {
                         console.log(`Schedule "${s.title}" (${s._id}) is of type class but missing targetId!`);
                    }
                }
            });
        });

        console.log(`Found ${missingCount} entries missing classId out of ${totalEntries} total entries across ${schedules.length} schedules.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSchedules();
