// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Indian)
export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Password strength validation
export const isStrongPassword = (password) => {
  // At least 6 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
  return passwordRegex.test(password);
};

// Validate subscription type
export const isValidSubscription = (subscription) => {
  return ['free', 'silver', 'gold'].includes(subscription);
};

// Validate exam type
export const isValidExamType = (examType) => {
  return ['JEE', 'NEET'].includes(examType);
};

// Validate Indian state
export const isValidState = (state) => {
  const validStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Outside India'
  ];
  return validStates.includes(state);
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Validate gift code format
export const isValidGiftCode = (code) => {
  // Format: S1ABC123 or G6XYZ456 or SY123456
  const giftCodeRegex = /^[SG][16Y][A-Z0-9]{6}$/;
  return giftCodeRegex.test(code);
};

// Validate question ID format
export const isValidQuestionId = (id) => {
  const questionIdRegex = /^\d{7}$/;
  return questionIdRegex.test(id);
};

// Validate serial number format
export const isValidSerialNumber = (serial) => {
  const serialRegex = /^\d+[A-Z]\d+$/;
  return serialRegex.test(serial);
};

// Check if string length is within limit
export const isWithinLength = (str, maxLength) => {
  return str && str.length <= maxLength;
};

// Validate URL
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate CloudFront URL
export const isValidCloudFrontURL = (url) => {
  if (!url) return true; // Allow null
  return url.includes('cloudfront.net') || url.includes('s3.amazonaws.com');
};

// Comprehensive validation for user details
export const validateUserDetails = (details) => {
  const errors = [];

  if (!details.name || !isWithinLength(details.name, 50)) {
    errors.push('Name is required and must not exceed 50 characters');
  }

  if (!details.profession || !['student', 'teacher'].includes(details.profession)) {
    errors.push('Valid profession is required (student or teacher)');
  }

  if (details.profession === 'student' && !details.grade) {
    errors.push('Grade is required for students');
  }

  if (!details.preparingFor) {
    errors.push('Preparing for exam is required');
  }

  if (details.collegeName && !isWithinLength(details.collegeName, 50)) {
    errors.push('College name must not exceed 50 characters');
  }

  if (!details.state || !isValidState(details.state)) {
    errors.push('Valid state is required');
  }

  if (details.lifeAmbition && !isWithinLength(details.lifeAmbition, 50)) {
    errors.push('Life ambition must not exceed 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comprehensive validation for question data
export const validateQuestionData = (question) => {
  const errors = [];

  if (!question.type || !['S', 'N'].includes(question.type)) {
    errors.push('Valid question type is required (S or N)');
  }

  if (!question.examType || !isValidExamType(question.examType)) {
    errors.push('Valid exam type is required (JEE or NEET)');
  }

  if (!question.subject) {
    errors.push('Subject is required');
  }

  if (!question.chapter) {
    errors.push('Chapter is required');
  }

  if (!question.topic) {
    errors.push('Topic is required');
  }

  if (!question.question) {
    errors.push('Question text is required');
  }

  if (!question.answer) {
    errors.push('Answer is required');
  }

  // MCQ specific validation
  if (question.type === 'S') {
    if (!question.options || !question.options.A || !question.options.B || 
        !question.options.C || !question.options.D) {
      errors.push('All four options are required for MCQ questions');
    }

    if (!['A', 'B', 'C', 'D'].includes(question.answer)) {
      errors.push('Answer must be A, B, C, or D for MCQ questions');
    }
  }

  // Validate image URLs if provided
  if (question.questionImageUrl && !isValidCloudFrontURL(question.questionImageUrl)) {
    errors.push('Invalid question image URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};