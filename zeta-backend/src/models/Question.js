import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // Question Identification
  questionId: {
    type: String,
    required: true,
    unique: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  
  // Question Type
  type: {
    type: String,
    enum: ['S', 'N'], // S = Single Correct MCQ, N = Numerical
    required: true
  },
  
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
  chapterNumber: {
    type: Number,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  topicCode: {
    type: String,
    required: true
  },
  
  // Question Content
  question: {
    type: String,
    required: true
  },
  questionImageUrl: {
    type: String,
    default: null
  },
  
  // Options (for MCQ type 'S')
  options: {
    A: {
      text: String,
      imageUrl: String
    },
    B: {
      text: String,
      imageUrl: String
    },
    C: {
      text: String,
      imageUrl: String
    },
    D: {
      text: String,
      imageUrl: String
    }
  },
  
  // Answer
  answer: {
    type: String,
    required: true
  },
  
  // Metadata
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  solution: {
    type: String,
    default: null
  },
  solutionImageUrl: {
    type: String,
    default: null
  },
  
  // Analytics
  totalAttempts: {
    type: Number,
    default: 0
  },
  correctAttempts: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Admin Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for fast querying
questionSchema.index({ examType: 1, subject: 1, chapter: 1, topic: 1 });
questionSchema.index({ questionId: 1 });
questionSchema.index({ serialNumber: 1 });
questionSchema.index({ isActive: 1 });

// Generate Question ID (auto-increment)
questionSchema.statics.generateQuestionId = async function(examType) {
  const lastQuestion = await this.findOne({ examType })
    .sort({ questionId: -1 })
    .limit(1);
  
  if (!lastQuestion) {
    return '0000001';
  }
  
  const lastId = parseInt(lastQuestion.questionId);
  const newId = (lastId + 1).toString().padStart(7, '0');
  return newId;
};

// Generate Serial Number (chapterNumber + topicCode + questionNumber)
questionSchema.statics.generateSerialNumber = async function(examType, chapterNumber, topicCode) {
  const questionsInTopic = await this.countDocuments({
    examType,
    chapterNumber,
    topicCode,
    isActive: true
  });
  
  const questionNumber = questionsInTopic + 1;
  return `${chapterNumber}${topicCode}${questionNumber}`;
};

// Method to update analytics
questionSchema.methods.recordAttempt = async function(isCorrect) {
  this.totalAttempts += 1;
  if (isCorrect) {
    this.correctAttempts += 1;
  }
  await this.save();
};

const Question = mongoose.model('Question', questionSchema);

export default Question;