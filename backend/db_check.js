const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/eduGenius');
  console.log("Connected to DB.");

  const Course = mongoose.model('Course', new mongoose.Schema({
      title: String,
      classId: mongoose.Schema.Types.ObjectId,
      subjectId: mongoose.Schema.Types.ObjectId,
      chapters: [new mongoose.Schema({}, { strict: false })],
      isPublished: Boolean
  }, { strict: false }));
  const classes = mongoose.model('Class', new mongoose.Schema({ name: String }, { strict: false }));
  const subjects = mongoose.model('Subject', new mongoose.Schema({ name: String }, { strict: false }));

  const allCourses = await Course.find({}).lean();
  console.log(`Found ${allCourses.length} courses.`);

  for (const c of allCourses) {
    const subject = await subjects.findOne({ _id: c.subjectId });
    const cls = await classes.findOne({ _id: c.classId });
    console.log(`Course Title: ${c.title}, Class: ${cls ? cls.name : c.classId}, Subject: ${subject ? subject.name : c.subjectId}`);
    console.log(`Published: ${c.isPublished}`);
    console.log(`Chapters Length: ${c.chapters ? c.chapters.length : 0}`);
    if (c.chapters) {
      for (const ch of c.chapters) {
        console.log(`  Chapter Title: ${ch.title}, isPublished: ${ch.isPublished}`);
        console.log(`    Materials: ${ch.materials ? ch.materials.length : 0}`);
        console.log(`    Exercises: ${ch.exercises ? ch.exercises.length : 0}`);
      }
    }
  }

  process.exit();
}

checkDB().catch(console.error);
