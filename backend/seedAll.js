const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const AcademicYear = require('./models/AcademicYear');
const Department = require('./models/Department');
const StudyProgram = require('./models/StudyProgram');
const TeachingUnit = require('./models/TeachingUnit');
const Subject = require('./models/Subject');
const User = require('./models/User');
const Class = require('./models/Class');
const Course = require('./models/Course');
const Schedule = require('./models/Schedule');
const VideoSession = require('./models/VideoSession');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const Quiz = require('./models/Quiz');
const Exam = require('./models/Exam');
const Submission = require('./models/Submission');
const StudentQuizAttempt = require('./models/StudentQuizAttempt');
const Announcement = require('./models/Announcement');
const ArenaChallenge = require('./models/ArenaChallenge');
const ArenaQuest = require('./models/ArenaQuest');
const ArenaProgress = require('./models/ArenaProgress');
const Attendance = require('./models/Attendance');
const Grade = require('./models/Grade');
const StudyMaterial = require('./models/StudyMaterial');
const StudentProgress = require('./models/StudentProgress');
const Bookmark = require('./models/Bookmark');
const AISummary = require('./models/AISummary');
const SelfQuiz = require('./models/SelfQuiz');
const WorkSubmission = require('./models/WorkSubmission');
const SystemSettings = require('./models/SystemSettings');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  const colls = await mongoose.connection.db.listCollections().toArray();
  for (const c of colls) {
    await mongoose.connection.db.collection(c.name).deleteMany({});
  }
  console.log('Cleared all collections');

  // 1. AcademicYear
  const acYear = await AcademicYear.create({
    year: '2024-2025',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-06-30'),
    semesters: [
      { number: 1, name: 'Semestre 1', startDate: new Date('2024-09-01'), endDate: new Date('2025-01-15') },
      { number: 2, name: 'Semestre 2', startDate: new Date('2025-01-16'), endDate: new Date('2025-06-30') },
    ],
    isCurrent: true,
    status: 'active',
  });
  console.log('AcademicYear seeded');

  // 2. Department
  const dept = await Department.create({
    name: 'Génie Logiciel',
    code: 'GL',
    description: 'Département de Génie Logiciel',
    isActive: true,
  });
  console.log('Department seeded');

  // 3. StudyProgram
  const program = await StudyProgram.create({
    name: 'Master Professionnel en Génie Logiciel',
    code: 'MPGL',
    description: 'Formation en génie logiciel',
    departmentId: dept._id,
    programType: 'master',
    duration: { years: 2, semesters: 4 },
    level: 'Master',
    isActive: true,
  });
  console.log('StudyProgram seeded');

  // 4. TeachingUnit
  const unit = await TeachingUnit.create({
    name: 'Génie Logiciel Avancé',
    code: 'GLA',
    description: 'Unités avancées du génie logiciel',
    departmentId: dept._id,
    programIds: [program._id],
    unitType: 'fundamental',
    totalCredits: 10,
    totalCoefficient: 5,
    isActive: true,
  });
  console.log('TeachingUnit seeded');

  // 5. Subject
  const subject = await Subject.create({
    name: 'Développement Full-Stack',
    code: 'DFS',
    description: 'Développement d\'applications web modernes',
    teachingUnitId: unit._id,
    semester: 1,
    credits: 5,
    coefficient: 3,
    hoursDistribution: { lecture: 1.5, tutorial: 1.5, practical: 0, total: 3 },
    evaluation: { examWeight: 70, continuousWeight: 30 },
    isActive: true,
  });
  console.log('Subject seeded');

  // 6. Users
  const admin = await User.create({
    firstName: 'System', lastName: 'Admin', cin: '11111111',
    email: 'admin@edugenius.com', password: 'adminpassword123', role: 'admin',
    nationality: 'Tunisian', isActive: true,
  });
  const teacher = await User.create({
    firstName: 'Ahmed', lastName: 'Teacher', cin: '22222222',
    email: 'teacher@edugenius.com', password: 'teacherpassword123', role: 'teacher',
    nationality: 'Tunisian', isActive: true,
    teacher: { specializations: ['Full-Stack'], diplomas: [{ type: 'Master', field: 'Informatique', university: 'UTM', year: 2020 }] },
  });
  const student = await User.create({
    firstName: 'Karim', lastName: 'Student', cin: '33333333',
    email: 'student@edugenius.com', password: 'studentpassword123', role: 'student',
    nationality: 'Tunisian', isActive: true,
    student: { fileNumber: 'STU001', level: 'M1' },
  });
  console.log('Users seeded');

  // 7. Class
  const cls = await Class.create({
    name: 'MPGL2', code: 'MPGL2', departmentId: dept._id, programId: program._id,
    academicYearId: acYear._id, level: 'M1', groupNumber: 1, capacity: 30,
    currentEnrollment: 1, academicAdvisorId: teacher._id, isActive: true,
    teachers: [{ subjectId: subject._id, teacherId: teacher._id }],
    students: [{ studentId: student._id, enrollmentDate: new Date(), status: 'enrolled' }],
  });
  console.log('Class seeded');

  // 8. Course
  const course = await Course.create({
    title: 'Développement Full-Stack - Cours',
    description: 'Cours sur le développement Full-Stack',
    classId: cls._id, teacherId: teacher._id, subjectId: subject._id, isPublished: true,
    chapters: [
      { title: 'Introduction à Next.js', order: 1, isPublished: true, materials: [], exercises: [] },
      { title: 'API avec Express', order: 2, isPublished: true, materials: [], exercises: [] },
    ],
  });
  console.log('Course seeded');

  // 9. Schedule
  const schedule = await Schedule.create({
    title: 'Emploi du temps MPGL2',
    academicYearId: '2024-2025', semester: 1,
    targetType: 'class', targetId: cls._id, isPublished: true,
    entries: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '10:00', subjectId: subject._id, teacherId: teacher._id, sessionType: 'lecture', meetingProvider: 'jitsi' },
      { dayOfWeek: 3, startTime: '10:00', endTime: '12:00', subjectId: subject._id, teacherId: teacher._id, sessionType: 'tutorial', meetingProvider: 'jitsi' },
    ],
  });
  console.log('Schedule seeded');

  // 10. VideoSession
  const videoSession = await VideoSession.create({
    title: 'Introduction à Next.js - Live',
    description: 'Session live sur Next.js',
    classId: cls._id, subjectId: subject._id, teacherId: teacher._id,
    scheduleId: schedule._id,
    scheduledStart: new Date('2025-01-10T08:00:00'), scheduledEnd: new Date('2025-01-10T10:00:00'),
    actualStart: new Date('2025-01-10T08:05:00'), actualEnd: new Date('2025-01-10T09:55:00'),
    meetingUrl: 'https://edugenius.daily.co/demo-session',
    meetingId: 'demo-session',
    attendanceThreshold: 70, gracePeriod: 15,
    participants: [{ userId: teacher._id, userName: 'Ahmed Teacher', role: 'teacher', joinedAt: new Date('2025-01-10T08:00:00'), leftAt: new Date('2025-01-10T10:00:00'), duration: 120, connectionLogs: [{ action: 'join', timestamp: new Date('2025-01-10T08:00:00') }] }],
    attendance: [{ studentId: student._id, status: 'present', joinTime: new Date('2025-01-10T08:05:00'), leaveTime: new Date('2025-01-10T09:55:00'), duration: 110, attendancePercentage: 91.7 }],
    statistics: { totalParticipants: 1, maxConcurrent: 1, averageDuration: 110, attendanceRate: 100, lateCount: 0, absentCount: 0 },
    recording: { isRecorded: true, recordingFile: 'https://s3.amazonaws.com/recordings/demo.webm', recordingSize: 50000000, recordingDuration: 3600 },
    status: 'ended',
  });
  console.log('VideoSession seeded');

  // 11. Message
  await Message.create({ senderId: student._id, receiverId: teacher._id, content: 'Bonjour professeur, j\'ai une question sur le cours.', messageType: 'private', isRead: false });
  await Message.create({ senderId: teacher._id, receiverId: student._id, content: 'Bien sûr, posez votre question.', messageType: 'private', isRead: false });
  await Message.create({ senderId: teacher._id, classId: cls._id, content: 'N\'oubliez pas le rendu des exercices demain !', messageType: 'class', isRead: false });
  console.log('Messages seeded');

  // 12. Notification
  await Notification.create({ userId: student._id, type: 'video_session_starting', title: 'Session live dans 10 min', message: 'La session "Introduction à Next.js" commence dans 10 minutes.', isRead: false, priority: 'high', classId: cls._id });
  await Notification.create({ userId: student._id, type: 'quiz_assigned', title: 'Nouveau quiz disponible', message: 'Un nouveau quiz vous a été assigné.', isRead: false, priority: 'normal', classId: cls._id });
  console.log('Notifications seeded');

  // 13. Quiz
  const quiz = await Quiz.create({
    title: 'Quiz Introduction à Next.js',
    description: 'Testez vos connaissances sur Next.js',
    courseId: course._id, classId: cls._id, teacherId: teacher._id,
    isPublished: true, difficulty: 'medium',
    questions: [
      { question: 'Qu\'est-ce que Next.js ?', type: 'mcq', options: ['Un framework React', 'Une base de données', 'Un serveur web', 'Un langage'], correctAnswer: 'Un framework React', points: 2 },
      { question: 'Next.js utilise-t-il le SSR ?', type: 'true-false', options: ['Vrai', 'Faux'], correctAnswer: 'Vrai', points: 1 },
    ],
    settings: { duration: 30, attempts: 2, shuffleQuestions: true, showResults: true, showCorrectAnswers: true },
  });
  console.log('Quiz seeded');

  // 14. Exam
  const exam = await Exam.create({
    title: 'Examen Full-Stack - Session 1',
    description: 'Examen de fin de semestre',
    courseId: course._id, classId: cls._id, teacherId: teacher._id, isPublished: true,
    passingScore: 50,
    questions: [
      { question: 'Décrivez l\'architecture de Next.js', type: 'short-answer', correctAnswer: 'Next.js utilise le rendu hybride SSR/SSG', points: 5 },
      { question: 'Express.js est-il un framework MVC ?', type: 'true-false', options: ['Vrai', 'Faux'], correctAnswer: 'Faux', points: 2 },
    ],
    settings: { duration: 90, attempts: 1, startDate: new Date('2025-06-01'), endDate: new Date('2025-06-02'), shuffleQuestions: false, showResults: true, showCorrectAnswers: false },
  });
  console.log('Exam seeded');

  // 15. Submission
  await Submission.create({
    quizId: quiz._id, studentId: student._id,
    answers: [
      { questionId: quiz.questions[0]._id, answer: 'Un framework React', isCorrect: true, pointsEarned: 2 },
      { questionId: quiz.questions[1]._id, answer: 'Vrai', isCorrect: true, pointsEarned: 1 },
    ],
    score: 3, totalPoints: 3, percentage: 100, attemptNumber: 1,
    startedAt: new Date('2025-01-15T10:00:00'), submittedAt: new Date('2025-01-15T10:25:00'), timeSpent: 25,
    status: 'graded',
  });
  console.log('Submission seeded');

  // 16. StudentQuizAttempt
  await StudentQuizAttempt.create({
    studentId: student._id, classId: cls._id, courseId: course._id, quizTitle: 'Quiz entraînement IA',
    isPracticeQuiz: true,
    questions: [
      { question: 'Quel hook React pour l\'état ?', type: 'mcq', options: ['useState', 'useEffect', 'useRef', 'useMemo'], correctAnswer: 'useState', points: 1 },
    ],
    score: 1, totalPoints: 1, percentage: 100,
    aiGenerationParams: { numberOfQuestions: 5, difficulty: 'medium', topics: ['React'] },
    reviewed: false,
  });
  console.log('StudentQuizAttempt seeded');

  // 17. Announcement
  await Announcement.create({
    title: 'Rendu des exercices',
    content: 'Les exercices du chapitre 1 sont à rendre avant vendredi.',
    teacherId: teacher._id, targetType: 'specific_classes', targetClasses: [cls._id], classId: cls._id,
    priority: 'high', type: 'assignment', isPinned: true, isPublished: true,
  });
  console.log('Announcement seeded');

  // 18. ArenaChallenge
  const challenge = await ArenaChallenge.create({
    classId: cls._id, title: 'Défi Arène — Semaine 1',
    weekStart: new Date('2025-01-06'), weekEnd: new Date('2025-01-12'),
    status: 'active',
  });
  console.log('ArenaChallenge seeded');

  // 19. ArenaQuest
  await ArenaQuest.create({
    challengeId: challenge._id, studentId: student._id, classId: cls._id,
    subjectId: subject._id, courseId: course._id, subjectName: subject.name,
    date: new Date('2025-01-07'), questIndex: 1, status: 'completed',
    xpEarned: 50, score: 5, totalQuestions: 5, timeTaken: 30,
  });
  console.log('ArenaQuest seeded');

  // 20. ArenaProgress
  await ArenaProgress.create({
    challengeId: challenge._id, studentId: student._id, classId: cls._id,
    totalXP: 50, completedQuestsCount: 1, currentStreak: 1, longestStreak: 1,
    lastActiveDate: new Date('2025-01-07'), milestonesReached: [],
    dailyActivity: [{ date: new Date('2025-01-07'), xpEarned: 50, questsCompleted: 1 }],
  });
  console.log('ArenaProgress seeded');

  // 21. Attendance
  await Attendance.create({
    videoSessionId: videoSession._id, scheduleId: schedule._id,
    sessionDate: new Date('2025-01-10'), subjectId: subject._id, subjectName: subject.name,
    classId: cls._id, className: cls.name, teacherId: teacher._id, teacherName: 'Ahmed Teacher',
    scheduledStart: new Date('2025-01-10T08:00:00'), scheduledEnd: new Date('2025-01-10T10:00:00'),
    actualStart: new Date('2025-01-10T08:05:00'), actualEnd: new Date('2025-01-10T09:55:00'),
    totalDuration: 110,
    records: [{ studentId: student._id, studentName: 'Karim Student', status: 'present', joinTime: new Date('2025-01-10T08:05:00'), leaveTime: new Date('2025-01-10T09:55:00'), duration: 110, attendancePercentage: 91.7 }],
    statistics: { totalStudents: 1, present: 1, late: 0, absent: 0, excused: 0, attendanceRate: 100 },
    generatedAt: new Date(), generatedBy: teacher._id,
  });
  console.log('Attendance seeded');

  // 22. Grade
  await Grade.create({
    studentId: student._id, studentName: 'Karim Student', subjectId: subject._id, subjectName: subject.name,
    classId: cls._id, academicYearId: acYear._id,
    examSession: 'main', examDate: new Date('2025-06-01'),
    continuousAssessment: 15, examGrade: 14, totalGrade: 14.3,
    isAbsent: false, isPassed: true, mention: 'Bien',
  });
  console.log('Grade seeded');

  // 23. StudyMaterial (summary)
  await StudyMaterial.create({
    studentId: student._id, classId: cls._id, courseId: course._id,
    type: 'summary', title: 'Résumé - Introduction à Next.js',
    content: 'Next.js est un framework React qui permet le rendu hybride (SSR/SSG).',
    isAIGenerated: true,
    aiGenerationParams: { summaryLength: 'medium', difficulty: 'medium', topics: ['Next.js'], generatedAt: new Date() },
    isBookmarked: false, isFavorite: true,
  });
  console.log('StudyMaterial seeded');

  // 24. StudentProgress
  await StudentProgress.create({
    studentId: student._id, classId: cls._id, courseId: course._id, subjectId: subject._id,
    chaptersProgress: [
      { chapterId: course.chapters[0]._id, status: 'completed', startedAt: new Date('2025-01-05'), completedAt: new Date('2025-01-08'), timeSpent: 180 },
      { chapterId: course.chapters[1]._id, status: 'in-progress', startedAt: new Date('2025-01-09'), timeSpent: 60 },
    ],
    overallProgress: 50, totalTimeSpent: 240, lastAccessedAt: new Date(),
  });
  console.log('StudentProgress seeded');

  // 25. Bookmark
  await Bookmark.create({
    studentId: student._id, resourceType: 'material', resourceId: course.chapters[0]._id, classId: cls._id,
    note: 'Important à réviser', tags: ['Next.js', 'important'],
  });
  console.log('Bookmark seeded');

  // 26. AISummary
  await AISummary.create({
    courseId: course._id, chapterId: course.chapters[0]._id, studentId: student._id,
    content: 'Résumé généré par IA du chapitre sur Next.js.',
    summaryType: 'chapter', generatedAt: new Date(),
    customizations: { style: 'default', language: 'fr' },
  });
  console.log('AISummary seeded');

  // 27. SelfQuiz
  await SelfQuiz.create({
    courseId: course._id, studentId: student._id,
    questions: [
      { question: 'Qu\'est-ce que le SSR ?', options: ['Server Side Rendering', 'Client Side Rendering', 'Static Site Generation'], correctAnswerIndex: 0 },
    ],
    score: 1, completed: true, quizType: 'quick',
  });
  console.log('SelfQuiz seeded');

  // 28. WorkSubmission
  await WorkSubmission.create({
    chapterId: course.chapters[0]._id, exerciseId: course.chapters[0]._id,
    classId: cls._id, subjectId: subject._id, studentId: student._id,
    fileUrl: 'https://s3.amazonaws.com/submissions/exercice1.pdf',
    fileName: 'exercice1.pdf', fileSize: 204800,
    submittedAt: new Date(), feedback: 'Bon travail !', grade: 16,
  });
  console.log('WorkSubmission seeded');

  // 29. SystemSettings
  await SystemSettings.create({
    institutionName: 'Université Tunisienne',
    academicSettings: { currentAcademicYearId: acYear._id, currentSemester: 1, gradingScale: 20, passingGrade: 10 },
    authSettings: { passwordMinLength: 8, sessionTimeout: 120 },
    aiSettings: { quizGenerationEnabled: true, summaryGenerationEnabled: true },
  });
  console.log('SystemSettings seeded');

  await mongoose.disconnect();
  console.log('Done! All collections seeded.');
}

seed().catch(err => { console.error(err); process.exit(1); });
