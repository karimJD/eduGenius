const express = require('express');
const router = express.Router();
const Quiz = require('../../models/Quiz');
const Submission = require('../../models/Submission');
const AiService = require('../../services/AiService');
const Course = require('../../models/Course');

// GET /api/teacher/quizzes?classId=xxx
router.get('/', async (req, res, next) => {
  try {
    const query = { teacherId: req.user._id };
    if (req.query.classId) query.classId = req.query.classId;

    const quizzes = await Quiz.find(query)
      .populate('classId', 'name code')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/quizzes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id })
      .populate('classId', 'name code')
      .populate('courseId', 'title');

    if (!quiz) return res.status(404).json({ error: 'Quiz not found or access denied' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher/quizzes
router.post('/', async (req, res, next) => {
  try {
    const { title, description, classId, courseId, questions, settings, isAIGenerated, generatedFrom } = req.body;

    let finalQuestions = questions || [];

    // AI generation
    if (isAIGenerated && generatedFrom) {
      let content = generatedFrom;
      if (courseId && req.body.useCourseContent) {
        const course = await Course.findById(courseId);
        if (course) content = course.content || course.summary || content;
      }
      try {
        finalQuestions = await AiService.generateQuiz(content, req.body.questionCount || 5);
      } catch (err) {
        console.error('AI Quiz Error:', err);
      }
    }

    const quiz = await Quiz.create({
      title,
      description,
      classId,
      courseId,
      teacherId: req.user._id,
      questions: finalQuestions,
      settings,
      isAIGenerated: isAIGenerated || false,
      generatedFrom,
      isPublished: false,
    });

    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teacher/quizzes/:id
router.put('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or access denied' });
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teacher/quizzes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or access denied' });
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher/quizzes/:id/publish
router.patch('/:id/publish', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or access denied' });

    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    res.json({ isPublished: quiz.isPublished });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher/quizzes/:id/submissions
router.get('/:id/submissions', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or access denied' });

    const submissions = await Submission.find({ quizId: quiz._id })
      .populate('studentId', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
