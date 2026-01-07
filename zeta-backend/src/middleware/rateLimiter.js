import rateLimit from 'express-rate-limit';

// Create rate limiter middleware
export const rateLimiter = (maxRequests = 5, windowMinutes = 15) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      success: false,
      message: `Too many requests. Please try again after ${windowMinutes} minutes.`
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID if authenticated, otherwise IP
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    }
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true
});

export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again after 10 minutes.'
  }
});

export const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again after 5 minutes.'
  }
});

export const adminRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.'
  }
});