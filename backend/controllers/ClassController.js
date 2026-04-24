const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher/Admin)
exports.createClass = async (req, res) => {
  try {
    const { name, code, departmentId, programId, academicYearId, level } = req.body;

    const newClass = await Class.create({
      name,
      code,
      departmentId,
      programId,
      academicYearId,
      level,
      teachers: [{ teacherId: req.user._id, subjectId: req.body.subjectId || null }],
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
  try {
    let query = {};
    
    // If student, only show classes they are enrolled in
    if (req.user.role === 'student') {
      query = { 'students.studentId': req.user._id, 'students.status': 'enrolled' };
    } 
    // If teacher, only show classes they teach
    else if (req.user.role === 'teacher') {
      query = { 'teachers.teacherId': req.user._id };
    }
    // Admin sees all
    else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      query = {}; // No filter, get all
    }

    const classes = await Class.find(query)
      .populate('teachers.teacherId', 'firstName lastName email')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
exports.getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teachers.teacherId', 'firstName lastName email')
      .populate('teachers.subjectId', 'name code')
      .populate('students.studentId', 'firstName lastName email studentId cin')
      .populate('departmentId', 'name')
      .populate('programId', 'name')
      .populate('academicYearId', 'year')
      .populate('academicAdvisorId', 'firstName lastName email');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access rights
    const isStudent = req.user.role === 'student';
    const isTeacher = req.user.role === 'teacher';
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (isStudent && !classItem.students.some(s => s.studentId?._id?.toString() === req.user._id.toString() || s.studentId?.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this class' });
    }
    if (isTeacher && !classItem.teachers.some(t => t.teacherId?._id?.toString() === req.user._id.toString() || t.teacherId?.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this class' });
    }

    res.json(classItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Join a class using code
// @route   POST /api/classes/join
// @access  Private (Student)
exports.joinClass = async (req, res) => {
  try {
    const { code } = req.body;

    const classItem = await Class.findOne({ code });

    if (!classItem) {
      return res.status(404).json({ message: 'Invalid class code' });
    }

    const alreadyEnrolled = classItem.students.some(s => s.studentId?.toString() === req.user._id.toString());
    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    classItem.students.push({ studentId: req.user._id, enrollmentDate: new Date(), status: 'enrolled' });
    classItem.currentEnrollment = classItem.students.filter(s => s.status === 'enrolled').length;
    await classItem.save();

    res.json({ message: 'Successfully joined class', classId: classItem._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private (Teacher/Admin)
exports.updateClass = async (req, res) => {
  try {
    let classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check ownership
    const isTeacher = classItem.teachers.some(t => t.teacherId.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }

    classItem = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(classItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Teacher/Admin)
exports.deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check ownership
    const isTeacher = classItem.teachers.some(t => t.teacherId.toString() === req.user._id.toString());
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await classItem.deleteOne();

    res.json({ message: 'Class removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
