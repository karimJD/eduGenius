const Quiz = require('../../models/Quiz');
const Submission = require('../../models/Submission');
const Course = require('../../models/Course');
const WorkSubmission = require('../../models/WorkSubmission');
const User = require('../../models/User');
const mongoose = require('mongoose');

const getAssignedAssessments = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { classId: queryClassId } = req.query;
    
    // Get student's classId if not provided in query
    let classId = queryClassId;
    if (!classId) {
      const user = await req.user.populate('student.classId');
      classId = user.student?.classId?._id || user.student?.classId;
    }

    if (!classId) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 1. Fetch Quizzes (traditional assessments)
    const quizzes = await Quiz.find({ classId })
      .populate('subjectId', 'name code')
      .lean();

    // 2. Fetch Exercises from Courses
    const courses = await Course.find({ classId })
      .populate('subjectId', 'name code')
      .lean();

    let exercises = [];
    courses.forEach(course => {
      course.chapters.forEach(chapter => {
        if (chapter.isPublished && chapter.exercises && chapter.exercises.length > 0) {
          chapter.exercises.forEach(ex => {
            exercises.push({
              _id: ex._id,
              title: ex.name,
              type: 'assignment',
              courseId: course._id,
              subjectId: course.subjectId,
              chapterId: chapter._id,
              dueDate: ex.dueDate,
              questions: [], // No fixed questions for file assignments
              duration: 0,
              isExercise: true,
              classId: course.classId
            });
          });
        }
      });
    });

    // 3. Get all submissions (Quizzes and Exercises)
    const [quizSubmissions, workSubmissions] = await Promise.all([
      Submission.find({ studentId, status: 'submitted' }).lean(),
      WorkSubmission.find({ studentId }).lean()
    ]);

    const submittedQuizIds = new Set(quizSubmissions.map(s => s.quizId?.toString()));
    const submittedWorkIds = new Set(workSubmissions.map(s => s.exerciseId?.toString()));

    // 4. Merge and format
    const allAssessments = [
      ...quizzes.map(q => {
        const sub = quizSubmissions.find(s => s.quizId?.toString() === q._id.toString());
        return {
          ...q,
          type: 'quiz',
          status: sub ? sub.status : 'assigned',
          hasSubmitted: sub ? sub.status === 'submitted' : false,
          score: sub ? (sub.percentage || sub.score) : null
        };
      }),
      ...exercises.map(ex => {
        const sub = workSubmissions.find(s => s.exerciseId?.toString() === ex._id.toString());
        return {
          ...ex,
          status: sub ? 'submitted' : 'assigned',
          hasSubmitted: !!sub,
          score: sub ? sub.grade : null
        };
      })
    ];

    res.status(200).json({ success: true, data: allAssessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
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
    let maxPoints = 0;
    const quiz = submission.quizId;

    submission.answers.forEach(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (question) {
        maxPoints += question.points || 1;
        if (['mcq', 'true-false'].includes(question.type)) {
          if (answer.answer === question.correctAnswer) {
            answer.isCorrect = true;
            totalScore += question.points || 1;
          } else {
            answer.isCorrect = false;
          }
        }
      }
    });

    submission.score = totalScore;
    submission.totalPoints = maxPoints;
    submission.percentage = maxPoints > 0 ? (totalScore / maxPoints) * 100 : 0;
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
