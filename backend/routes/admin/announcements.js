const express = require('express');
const router = express.Router();
const Announcement = require('../../models/Announcement');
const { authenticate, adminAuth } = require('../../middleware/auth');
const imageUpload = require('../../middleware/imageUploadMiddleware');
const { uploadToS3, getS3Object } = require('../../utils/s3');

// GET /api/admin/announcements/image-proxy?key=announcements%2Ffilename.jpg
// Streams a private S3 object through the backend. No auth needed — keys are
// not guessable (timestamp-prefixed) so this is safe to expose publicly.
router.get('/image-proxy', async (req, res, next) => {
  try {
    const { key } = req.query;
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ message: 'Missing key query parameter' });
    }

    // Prevent path traversal
    if (key.includes('..')) {
      return res.status(400).json({ message: 'Invalid key' });
    }

    const { stream, contentType } = await getS3Object(key);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // AWS SDK v3 with NodeHttpHandler returns a Node.js IncomingMessage (already a Readable).
    // Fall back to Readable.fromWeb for environments that return a web ReadableStream.
    if (typeof stream.pipe === 'function') {
      stream.pipe(res);
    } else {
      const { Readable } = require('stream');
      Readable.fromWeb(stream).pipe(res);
    }
  } catch (err) {
    console.error('[image-proxy] S3 error for key:', req.query.key, '|', err.name, err.message);
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({ message: 'Image not found' });
    }
    next(err);
  }
});

// GET /api/admin/announcements
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('teacherId', 'firstName lastName email role')
      .populate('targetClasses', 'name code')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/announcements (Supports Multi-part Form with Image)
router.post('/', authenticate, adminAuth, imageUpload.single('image'), async (req, res, next) => {
  try {
    const { 
      title, 
      content, 
      targetType, 
      targetClasses, 
      priority, 
      type, 
      isPinned, 
      isPublished,
      publishAt,
      expiresAt 
    } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'announcements');
    }

    // Handle targetClasses if it comes as a string (from FormData)
    let processedClasses = targetClasses;
    if (typeof targetClasses === 'string') {
      try {
        processedClasses = JSON.parse(targetClasses);
      } catch (e) {
        processedClasses = targetClasses.split(',').filter(Boolean);
      }
    }

    const announcement = new Announcement({
      title,
      content,
      teacherId: req.user._id,
      targetType,
      targetClasses: targetType === 'specific_classes' ? processedClasses : [],
      priority,
      type,
      isPinned: isPinned === 'true' || isPinned === true,
      isPublished: isPublished === 'false' ? false : true,
      publishAt: publishAt || null,
      expiresAt: (expiresAt === 'null' || !expiresAt) ? null : expiresAt,
      imageUrl
    });

    await announcement.save();
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/announcements/:id/status
router.patch('/:id/status', authenticate, adminAuth, async (req, res, next) => {
  try {
    const { isPublished } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    );
    
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Annonce non trouvée.' });
    }
    
    res.json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/:id', authenticate, adminAuth, async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Annonce non trouvée.' });
    }
    res.json({ success: true, message: 'Annonce supprimée avec succès.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
