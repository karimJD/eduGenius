const mongoose = require('mongoose');
const ArenaChallenge = require('../../models/ArenaChallenge');
const ArenaQuest     = require('../../models/ArenaQuest');
const ArenaProgress  = require('../../models/ArenaProgress');
const StudentQuizAttempt = require('../../models/StudentQuizAttempt');
const Class   = require('../../models/Class');
const Course  = require('../../models/Course');
const User    = require('../../models/User');
const AiService = require('../../services/AiService');
const axios = require('axios');
const PDFParser = require('pdf2json');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalize a date to midnight UTC */
const toMidnight = (d = new Date()) => {
  const day = new Date(d);
  day.setUTCHours(0, 0, 0, 0);
  return day;
};

/** Get Monday of the current week (UTC) */
const getWeekStart = () => {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

/** Get Sunday 23:59:59 of current week (UTC) */
const getWeekEnd = () => {
  const start = getWeekStart();
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
};

/** Extract text from a PDF URL */
const extractPdfText = (buffer) => new Promise((resolve, reject) => {
  const parser = new PDFParser(null, 1);
  parser.on('pdfParser_dataReady', () => { try { resolve(parser.getRawTextContent()); } catch(e) { reject(e); } });
  parser.on('pdfParser_dataError', (e) => reject(new Error(e.parserError || 'PDF parse failed')));
  parser.parseBuffer(buffer);
});

const getAbsoluteUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.BASE_URL || process.env.API_URL || 'http://localhost:5000';
  return `${base}${url.startsWith('/') ? url : '/' + url}`;
};

const parseMaterialPdf = async (material) => {
  if (!material.url) return '';
  const url = material.url;
  try {
    const fs = require('fs');
    const path = require('path');

    // ── 1. S3 URL (private bucket) → use AWS SDK ──────────────────────────────
    const s3Match = url.match(/s3(?:\.[\w-]+)?\.amazonaws\.com\/(.+)/);
    if (s3Match) {
      const key = decodeURIComponent(s3Match[1]);
      const { getS3Object } = require('../../utils/s3');
      const { stream } = await getS3Object(key);
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return await extractPdfText(Buffer.concat(chunks));
    }

    // ── 2. Local /uploads/... path → read from disk ───────────────────────────
    const relativePath = url.replace(/^\//, '');
    const diskPath = path.join(__dirname, '../../', relativePath);
    if (fs.existsSync(diskPath)) {
      return await extractPdfText(fs.readFileSync(diskPath));
    }

    // ── 3. Fallback: plain HTTP (for public external URLs) ────────────────────
    const fileUrl = getAbsoluteUrl(url);
    if (!fileUrl) return '';
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer', timeout: 15000 });
    return await extractPdfText(Buffer.from(response.data));

  } catch (err) {
    console.warn(`[Arena] Failed to parse PDF "${material.name}":`, err.message);
    return '';
  }
};

const isPdfMaterial = (m) =>
  m.type === 'pdf' || (m.url && m.url.toLowerCase().endsWith('.pdf'));

/** Extract readable text from a course chapter — fetches PDF materials */
const getChapterText = async (course, chapter) => {
  let text = `${course.title}\nChapitre: ${chapter.title}\n${chapter.description || ''}\n`;
  for (const mat of chapter.materials || []) {
    if (isPdfMaterial(mat)) {
      const extracted = await parseMaterialPdf(mat);
      if (extracted) text += `\n--- ${mat.name} ---\n${extracted}`;
    }
  }
  return text.trim() || `${course.title} — ${chapter.title}`;
};

/** Pick the best published chapter from a course */
const pickBestChapter = (course) => {
  const chapters = (course.chapters || []).filter(c => c.isPublished !== false);
  if (chapters.length === 0) return course.chapters?.[0] || null;
  return chapters.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))[0];
};

/** Parse a course's best chapter and generate AI quiz questions */
const generateQuestionsForCourse = async (course, numQ) => {
  const chapter = pickBestChapter(course);
  if (!chapter) return null;
  try {
    const text = await getChapterText(course, chapter);
    const aiQuestions = await AiService.generateQuiz(text, numQ);
    if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) return null;
    return aiQuestions.map(q => ({
      question: q.question,
      type: 'mcq',
      options: q.options,
      correctAnswer: q.options[q.correctAnswerIndex] ?? q.options[0],
      points: 1,
    }));
  } catch (err) {
    console.warn(`[Arena] AI quiz generation failed for "${course.title}":`, err.message);
    return null;
  }
};

/** Find a student's classId from profile OR enrollment record */
const getStudentClassId = async (studentId) => {
  const user = await User.findById(studentId).select('student.classId').lean();
  let classId = user?.student?.classId;

  if (!classId) {
    // Fallback: search in Class collection
    const enrollment = await Class.findOne({ 'students.studentId': studentId }).select('_id').lean();
    if (enrollment) {
      classId = enrollment._id;
      // Self-heal: update user profile
      await User.updateOne({ _id: studentId }, { 'student.classId': classId });
    }
  }
  return classId;
};

/** Get or create the active ArenaChallenge for a class */
const getOrCreateChallenge = async (classId) => {
  const weekStart = getWeekStart();
  let challenge = await ArenaChallenge.findOne({ classId, weekStart });
  if (!challenge) {
    const cls = await Class.findById(classId).lean();
    const weekEnd = getWeekEnd();
    const df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
    challenge = await ArenaChallenge.create({
      classId,
      title: `Défi Arène — Semaine du ${df.format(weekStart)}`,
      weekStart,
      weekEnd,
    });
    // Mark previous challenges as ended
    await ArenaChallenge.updateMany(
      { classId, _id: { $ne: challenge._id }, status: 'active' },
      { status: 'ended' }
    );
  }
  return challenge;
};

/** Get subjects/courses available to a student in their class */
const getStudentCourses = async (studentId, classId) => {
  const courses = await Course.find({ classId, isPublished: true })
    .populate('subjectId', 'name code')
    .lean();
  return courses.filter(c => c.subjectId);
};

// ─── Controllers ────────────────────────────────────────────────────────────

/** GET /arena/challenge */
const getChallenge = async (req, res) => {
  try {
    const studentId = req.user._id;
    const classId = await getStudentClassId(studentId);
    if (!classId) return res.json({ success: true, data: null, message: 'no_class' });

    const challenge = await getOrCreateChallenge(classId);
    return res.json({ success: true, data: challenge });
  } catch (err) {
    console.error('getChallenge error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /arena/quests/today */
const getTodayQuests = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const classId = await getStudentClassId(studentId);
    if (!classId) return res.json({ success: true, data: [], challenge: null, message: 'no_class' });

    const challenge = await getOrCreateChallenge(classId);
    const today = toMidnight();

    // Check existing quests for today
    let quests = await ArenaQuest.find({ studentId, challengeId: challenge._id, date: today })
      .sort({ questIndex: 1 }).lean();

    if (quests.length < challenge.questsConfig.questsPerDay) {
      // Generate quest slots
      const courses = await getStudentCourses(studentId, classId);
      if (courses.length === 0) {
        return res.json({ success: true, data: [], challenge });
      }

      const existingIndexes = new Set(quests.map(q => q.questIndex));
      const toCreate = [];

      for (let i = 1; i <= challenge.questsConfig.questsPerDay; i++) {
        if (existingIndexes.has(i)) continue;
        // Round-robin subject assignment
        const course = courses[(i - 1) % courses.length];
        toCreate.push({
          challengeId: challenge._id,
          studentId,
          classId,
          subjectId: course.subjectId._id,
          courseId: course._id,
          subjectName: course.subjectId.name,
          date: today,
          questIndex: i,
          status: 'pending',
        });
      }

      if (toCreate.length > 0) {
        await ArenaQuest.insertMany(toCreate);
      }

      quests = await ArenaQuest.find({ studentId, challengeId: challenge._id, date: today })
        .sort({ questIndex: 1 }).lean();
    }

    return res.json({ success: true, data: quests, challenge });
  } catch (err) {
    console.error('getTodayQuests error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /arena/quests/:id/start — Return pre-generated quiz or generate on demand */
const startQuest = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const quest = await ArenaQuest.findOne({ _id: req.params.id, studentId });
    if (!quest) return res.status(404).json({ success: false, message: 'Quête introuvable' });
    if (quest.status === 'completed') return res.status(400).json({ success: false, message: 'Quête déjà terminée' });

    const challenge = await ArenaChallenge.findById(quest.challengeId);
    const numQ = challenge?.questsConfig?.questionsPerQuest || 5;
    const secondsPerQ = challenge?.questsConfig?.secondsPerQuestion || 20;

    // ── Reuse pre-generated attempt if already exists ──────────────────────
    if (quest.quizAttemptId) {
      const existing = await StudentQuizAttempt.findById(quest.quizAttemptId);
      if (existing && existing.questions && existing.questions.length > 0) {
        if (quest.status !== 'in_progress') {
          quest.status = 'in_progress';
          await quest.save();
        }
        const safeQuestions = existing.questions.map(q => ({
          _id: q._id,
          question: q.question,
          type: q.type,
          options: q.options,
          points: q.points,
        }));
        return res.json({ success: true, data: { questId: quest._id, attemptId: existing._id, questions: safeQuestions, secondsPerQuestion: secondsPerQ } });
      }
    }

    // ── Generate quiz on demand (fallback) ─────────────────────────────────
    let questions = [];
    try {
      const course = await Course.findById(quest.courseId).lean();
      if (course) {
        const generated = await generateQuestionsForCourse(course, numQ);
        if (generated) questions = generated;
      }
    } catch (aiErr) {
      console.warn('[Arena] On-demand AI generation failed:', aiErr.message);
    }

    // Fallback placeholder questions
    if (questions.length === 0) {
      questions = Array.from({ length: numQ }, (_, i) => ({
        question: `Question ${i + 1} — ${quest.subjectName}`,
        type: 'mcq',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 1,
      }));
    }

    const attempt = await StudentQuizAttempt.create({
      studentId,
      classId: quest.classId,
      courseId: quest.courseId,
      quizTitle: `Arena — ${quest.subjectName}`,
      isPracticeQuiz: true,
      questions,
      startedAt: new Date(),
      aiGenerationParams: { numberOfQuestions: numQ, generatedAt: new Date() },
    });

    quest.quizAttemptId = attempt._id;
    quest.status = 'in_progress';
    quest.totalQuestions = questions.length;
    await quest.save();

    const safeQuestions = questions.map((q, idx) => ({
      _id: attempt.questions[idx]?._id,
      question: q.question,
      type: q.type,
      options: q.options,
      points: q.points,
    }));

    return res.json({ success: true, data: { questId: quest._id, attemptId: attempt._id, questions: safeQuestions, secondsPerQuestion: secondsPerQ } });
  } catch (err) {
    console.error('startQuest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** POST /arena/quests/:id/submit — Score answers, award XP, update leaderboard */
const submitQuest = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user._id.toString());
    const { answers, timeTaken } = req.body; // answers: string[]
    const quest = await ArenaQuest.findOne({ _id: req.params.id, studentId });
    if (!quest) return res.status(404).json({ success: false, message: 'Quête introuvable' });
    if (quest.status === 'completed') return res.status(400).json({ success: false, message: 'Quête déjà soumise' });

    const attempt = await StudentQuizAttempt.findById(quest.quizAttemptId);
    if (!attempt) return res.status(404).json({ success: false, message: 'Tentative introuvable' });

    const challenge = await ArenaChallenge.findById(quest.challengeId);
    const cfg = challenge?.questsConfig || {};
    const xpPerCorrect = cfg.xpPerCorrectAnswer || 10;
    const xpBonus = cfg.xpBonusCompletion || 20;
    const xpBonus100 = cfg.xpBonus100Percent || 30;

    // Grade each question
    let correct = 0;
    const gradedQuestions = attempt.questions.map((q, i) => {
      const studentAnswer = answers[i] ?? null;
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correct++;
      return { ...q.toObject(), studentAnswer, isCorrect, pointsEarned: isCorrect ? q.points : 0 };
    });

    const total = attempt.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Calculate XP
    let xpEarned = correct * xpPerCorrect + xpBonus;
    if (percentage === 100) xpEarned += xpBonus100;

    // Apply streak multiplier
    const progress = await ArenaProgress.findOne({ challengeId: quest.challengeId, studentId }) || new ArenaProgress({ challengeId: quest.challengeId, studentId, classId: quest.classId });
    const today = toMidnight();
    const lastDate = progress.lastActiveDate ? toMidnight(progress.lastActiveDate) : null;
    const isConsecutive = lastDate && (today - lastDate === 86400000);
    if (isConsecutive) {
      progress.currentStreak += 1;
      if (progress.currentStreak >= 2) xpEarned = Math.round(xpEarned * (cfg.streakBonusMultiplier || 1.5));
    } else if (!lastDate || today - lastDate > 86400000) {
      progress.currentStreak = 1;
    }
    if (progress.currentStreak > progress.longestStreak) progress.longestStreak = progress.currentStreak;

    progress.totalXP += xpEarned;
    progress.completedQuestsCount += 1;
    progress.lastActiveDate = new Date();

    // Daily activity
    const dayEntry = progress.dailyActivity.find(d => toMidnight(d.date).getTime() === today.getTime());
    if (dayEntry) { dayEntry.xpEarned += xpEarned; dayEntry.questsCompleted += 1; }
    else { progress.dailyActivity.push({ date: today, xpEarned, questsCompleted: 1 }); }

    // Milestones
    const newMilestones = [];
    for (const ms of (challenge?.milestones || [])) {
      if (progress.totalXP >= ms.xp && !progress.milestonesReached.includes(ms.label)) {
        progress.milestonesReached.push(ms.label);
        newMilestones.push(ms);
      }
    }

    await progress.save();

    // Update attempt
    attempt.questions = gradedQuestions;
    attempt.score = correct;
    attempt.totalPoints = total;
    attempt.percentage = percentage;
    attempt.completedAt = new Date();
    attempt.timeSpent = timeTaken || 0;
    await attempt.save();

    // Update quest
    quest.status = 'completed';
    quest.xpEarned = xpEarned;
    quest.score = correct;
    quest.timeTaken = timeTaken || 0;
    await quest.save();

    return res.json({
      success: true,
      data: {
        score: correct,
        total,
        percentage,
        xpEarned,
        totalXP: progress.totalXP,
        streak: progress.currentStreak,
        newMilestones,
        gradedQuestions: gradedQuestions.map(q => ({
          question: q.question,
          options: q.options,
          studentAnswer: q.studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          explanation: q.explanation || '',
        })),
      }
    });
  } catch (err) {
    console.error('submitQuest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /arena/leaderboard */
const getLeaderboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const classId = await getStudentClassId(studentId);
    if (!classId) return res.json({ success: true, data: [], message: 'no_class' });

    const challenge = await getOrCreateChallenge(classId);

    const entries = await ArenaProgress.find({ challengeId: challenge._id })
      .sort({ totalXP: -1 })
      .populate('studentId', 'firstName lastName profileImage')
      .lean();

    const board = entries.map((e, i) => ({
      rank: i + 1,
      studentId: e.studentId?._id,
      name: `${e.studentId?.firstName} ${e.studentId?.lastName}`,
      avatar: `${e.studentId?.firstName?.[0] || '?'}${e.studentId?.lastName?.[0] || ''}`,
      totalXP: e.totalXP,
      completedQuests: e.completedQuestsCount,
      streak: e.currentStreak,
      milestones: e.milestonesReached,
      isMe: e.studentId?._id?.toString() === studentId.toString(),
    }));

    return res.json({ success: true, data: board, challengeId: challenge._id });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /arena/progress */
const getMyProgress = async (req, res) => {
  try {
    const studentId = req.user._id;
    const classId = await getStudentClassId(studentId);
    if (!classId) return res.json({ success: true, data: { totalXP: 0, completedQuestsCount: 0, currentStreak: 0, longestStreak: 0, milestonesReached: [], dailyActivity: [], rank: 0 }, message: 'no_class' });

    const challenge = await getOrCreateChallenge(classId);
    let progress = await ArenaProgress.findOne({ challengeId: challenge._id, studentId }).lean();
    if (!progress) {
      progress = { totalXP: 0, completedQuestsCount: 0, currentStreak: 0, longestStreak: 0, milestonesReached: [], dailyActivity: [] };
    }

    // Rank
    const rank = await ArenaProgress.countDocuments({ challengeId: challenge._id, totalXP: { $gt: progress.totalXP } }) + 1;

    return res.json({ success: true, data: { ...progress, rank, challengeId: challenge._id } });
  } catch (err) {
    console.error('getMyProgress error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * generateFullArenaQuests
 *
 * For every active class:
 *  1. Get/create the week's ArenaChallenge
 *  2. Find all enrolled students
 *  3. For each student × quest slot:
 *     - Parse course PDF chapters using the AiToolsController pattern
 *     - Call AiService.generateQuiz() to produce real questions
 *     - Pre-create a StudentQuizAttempt with those questions
 *     - Create (or update) the ArenaQuest with quizAttemptId pre-filled
 *
 * Quests are immediately playable — startQuest() will reuse the pre-generated attempt.
 * Idempotent: skips quest slots that already have a completed status.
 */
const generateFullArenaQuests = async () => {
  const today = toMidnight();
  const weekStart = getWeekStart();
  const weekEnd   = getWeekEnd();
  console.log(`[Arena Full Generate] Starting for ${today.toISOString()}`);

  const allClasses = await Class.find({}).select('_id name students').lean();
  let stats = { classes: 0, students: 0, questsCreated: 0, questsUpdated: 0, errors: 0 };

  for (const cls of allClasses) {
    const classId = cls._id;

    // 1. Get or create the active challenge
    let challenge = await ArenaChallenge.findOne({ classId, weekStart });
    if (!challenge) {
      const df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
      challenge = await ArenaChallenge.create({
        classId,
        title: `Défi Arène — Semaine du ${df.format(weekStart)}`,
        weekStart,
        weekEnd,
      });
      await ArenaChallenge.updateMany(
        { classId, _id: { $ne: challenge._id }, status: 'active' },
        { status: 'ended' }
      );
    }

    const numQ = challenge.questsConfig?.questionsPerQuest || 5;

    // 2. Get courses with subjects for this class
    const courses = await Course.find({ classId })
      .populate('subjectId', 'name code')
      .lean();
    const validCourses = courses.filter(c => c.subjectId);

    if (validCourses.length === 0) {
      console.log(`[Arena Full Generate] Class "${cls.name}": no courses, skipping`);
      continue;
    }

    // 3. Collect student IDs
    const usersInClass = await User.find({ 'student.classId': classId, role: 'student' })
      .select('_id').lean();
    const enrolledIds = new Set([
      ...(cls.students || [])
        .filter(s => s.status === 'enrolled' || s.status === 'active')
        .map(s => s.studentId?.toString()),
      ...usersInClass.map(u => u._id.toString()),
    ].filter(Boolean));

    stats.classes++;

    // 4. Pre-generate questions per course slot (once per class, reused per student)
    const questionsPerSlot = [];
    for (let slot = 1; slot <= challenge.questsConfig.questsPerDay; slot++) {
      const course = validCourses[(slot - 1) % validCourses.length];
      console.log(`[Arena Full Generate] Class "${cls.name}" slot ${slot}: generating quiz for "${course.title}" via Ollama...`);
      const questions = await generateQuestionsForCourse(course, numQ);
      questionsPerSlot.push({
        slot,
        course,
        questions: questions || Array.from({ length: numQ }, (_, i) => ({
          question: `Question ${i + 1} — ${course.subjectId.name}`,
          type: 'mcq',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 'Option A',
          points: 1,
        })),
      });
    }

    // 5. Create quests + pre-generated attempts per student
    for (const studentIdStr of enrolledIds) {
      const studentId = new mongoose.Types.ObjectId(studentIdStr);

      for (const { slot, course, questions } of questionsPerSlot) {
        // Find existing quest for this slot
        let quest = await ArenaQuest.findOne({
          studentId, challengeId: challenge._id, date: today, questIndex: slot,
        });

        if (quest && quest.status === 'completed') continue; // don't overwrite completed quests

        // Create StudentQuizAttempt with the pre-generated questions
        const attempt = await StudentQuizAttempt.create({
          studentId,
          classId,
          courseId: course._id,
          quizTitle: `Arena — ${course.subjectId.name}`,
          isPracticeQuiz: true,
          questions,
          aiGenerationParams: { numberOfQuestions: numQ, generatedAt: new Date() },
        });

        if (!quest) {
          await ArenaQuest.create({
            challengeId: challenge._id,
            studentId,
            classId,
            subjectId: course.subjectId._id,
            courseId: course._id,
            subjectName: course.subjectId.name,
            date: today,
            questIndex: slot,
            status: 'pending',
            quizAttemptId: attempt._id,
            totalQuestions: questions.length,
          });
          stats.questsCreated++;
        } else {
          // Update existing quest with fresh attempt
          quest.quizAttemptId = attempt._id;
          quest.totalQuestions = questions.length;
          quest.status = 'pending';
          await quest.save();
          stats.questsUpdated++;
        }
      }

      stats.students++;
    }

    console.log(`[Arena Full Generate] Class "${cls.name}": ${enrolledIds.size} students processed`);
  }

  console.log(`[Arena Full Generate] Done:`, stats);
  return stats;
};

module.exports = { getChallenge, getTodayQuests, startQuest, submitQuest, getLeaderboard, getMyProgress, generateFullArenaQuests };

