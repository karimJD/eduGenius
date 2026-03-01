const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  getClass,
  joinClass,
  updateClass,
  deleteClass,
} = require('../controllers/ClassController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router
  .route('/')
  .get(getClasses)
  .post(authorize('teacher', 'admin'), createClass);

router.post('/join', authorize('student'), joinClass);

router
  .route('/:id')
  .get(getClass)
  .put(authorize('teacher', 'admin'), updateClass)
  .delete(authorize('teacher', 'admin'), deleteClass);

module.exports = router;
