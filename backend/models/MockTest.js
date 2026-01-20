// models/MockTest.js
const mongoose = require('mongoose');

const mockTestQuestionSchema = new mongoose.Schema({
  serialNumber: {
    type: Number,
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
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
    unique: true
  },
  duration: {
    type: Number,
    default: 180 // minutes
  },
  totalQuestions: {
    type: Number,
    default: 180
  },
  marking: {
    positive: { type: Number, default: 4 },
    negative: { type: Number, default: -1 }
  },
  questions: [mockTestQuestionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('MockTest', mockTestSchema);