import express from 'express';
import {
  getAllMockTests,
  getMockTestById,
  startMockTest,
  submitMockTest,
  getMockTestResult,
  getUserMockTestAttempts,
  getOngoingTest
} from '../controllers/mockTestController.js';
import { protect, checkSubscription, checkDailyLimit } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Mock test routes - requires gold subscription
router.get('/all/:examType', checkSubscription('gold'), getAllMockTests);
router.get('/ongoing', getOngoingTest);
router.get('/:testId', checkSubscription('gold'), getMockTestById);
router.get('/:testId/attempts', getUserMockTestAttempts);

// Start and submit test
router.post('/:testId/start', checkSubscription('gold'), checkDailyLimit('mockTests'), startMockTest);
router.post('/:testId/submit', submitMockTest);

// Results
router.get('/:testId/result/:attemptId', getMockTestResult);

export default router;