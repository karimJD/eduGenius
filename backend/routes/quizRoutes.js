const express = require('express');
const router = express.Router();
const {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
} = require('../controllers/QuizController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getQuizzes)
  .post(authorize('teacher', 'admin'), createQuiz);

router
  .route('/:id')
  .get(getQuiz)
  .put(authorize('teacher', 'admin'), updateQuiz)
  .delete(authorize('teacher', 'admin'), deleteQuiz);

module.exports = router;
