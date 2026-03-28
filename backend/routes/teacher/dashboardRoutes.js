const express = require('express');
const router = express.Router();
const Class = require('../../models/Class');
const Quiz = require('../../models/Quiz');
const Exam = require('../../models/Exam');
const Submission = require('../../models/Submission');
const VideoSession = require('../../models/VideoSession');

// GET /api/teacher/dashboard/stats
router.get('/stats', async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    const classes = await Class.find({ teacherId }).lean();
    const classIds = classes.map((c) => c._id);

    const totalStudents = classes.reduce(
      (acc, c) => acc + (c.studentIds?.length || 0),
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

    const pendingGrading = await Submission.countDocuments({
      status: 'submitted',
      $or: [{ quizId: { $in: myQuizIds } }, { examId: { $in: myExamIds } }],
    });

    // Upcoming sessions (next 48h)
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const upcomingSessions = await VideoSession.countDocuments({
      teacherId,
      status: 'scheduled',
      scheduledAt: { $gte: now, $lte: in48h },
    });

    res.json({
      totalClasses: classes.length,
      totalStudents,
      totalAssessments: quizCount + examCount,
      pendingGrading,
      upcomingSessions,
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
