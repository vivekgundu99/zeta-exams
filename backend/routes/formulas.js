// routes/formulas.js
const express = require('express');
const Formula = require('../models/Formula');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get formula by subject and chapter (User)
router.get('/', async (req, res) => {
  try {
    const { subject, chapter } = req.query;
    
    if (!subject || !chapter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and chapter required' 
      });
    }

    const formula = await Formula.findOne({ subject, chapter });
    
    if (!formula) {
      return res.status(404).json({ 
        success: false, 
        message: 'Formula not found' 
      });
    }

    res.json({ success: true, formula });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all formulas (User)
router.get('/all', async (req, res) => {
  try {
    const formulas = await Formula.find().sort({ subject: 1, chapter: 1 });
    res.json({ success: true, formulas });
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
    const subjects = await Formula.distinct('subject');
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
    const chapters = await Formula.distinct('chapter', { subject });
    res.json({ success: true, chapters });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ADMIN ROUTES (Protected)

// Add formula
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject, chapter, pdfUrl, shortNote } = req.body;

    if (!subject || !chapter || !pdfUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject, chapter, and PDF URL required' 
      });
    }

    // Check if formula already exists
    const existing = await Formula.findOne({ subject, chapter });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Formula already exists for this subject and chapter' 
      });
    }

    const formula = new Formula({
      subject,
      chapter,
      pdfUrl,
      shortNote
    });

    await formula.save();

    res.json({
      success: true,
      message: 'Formula added successfully',
      formula
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update formula
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const formula = await Formula.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!formula) {
      return res.status(404).json({ 
        success: false, 
        message: 'Formula not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Formula updated successfully', 
      formula 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete formula
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const formula = await Formula.findByIdAndDelete(req.params.id);

    if (!formula) {
      return res.status(404).json({ 
        success: false, 
        message: 'Formula not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Formula deleted successfully' 
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