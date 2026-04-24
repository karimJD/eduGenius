const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/UserController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Protect all user routes
router.use(protect);

// GET /api/users - Allow all authenticated roles for messaging
router.get('/', authorize('admin', 'teacher', 'student'), getUsers);

// POST /api/users - Only admins
router.post('/', authorize('admin'), createUser);

// GET /api/users/:id - Allow all authenticated roles
router.get('/:id', authorize('admin', 'teacher', 'student'), getUserById);

// PUT / DELETE - Only admins
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
