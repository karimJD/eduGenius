const express = require('express');
const router = express.Router();
const { generateSelfQuiz, submitSelfQuiz } = require('../controllers/AIQuizController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generateSelfQuiz);
// router.get('/:id', getSelfQuiz);
router.put('/:id/submit', submitSelfQuiz);

module.exports = router;
