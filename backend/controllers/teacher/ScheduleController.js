const Schedule = require('../../models/Schedule');
const Class = require('../../models/Class');

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
    .populate('entries.classId', 'name code')
    .lean();

    // Map class details to top level for class schedules
    for (const sched of schedules) {
        if (sched.targetType === 'class' && sched.targetId) {
            sched.classId = await Class.findById(sched.targetId).select('name code');
            console.log(`Enriched schedule ${sched._id} with class:`, sched.classId ? sched.classId.name : 'null');
        }
    }

    console.log('Sending teacher schedules. Sample classId from first schedule:', schedules[0]?.classId);

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
