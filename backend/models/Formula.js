// models/Formula.js
const mongoose = require('mongoose');

const formulaSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Biology']
  },
  chapter: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  shortNote: String
}, {
  timestamps: true
});

formulaSchema.index({ subject: 1, chapter: 1 }, { unique: true });

module.exports = mongoose.model('Formula', formulaSchema);