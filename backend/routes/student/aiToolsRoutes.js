const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { 
  generateSummary, getSummaries, 
  generateFlashcards, getFlashcards, 
  generatePracticeQuiz, submitPracticeQuiz, getPracticeHistory, 
  getRecommendations 
} = require('../../controllers/student/AiToolsController');

router.post('/generate-summary', auth, generateSummary);
router.get('/summaries', auth, getSummaries);

router.post('/generate-flashcards', auth, generateFlashcards);
router.get('/flashcards/:classId', auth, getFlashcards);

router.post('/generate-practice-quiz', auth, generatePracticeQuiz);
router.post('/practice-quiz/:id/submit', auth, submitPracticeQuiz);
router.get('/practice-quizzes/history', auth, getPracticeHistory);

router.get('/recommendations/:classId', auth, getRecommendations);

module.exports = router;
