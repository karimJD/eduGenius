const mongoose = require('mongoose');
const axios = require('axios');
const PDFParser = require('pdf2json');
const OllamaService = require('../../services/OllamaService');
const Course = require('../../models/Course');
const Subject = require('../../models/Subject');
const StudyMaterial = require('../../models/StudyMaterial');
const StudentQuizAttempt = require('../../models/StudentQuizAttempt');
const Submission = require('../../models/Submission');
const {
  emitSummaryGenerated,
  emitSummaryError,
} = require('../../sockets/aiToolsHandlers');

// ─── PDF Text Extraction ───────────────────────────────────────────────────────
const extractPdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const text = pdfParser.getRawTextContent();
        resolve(text);
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.on('pdfParser_dataError', (err) => {
      reject(new Error(err.parserError || 'PDF parsing failed'));
    });

    pdfParser.parseBuffer(buffer);
  });
};

// ─── Content Extraction ────────────────────────────────────────────────────────
const extractTextFromContent = async (
  courseId,
  chapterIds = [],
  selectedMaterialIds = [],
) => {
  const course = await Course.findById(courseId);
  if (!course) return 'Contenu introuvable.';

  let content = '';

  const getAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl =
      process.env.BASE_URL ||
      `${process.env.API_URL || 'http://localhost:5000'}`;
    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };

  const parseMaterialPdf = async (material) => {
    const fileUrl = getAbsoluteUrl(material.url);
    if (!fileUrl) {
      console.error(`Missing URL for material: ${material.name}`);
      return '(URL du fichier manquant)';
    }
    console.log(`Fetching PDF from URL: ${fileUrl}`);
    try {
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      console.log(
        `Response status: ${response.status}, data length: ${response.data?.length}`,
      );
      const text = await extractPdfText(Buffer.from(response.data));
      console.log('Extracted text length:', text.length);
      console.log('Extracted text preview:', text.substring(0, 300));
      return text;
    } catch (error) {
      console.error(`Failed to parse PDF "${material.name}":`, error.message);
      return `(Erreur lors de l'extraction du contenu de ce fichier)`;
    }
  };

  const isPdfMaterial = (material) =>
    material.type === 'pdf' ||
    (material.type === 'file' &&
      material.url &&
      material.url.toLowerCase().endsWith('.pdf'));

  // ── Selected materials ────────────────────────────────────────────────────
  if (selectedMaterialIds.length > 0) {
    for (const chapter of course.chapters) {
      for (const material of chapter.materials) {
        if (selectedMaterialIds.includes(material._id.toString())) {
          content += `\n\n--- Contenu de : ${material.name} ---\n`;
          if (isPdfMaterial(material)) {
            content += await parseMaterialPdf(material);
          } else {
            content += `${material.name} - ${material.type}`;
          }
        }
      }
    }
  }
  // ── Selected chapters ─────────────────────────────────────────────────────
  else if (chapterIds.length > 0) {
    for (const id of chapterIds) {
      const chapter = course.chapters.id(id);
      if (chapter) {
        content += `\n\n### Chapitre : ${chapter.title}\n`;
        content += chapter.description || '';

        for (const material of chapter.materials) {
          if (isPdfMaterial(material)) {
            const text = await parseMaterialPdf(material);
            content += `\n\n--- Contenu de : ${material.name} ---\n${text}`;
          }
        }
      }
    }
  }
  // ── Full course ───────────────────────────────────────────────────────────
  else {
    content = `${course.title}\n${course.description}\n\n`;
    content += course.content || '';
  }

  return content;
};

// ─── Controllers ───────────────────────────────────────────────────────────────

const generateSummary = async (req, res) => {
  try {
    const {
      classId,
      courseId,
      chapterId,
      selectedChapters,
      selectedMaterials,
      style,
      difficulty,
    } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId =
      courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;

    const contentText = await extractTextFromContent(
      targetCourseId,
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || [],
    );

    const summaryText = await OllamaService.generateSummary(
      contentText,
      style || 'detailed',
    );

    // Get course info for title
    const course = await Course.findById(targetCourseId);

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId: targetCourseId,
      type: 'summary',
      title: `Résumé ${course?.name || 'IA'}`,
      content: summaryText,
      isAIGenerated: true,
      aiGenerationParams: {
        sourceChapterId: chapterId,
        summaryLength: 'medium',
        difficulty: difficulty || 'medium',
        generatedAt: new Date(),
      },
    });
    await studyMaterial.save();

    // Populate the response data with course info for frontend display
    const populatedSummary = {
      ...studyMaterial.toObject(),
      course: { name: course?.name || 'IA' },
    };

    // Emit socket event to notify user
    if (global.io) {
      emitSummaryGenerated(
        global.io,
        req.user._id.toString(),
        populatedSummary,
      );
    }

    res.status(200).json({ success: true, data: populatedSummary });
  } catch (error) {
    console.error('Error in generateSummary:', error);

    // Emit error event to notify user
    if (global.io) {
      emitSummaryError(global.io, req.user._id.toString(), error.message);
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

const getSummaries = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const summaries = await StudyMaterial.find({
      studentId,
      type: 'summary',
    })
    .populate({
      path: 'courseId',
      populate: { path: 'subjectId', select: 'name code' }
    })
    .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: summaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());

    const summary = await StudyMaterial.findOneAndDelete({
      _id: id,
      studentId,
      type: 'summary',
    });

    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: 'Résumé non trouvé' });
    }

    res
      .status(200)
      .json({ success: true, message: 'Résumé supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateFlashcards = async (req, res) => {
  try {
    const {
      classId,
      courseId,
      chapterId,
      selectedChapters,
      selectedMaterials,
    } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId =
      courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;

    const contentText = await extractTextFromContent(
      targetCourseId,
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || [],
    );

    const generatedFlashcards =
      await OllamaService.generateFlashcards(contentText);

    const studyMaterial = new StudyMaterial({
      studentId,
      classId,
      courseId: targetCourseId,
      type: 'flashcard',
      title: `Flashcards IA - ${new Date().toLocaleDateString()}`,
      flashcards: generatedFlashcards,
      isAIGenerated: true,
      aiGenerationParams: {
        sourceChapterId: chapterId,
        generatedAt: new Date(),
      },
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
    
    const query = {
      studentId,
      type: 'flashcard',
    };

    if (classId && classId !== 'all') {
      query.classId = new mongoose.Types.ObjectId(classId);
    }

    const materials = await StudyMaterial.find(query).populate({
      path: 'courseId',
      populate: { path: 'subjectId', select: 'name code' }
    });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePracticeQuiz = async (req, res) => {
  try {
    const {
      classId,
      courseId,
      chapterId,
      selectedChapters,
      selectedMaterials,
      numberOfQuestions,
    } = req.body;
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const mongooseClassId = new mongoose.Types.ObjectId(classId);

    const targetCourseId =
      courseId || (await Course.findOne({ classId: mongooseClassId }))?._id;

    const contentText = await extractTextFromContent(
      targetCourseId,
      selectedChapters || (chapterId ? [chapterId] : []),
      selectedMaterials || [],
    );

    const generatedQuestions = await OllamaService.generateQuiz(
      contentText,
      numberOfQuestions || 5,
    );

    const questions = generatedQuestions.map((q) => ({
      question: q.question,
      type: 'mcq',
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex],
      explanation: q.explanation || "Pas d'explication disponible.",
      points: 1,
    }));

    const attempt = new StudentQuizAttempt({
      studentId,
      classId,
      courseId: targetCourseId,
      chapterId: chapterId || (selectedChapters ? selectedChapters[0] : null),
      quizTitle: "Quiz d'entraînement IA",
      isPracticeQuiz: true,
      questions,
      aiGenerationParams: { numberOfQuestions, generatedAt: new Date() },
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

    if (!attempt)
      return res
        .status(404)
        .json({ success: false, message: 'Attempt not found' });

    let score = 0;
    attempt.questions.forEach((q, idx) => {
      q.studentAnswer = answers[idx];
      q.isCorrect = q.studentAnswer === q.correctAnswer;
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
    const history = await StudentQuizAttempt.find({
      studentId,
      isPracticeQuiz: true,
    })
    .populate({
      path: 'courseId',
      populate: { path: 'subjectId', select: 'name code' }
    })
    .sort({ createdAt: -1 });
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
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: 'Quiz introuvable' });

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
        aiRecommendations: 'Revisez plus la matière 1.',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const explainText = async (req, res) => {
  try {
    const { selectedText, userQuestion, summaryContext } = req.body;
    if (!selectedText || !userQuestion || !summaryContext) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing parameters' });
    }

    const explanation = await OllamaService.explainText(
      selectedText,
      userQuestion,
      summaryContext,
    );

    res.status(200).json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateSummary,
  getSummaries,
  deleteSummary,
  generateFlashcards,
  getFlashcards,
  generatePracticeQuiz,
  submitPracticeQuiz,
  getPracticeHistory,
  getPracticeQuizById,
  getRecommendations,
  explainText,
};
