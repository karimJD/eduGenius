const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const { getEnrolledClasses, getClassDetails } = require('../../controllers/student/ClassController');

router.get('/', auth, getEnrolledClasses);
router.get('/:id', auth, getClassDetails);

module.exports = router;
