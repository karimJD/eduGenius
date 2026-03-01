const Exam = require('../models/Exam');
const Class = require('../models/Class');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Teacher/Admin)
exports.createExam = async (req, res) => {
  try {
    const { title, description, courseId, classId, settings, questions, passingScore } = req.body;

    const exam = await Exam.create({
      title,
      description,
      courseId,
      classId,
      teacherId: req.user._id,
      questions,
      settings, // start/end dates, duration, proctoring
      passingScore,
      isPublished: req.body.isPublished || false
    });

    res.status(201).json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
exports.getExams = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
        // Validation for student access (e.g., enrolled classes)
        query = { isPublished: true }; 
    } else if (req.user.role === 'teacher') {
        query = { teacherId: req.user._id };
    }

    const exams = await Exam.find(query)
      .populate('courseId', 'title')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.json(exams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('classId', 'name')
      .populate('teacherId', 'firstName lastName');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Teacher/Admin)
exports.updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Teacher/Admin)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (req.user.role !== 'admin' && exam.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await exam.deleteOne();

    res.json({ message: 'Exam removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
