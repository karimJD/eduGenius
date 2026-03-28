const Quiz = require('../../models/Quiz');
const Submission = require('../../models/Submission');

const getAssignedAssessments = async (req, res) => {
  try {
    const { classId, type } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (type) filter.type = type;
    
    const assessments = await Quiz.find(filter);
    res.status(200).json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAssessmentDetails = async (req, res) => {
  try {
    const assessment = await Quiz.findById(req.params.id);
    res.status(200).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const startAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const assessment = await Quiz.findById(id);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const submission = new Submission({
      quizId: id,
      studentId,
      classId: assessment.classId,
      submissionType: assessment.type || 'quiz',
      status: 'in-progress',
      startedAt: new Date(),
      answers: assessment.questions.map(q => ({
        questionId: q._id,
        answer: null
      }))
    });

    await submission.save();
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const { id } = req.params; // quizId or submissionId based on route mapping, let's assume submissionId
    const submissionId = req.body.submissionId || id;
    const studentId = req.user._id;

    const submission = await Submission.findById(submissionId).populate('quizId');
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    let totalScore = 0;
    const quiz = submission.quizId;

    submission.answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (question && ['mcq', 'true-false'].includes(question.type)) {
        if (answer.answer === question.correctAnswer) {
          answer.isCorrect = true;
          totalScore += question.points || 1;
        } else {
          answer.isCorrect = false;
        }
      }
    });

    submission.score = totalScore;
    submission.status = 'submitted';
    submission.submittedAt = new Date();

    await submission.save();
    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAssignedAssessments,
  getAssessmentDetails,
  startAssessment,
  submitAssessment
};
