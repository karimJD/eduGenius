const Class = require('../../models/Class');
const Submission = require('../../models/Submission');
const Notification = require('../../models/Notification');
const Grade = require('../../models/Grade');

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

module.exports = {
  getDashboardStats,
  getRecentActivity
};
