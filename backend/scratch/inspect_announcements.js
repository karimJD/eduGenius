const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Announcement = require('../models/Announcement');

async function inspectAnnouncements() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const announcements = await Announcement.find({}).select('title imageUrl targetType');
        console.log(`Found ${announcements.length} announcements:\n`);

        announcements.forEach((ann, i) => {
            console.log(`--- Announcement ${i + 1} ---`);
            console.log(`Title: ${ann.title}`);
            console.log(`ImageUrl: ${ann.imageUrl}`);
            console.log(`TargetType: ${ann.targetType}`);
            console.log('\n');
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspectAnnouncements();
