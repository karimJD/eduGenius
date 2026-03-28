const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { 
  getAssignedAssessments, 
  getAssessmentDetails, 
  startAssessment, 
  submitAssessment 
} = require('../../controllers/student/AssessmentController');

router.get('/', auth, getAssignedAssessments);
router.get('/:id', auth, getAssessmentDetails);
router.post('/:id/start', auth, startAssessment);
router.post('/:id/submit', auth, submitAssessment);

module.exports = router;
