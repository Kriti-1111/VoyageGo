import express from 'express';
import { register, login, me } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, me);

// Admin only route example
router.get('/admin-only', auth, roleMiddleware(['ADMIN']), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

// Driver only route example
router.get('/driver-only', auth, roleMiddleware(['DRIVER']), (req, res) => {
  res.json({ message: 'Driver access granted' });
});

export default router;