const Class = require('../../models/Class');

const getEnrolledClasses = async (req, res) => {
  try {
    const studentId = req.user._id;
    const classes = await Class.find({
      'students.studentId': studentId,
      'students.status': 'active'
    }).populate('teacher', 'firstName lastName email profileImage');

    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;
    const classObj = await Class.findOne({
      _id: id,
      'students.studentId': studentId,
      'students.status': 'active'
    }).populate('teacher', 'firstName lastName email profileImage');

    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found or not enrolled' });
    }

    res.status(200).json({ success: true, data: classObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEnrolledClasses,
  getClassDetails
};
