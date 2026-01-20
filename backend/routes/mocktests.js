// routes/mocktests.js
const express = require('express');
const MockTest = require('../models/MockTest');
const MockTestAttempt = require('../models/MockTestAttempt');
const { authMiddleware } = require('../middleware/auth');
const { parseMockTestCSV } = require('../utils/csvParser');

const router = express.Router();

// Get all mock tests (User)
router.get('/', async (req, res) => {
  try {
    const tests = await MockTest.find()
      .select('-questions')
      .sort({ createdAt: -1 });

    res.json({ success: true, tests });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get single mock test with questions (User)
router.get('/:id', async (req, res) => {
  try {
    const test = await MockTest.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mock test not found' 
      });
    }

    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Submit mock test attempt (User)
router.post('/:id/submit', async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const test = await MockTest.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mock test not found' 
      });
    }

    // Calculate score
    let score = 0;
    const processedAnswers = [];

    answers.forEach(answer => {
      const question = test.questions.find(
        q => q.serialNumber === answer.questionNumber
      );
      
      if (question) {
        const isCorrect = question.correctOption === answer.selectedOption;
        
        if (isCorrect) {
          score += test.marking.positive;
        } else if (answer.selectedOption) {
          score += test.marking.negative;
        }

        processedAnswers.push({
          questionNumber: answer.questionNumber,
          selectedOption: answer.selectedOption,
          isCorrect
        });
      }
    });

    const attempt = new MockTestAttempt({
      testId: test._id,
      answers: processedAnswers,
      score,
      timeTaken,
      completedAt: new Date()
    });

    await attempt.save();

    res.json({
      success: true,
      message: 'Test submitted successfully',
      result: {
        score,
        totalQuestions: test.totalQuestions,
        attempted: answers.filter(a => a.selectedOption).length,
        correct: processedAnswers.filter(a => a.isCorrect).length,
        incorrect: processedAnswers.filter(a => !a.isCorrect && a.selectedOption).length,
        timeTaken
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ADMIN ROUTES (Protected)

// Add mock test from CSV
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { testName, csvData, duration, totalQuestions } = req.body;

    if (!testName || !csvData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test name and CSV data required' 
      });
    }

    // Check if test name exists
    const existing = await MockTest.findOne({ testName });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test with this name already exists' 
      });
    }

    const parsedQuestions = parseMockTestCSV(csvData);
    
    if (parsedQuestions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid questions found in CSV' 
      });
    }

    const mockTest = new MockTest({
      testName,
      duration: duration || 180,
      totalQuestions: totalQuestions || parsedQuestions.length,
      questions: parsedQuestions
    });

    await mockTest.save();

    res.json({
      success: true,
      message: 'Mock test created successfully',
      test: {
        id: mockTest._id,
        testName: mockTest.testName,
        totalQuestions: mockTest.questions.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all mock tests with question count (Admin)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const tests = await MockTest.find().sort({ createdAt: -1 });

    const testsWithCount = tests.map(test => ({
      id: test._id,
      testName: test.testName,
      totalQuestions: test.questions.length,
      duration: test.duration,
      createdAt: test.createdAt
    }));

    res.json({ success: true, tests: testsWithCount });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete mock test
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const test = await MockTest.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mock test not found' 
      });
    }

    // Delete associated attempts
    await MockTestAttempt.deleteMany({ testId: req.params.id });

    res.json({ 
      success: true, 
      message: 'Mock test deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;