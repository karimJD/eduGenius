const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate: auth } = require('../../middleware/auth');
const { 
  getCourseStructure, 
  getChapterMaterials, 
  getProgress, 
  trackMaterialView, 
  trackMaterialDownload, 
  markChapterComplete 
} = require('../../controllers/student/CourseController');

// Mounted on /api/student/courses
router.get('/:classId', auth, getCourseStructure);
router.get('/:classId/chapters/:chapterId', auth, getChapterMaterials);
router.get('/:classId/progress', auth, getProgress);
router.post('/:classId/materials/:materialId/view', auth, trackMaterialView);
router.post('/:classId/materials/:materialId/download', auth, trackMaterialDownload);
router.post('/:classId/chapters/:chapterId/complete', auth, markChapterComplete);

module.exports = router;
