const express = require('express');
const router = express.Router();
const multer = require('multer');
const VideoSession = require('../../models/VideoSession');
const Course = require('../../models/Course');
const Schedule = require('../../models/Schedule');
const { uploadToS3 } = require('../../utils/s3');

// Allow large video files (up to 500MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

/**
 * POST /api/teacher/recordings/save
 * Receives a recorded video blob from the frontend (MediaRecorder),
 * uploads it to S3, then saves a reference in the course's
 * auto-created "Enregistrements" chapter.
 */
router.post('/save', upload.single('recording'), async (req, res, next) => {
  console.log('=== RECORDING SAVE WORKFLOW STARTED ===');
  try {
    const { sessionId } = req.body;
    const teacherId = req.user._id;

    console.log(`[DEBUG] Received request from Teacher ID: ${teacherId}`);
    if (!req.file) {
      console.error('[ERROR] No recording file provided in request');
      return res.status(400).json({ error: 'No recording file provided' });
    }
    console.log(`[DEBUG] Upload file received: size = ${req.file.size} bytes`);

    if (!sessionId) {
      console.error('[ERROR] sessionId is required but missing');
      return res.status(400).json({ error: 'sessionId is required' });
    }
    console.log(`[DEBUG] Session ID to match: ${sessionId}`);

    // 1. Retrieve session to get classId and subjectId
    const session = await VideoSession.findById(sessionId);
    if (!session) {
      console.error(`[ERROR] VideoSession not found for ID: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    console.log(`[DEBUG] Session found: "${session.title}" (Class ID: ${session.classId}, Subject ID: ${session.subjectId})`);

    // Recover subjectId if missing (undefined/null)
    let subjectId = session.subjectId;
    if (!subjectId) {
      console.log('[DEBUG] Session subjectId is missing. Attempting to recover subjectId from Schedule...');
      const scheduleDoc = await Schedule.findOne({
        targetType: 'class',
        targetId: session.classId,
        'entries.teacherId': teacherId
      });
      if (scheduleDoc) {
        const matchingEntry = scheduleDoc.entries.find(e => 
          e.teacherId && e.teacherId.toString() === teacherId.toString()
        );
        if (matchingEntry) {
          subjectId = matchingEntry.subjectId;
          console.log(`[DEBUG] Recovered subjectId: ${subjectId} from Schedule entries`);
          
          // Persist the recovered subjectId on the VideoSession document
          session.subjectId = subjectId;
          await session.save();
          console.log(`[DEBUG] Updated VideoSession ${session._id} with recovered subjectId`);
        }
      }
    }
    const finalSubjectId = subjectId || session.subjectId;

    // 2. Upload the video to S3
    const dateLabel = new Date(session.scheduledStart || Date.now())
      .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      .replace(/\//g, '-');
    const fileName = `enregistrement_${dateLabel}_${Date.now()}.webm`;

    console.log(`[DEBUG] Uploading file "${fileName}" to S3...`);
    const videoUrl = await uploadToS3(
      req.file.buffer,
      fileName,
      'video/webm',
      'recordings'
    );

    if (!videoUrl) {
      console.error('[ERROR] S3 upload failed; no video URL returned');
      return res.status(500).json({ error: 'Failed to upload recording to storage' });
    }
    console.log(`[DEBUG] S3 upload successful! File URL: ${videoUrl}`);

    // 3. Find the course associated with this session's class & subject
    console.log(`[DEBUG] Searching for Course associated with Class: ${session.classId} and Subject: ${finalSubjectId}...`);
    let course = await Course.findOne({
      classId: session.classId,
      subjectId: finalSubjectId,
    });

    if (!course) {
      console.log('[DEBUG] Course not found. Auto-creating a new course database document...');
      course = await Course.create({
        title: 'Cours',
        classId: session.classId,
        subjectId: finalSubjectId,
        teacherId,
        chapters: [],
      });
      console.log(`[DEBUG] Created new Course document with ID: ${course._id}`);
    } else {
      console.log(`[DEBUG] Found existing Course: ID = ${course._id}, Title = "${course.title}"`);
    }

    // 4. Find or auto-create the "Recordings" chapter
    const RECORDING_CHAPTER_TITLE = 'Recordings';
    let recordingChapter = course.chapters.find(
      (ch) => ch.title === RECORDING_CHAPTER_TITLE
    );

    if (!recordingChapter) {
      console.log(`[DEBUG] Chapter "${RECORDING_CHAPTER_TITLE}" not found. Creating new chapter...`);
      course.chapters.push({
        title: RECORDING_CHAPTER_TITLE,
        order: 9999, // Always last
        isPublished: true, // Set to true so it immediately shows up for students!
        materials: [],
        exercises: [],
      });
      recordingChapter = course.chapters[course.chapters.length - 1];
      console.log('[DEBUG] Chapter "Recordings" appended to chapters array');
    } else {
      console.log('[DEBUG] Chapter "Recordings" already exists in course');
      if (recordingChapter.isPublished === false) {
        recordingChapter.isPublished = true;
        console.log('[DEBUG] Existing chapter "Recordings" was unpublished. Toggled to published: true');
      }
    }

    // 5. Push the recording as a material
    const recordingName = session.title
      ? `${session.title} — ${dateLabel}`
      : `Session du ${dateLabel}`;

    console.log(`[DEBUG] Appending recording item "${recordingName}" as a video material...`);
    recordingChapter.materials.push({
      name: recordingName,
      type: 'video',
      url: videoUrl,
      size: req.file.size,
      uploadedAt: new Date(),
    });

    // 6. Update VideoSession recording metadata
    console.log('[DEBUG] Updating VideoSession metadata...');
    session.recording = {
      isRecorded: true,
      recordingFile: videoUrl,
      recordingSize: req.file.size,
    };

    console.log(`[DEBUG] Saving Course (${course._id}) and VideoSession (${session._id}) to database...`);
    await Promise.all([course.save(), session.save()]);
    console.log('=== RECORDING SAVE WORKFLOW COMPLETED SUCCESSFULLY ===');

    res.status(201).json({
      success: true,
      message: 'Enregistrement sauvegardé dans le cours',
      videoUrl,
      chapterTitle: RECORDING_CHAPTER_TITLE,
    });
  } catch (err) {
    console.error('=== [ERROR] RECORDING SAVE WORKFLOW FAILED ===');
    console.error(err);
    next(err);
  }
});

module.exports = router;
