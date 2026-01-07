import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema({
  // User and Test Info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true
  },
  testType: {
    type: String,
    enum: ['mock', 'chapter'],
    required: true
  },
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    required: true
  },
  
  // Attempt Details
  attemptNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // actual time taken in minutes
  },
  
  // Responses
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    questionNumber: {
      type: Number
    },
    subject: {
      type: String
    },
    userAnswer: {
      type: String
    },
    correctAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    isAttempted: {
      type: Boolean,
      default: false
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    timeTaken: {
      type: Number // in seconds
    },
    marksAwarded: {
      type: Number,
      default: 0
    }
  }],
  
  // Results
  score: {
    total: {
      type: Number,
      default: 0
    },
    physics: {
      type: Number,
      default: 0
    },
    chemistry: {
      type: Number,
      default: 0
    },
    mathematics: {
      type: Number,
      default: 0
    },
    biology: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  totalQuestions: {
    type: Number,
    required: true
  },
  attemptedQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  unattemptedQuestions: {
    type: Number,
    default: 0
  },
  
  // Accuracy
  accuracy: {
    type: Number,
    default: 0
  },
  
  // Percentile (calculated after all attempts)
  percentile: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number
  },
  
  // Status
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'auto-submitted'],
    default: 'ongoing'
  },
  
  // Subject-wise Analytics
  subjectAnalysis: {
    physics: {
      attempted: Number,
      correct: Number,
      wrong: Number,
      marks: Number,
      accuracy: Number
    },
    chemistry: {
      attempted: Number,
      correct: Number,
      wrong: Number,
      marks: Number,
      accuracy: Number
    },
    mathematics: {
      attempted: Number,
      correct: Number,
      wrong: Number,
      marks: Number,
      accuracy: Number
    },
    biology: {
      attempted: Number,
      correct: Number,
      wrong: Number,
      marks: Number,
      accuracy: Number
    }
  }
}, {
  timestamps: true
});

// Indexes
testAttemptSchema.index({ userId: 1, testId: 1 });
testAttemptSchema.index({ userId: 1, createdAt: -1 });
testAttemptSchema.index({ testId: 1, status: 1 });

// Calculate results after test completion
testAttemptSchema.methods.calculateResults = function() {
  let totalScore = 0;
  let attempted = 0;
  let correct = 0;
  let wrong = 0;
  
  const subjectScores = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
    biology: 0
  };
  
  const subjectStats = {
    physics: { attempted: 0, correct: 0, wrong: 0 },
    chemistry: { attempted: 0, correct: 0, wrong: 0 },
    mathematics: { attempted: 0, correct: 0, wrong: 0 },
    biology: { attempted: 0, correct: 0, wrong: 0 }
  };
  
  this.responses.forEach(response => {
    if (response.isAttempted) {
      attempted++;
      const subject = response.subject.toLowerCase();
      subjectStats[subject].attempted++;
      
      if (response.isCorrect) {
        correct++;
        subjectStats[subject].correct++;
      } else {
        wrong++;
        subjectStats[subject].wrong++;
      }
      
      totalScore += response.marksAwarded;
      subjectScores[subject] += response.marksAwarded;
    }
  });
  
  this.attemptedQuestions = attempted;
  this.correctAnswers = correct;
  this.wrongAnswers = wrong;
  this.unattemptedQuestions = this.totalQuestions - attempted;
  this.score.total = totalScore;
  
  Object.keys(subjectScores).forEach(subject => {
    this.score[subject] = subjectScores[subject];
    
    if (this.subjectAnalysis) {
      this.subjectAnalysis[subject] = {
        ...subjectStats[subject],
        marks: subjectScores[subject],
        accuracy: subjectStats[subject].attempted > 0 
          ? (subjectStats[subject].correct / subjectStats[subject].attempted * 100).toFixed(2)
          : 0
      };
    }
  });
  
  this.accuracy = attempted > 0 ? (correct / attempted * 100).toFixed(2) : 0;
};

// Calculate percentile
testAttemptSchema.statics.calculatePercentile = async function(attemptId) {
  const attempt = await this.findById(attemptId);
  if (!attempt) return;
  
  const totalAttempts = await this.countDocuments({
    testId: attempt.testId,
    status: 'completed'
  });
  
  const lowerScores = await this.countDocuments({
    testId: attempt.testId,
    status: 'completed',
    'score.total': { $lt: attempt.score.total }
  });
  
  const percentile = totalAttempts > 1 
    ? ((lowerScores / (totalAttempts - 1)) * 100).toFixed(2)
    : 100;
  
  attempt.percentile = percentile;
  await attempt.save();
  
  return percentile;
};

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);

export default TestAttempt;