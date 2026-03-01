const express = require('express');
const router = express.Router();
const { getStudentSummary } = require('../controllers/AISummaryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/summary', getStudentSummary);

module.exports = router;
