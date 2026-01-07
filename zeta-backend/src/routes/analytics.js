import express from 'express';
import {
  getUserAnalytics,
  getSubjectWiseAnalysis,
  getChapterWiseAnalysis,
  getTestHistory,
  getPerformanceTrend,
  getStrengthWeakness,
  getAccuracyReport,
  getTimeAnalysis
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Overall analytics
router.get('/overview', getUserAnalytics);
router.get('/performance-trend', getPerformanceTrend);

// Subject and chapter analysis
router.get('/subject-wise/:examType', getSubjectWiseAnalysis);
router.get('/chapter-wise/:examType/:subject', getChapterWiseAnalysis);

// Test history
router.get('/test-history', getTestHistory);

// Detailed reports
router.get('/strength-weakness', getStrengthWeakness);
router.get('/accuracy-report', getAccuracyReport);
router.get('/time-analysis', getTimeAnalysis);

export default router;