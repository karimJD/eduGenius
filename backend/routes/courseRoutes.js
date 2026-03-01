const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourse,
  updateCourseSummary,
  generateCourseQuiz,
  getCourseQuizzes,
  deleteCourse,
  updateCourse,
} = require('../controllers/CourseController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.route('/').get(protect, getCourses).post(protect, authorize('teacher', 'admin'), upload.single('file'), createCourse);

router
  .route('/:id')
  .get(getCourse)
  .delete(protect, authorize('teacher', 'admin'), deleteCourse)
  .put(protect, authorize('teacher', 'admin'), updateCourse);

router.post('/:id/summary', protect, authorize('teacher', 'admin'), updateCourseSummary);
router.post('/:id/quiz', protect, authorize('teacher', 'admin'), generateCourseQuiz);
router.get('/:id/quizzes', protect, getCourseQuizzes);

module.exports = router;
