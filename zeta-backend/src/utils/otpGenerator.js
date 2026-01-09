import OTP from '../models/OTP.js';

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = async (email, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  await OTP.findOneAndDelete({ email });
  
  await OTP.create({
    email,
    otp,
    expiresAt
  });
  
  return true;
};

export const verifyOTP = async (email, otp) => {
  const stored = await OTP.findOne({ 
    email, 
    expiresAt: { $gt: new Date() }
  });
  
  if (!stored || stored.otp !== otp) {
    return false;
  }
  
  await OTP.findByIdAndDelete(stored._id);
  return true;
};

export const clearExpiredOTPs = async () => {
  await OTP.deleteMany({ 
    expiresAt: { $lt: new Date() }
  });
};