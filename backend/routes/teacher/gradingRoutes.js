const express = require('express');
const router = express.Router();
const Quiz = require('../../models/Quiz');
const Exam = require('../../models/Exam');
const Submission = require('../../models/Submission');
const Class = require('../../models/Class');

// GET /api/teacher/grading/pending  — all submitted, ungraded submissions for this teacher
router.get('/pending', async (req, res, next) => {
  try {
    const teacherId = req.user._id;

    const myQuizIds = (await Quiz.find({ teacherId }).select('_id')).map((q) => q._id);
    const myExamIds = (await Exam.find({ teacherId }).select('_id')).map((e) => e._id);

    const submissions = await Submission.find({
      status: 'submitted',
      $or: [{ quizId: { $in: myQuizIds } }, { examId: { $in: myExamIds } }],
    })
      .populate('studentId', 'firstName lastName email')
      .populate('quizId', 'title classId')
      .populate('examId', 'title classId')
      .sort({ submittedAt: -1 })
      .limit(Number(req.query.limit) || 50);

    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/grading/gradebook/:classId
router.get('/gradebook/:classId', async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const { classId } = req.params;

    // Verify ownership
    const cls = await Class.findOne({ _id: classId, teacherId }).populate(
      'studentIds',
      'firstName lastName email'
    );
    if (!cls) return res.status(403).json({ error: 'Access denied' });

    // All quizzes for this class
    const quizzes = await Quiz.find({ classId, teacherId }).select('title questions');
    const quizIds = quizzes.map((q) => q._id);

    // All submissions for these quizzes
    const submissions = await Submission.find({
      quizId: { $in: quizIds },
      studentId: { $in: cls.studentIds.map((s) => s._id) },
      status: { $in: ['submitted', 'graded'] },
    });

    // Build gradebook rows: one per student
    const rows = cls.studentIds.map((student) => {
      const studentSubs = submissions.filter(
        (s) => s.studentId.toString() === student._id.toString()
      );

      const quizGrades = quizzes.map((quiz) => {
        const sub = studentSubs.find((s) => s.quizId?.toString() === quiz._id.toString());
        return {
          quizId: quiz._id,
          quizTitle: quiz.title,
          score: sub ? sub.score : null,
          totalPoints: sub ? sub.totalPoints : null,
          percentage: sub ? sub.percentage : null,
        };
      });

      const completed = quizGrades.filter((g) => g.score !== null);
      const avg =
        completed.length > 0
          ? Math.round(
              (completed.reduce((s, g) => s + (g.percentage || 0), 0) / completed.length) * 10
            ) / 10
          : null;

      return {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        },
        quizGrades,
        average: avg,
      };
    });

    res.json({ class: { _id: cls._id, name: cls.name }, quizzes, rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/grading/submission/:id — get a submission for grading
router.get('/submission/:id', async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'firstName lastName email')
      .populate('quizId')
      .populate('examId');

    if (!submission) return res.status(404).json({ error: 'Not found' });

    // Verify teacher owns the quiz/exam
    const teacherId = req.user._id.toString();
    const ownerMatch =
      submission.quizId?.teacherId?.toString() === teacherId ||
      submission.examId?.teacherId?.toString() === teacherId;

    if (!ownerMatch) return res.status(403).json({ error: 'Access denied' });

    res.json(submission);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teacher/grading/submission/:id — grade a submission
router.put('/submission/:id', async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('quizId', 'teacherId')
      .populate('examId', 'teacherId');

    if (!submission) return res.status(404).json({ error: 'Not found' });

    const teacherId = req.user._id.toString();
    const ownerMatch =
      submission.quizId?.teacherId?.toString() === teacherId ||
      submission.examId?.teacherId?.toString() === teacherId;

    if (!ownerMatch) return res.status(403).json({ error: 'Access denied' });

    const { answers, overallFeedback } = req.body;

    // Apply updated per-answer grades
    if (answers && Array.isArray(answers)) {
      for (const updated of answers) {
        const ans = submission.answers.find(
          (a) => a.questionId.toString() === updated.questionId
        );
        if (ans) {
          ans.pointsEarned = updated.pointsEarned;
          ans.isCorrect = updated.pointsEarned > 0;
          if (updated.feedback !== undefined) ans.feedback = updated.feedback;
        }
      }
    }

    // Recalculate totals
    const totalPoints = submission.answers.reduce((s, a) => s + (a.pointsEarned || 0), 0);
    submission.score = totalPoints;
    submission.totalPoints = req.body.totalPoints || submission.totalPoints;
    submission.percentage =
      submission.totalPoints > 0
        ? Math.round((totalPoints / submission.totalPoints) * 1000) / 10
        : 0;
    submission.status = 'graded';
    if (overallFeedback !== undefined) submission.mistakeExplanation = overallFeedback;

    await submission.save();
    res.json(submission);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
