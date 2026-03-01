const express = require('express');
const router = express.Router();
const { createSession, getSessions, startSession, endSession } = require('../controllers/VideoSessionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
    .get(getSessions)
    .post(authorize('teacher', 'admin'), createSession);

router.put('/:id/start', authorize('teacher', 'admin'), startSession);
router.put('/:id/end', authorize('teacher', 'admin'), endSession);

module.exports = router;
