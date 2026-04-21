const mongoose = require('mongoose');
const Class = require('../../models/Class');
const Submission = require('../../models/Submission');
const Notification = require('../../models/Notification');
const Grade = require('../../models/Grade');
const Course = require('../../models/Course');
const WorkSubmission = require('../../models/WorkSubmission');

const getDashboardStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Enrolled Classes
    const enrolledClasses = await Class.countDocuments({
      'students.studentId': studentId,
      'students.status': 'active'
    });

    // 2. Upcoming Assessments
    // Could aggregate from quizzes/exams assigned to the student's classes.
    // For simplicity, we assume there's a status or we count pending submissions.
    const pendingAssignments = await Submission.countDocuments({
      studentId,
      status: { $in: ['assigned', 'not-started'] }
    });

    // 3. Unread Notifications/Announcements
    const unreadAnnouncements = await Notification.countDocuments({
      userId: studentId,
      isRead: false,
      type: 'announcement'
    });
    
    const unreadMessages = await Notification.countDocuments({
      userId: studentId,
      isRead: false,
      type: 'new_message'
    });

    res.status(200).json({
      success: true,
      stats: {
        enrolledClasses,
        upcomingAssessments: pendingAssignments, // approximated
        pendingAssignments,
        overallGPA: 0, // calculate if needed from grades
        attendanceRate: 100, // mock or calculate
        unreadAnnouncements,
        unreadMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const studentId = req.user._id;
    // Mock recent activity or fetch from Notifications/Submissions
    const recentSubmissions = await Submission.find({ studentId })
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: recentSubmissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPendingExercises = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    // 1. Find active classes student is enrolled in
    const enrolledClasses = await Class.find({
      'students.studentId': studentId,
      'students.status': { $in: ['enrolled', 'active'] }
    }).select('_id name').lean();

    const classIds = enrolledClasses.map(c => c._id);

    // 2. Fallback: Check student profile classId
    const User = require('../../models/User');
    const userProfile = await User.findById(studentId).select('student.classId');
    if (userProfile?.student?.classId) {
      const profileClassId = userProfile.student.classId;
      if (!classIds.some(id => id.toString() === profileClassId.toString())) {
        classIds.push(profileClassId);
      }
    }

    if (classIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 3. Find all Courses for these classes
    const courses = await Course.find({
      classId: { $in: classIds }
    }).populate('subjectId', 'name code').lean();

    // 4. Extract all exercises from published chapters (only from courses with a subject)
    let allExercises = [];
    courses.forEach(course => {
      if (!course.subjectId) return; // Skip courses not linked to a subject
      if (course.chapters && Array.isArray(course.chapters)) {
        course.chapters.forEach(chapter => {
          if (chapter.isPublished !== false && chapter.exercises && Array.isArray(chapter.exercises)) {
            chapter.exercises.forEach(ex => {
              allExercises.push({
                ...ex,
                title: ex.name,
                classId: course.classId,
                subjectId: course.subjectId?._id,
                subjectName: course.subjectId?.name,
                subjectCode: course.subjectId?.code,
                chapterId: chapter._id
              });
            });
          }
        });
      }
    });

    if (allExercises.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 5. Find student's submissions
    const submissions = await WorkSubmission.find({
      studentId: studentId
    }).select('exerciseId studentId').lean();

    console.log({submissions});

    const submittedExerciseIds = new Set(submissions.map(s => s.exerciseId.toString()));

    console.log({submittedExerciseIds});

    // 6. Filter out submitted exercises
    const pendingExercises = allExercises.filter(ex => !submittedExerciseIds.has(ex._id.toString()));

    console.log({pendingExercises});

    // 7. Sort by due date (if available) or most recent
    pendingExercises.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      data: pendingExercises.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching pending exercises:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getPendingExercises
};
