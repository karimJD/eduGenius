const Quiz = require('../models/Quiz');
const AiService = require('../services/AiService');
const Course = require('../models/Course');

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Teacher/Admin)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, courseId, classId, settings, questions } = req.body;

    // If AI generation is requested
    let generatedQuestions = questions || [];
    if (req.body.isAIGenerated && req.body.generatedFrom) {
        // Fetch content from course or provided text
        let contentToProcess = req.body.generatedFrom;
        
        if (courseId && req.body.useCourseContent) {
            const course = await Course.findById(courseId);
            if (course) {
                contentToProcess = course.content || course.summary;
            }
        }

        if (contentToProcess) {
            try {
                generatedQuestions = await AiService.generateQuiz(contentToProcess, req.body.questionCount || 5);
            } catch (err) {
                console.error("AI Quiz Gen Error:", err);
                return res.status(500).json({ message: 'Failed to generate quiz from AI' });
            }
        }
    }

    const quiz = await Quiz.create({
      title,
      description,
      courseId,
      classId,
      teacherId: req.user._id,
      questions: generatedQuestions,
      settings,
      isAIGenerated: req.body.isAIGenerated || false,
      generatedFrom: req.body.generatedFrom,
      isPublished: req.body.isPublished || false
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
exports.getQuizzes = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
        // Students see published quizzes for their classes
        // Need to find classes student is in, but for now simplify:
        // TODO: Filter by student's classes
        query = { isPublished: true }; 
    } else if (req.user.role === 'teacher') {
        query = { teacherId: req.user._id };
    }

    const quizzes = await Quiz.find(query)
      .populate('courseId', 'title')
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'title')
      .populate('classId', 'name')
      .populate('teacherId', 'firstName lastName');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Role check logic can be added here (e.g., if private quiz)

    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Teacher/Admin)
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(quiz);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher/Admin)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user.role !== 'admin' && quiz.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await quiz.deleteOne();

    res.json({ message: 'Quiz removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
