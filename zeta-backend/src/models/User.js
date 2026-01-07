import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phoneNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Login Management
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  loginDeviceId: {
    type: String,
    default: null
  },
  lastLoginAt: {
    type: Date
  },
  
  // Exam Type
  examType: {
    type: String,
    enum: ['JEE', 'NEET'],
    default: null
  },
  
  // Subscription Details
  subscription: {
    type: String,
    enum: ['free', 'silver', 'gold'],
    default: 'free'
  },
  subscriptionStartTime: {
    type: Date,
    default: null
  },
  subscriptionEndTime: {
    type: Date,
    default: null
  },
  
  // Daily Limits
  dailyLimit: {
    questionsAttempted: {
      type: Number,
      default: 0
    },
    chapterTestsAttempted: {
      type: Number,
      default: 0
    },
    mockTestsAttempted: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    },
    isLimitReached: {
      type: Boolean,
      default: false
    }
  },
  
  // User Details
  userDetailsCompleted: {
    type: Boolean,
    default: false
  },
  userDetails: {
    name: {
      type: String,
      maxlength: 50,
      trim: true
    },
    profession: {
      type: String,
      enum: ['student', 'teacher']
    },
    grade: {
      type: String,
      enum: ['9th', '10th', '11th', '12th', '12th-passout', 'other']
    },
    preparingFor: {
      type: String
    },
    collegeName: {
      type: String,
      maxlength: 50,
      trim: true
    },
    state: {
      type: String,
      enum: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Outside India'
      ]
    },
    lifeAmbition: {
      type: String,
      maxlength: 50,
      trim: true
    }
  },
  
  // Gift Code
  giftCodeUsed: {
    type: Boolean,
    default: false
  },
  giftCodeDetails: {
    code: String,
    usedAt: Date
  },
  
  // Analytics
  totalQuestionsAttempted: {
    type: Number,
    default: 0
  },
  totalTestsAttempted: {
    type: Number,
    default: 0
  },
  totalMockTestsAttempted: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNo: 1 });
userSchema.index({ subscriptionEndTime: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is active
userSchema.methods.isSubscriptionActive = function() {
  if (this.subscription === 'free') return true;
  if (!this.subscriptionEndTime) return false;
  return new Date() < this.subscriptionEndTime;
};

// Get daily limit for current subscription
userSchema.methods.getDailyLimits = function() {
  const limits = {
    free: {
      questions: 50,
      chapterTests: 0,
      mockTests: 0
    },
    silver: {
      questions: 200,
      chapterTests: 10,
      mockTests: 0
    },
    gold: {
      questions: 5000,
      chapterTests: 50,
      mockTests: 8
    }
  };
  return limits[this.subscription] || limits.free;
};

// Check if daily limit reached
userSchema.methods.checkDailyLimit = function(type) {
  const limits = this.getDailyLimits();
  
  switch(type) {
    case 'questions':
      return this.dailyLimit.questionsAttempted >= limits.questions;
    case 'chapterTests':
      return this.dailyLimit.chapterTestsAttempted >= limits.chapterTests;
    case 'mockTests':
      return this.dailyLimit.mockTestsAttempted >= limits.mockTests;
    default:
      return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;