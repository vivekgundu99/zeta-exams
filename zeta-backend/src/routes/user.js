import express from 'express';
import {
  getUserProfile,
  updateUserDetails,
  selectExamType,
  updatePassword,
  updateExamType,
  getUserStats,
  getSubscriptionInfo
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile
router.get('/profile', getUserProfile);
router.put('/details', rateLimiter(10, 15), updateUserDetails);
router.put('/password', rateLimiter(5, 15), updatePassword);

// Exam type
router.post('/select-exam', rateLimiter(5, 15), selectExamType);
router.put('/exam-type', rateLimiter(5, 15), updateExamType);

// User statistics
router.get('/stats', getUserStats);
router.get('/subscription-info', getSubscriptionInfo);

export default router;