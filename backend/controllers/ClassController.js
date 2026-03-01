const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher/Admin)
exports.createClass = async (req, res) => {
  try {
    const { name, description, schedule } = req.body;

    const newClass = await Class.create({
      name,
      description,
      teacherId: req.user._id,
      schedule,
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
      query = { studentIds: req.user._id };
    } 
    // If teacher, only show classes they teach
    else if (req.user.role === 'teacher') {
      query = { teacherId: req.user._id };
    }
    // Admin sees all
    if (req.user.role === 'admin') {
      query = {}; // No filter, get all
    }

    const classes = await Class.find(query)
      .populate('teacherId', 'firstName lastName email')
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
      .populate('teacherId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email');

    if (!classItem) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check access rights
    if (req.user.role === 'student' && !classItem.studentIds.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this class' });
    }
    if (req.user.role === 'teacher' && classItem.teacherId._id.toString() !== req.user._id.toString()) {
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

    if (classItem.studentIds.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    classItem.studentIds.push(req.user._id);
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
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
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
    if (req.user.role !== 'admin' && classItem.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    await classItem.deleteOne();

    res.json({ message: 'Class removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
