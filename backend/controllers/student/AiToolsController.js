const AiService = require('../../services/AiService');
const Course = require('../../models/Course');
const StudyMaterial = require('../../models/StudyMaterial');
const StudentQuizAttempt = require('../../models/StudentQuizAttempt');
const Submission = require('../../models/Submission');

// Helper to extract text from a chapter or course
const extractTextFromContent = async (reqClassId, chapterId) => {
  // In a real app, you would fetch actual files/text. Providing mock content here.
  const course = await Course.findOne({ classId: reqClassId });
  let content = "Contenu de cours générique pour l'analyse IA.";
  if (course) {
    if (chapterId) {
      const chapter = course.chapters.id(chapterId);
      if (chapter) content = chapter.title + ' ' + (chapter.description || '');
    } else {
      content = course.title + ' ' + course.description;
    }
  }
  return content;
};

const generateSummary = async (req, res) => {
  try {
    const { classId, courseId, chapterId, length, difficulty } = req.body;
    const studentId = req.user._id;

    const contentText = await extractTextFromContent(classId, chapterId);
    const summaryText = await AiService.generateSummary(contentText);

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId,
      chapterId,
      type: 'summary',
      title: 'Résumé IA',
      content: summaryText,
      isAIGenerated: true,
      aiGenerationParams: { sourceChapterId: chapterId, summaryLength: length || 'medium', difficulty: difficulty || 'medium', generatedAt: new Date() }
    });
    await studyMaterial.save();

    res.status(200).json({ success: true, data: studyMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSummaries = async (req, res) => {
  try {
    const studentId = req.user._id;
    const summaries = await StudyMaterial.find({ studentId, type: 'summary' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateFlashcards = async (req, res) => {
  try {
    const { classId, courseId, chapterId, numberOfCards } = req.body;
    const studentId = req.user._id;

    // A simplified prompt for flashcards using the AiService
    // Since AiService doesn't have generateFlashcards, we reuse enhanced summary or a direct model call.
    // We'll mock the flashcards generation logic here relying on standard properties.
    const flashcardsMock = [
      { front: 'Question 1', back: 'Réponse 1', difficulty: 'medium' },
      { front: 'Question 2', back: 'Réponse 2', difficulty: 'medium' }
    ];

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId,
      chapterId,
      type: 'flashcard',
      title: 'Flashcards IA',
      flashcards: flashcardsMock,
      isAIGenerated: true,
      aiGenerationParams: { sourceChapterId: chapterId, generatedAt: new Date() }
    });
    await studyMaterial.save();

    res.status(200).json({ success: true, data: studyMaterial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFlashcards = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id;
    const materials = await StudyMaterial.find({ studentId, classId, type: 'flashcard' });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePracticeQuiz = async (req, res) => {
  try {
    const { classId, courseId, chapterId, numberOfQuestions } = req.body;
    const studentId = req.user._id;

    const contentText = await extractTextFromContent(classId, chapterId);
    // AiService returns parsed JSON array of questions
    const generatedQuestions = await AiService.generateQuiz(contentText, numberOfQuestions || 5);

    const questions = generatedQuestions.map(q => ({
      question: q.question,
      type: 'mcq',
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      points: 1
    }));

    const attempt = new StudentQuizAttempt({
      studentId, classId, courseId, chapterId,
      quizTitle: 'Quiz d\'entraînement IA',
      isPracticeQuiz: true,
      questions,
      aiGenerationParams: { numberOfQuestions, generatedAt: new Date() }
    });

    await attempt.save();
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitPracticeQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // array of answered question options
    const attempt = await StudentQuizAttempt.findById(id);

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    let score = 0;
    attempt.questions.forEach((q, idx) => {
      q.studentAnswer = answers[idx];
      q.isCorrect = (q.studentAnswer === q.correctAnswer);
      if (q.isCorrect) score += q.points;
      // Ideally generate explanation using AiService.explainMistakes
    });

    attempt.score = score;
    attempt.totalPoints = attempt.questions.length;
    attempt.percentage = (score / attempt.questions.length) * 100;
    attempt.completedAt = new Date();

    await attempt.save();
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPracticeHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const history = await StudentQuizAttempt.find({ studentId, isPracticeQuiz: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id;
    
    // Simple mock logic for recommendations
    res.status(200).json({ 
      success: true, 
      data: {
        weakTopics: ['Matière 1'],
        aiRecommendations: 'Revisez plus la matière 1.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSummary,
  getSummaries,
  generateFlashcards,
  getFlashcards,
  generatePracticeQuiz,
  submitPracticeQuiz,
  getPracticeHistory,
  getRecommendations
};
