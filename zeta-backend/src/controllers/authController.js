import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateOTP, verifyOTP, storeOTP } from '../utils/otpGenerator.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { encryptPhone, decryptPhone } from '../utils/encryption.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { email, phoneNo, password, confirmPassword } = req.body;

    // Validation
    if (!email || !phoneNo || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNo: encryptPhone(phoneNo) }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, otp, 'registration');

    // Store user data temporarily (in production, use Redis or similar)
    // For now, we'll send back a token to verify OTP
    const tempToken = jwt.sign(
      { email, phoneNo: encryptPhone(phoneNo), password },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      tempToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', error.stack); // Add this line
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined // Add this line
    });
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPAndRegister = async (req, res) => {
  try {
    const { tempToken, otp } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and OTP'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { email, phoneNo, password } = decoded;

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Create user
    const user = await User.create({
      email,
      phoneNo,
      password
    });

    // Generate auth token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        subscription: user.subscription,
        userDetailsCompleted: user.userDetailsCompleted,
        examType: user.examType
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, phoneNo, password, deviceId, isAdmin } = req.body;

    // Validation
    if ((!email && !phoneNo) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/phone and password'
      });
    }

    // Admin login check
    if (isAdmin) {
      if (email !== process.env.ADMIN_EMAIL) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      // In production, verify against hashed password
      if (password !== 'Zeta@123') {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      // Find or create admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        adminUser = await User.create({
          email: process.env.ADMIN_EMAIL,
          phoneNo: '0000000000',
          password: 'Zeta@123',
          isAdmin: true,
          userDetailsCompleted: true
        });
      }

      const token = generateToken(adminUser._id);

      return res.json({
        success: true,
        message: 'Admin login successful',
        token,
        isAdmin: true,
        user: {
          id: adminUser._id,
          email: adminUser.email,
          isAdmin: true
        }
      });
    }

    // Regular user login
    const query = email ? { email } : { phoneNo: encryptPhone(phoneNo) };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if already logged in on another device
    if (user.isLoggedIn && user.loginDeviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        message: 'Already logged in on another device. Please logout from that device first.'
      });
    }

    // Update login status
    user.isLoggedIn = true;
    user.loginDeviceId = deviceId;
    user.lastLoginAt = new Date();
    user.lastActive = new Date();
    await user.save();

    // Check if subscription expired
    if (!user.isSubscriptionActive() && user.subscription !== 'free') {
      user.subscription = 'free';
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        phoneNo: decryptPhone(user.phoneNo),
        subscription: user.subscription,
        subscriptionEndTime: user.subscriptionEndTime,
        userDetailsCompleted: user.userDetailsCompleted,
        examType: user.examType,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.isLoggedIn = false;
      user.loginDeviceId = null;
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate and send OTP
    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, otp, 'password-reset');

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};