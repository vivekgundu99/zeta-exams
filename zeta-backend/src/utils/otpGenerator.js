// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with 10-minute expiry
export const storeOTP = async (identifier, otp) => {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(identifier, { otp, expiresAt });
  
  // Auto-delete after expiry
  setTimeout(() => {
    otpStore.delete(identifier);
  }, 10 * 60 * 1000);
  
  return true;
};

// Verify OTP
export const verifyOTP = async (identifier, otp) => {
  const stored = otpStore.get(identifier);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier);
    return false;
  }
  
  if (stored.otp !== otp) {
    return false;
  }
  
  // Delete OTP after successful verification
  otpStore.delete(identifier);
  return true;
};

// Clear expired OTPs (cleanup job)
export const clearExpiredOTPs = () => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
};