const Schedule = require('../../models/Schedule');
const User = require('../../models/User');
const Announcement = require('../../models/Announcement');
const Class = require('../../models/Class');

// --- Schedule ---
const getSchedule = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Find classes the student is enrolled in
    const enrolledClasses = await Class.find({ 
      'students.studentId': studentId,
      'students.status': 'enrolled'
    }).select('_id');
    const classIds = enrolledClasses.map(c => c._id);

    // Fetch schedules targeting those classes
    const schedules = await Schedule.find({
      targetType: 'class',
      targetId: { $in: classIds },
      isPublished: true
    })
    .populate('entries.subjectId', 'name code')
    .populate('entries.teacherId', 'firstName lastName email')
    .populate('entries.classId', 'name code');

    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Profile ---
const getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true }).select('-password');
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Announcements ---
const getAnnouncements = async (req, res) => {
  try {
    // Should filter by enrolled classes
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSchedule,
  getProfile,
  updateProfile,
  getAnnouncements
};
