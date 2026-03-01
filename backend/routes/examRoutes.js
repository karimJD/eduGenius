const express = require('express');
const router = express.Router();
const {
  createExam,
  getExams,
  getExam,
  updateExam,
  deleteExam,
} = require('../controllers/ExamController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getExams)
  .post(authorize('teacher', 'admin'), createExam);

router
  .route('/:id')
  .get(getExam)
  .put(authorize('teacher', 'admin'), updateExam)
  .delete(authorize('teacher', 'admin'), deleteExam);

module.exports = router;
