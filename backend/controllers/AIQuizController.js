const SelfQuiz = require('../models/SelfQuiz');
const Course = require('../models/Course');
const AiService = require('../services/AiService');

// @desc    Generate a self-evaluation quiz
// @route   POST /api/ai/quiz
// @access  Private
exports.generateSelfQuiz = async (req, res) => {
    try {
        const { courseId, type } = req.body;
        const studentId = req.user._id;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        const countMap = {
            'quick': 5,
            'deep': 10,
            'exam': 20
        };
        const count = countMap[type] || 5;

        // Generate quiz using AI
        const questions = await AiService.generateQuiz(course.content || course.summary, count);

        const selfQuiz = await SelfQuiz.create({
            courseId,
            studentId,
            questions,
            quizType: type || 'quick'
        });

        res.status(201).json(selfQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a specific self-quiz
// @route   GET /api/ai/quiz/:id
// @access  Private
exports.getSelfQuiz = async (req, res) => {
    try {
        const quiz = await SelfQuiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        
        if (quiz.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit self-evaluation quiz result
// @route   PUT /api/ai/quiz/:id/submit
// @access  Private
exports.submitSelfQuiz = async (req, res) => {
    try {
        const { score } = req.body;
        const quiz = await SelfQuiz.findById(req.params.id);

        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        if (quiz.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        quiz.score = score;
        quiz.completed = true;
        await quiz.save();

        res.json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
