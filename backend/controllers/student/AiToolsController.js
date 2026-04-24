const pdf = require('pdf-parse');
const axios = require('axios');
const OllamaService = require('../../services/OllamaService');
const Course = require('../../models/Course');
const Subject = require('../../models/Subject');
const StudyMaterial = require('../../models/StudyMaterial');
const StudentQuizAttempt = require('../../models/StudentQuizAttempt');
const Submission = require('../../models/Submission');

// Helper to extract text from a chapter or course
const extractTextFromContent = async (courseId, chapterIds = [], selectedMaterialIds = []) => {
  const course = await Course.findById(courseId);
  if (!course) return "Contenu introuvable.";

  let content = "";
  
  // If specific materials are selected
  if (selectedMaterialIds.length > 0) {
    for (const chapter of course.chapters) {
      for (const material of chapter.materials) {
        if (selectedMaterialIds.includes(material._id.toString())) {
          content += `\n\n--- Contenu de : ${material.name} ---\n`;
          if (material.type === 'pdf') {
            try {
              const response = await axios.get(material.url, { responseType: 'arraybuffer' });
              const pdfData = await pdf(response.data);
              content += pdfData.text;
            } catch (error) {
              console.error(`Failed to parse PDF ${material.name}:`, error);
              content += `(Erreur lors de l'extraction du contenu de ce fichier)`;
            }
          } else {
            content += `${material.name} - ${material.type}`;
          }
        }
      }
    }
  } 
  // Otherwise check if chapters are selected
  else if (chapterIds.length > 0) {
    for (const id of chapterIds) {
      const chapter = course.chapters.id(id);
      if (chapter) {
        content += `\n\n### Chapitre : ${chapter.title}\n`;
        content += chapter.description || '';
        
        // Also extract from all PDF materials in the chapter
        for (const material of chapter.materials) {
          if (material.type === 'pdf') {
            try {
              const response = await axios.get(material.url, { responseType: 'arraybuffer' });
              const pdfData = await pdf(response.data);
              content += `\n\n--- Contenu de : ${material.name} ---\n${pdfData.text}`;
            } catch (error) {
              console.error(`Failed to parse PDF in chapter:`, error);
            }
          }
        }
      }
    }
  } else {
    // Full course summary
    content = `${course.title}\n${course.description}\n\n`;
    // Optionally extract from all PDFs in all chapters if it's not too large
    // For now, let's keep it simple and just use the metadata if full course
    content += course.content || '';
  }

  return content;
};

const generateSummary = async (req, res) => {
  try {
    const { classId, courseId, chapterId, selectedChapters, selectedMaterials, style, difficulty } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId = courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;
    const contentText = await extractTextFromContent(
      targetCourseId, 
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || []
    );
    
    const summaryText = await OllamaService.generateSummary(contentText, style || 'detailed');

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId: targetCourseId,
      type: 'summary',
      title: `Résumé IA - ${new Date().toLocaleDateString()}`,
      content: summaryText,
      isAIGenerated: true,
      aiGenerationParams: { 
        sourceChapterId: chapterId, 
        summaryLength: 'medium', 
        difficulty: difficulty || 'medium', 
        generatedAt: new Date() 
      }
    });
    await studyMaterial.save();

    res.status(200).json({ success: true, data: studyMaterial });
  } catch (error) {
    console.error('Error in generateSummary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSummaries = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const summaries = await StudyMaterial.find({ studentId, type: 'summary' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateFlashcards = async (req, res) => {
  try {
    const { classId, courseId, chapterId, selectedChapters, selectedMaterials } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId = courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;
    const contentText = await extractTextFromContent(
      targetCourseId, 
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || []
    );

    const generatedFlashcards = await OllamaService.generateFlashcards(contentText);

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId: targetCourseId,
      type: 'flashcard',
      title: `Flashcards IA - ${new Date().toLocaleDateString()}`,
      flashcards: generatedFlashcards,
      isAIGenerated: true,
      aiGenerationParams: { sourceChapterId: chapterId, generatedAt: new Date() }
    });
    await studyMaterial.save();

    res.status(200).json({ success: true, data: studyMaterial });
  } catch (error) {
    console.error('Error in generateFlashcards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFlashcards = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);
    const materials = await StudyMaterial.find({ studentId, classId: mongooseClassId, type: 'flashcard' });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePracticeQuiz = async (req, res) => {
  try {
    const { classId, courseId, chapterId, selectedChapters, selectedMaterials, numberOfQuestions } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId = courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;
    const contentText = await extractTextFromContent(
      targetCourseId, 
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || []
    );
    
    const generatedQuestions = await OllamaService.generateQuiz(contentText, numberOfQuestions || 5);

    const questions = generatedQuestions.map(q => ({
      question: q.question,
      type: 'mcq',
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      points: 1
    }));

    const attempt = new StudentQuizAttempt({
      studentId, 
      classId, 
      courseId: targetCourseId, 
      chapterId: chapterId || (selectedChapters ? selectedChapters[0] : null),
      quizTitle: 'Quiz d\'entraînement IA',
      isPracticeQuiz: true,
      questions,
      aiGenerationParams: { numberOfQuestions, generatedAt: new Date() }
    });

    await attempt.save();
    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    console.error('Error in generatePracticeQuiz:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitPracticeQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const attempt = await StudentQuizAttempt.findById(id);

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    let score = 0;
    attempt.questions.forEach((q, idx) => {
      q.studentAnswer = answers[idx];
      q.isCorrect = (q.studentAnswer === q.correctAnswer);
      if (q.isCorrect) score += q.points;
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
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const history = await StudentQuizAttempt.find({ studentId, isPracticeQuiz: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPracticeQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    
    const quiz = await StudentQuizAttempt.findOne({ _id: id, studentId });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz introuvable' });
    
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user._id;
    
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
  getPracticeQuizById,
  getRecommendations
};

