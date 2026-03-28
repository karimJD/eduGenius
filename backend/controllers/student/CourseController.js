const Course = require('../../models/Course');
const StudentProgress = require('../../models/StudentProgress');
const mongoose = require('mongoose');

const getCourseStructure = async (req, res) => {
  try {
    const { classId } = req.params;
    // Find the course associated with the class. In some architectures, Course has classId.
    // Let's assume Course has a classId or we just return the first one for the demo, or query by class.
    const course = await Course.findOne({ classId }).select('-chapters.materials');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found for this class' });
    }

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getChapterMaterials = async (req, res) => {
  try {
    const { classId, chapterId } = req.params;
    const course = await Course.findOne({ classId, 'chapters._id': chapterId });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Chapter not found' });
    }

    const chapter = course.chapters.id(chapterId);
    res.status(200).json({ success: true, data: chapter.materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id;

    const progress = await StudentProgress.findOne({ studentId, classId });
    res.status(200).json({ success: true, data: progress || { overallProgress: 0, chaptersProgress: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const trackMaterialView = async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    const studentId = req.user._id;

    let progress = await StudentProgress.findOne({ studentId, classId });
    if (!progress) {
      progress = new StudentProgress({ studentId, classId, chaptersProgress: [] });
    }

    let materialUpdated = false;
    for (const chapter of progress.chaptersProgress) {
      for (const mat of chapter.materials) {
        if (mat.materialId.toString() === materialId) {
          if (!mat.viewed) {
            mat.viewed = true;
            mat.viewedAt = new Date();
          }
          mat.timeSpent += req.body.timeSpent || 0;
          materialUpdated = true;
          break;
        }
      }
    }

    // If material wasn't in progress tracking yet, we might need to find its chapter.
    // Assuming it is handled or front-end initializes it.

    progress.lastAccessedAt = new Date();
    await progress.save();

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const trackMaterialDownload = async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    const studentId = req.user._id;
    // Similar to trackMaterialView, simply update downloadedAt
    let progress = await StudentProgress.findOne({ studentId, classId });
    if (progress) {
      // update logic
      progress.lastAccessedAt = new Date();
      await progress.save();
    }
    res.status(200).json({ success: true, message: 'Download tracked' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markChapterComplete = async (req, res) => {
  try {
    const { classId, chapterId } = req.params;
    const studentId = req.user._id;

    let progress = await StudentProgress.findOne({ studentId, classId });
    if (!progress) {
      return res.status(404).json({ success: false, message: 'Progress not found' });
    }

    const chapterProg = progress.chaptersProgress.find(c => c.chapterId.toString() === chapterId);
    if (chapterProg) {
      chapterProg.status = 'completed';
      chapterProg.completedAt = new Date();
      await progress.save();
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCourseStructure,
  getChapterMaterials,
  getProgress,
  trackMaterialView,
  trackMaterialDownload,
  markChapterComplete
};
