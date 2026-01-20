// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zeta-exams-secret-key-2024';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

module.exports = { authMiddleware, JWT_SECRET };

// utils/csvParser.js
const parseQuestionCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const questions = [];
  
  lines.forEach((line, index) => {
    const parts = line.split('#');
    
    if (parts.length >= 9) {
      questions.push({
        subject: parts[0].trim(),
        chapter: parts[1].trim(),
        question: parts[2].trim(),
        optionA: parts[3].trim(),
        optionB: parts[4].trim(),
        optionC: parts[5].trim(),
        optionD: parts[6].trim(),
        correctOption: parts[7].trim().toUpperCase(),
        explanation: parts[8].trim(),
        questionImageUrl: parts[9]?.trim() || '',
        explanationImageUrl: parts[10]?.trim() || ''
      });
    }
  });
  
  return questions;
};

const parseMockTestCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const questions = [];
  
  lines.forEach((line, index) => {
    const parts = line.split('#');
    
    if (parts.length >= 8) {
      questions.push({
        serialNumber: index + 1,
        question: parts[0].trim(),
        optionA: parts[1].trim(),
        optionB: parts[2].trim(),
        optionC: parts[3].trim(),
        optionD: parts[4].trim(),
        correctOption: parts[5].trim().toUpperCase(),
        explanation: parts[6].trim(),
        questionImageUrl: parts[7]?.trim() || '',
        explanationImageUrl: parts[8]?.trim() || ''
      });
    }
  });
  
  return questions;
};

module.exports = { parseQuestionCSV, parseMockTestCSV };