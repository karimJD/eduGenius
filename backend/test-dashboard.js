const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' }); // load backend env
const Course = require('./models/Course');
const WorkSubmission = require('./models/WorkSubmission');
const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB:", process.env.MONGODB_URI);
  
  // Find a teacher ID
  const courseWithTeacher = await Course.findOne({ teacherId: { $ne: null } });
  if (!courseWithTeacher) {
      console.log("No course found with a teacherId");
      process.exit();
  }
  const teacherId = courseWithTeacher.teacherId;
  console.log("Testing with teacherId:", teacherId);

  try {
    const myCourses = await Course.find({ teacherId }).select('classId subjectId chapters');
    
    const allMyChapterIds = myCourses.reduce((acc, course) => {
      return acc.concat(course.chapters.map(ch => ch._id));
    }, []);

    const pendingSubmissions = await WorkSubmission.find({
      chapterId: { $in: allMyChapterIds },
      grade: null
    })
    .populate('studentId', 'firstName lastName profileImage')
    .populate('classId', 'name')
    .populate('subjectId', 'name')
    .sort({ submittedAt: -1 })
    .limit(5);

    console.log(`Found ${pendingSubmissions.length} pending submissions`);

    const results = pendingSubmissions.map(sub => {
      const subObj = sub.toObject();
      const course = myCourses.find(c => c.chapters.some(ch => ch._id.toString() === sub.chapterId.toString()));
      if (course) {
        const chapter = course.chapters.find(ch => ch._id.toString() === sub.chapterId?.toString());
        const exercise = chapter?.exercises?.find(ex => ex._id.toString() === sub.exerciseId?.toString());
        subObj.exerciseName = exercise?.name || 'Exercice inconnu';
      }
      return subObj;
    });

    console.log("Success! Results mapped.");
  } catch (e) {
    console.error("Crash during execution:", e);
  }
  process.exit();
}

test();
