const express = require('express');
const router = express.Router();
const Class = require('../../models/Class');
const Quiz = require('../../models/Quiz');
const Exam = require('../../models/Exam');
const Submission = require('../../models/Submission');
const VideoSession = require('../../models/VideoSession');
const Course = require('../../models/Course');
const WorkSubmission = require('../../models/WorkSubmission');

// GET /api/teacher/dashboard/pending-work — recent ungraded work submissions
router.get('/pending-work', async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // 1. Get all courses owned by this teacher to know which (class, subject) they grade
    const myCourses = await Course.find({ teacherId }).select('classId subjectId chapters');
    
    // 2. Build a list of all chapter IDs owned by this teacher
    const allMyChapterIds = myCourses.reduce((acc, course) => {
      return acc.concat(course.chapters.map(ch => ch._id));
    }, []);

    // 3. Find submissions for these chapters that are not graded
    const pendingSubmissions = await WorkSubmission.find({
      chapterId: { $in: allMyChapterIds },
      grade: null
    })
    .populate('studentId', 'firstName lastName profileImage')
    .populate('classId', 'name')
    .populate('subjectId', 'name')
    .sort({ submittedAt: -1 })
    .limit(5);

    // 4. We need to find the exercise name for each submission
    // Since exercises are subdocuments in Course.chapters, we can map them
    const results = pendingSubmissions.map(sub => {
      const subObj = sub.toObject();
      const course = myCourses.find(c => c.chapters.some(ch => ch._id.toString() === sub.chapterId.toString()));
      if (course) {
        const chapter = course.chapters.find(ch => ch._id.toString() === sub.chapterId?.toString());
        const exercise = chapter?.exercises?.find(ex => ex._id.toString() === sub.exerciseId?.toString());
        subObj.exerciseName = exercise?.name || 'Exercice inconnu';
        subObj.chapterName = chapter?.title || 'Dossier inconnu';
      }
      return subObj;
    });

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    // Classes where this teacher is academicAdvisor OR listed in the teachers array
    const classes = await Class.find({ 
      $or: [
        { academicAdvisorId: teacherId },
        { 'teachers.teacherId': teacherId }
      ]
    }).lean();
    
    const totalStudents = classes.reduce(
      (acc, c) => acc + (c.students?.length || 0),
      0
    );

    // Count quizzes + exams belonging to this teacher
    const [quizCount, examCount] = await Promise.all([
      Quiz.countDocuments({ teacherId }),
      Exam.countDocuments({ teacherId }),
    ]);

    // Pending submissions (submitted but not graded)
    const myQuizIds = (await Quiz.find({ teacherId }).select('_id')).map((q) => q._id);
    const myExamIds = (await Exam.find({ teacherId }).select('_id')).map((e) => e._id);

    // Old pending grading (Quizzes/Exams)
    const pendingGradingCount = await Submission.countDocuments({
      status: 'submitted',
      $or: [{ quizId: { $in: myQuizIds } }, { examId: { $in: myExamIds } }],
    });

    // 1. New Pending Work Submissions count
    const myCourses = await Course.find({ teacherId }).select('chapters');
    const allMyChapterIds = myCourses.reduce((acc, course) => {
      return acc.concat(course.chapters.map(ch => ch._id));
    }, []);

    const pendingWorkCount = await WorkSubmission.countDocuments({
      chapterId: { $in: allMyChapterIds },
      grade: null
    });

    // 2. Today's sessions count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todaySessions = await VideoSession.countDocuments({
      teacherId,
      scheduledStart: { $gte: startOfToday, $lte: endOfToday },
    });

    res.json({
      totalClasses: classes.length,
      totalStudents,
      totalAssessments: quizCount + examCount,
      pendingGrading: pendingGradingCount, // Quizzes/Exams
      pendingWork: pendingWorkCount, // Exercises
      todaySessions,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/dashboard/upcoming-sessions
router.get('/upcoming-sessions', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const now = new Date();
    const sessions = await VideoSession.find({
      teacherId,
      scheduledAt: { $gte: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(5)
      .populate('classId', 'name code');
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
