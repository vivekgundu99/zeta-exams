// models/Question.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Biology']
  },
  chapter: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
  correctOption: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  explanation: String,
  questionImageUrl: String,
  explanationImageUrl: String
}, {
  timestamps: true
});

questionSchema.index({ subject: 1, chapter: 1 });
questionSchema.index({ questionId: 1 });
questionSchema.index({ serialNumber: 1 });

module.exports = mongoose.model('Question', questionSchema);