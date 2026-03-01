const express = require('express');
const router = express.Router();
const SystemSettings = require('../../models/SystemSettings');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/settings
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const settings = await SystemSettings.getInstance();
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT /api/admin/settings
router.put('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
      settings.updatedAt = new Date();
    }
    await settings.save();
    res.json(settings);
  } catch (err) { next(err); }
});

module.exports = router;
