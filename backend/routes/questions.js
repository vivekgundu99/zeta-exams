// routes/questions.js
const express = require('express');
const Question = require('../models/Question');
const { authMiddleware } = require('../middleware/auth');
const { parseQuestionCSV } = require('../utils/csvParser');

const router = express.Router();

// Get questions by subject and chapter (User - Paginated)
router.get('/', async (req, res) => {
  try {
    const { subject, chapter, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;

    const skip = (page - 1) * limit;
    
    const questions = await Question.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ questionId: 1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      questions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
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

// Get unique subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Question.distinct('subject');
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get chapters by subject
router.get('/chapters', async (req, res) => {
  try {
    const { subject } = req.query;
    const chapters = await Question.distinct('chapter', { subject });
    res.json({ success: true, chapters });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get single question by ID or serial number
router.get('/search', async (req, res) => {
  try {
    const { questionId, serialNumber } = req.query;
    
    const query = questionId 
      ? { questionId } 
      : { serialNumber };

    const question = await Question.findOne(query);
    
    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ADMIN ROUTES (Protected)

// Bulk add questions from CSV
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData) {
      return res.status(400).json({ 
        success: false, 
        message: 'CSV data required' 
      });
    }

    const parsedQuestions = parseQuestionCSV(csvData);
    
    if (parsedQuestions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid questions found in CSV' 
      });
    }

    // Get last question ID
    const lastQuestion = await Question.findOne().sort({ questionId: -1 });
    let lastIdNumber = lastQuestion 
      ? parseInt(lastQuestion.questionId) 
      : 0;

    // Create questions with IDs and serial numbers
    const questionsToInsert = [];
    const chapterCounters = {};

    for (const q of parsedQuestions) {
      lastIdNumber++;
      const questionId = String(lastIdNumber).padStart(7, '0');
      
      // Generate serial number
      const chapterKey = `${q.subject}-${q.chapter}`;
      if (!chapterCounters[chapterKey]) {
        const count = await Question.countDocuments({ 
          subject: q.subject, 
          chapter: q.chapter 
        });
        chapterCounters[chapterKey] = count + 1;
      } else {
        chapterCounters[chapterKey]++;
      }

      const serialNumber = `${q.chapter}-${chapterCounters[chapterKey]}`;

      questionsToInsert.push({
        ...q,
        questionId,
        serialNumber
      });
    }

    await Question.insertMany(questionsToInsert);

    res.json({
      success: true,
      message: `${questionsToInsert.length} questions added successfully`,
      count: questionsToInsert.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update question
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Question updated successfully', 
      question 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete question
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
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