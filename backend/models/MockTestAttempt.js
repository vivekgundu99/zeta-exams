// models/MockTestAttempt.js
const mongoose = require('mongoose');

const mockTestAttemptSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true
  },
  userId: String, // Optional: for future user tracking
  answers: [{
    questionNumber: Number,
    selectedOption: String,
    isCorrect: Boolean
  }],
  score: Number,
  timeTaken: Number, // in minutes
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('MockTestAttempt', mockTestAttemptSchema);