const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../../middleware/auth');
const {
  getChallenge,
  getTodayQuests,
  startQuest,
  submitQuest,
  getLeaderboard,
  getMyProgress,
  generateFullArenaQuests,
} = require('../../controllers/student/ArenaController');
const { generateDailyQuestsForAllClasses } = require('../../jobs/arenaCronJob');

// ── Protected arena routes ──────────────────────────────────────────────────
router.get('/challenge',           auth, getChallenge);
router.get('/quests/today',        auth, getTodayQuests);
router.post('/quests/:id/start',   auth, startQuest);
router.post('/quests/:id/submit',  auth, submitQuest);
router.get('/leaderboard',         auth, getLeaderboard);
router.get('/progress',            auth, getMyProgress);

// ── Unprotected test triggers ───────────────────────────────────────────────

/**
 * GET /api/student/arena/cron/trigger
 * Creates quest slots (no AI generation) — fast, idempotent.
 */
router.get('/cron/trigger', async (req, res) => {
  try {
    console.log('[Arena] Manual cron trigger fired');
    const result = await generateDailyQuestsForAllClasses();
    return res.json({ success: true, message: 'Daily quest slots created', ...result });
  } catch (err) {
    console.error('[Arena] Cron trigger error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/student/arena/cron/generate-full
 * Parses course PDFs → calls Ollama → pre-creates StudentQuizAttempts.
 * Quests are immediately playable without waiting for AI at click time.
 * ⚠️  Slow — Ollama runs once per quest slot per class.
 */
router.get('/cron/generate-full', async (req, res) => {
  try {
    console.log('[Arena] Full AI quest generation triggered');
    const result = await generateFullArenaQuests();
    return res.json({ success: true, message: 'Full AI quest generation complete', ...result });
  } catch (err) {
    console.error('[Arena] Full generate error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
