const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const Exam = require('../models/Exam');
const AiService = require('../services/AiService');

// @desc    Submit a quiz or exam attempt
// @route   POST /api/submissions
// @access  Private (Student)
exports.createSubmission = async (req, res) => {
  try {
    const { quizId, examId, answers, timeSpent } = req.body;
    
    // Validate either quizId OR examId
    if ((!quizId && !examId) || (quizId && examId)) {
        return res.status(400).json({ message: 'Either quizId or examId is required, not both' });
    }

    // Fetch the assessment source (Quiz or Exam)
    let assessment;
    let type = '';
    if (quizId) {
        assessment = await Quiz.findById(quizId);
        type = 'quiz';
    } else {
        assessment = await Exam.findById(examId);
        type = 'exam';
    }

    if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
    }

    // Basic Scoring Logic
    let score = 0;
    let totalPoints = 0;
    let gradedAnswers = [];

    // For simplicity, assuming all questions have same weight for now
    // and matching index-based answers. Robust logic would match question IDs.
    
    assessment.questions.forEach((question, index) => {
        const studentAnswer = answers[index];
        totalPoints += 1; // Or question.points if existed

        // Simple check for MCQ/TrueFalse (index based)
        // Adjust logic if string based answers
        let isCorrect = false;
        if (studentAnswer !== undefined && studentAnswer === question.correctAnswerIndex) {
            score += 1;
            isCorrect = true;
        }
        
        gradedAnswers.push({
            questionIndex: index,
            studentAnswer,
            isCorrect
        });
    });

    const percentage = (score / totalPoints) * 100;

    // AI Mistake Explanation (Optional but good for UX)
    let mistakeExplanation = '';
    const wrongAnswers = gradedAnswers.filter(a => !a.isCorrect);
    
    // Only generate explanation for quizzes needed context (not exams where feedback might be delayed)
    // AND if mistakes exist
    if (type === 'quiz' && wrongAnswers.length > 0 && assessment.courseId) {
         // Logic to get course content and call AI would go here
         // Keeping simpler for now to avoid overhead
    }

    const submission = await Submission.create({
        studentId: req.user._id,
        quizId,
        examId,
        answers: gradedAnswers, // Storing processed answers
        score,
        totalPoints,
        percentage,
        timeSpent,
        status: 'graded',
        mistakeExplanation
    });

    // Update user progress if needed (legacy or new model)

    res.status(201).json(submission);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get submissions for user
// @route   GET /api/submissions
// @access  Private
exports.getSubmissions = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'student') {
            query = { studentId: req.user._id };
        } else if (req.user.role === 'teacher') {
            // Complex: find submissions for quizzes/exams created by this teacher
            // This requires aggregation or two-step query.
            // Simplified: return empty or specific course submissions
            // For now, let's just return submissions if filtered by quizId in query params
            if (req.query.quizId) query.quizId = req.query.quizId;
            if (req.query.examId) query.examId = req.query.examId;
        }

        const submissions = await Submission.find(query)
            .populate('studentId', 'firstName lastName')
            .populate('quizId', 'title')
            .populate('examId', 'title')
            .sort({ submittedAt: -1 });

        res.json(submissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate('studentId', 'firstName lastName')
            .populate('quizId', 'title')
            .populate('examId', 'title');

        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        // Access Check
        if (req.user.role === 'student' && submission.studentId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Teachers should access if they own the quiz/exam (requires extra lookup)

        res.json(submission);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
