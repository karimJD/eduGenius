const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate: auth } = require('../../middleware/auth');
const { 
  getAllStudentCourses,
  getCourseStructure, 
  getChapterMaterials, 
  getStudentSubmissions,
  getProgress, 
  trackMaterialView, 
  trackMaterialDownload, 
  markChapterComplete,
  getExerciseDetails,
  submitExercise
} = require('../../controllers/student/CourseController');

const multer = require('multer');
const { uploadToS3 } = require('../../utils/s3');
const WorkSubmission = require('../../models/WorkSubmission');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Mounted on /api/student/courses
router.get('/', auth, getAllStudentCourses);
router.get('/:classId', auth, getCourseStructure);
router.get('/:classId/chapters/:chapterId', auth, getChapterMaterials);
router.get('/:classId/exercises/:exerciseId', auth, getExerciseDetails);
router.get('/:classId/submissions', auth, getStudentSubmissions);
router.get('/:classId/progress', auth, getProgress);
router.post('/:classId/materials/:materialId/view', auth, trackMaterialView);
router.post('/:classId/materials/:materialId/download', auth, trackMaterialDownload);
router.post('/:classId/chapters/:chapterId/complete', auth, markChapterComplete);

// Exercise File Submission
router.post('/:classId/chapters/:chapterId/exercises/:exerciseId/submit', auth, upload.single('file'), submitExercise);

module.exports = router;
