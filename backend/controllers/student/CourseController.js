const Course = require('../../models/Course');
const StudentProgress = require('../../models/StudentProgress');
const Class = require('../../models/Class');
const WorkSubmission = require('../../models/WorkSubmission');
const mongoose = require('mongoose');

const Schedule = require('../../models/Schedule');

const getAllStudentCourses = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    // 1. Find classes the student is enrolled in via the Class model
    const classesFromEnrollment = await Class.find({ 
      'students.studentId': studentId,
      'students.status': 'enrolled'
    })
    .populate('departmentId', 'name')
    .populate('teachers.subjectId', 'name code')
    .lean();

    // 2. Fallback: check if student has classId in their profile
    const user = await req.user.populate('student.classId');
    const profileClassId = user.student?.classId?._id;

    let allClassIds = new Set(classesFromEnrollment.map(c => c._id.toString()));
    let finalClasses = [...classesFromEnrollment];

    if (profileClassId && !allClassIds.has(profileClassId.toString())) {
      const profileClass = await Class.findById(profileClassId)
        .populate('departmentId', 'name')
        .populate('teachers.subjectId', 'name code')
        .lean();
      if (profileClass) {
        finalClasses.push(profileClass);
      }
    }

    if (finalClasses.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const formattedClasses = await Promise.all(finalClasses.map(async (cls) => {
      const classId = cls._id;

      // 3. Fetch subjects from Schedule
      const schedules = await Schedule.find({
        $or: [
          { targetType: 'class', targetId: classId },
          { 'entries.classId': classId }
        ],
        isPublished: true
      }).populate('entries.subjectId', 'name code').lean();

      const subjectMap = new Map();
      // From Class record
      cls.teachers?.forEach(t => {
        if (t.subjectId) subjectMap.set(t.subjectId._id.toString(), t.subjectId);
      });

      // From Schedule
      schedules.forEach(s => {
        s.entries.forEach(entry => {
          const entryClassId = entry.classId ? entry.classId.toString() : (s.targetType === 'class' ? s.targetId.toString() : null);
          if (entryClassId === classId.toString() && entry.subjectId) {
            subjectMap.set(entry.subjectId._id.toString(), entry.subjectId);
          }
        });
      });

      // 4. Fallback: Discovery from existing Courses for this class
      const coursesForClass = await Course.find({ classId }).populate('subjectId', 'name code').lean();
      coursesForClass.forEach(c => {
        if (c.subjectId) {
          subjectMap.set(c.subjectId._id.toString(), c.subjectId);
        }
      });

      const assignedSubjects = Array.from(subjectMap.values()).map(s => ({ subjectId: s }));

      return {
        ...cls,
        assignedSubjects
      };
    }));

    res.status(200).json({ success: true, data: formattedClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCourseStructure = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    // Security: Check if student is actually part of this class
    const isEnrolled = await Class.findOne({
      _id: classId,
      'students.studentId': studentId,
      'students.status': 'enrolled'
    });

    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Non autorisé à accéder à cette classe' });
    }

    let course = await Course.findOne({ classId, subjectId })
      .populate('teacherId', 'firstName lastName profileImage')
      .populate('subjectId', 'name code')
      .lean();
    
    if (!course) {
      // Return a skeleton object if course document hasn't been created yet
      return res.status(200).json({ 
        success: true, 
        data: {
          title: 'Cours non disponible',
          chapters: [],
          subjectId: null
        } 
      });
    }

    // Fetch the student's submissions for this specific class and subject
    const submissions = await WorkSubmission.find({
      studentId: studentId,
      classId: classId,
      subjectId: subjectId
    }).lean();
    const submittedExerciseIds = new Set(submissions.map(s => s.exerciseId.toString()));

    // Ensure we only show published chapters to students
    if (course.chapters && Array.isArray(course.chapters)) {
      course.chapters = course.chapters.filter(ch => ch.isPublished === true);
      
      // Inject hasSubmitted flag
      course.chapters.forEach(ch => {
        if (ch.exercises && Array.isArray(ch.exercises)) {
           ch.exercises.forEach(ex => {
              ex.hasSubmitted = submittedExerciseIds.has(ex._id.toString());
           });
        }
      });
    } else {
      course.chapters = [];
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
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const progress = await StudentProgress.findOne({ studentId, classId, subjectId });
    res.status(200).json({ success: true, data: progress || { overallProgress: 0, chaptersProgress: [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const trackMaterialView = async (req, res) => {
  try {
    const { classId, materialId } = req.params;
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    let progress = await StudentProgress.findOne({ studentId, classId, subjectId });
    if (!progress) {
      progress = new StudentProgress({ studentId, classId, subjectId, chaptersProgress: [] });
    }

    // Iterate through chapters to find material (same as before but scoped to subject)
    // Chapters follow Course structure
    const course = await Course.findOne({ classId, subjectId });
    if (!course) return res.status(404).json({ success: false, message: 'Matière introuvable' });

    // Ensure chaptersProgress matches Course structure if new
    if (progress.chaptersProgress.length === 0) {
      progress.chaptersProgress = course.chapters.map(ch => ({
        chapterId: ch._id,
        materials: ch.materials.map(m => ({ materialId: m._id, viewed: false }))
      }));
    }

    for (const chapter of progress.chaptersProgress) {
      for (const mat of chapter.materials) {
        if (mat.materialId.toString() === materialId) {
          if (!mat.viewed) {
            mat.viewed = true;
            mat.viewedAt = new Date();
          }
          mat.timeSpent += req.body.timeSpent || 0;
          break;
        }
      }
    }

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
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    let progress = await StudentProgress.findOne({ studentId, classId, subjectId });
    if (progress) {
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
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    let progress = await StudentProgress.findOne({ studentId, classId, subjectId });
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

const getStudentSubmissions = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const WorkSubmission = require('../../models/WorkSubmission');

    const submissions = await WorkSubmission.find({ classId, studentId });
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExerciseDetails = async (req, res) => {
  try {
    const { classId, exerciseId } = req.params;
    const { subjectId } = req.query;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const course = await Course.findOne({ classId, subjectId })
      .populate('subjectId', 'name code')
      .lean();
    
    if (!course) return res.status(404).json({ success: false, message: 'Cours non trouvé' });

    let foundExercise = null;
    let foundChapterId = null;

    for (const chapter of course.chapters) {
      const exercise = chapter.exercises.find(e => e._id.toString() === exerciseId);
      if (exercise) {
        foundExercise = exercise;
        foundChapterId = chapter._id;
        break;
      }
    }

    if (!foundExercise) return res.status(404).json({ success: false, message: 'Exercice non trouvé' });

    // Fetch student's submission if exists
    const WorkSubmission = require('../../models/WorkSubmission');
    const submission = await WorkSubmission.findOne({ exerciseId, studentId }).lean();

    res.status(200).json({ 
      success: true, 
      data: {
        exercise: foundExercise,
        chapterId: foundChapterId,
        subject: course.subjectId,
        submission
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitExercise = async (req, res) => {
  try {
    const { classId, chapterId, exerciseId } = req.params;
    const { subjectId } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const { uploadToS3 } = require('../../utils/s3');
    const WorkSubmission = require('../../models/WorkSubmission');

    const fileUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype);

    // Upsert submission
    const submission = await WorkSubmission.findOneAndUpdate(
      { exerciseId, studentId },
      {
        classId,
        subjectId,
        chapterId,
        fileName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    console.error('Work Submission Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit work', error: error.message });
  }
};

module.exports = {
  getAllStudentCourses,
  getCourseStructure,
  getChapterMaterials,
  getExerciseDetails,
  submitExercise,
  getProgress,
  trackMaterialView,
  trackMaterialDownload,
  markChapterComplete,
  getStudentSubmissions
};
