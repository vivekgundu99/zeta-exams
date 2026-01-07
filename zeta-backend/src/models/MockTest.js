import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema({
  // Test Identification
  testId: {
    type: String,
    required: true,
    unique: true
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Exam Type
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  
  // Test Configuration
  duration: {
    type: Number, // in minutes
    required: true,
    default: 180
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  
  // Questions Array
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    section: {
      type: String,
      required: true
    },
    marks: {
      type: Number,
      required: true
    },
    negativeMarks: {
      type: Number,
      default: 0
    },
    questionNumber: {
      type: Number,
      required: true
    }
  }],
  
  // JEE Specific (3 sections: Physics, Chemistry, Maths)
  // Each section: 20 MCQ + 10 Numerical (5 to attempt)
  jeeConfig: {
    physics: {
      mcq: { count: Number, marksPerQuestion: Number, negativeMarks: Number },
      numerical: { count: Number, toAttempt: Number, marksPerQuestion: Number }
    },
    chemistry: {
      mcq: { count: Number, marksPerQuestion: Number, negativeMarks: Number },
      numerical: { count: Number, toAttempt: Number, marksPerQuestion: Number }
    },
    mathematics: {
      mcq: { count: Number, marksPerQuestion: Number, negativeMarks: Number },
      numerical: { count: Number, toAttempt: Number, marksPerQuestion: Number }
    }
  },
  
  // NEET Specific (Physics: 45, Chemistry: 45, Biology: 90)
  neetConfig: {
    physics: {
      count: Number,
      marksPerQuestion: Number,
      negativeMarks: Number
    },
    chemistry: {
      count: Number,
      marksPerQuestion: Number,
      negativeMarks: Number
    },
    biology: {
      count: Number,
      marksPerQuestion: Number,
      negativeMarks: Number
    }
  },
  
  // Test Metadata
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Analytics
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  
  // Admin Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
mockTestSchema.index({ examType: 1, isActive: 1 });
mockTestSchema.index({ testId: 1 });

// Generate Test ID
mockTestSchema.statics.generateTestId = async function(examType) {
  const prefix = examType === 'JEE' ? 'JM' : 'NT';
  const lastTest = await this.findOne({ examType })
    .sort({ testId: -1 })
    .limit(1);
  
  if (!lastTest) {
    return `${prefix}001`;
  }
  
  const lastNumber = parseInt(lastTest.testId.substring(2));
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `${prefix}${newNumber}`;
};

// Default configurations
mockTestSchema.statics.getDefaultConfig = function(examType) {
  if (examType === 'JEE') {
    return {
      duration: 180,
      totalQuestions: 90,
      totalMarks: 300,
      jeeConfig: {
        physics: {
          mcq: { count: 20, marksPerQuestion: 4, negativeMarks: -1 },
          numerical: { count: 10, toAttempt: 5, marksPerQuestion: 4 }
        },
        chemistry: {
          mcq: { count: 20, marksPerQuestion: 4, negativeMarks: -1 },
          numerical: { count: 10, toAttempt: 5, marksPerQuestion: 4 }
        },
        mathematics: {
          mcq: { count: 20, marksPerQuestion: 4, negativeMarks: -1 },
          numerical: { count: 10, toAttempt: 5, marksPerQuestion: 4 }
        }
      }
    };
  } else {
    return {
      duration: 180,
      totalQuestions: 180,
      totalMarks: 720,
      neetConfig: {
        physics: { count: 45, marksPerQuestion: 4, negativeMarks: -1 },
        chemistry: { count: 45, marksPerQuestion: 4, negativeMarks: -1 },
        biology: { count: 90, marksPerQuestion: 4, negativeMarks: -1 }
      }
    };
  }
};

const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;