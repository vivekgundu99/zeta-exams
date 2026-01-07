import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Update last active
      req.user.lastActive = new Date();
      await req.user.save();

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check subscription level
export const checkSubscription = (requiredLevel) => {
  const levels = { free: 0, silver: 1, gold: 2 };
  
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Check if subscription is active
      if (!user.isSubscriptionActive() && user.subscription !== 'free') {
        user.subscription = 'free';
        await user.save();
      }
      
      const userLevel = levels[user.subscription] || 0;
      const required = levels[requiredLevel] || 0;
      
      if (userLevel < required) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredLevel} subscription`,
          currentSubscription: user.subscription,
          requiredSubscription: requiredLevel
        });
      }
      
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};

// Check daily limit
export const checkDailyLimit = (type) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (user.checkDailyLimit(type)) {
        const limits = user.getDailyLimits();
        return res.status(403).json({
          success: false,
          message: 'Daily limit reached',
          limit: limits[type],
          current: user.dailyLimit[`${type}Attempted`],
          subscription: user.subscription
        });
      }
      
      next();
    } catch (error) {
      console.error('Daily limit check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
};