const Grade = require('../../models/Grade');
const Attendance = require('../../models/Attendance');
const StudentProgress = require('../../models/StudentProgress');

const getGrades = async (req, res) => {
  try {
    const studentId = req.user._id;
    const grades = await Grade.find({ studentId }).populate('classId');
    res.status(200).json({ success: true, data: grades });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProgressReports = async (req, res) => {
  try {
    const studentId = req.user._id;
    const progress = await StudentProgress.find({ studentId }).populate('classId');
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    // Assuming Attendance model records are by class or date
    const attendance = await Attendance.find({ 'records.studentId': studentId });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGrades,
  getProgressReports,
  getAttendance
};
