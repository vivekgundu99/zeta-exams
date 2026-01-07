import mongoose from 'mongoose';

const formulaSchema = new mongoose.Schema({
  // Exam Type
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  
  // Classification
  subject: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  },
  chapter: {
    type: String,
    required: true,
    trim: true
  },
  
  // Content
  topicName: {
    type: String,
    required: true,
    trim: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  
  // Metadata
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Admin Info
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
formulaSchema.index({ examType: 1, subject: 1, chapter: 1 });
formulaSchema.index({ isActive: 1 });

// Increment view count
formulaSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

const Formula = mongoose.model('Formula', formulaSchema);

export default Formula;