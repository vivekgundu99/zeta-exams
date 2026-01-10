import User from '../models/User.js';
import TestAttempt from '../models/TestAttempt.js';
import { decryptPhone } from '../utils/encryption.js';

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -loginDeviceId');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Decrypt phone number for display
    const userProfile = user.toObject();
    try {
      userProfile.phoneNo = decryptPhone(user.phoneNo);
    } catch (error) {
      // If decryption fails, keep encrypted value
      console.error('Phone decryption error:', error);
    }

    // Return complete user object with all details
    res.json({
      success: true,
      user: {
        id: userProfile._id,
        email: userProfile.email,
        phoneNo: userProfile.phoneNo,
        subscription: userProfile.subscription,
        subscriptionStartTime: userProfile.subscriptionStartTime,
        subscriptionEndTime: userProfile.subscriptionEndTime,
        examType: userProfile.examType,
        userDetailsCompleted: userProfile.userDetailsCompleted,
        userDetails: userProfile.userDetails,
        isAdmin: userProfile.isAdmin,
        dailyLimit: userProfile.dailyLimit,
        totalQuestionsAttempted: userProfile.totalQuestionsAttempted,
        totalTestsAttempted: userProfile.totalTestsAttempted,
        totalMockTestsAttempted: userProfile.totalMockTestsAttempted,
        giftCodeUsed: userProfile.giftCodeUsed,
        giftCodeDetails: userProfile.giftCodeDetails,
        createdAt: userProfile.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user details
// @route   PUT /api/user/details
// @access  Private
export const updateUserDetails = async (req, res) => {
  try {
    const { name, profession, grade, preparingFor, collegeName, state, lifeAmbition } = req.body;

    // Validation
    if (!name || !profession || !preparingFor || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate character limits
    if (name.length > 50 || collegeName?.length > 50 || lifeAmbition?.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name, college name, and life ambition must not exceed 50 characters'
      });
    }

    // Grade validation for students
    if (profession === 'student' && !grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade is required for students'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user details - THIS IS THE KEY FIX
    user.userDetails = {
      name,
      profession,
      grade: profession === 'student' ? grade : 'other',
      preparingFor,
      collegeName: collegeName || '',
      state,
      lifeAmbition: lifeAmbition || ''
    };
    user.userDetailsCompleted = true;

    // Save to database
    await user.save();

    // Return updated user with complete details
    res.json({
      success: true,
      message: 'User details updated successfully',
      user: {
        id: user._id,
        email: user.email,
        userDetailsCompleted: user.userDetailsCompleted,
        userDetails: user.userDetails,
        examType: user.examType,
        subscription: user.subscription,
        subscriptionEndTime: user.subscriptionEndTime,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Select exam type
// @route   POST /api/user/select-exam
// @access  Private
export const selectExamType = async (req, res) => {
  try {
    const { examType } = req.body;

    if (!examType || !['JEE', 'NEET'].includes(examType)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid exam type (JEE or NEET)'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.examType = examType;
    await user.save();

    res.json({
      success: true,
      message: `${examType} exam selected successfully`,
      examType: user.examType
    });
  } catch (error) {
    console.error('Select exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update exam type
// @route   PUT /api/user/exam-type
// @access  Private
export const updateExamType = async (req, res) => {
  try {
    const { examType } = req.body;

    if (!examType || !['JEE', 'NEET'].includes(examType)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid exam type (JEE or NEET)'
      });
    }

    const user = await User.findById(req.user.id);
    user.examType = examType;
    await user.save();

    res.json({
      success: true,
      message: `Exam type changed to ${examType} successfully`,
      examType: user.examType
    });
  } catch (error) {
    console.error('Update exam type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update password
// @route   PUT /api/user/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id);

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/user/stats
// @access  Private
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const mockTestAttempts = await TestAttempt.countDocuments({
      userId: req.user.id,
      testType: 'mock',
      status: 'completed'
    });

    const chapterTestAttempts = await TestAttempt.countDocuments({
      userId: req.user.id,
      testType: 'chapter',
      status: 'completed'
    });

    const avgScore = await TestAttempt.aggregate([
      { 
        $match: { 
          userId: user._id, 
          testType: 'mock',
          status: 'completed'
        } 
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score.total' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalQuestionsAttempted: user.totalQuestionsAttempted,
        mockTestsCompleted: mockTestAttempts,
        chapterTestsCompleted: chapterTestAttempts,
        averageScore: avgScore[0]?.avgScore || 0,
        averageAccuracy: avgScore[0]?.avgAccuracy || 0,
        subscription: user.subscription,
        dailyLimit: user.dailyLimit
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get subscription info
// @route   GET /api/user/subscription-info
// @access  Private
export const getSubscriptionInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const daysRemaining = user.subscriptionEndTime 
      ? Math.ceil((user.subscriptionEndTime - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      success: true,
      subscription: {
        type: user.subscription,
        startTime: user.subscriptionStartTime,
        endTime: user.subscriptionEndTime,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isActive: user.isSubscriptionActive(),
        limits: user.getDailyLimits(),
        currentUsage: {
          questions: user.dailyLimit.questionsAttempted,
          chapterTests: user.dailyLimit.chapterTestsAttempted,
          mockTests: user.dailyLimit.mockTestsAttempted
        }
      }
    });
  } catch (error) {
    console.error('Get subscription info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};