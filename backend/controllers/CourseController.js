const Course = require('../models/Course');
const AiService = require('../services/AiService');
const pdf = require('pdf-parse');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Teacher/Admin)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, classId, level, subject } = req.body;
    let content = req.body.content || '';

    // Handle File Upload (Extract text for AI)
    let materials = [];
    if (req.file) {
        const data = await pdf(req.file.buffer);
        content += `\n\n--- File: ${req.file.originalname} ---\n\n${data.text}`;
        
        materials.push({
            type: 'PDF',
            name: req.file.originalname,
            url: '', // In a real app, upload to S3/Cloudinary and get URL
            size: req.file.size
        });
    }

    // Generate AI Content if content exists
    let summary = '';
    let quiz = [];
    if (content.length > 50) {
        try {
            summary = await AiService.generateSummary(content);
            quiz = await AiService.generateQuiz(content);
        } catch (err) {
            console.error('AI Generation failed:', err);
            // Continue without AI content
        }
    }

    const course = await Course.create({
      title,
      description,
      content, // Legacy field for AI context
      summary,
      quiz,
      level,
      subject,
      classId,
      teacherId: req.user._id,
      chapters: [{
          title: 'Introduction',
          order: 1,
          materials: materials
      }]
    });

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    let query = {};
    
    // Filter based on role
    if (req.user.role === 'student') {
        // Students see courses for their classes or public ones
        // For now, let's just return all published courses or filter by class if implemented
        query = { isPublished: true };
    } else if (req.user.role === 'teacher') {
        query = { teacherId: req.user._id };
    }

    const courses = await Course.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Teacher/Admin)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Teacher/Admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();

    res.json({ message: 'Course removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Generate/Update Course Summary (AI)
// @route   POST /api/courses/:id/summary
// @access  Private (Teacher/Admin)
exports.updateCourseSummary = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (!course.content) return res.status(400).json({ message: 'No content to summarize' });

        const summary = await AiService.generateSummary(course.content);
        course.summary = summary;
        await course.save();

        res.json({ summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Generate Course Quiz (AI)
// @route   POST /api/courses/:id/quiz
// @access  Private (Teacher/Admin)
exports.generateCourseQuiz = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (!course.content) return res.status(400).json({ message: 'No content for quiz generation' });

        const newQuiz = await AiService.generateQuiz(course.content);
        course.quiz.push(...newQuiz);
        await course.save();

        res.json(course.quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Course Quizzes
// @route   GET /api/courses/:id/quizzes
// @access  Private
exports.getCourseQuizzes = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        res.json(course.quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
