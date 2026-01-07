import express from 'express';
import {
  getQuestions,
  getQuestionById,
  getQuestionsByTopic,
  getSubjects,
  getChaptersBySubject,
  getTopicsByChapter,
  submitAnswer,
  getChapterTest,
  submitChapterTest
} from '../controllers/questionController.js';
import { protect, checkSubscription, checkDailyLimit } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get dropdown data
router.get('/subjects/:examType', getSubjects);
router.get('/chapters/:examType/:subject', getChaptersBySubject);
router.get('/topics/:examType/:subject/:chapter', getTopicsByChapter);

// Get questions
router.get('/topic/:examType/:subject/:chapter/:topic', checkDailyLimit('questions'), getQuestionsByTopic);
router.get('/:questionId', getQuestionById);

// Submit answers
router.post('/submit-answer', checkDailyLimit('questions'), submitAnswer);

// Chapter tests
router.post('/chapter-test/generate', checkSubscription('silver'), checkDailyLimit('chapterTests'), getChapterTest);
router.post('/chapter-test/submit', submitChapterTest);

export default router;