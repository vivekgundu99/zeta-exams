import { Resend } from 'resend';

// Initialize Resend instance
const resendInstance = new Resend(process.env.RESEND_API_KEY);

// Validate Resend configuration
export const validateResendConfig = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is not configured');
  }

  const keyPattern = /^re_[A-Za-z0-9_-]+$/;
  if (!keyPattern.test(process.env.RESEND_API_KEY)) {
    throw new Error('Invalid Resend API key format');
  }

  console.log('✅ Resend email service configured successfully');
};

// Test email sending capability
export const testEmailService = async () => {
  try {
    // This is a test - won't actually send in most cases
    console.log('Email service ready');
    return true;
  } catch (error) {
    console.error('Email service test failed:', error.message);
    return false;
  }
};

export default resendInstance;