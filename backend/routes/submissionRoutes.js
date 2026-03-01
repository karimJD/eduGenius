const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissions,
  getSubmission,
} = require('../controllers/SubmissionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .get(getSubmissions)
  .post(createSubmission);

router.route('/:id').get(getSubmission);

module.exports = router;
