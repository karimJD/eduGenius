const Schedule = require('../../models/Schedule');

/**
 * GET /api/teacher/schedule
 * Fetch schedules where the teacher is either the overall target or assigned in entries
 */
const getTeacherSchedule = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // We look for schedules where:
    // 1. targetType is 'teacher' (individual schedule)
    // 2. OR targetType is 'class' AND at least one entry belongs to this teacher
    const schedules = await Schedule.find({
      $or: [
        { targetType: 'teacher', targetId: teacherId },
        { 
          targetType: 'class', 
          'entries.teacherId': teacherId 
        }
      ],
      isPublished: true
    })
    .populate('entries.subjectId', 'name code')
    .populate('entries.teacherId', 'firstName lastName email')
    .populate('entries.classId', 'name code');

    res.status(200).json({ 
      success: true, 
      count: schedules.length,
      data: schedules 
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de l\'emploi du temps' 
    });
  }
};

module.exports = {
  getTeacherSchedule
};
