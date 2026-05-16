const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const WorkSubmission = require('./models/WorkSubmission');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const course = await Course.findOne();
  if (!course) return console.log("No courses found");
  const teacherId = course.teacherId;

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

    const results = pendingSubmissions.map(sub => {
      const subObj = sub.toObject();
      const c = myCourses.find(c => c.chapters.some(ch => ch._id.toString() === sub.chapterId.toString()));
      if (c) {
        const chapter = c.chapters.id(sub.chapterId);
        if (!chapter.exercises || typeof chapter.exercises.id !== 'function') {
           throw new Error('exercises.id is not a function');
        }
        const exercise = chapter?.exercises.id(sub.exerciseId);
        subObj.exerciseName = exercise?.name || 'Exercice inconnu';
      }
      return subObj;
    });

    console.log("Success:", results.length);
  } catch (e) {
    console.error("Error:", e.stack);
  }
  process.exit();
}
test();
