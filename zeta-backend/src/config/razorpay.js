import Razorpay from 'razorpay';

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Validate Razorpay credentials
export const validateRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }

  const keyIdPattern = /^rzp_(test|live)_[A-Za-z0-9]+$/;
  if (!keyIdPattern.test(process.env.RAZORPAY_KEY_ID)) {
    throw new Error('Invalid Razorpay Key ID format');
  }

  console.log('✅ Razorpay configured successfully');
  console.log(`   Mode: ${process.env.RAZORPAY_KEY_ID.includes('test') ? 'TEST' : 'LIVE'}`);
};

export default razorpayInstance;