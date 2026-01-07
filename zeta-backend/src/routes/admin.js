import express from 'express';
import multer from 'multer';
import {
  bulkUploadQuestions,
  addSingleQuestion,
  updateQuestion,
  deleteQuestion,
  searchQuestion,
  addFormula,
  updateFormula,
  deleteFormula,
  getAllFormulas,
  createMockTest,
  updateMockTest,
  deleteMockTest,
  getAllUsers,
  getUserDetails,
  updateUserSubscription,
  deactivateUser,
  generateGiftCodes,
  getAllGiftCodes,
  deleteGiftCode,
  getAdminStats
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes require admin authentication
router.use(protect);
router.use(isAdmin);

// Dashboard stats
router.get('/stats', getAdminStats);

// Question Management
router.post('/questions/bulk-upload', upload.single('csv'), bulkUploadQuestions);
router.post('/questions/add', addSingleQuestion);
router.put('/questions/:questionId', updateQuestion);
router.delete('/questions/:questionId', deleteQuestion);
router.get('/questions/search', searchQuestion);

// Formula Management
router.post('/formulas/add', addFormula);
router.put('/formulas/:formulaId', updateFormula);
router.delete('/formulas/:formulaId', deleteFormula);
router.get('/formulas/:examType', getAllFormulas);

// Mock Test Management
router.post('/mock-tests/create', createMockTest);
router.put('/mock-tests/:testId', updateMockTest);
router.delete('/mock-tests/:testId', deleteMockTest);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId/subscription', updateUserSubscription);
router.put('/users/:userId/deactivate', deactivateUser);

// Gift Code Management
router.post('/giftcodes/generate', generateGiftCodes);
router.get('/giftcodes', getAllGiftCodes);
router.delete('/giftcodes/:codeId', deleteGiftCode);

export default router;