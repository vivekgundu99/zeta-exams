import express from 'express';
import {
  register,
  verifyOTPAndRegister,
  login,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', rateLimiter(5, 15), register);
router.post('/verify-otp', rateLimiter(5, 15), verifyOTPAndRegister);
router.post('/login', rateLimiter(10, 15), login);
router.post('/forgot-password', rateLimiter(3, 15), forgotPassword);
router.post('/reset-password', rateLimiter(5, 15), resetPassword);

// Protected routes
router.post('/logout', protect, logout);

export default router;