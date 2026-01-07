import mongoose from 'mongoose';

const giftCodeSchema = new mongoose.Schema({
  // Gift Code
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 8
  },
  
  // Subscription Details
  subscriptionType: {
    type: String,
    enum: ['silver', 'gold'],
    required: true
  },
  duration: {
    type: String,
    enum: ['1month', '6months', '1year'],
    required: true
  },
  durationInDays: {
    type: Number,
    required: true
  },
  
  // Status
  isUsed: {
    type: Boolean,
    default: false
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  usedAt: {
    type: Date,
    default: null
  },
  
  // Admin Info
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Expiry (optional - for limited time codes)
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
giftCodeSchema.index({ code: 1 });
giftCodeSchema.index({ isUsed: 1 });
giftCodeSchema.index({ expiresAt: 1 });

// Generate Gift Code
giftCodeSchema.statics.generateCode = function(subscriptionType, duration) {
  // First letter: S for silver, G for gold
  const typeCode = subscriptionType === 'silver' ? 'S' : 'G';
  
  // Second letter: 1 for 1month, 6 for 6months, Y for 1year
  let durationCode;
  let durationInDays;
  
  switch(duration) {
    case '1month':
      durationCode = '1';
      durationInDays = 30;
      break;
    case '6months':
      durationCode = '6';
      durationInDays = 180;
      break;
    case '1year':
      durationCode = 'Y';
      durationInDays = 365;
      break;
    default:
      durationCode = '1';
      durationInDays = 30;
  }
  
  // Generate 6 random alphanumeric characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  const code = `${typeCode}${durationCode}${randomCode}`;
  
  return { code, durationInDays };
};

// Validate and parse gift code
giftCodeSchema.statics.parseCode = function(code) {
  if (!code || code.length !== 8) {
    return null;
  }
  
  const typeCode = code[0];
  const durationCode = code[1];
  
  let subscriptionType;
  let duration;
  
  if (typeCode === 'S') {
    subscriptionType = 'silver';
  } else if (typeCode === 'G') {
    subscriptionType = 'gold';
  } else {
    return null;
  }
  
  if (durationCode === '1') {
    duration = '1month';
  } else if (durationCode === '6') {
    duration = '6months';
  } else if (durationCode === 'Y') {
    duration = '1year';
  } else {
    return null;
  }
  
  return { subscriptionType, duration };
};

// Check if code is valid
giftCodeSchema.methods.isValid = function() {
  if (this.isUsed) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

const GiftCode = mongoose.model('GiftCode', giftCodeSchema);

export default GiftCode;