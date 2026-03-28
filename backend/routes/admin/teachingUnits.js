const express = require('express');
const router = express.Router();
const TeachingUnit = require('../../models/TeachingUnit');
const { authenticate, adminAuth } = require('../../middleware/auth');

// GET /api/admin/teaching-units
router.get('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const units = await TeachingUnit.find({ isActive: true }).sort({ name: 1 });
    res.json(units);
  } catch (err) { next(err); }
});

// POST /api/admin/teaching-units
router.post('/', authenticate, adminAuth, async (req, res, next) => {
  try {
    const unit = new TeachingUnit(req.body);
    await unit.save();
    res.status(201).json(unit);
  } catch (err) { next(err); }
});

module.exports = router;
