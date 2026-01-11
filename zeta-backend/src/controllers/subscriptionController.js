import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import GiftCode from '../models/GiftCode.js';
import { sendSubscriptionEmail } from '../utils/emailService.js';

// Lazy initialization
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized');
  }
  return razorpayInstance;
};

// Subscription plans
const SUBSCRIPTION_PLANS = {
  silver: {
    '1month': { mrp: 100, sp: 49, days: 30 },
    '6months': { mrp: 500, sp: 249, days: 180 },
    '1year': { mrp: 1000, sp: 399, days: 365 }
  },
  gold: {
    '1month': { mrp: 600, sp: 299, days: 30 },
    '6months': { mrp: 2500, sp: 1299, days: 180 },
    '1year': { mrp: 5000, sp: 2000, days: 365 }
  }
};

const getPlanOrThrow = (subscriptionType, duration) => {
  const plan = SUBSCRIPTION_PLANS[subscriptionType]?.[duration];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }
  return plan;
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      plans: SUBSCRIPTION_PLANS
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { subscriptionType, duration } = req.body;
    
    // Detailed logging
    console.log('📝 CREATE ORDER REQUEST');
    console.log('Body:', req.body);
    console.log('User:', req.user?.id);
    console.log('Razorpay Key ID exists:', !!process.env.RAZORPAY_KEY_ID);
    console.log('Razorpay Secret exists:', !!process.env.RAZORPAY_KEY_SECRET);

    // Validate inputs
    if (!subscriptionType) {
      console.log('❌ Missing subscriptionType');
      return res.status(400).json({
        success: false,
        message: 'Subscription type is required'
      });
    }

    if (!duration) {
      console.log('❌ Missing duration');
      return res.status(400).json({
        success: false,
        message: 'Duration is required'
      });
    }

    // Validate subscription type
    if (!['silver', 'gold'].includes(subscriptionType)) {
      console.log('❌ Invalid subscriptionType:', subscriptionType);
      return res.status(400).json({
        success: false,
        message: `Invalid subscription type: ${subscriptionType}. Must be 'silver' or 'gold'.`
      });
    }

    // Validate duration
    if (!['1month', '6months', '1year'].includes(duration)) {
      console.log('❌ Invalid duration:', duration);
      return res.status(400).json({
        success: false,
        message: `Invalid duration: ${duration}. Must be '1month', '6months', or '1year'.`
      });
    }

    // Check if plan exists
    if (!SUBSCRIPTION_PLANS[subscriptionType]) {
      console.log('❌ Plan not found for subscriptionType:', subscriptionType);
      return res.status(400).json({
        success: false,
        message: `No plans available for ${subscriptionType}`
      });
    }

    if (!SUBSCRIPTION_PLANS[subscriptionType][duration]) {
      console.log('❌ Duration not found:', duration, 'for', subscriptionType);
      return res.status(400).json({
        success: false,
        message: `Duration ${duration} not available for ${subscriptionType}`
      });
    }

    const plan = SUBSCRIPTION_PLANS[subscriptionType][duration];
    console.log('✅ Plan found:', plan);

    // Check Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials missing');
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please contact support.'
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      console.error('❌ Razorpay instance failed');
      return res.status(503).json({
        success: false,
        message: 'Payment service initialization failed'
      });
    }

    console.log('✅ Creating Razorpay order...');
    console.log('Amount:', plan.sp * 100, 'INR');

    // ADD THIS BLOCK
try {
  const order = await razorpay.orders.create({
    amount: plan.sp * 100,
    currency: 'INR',
    receipt: `sub_${req.user.id}_${Date.now()}`,
    notes: { 
      userId: req.user.id, 
      subscriptionType, 
      duration, 
      days: plan.days 
    }
  });

  console.log('✅ Razorpay order created:', order.id);

  res.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    }
  });

} catch (razorpayError) {
  console.error('❌ Razorpay API Error:', razorpayError);
  throw new Error(`Razorpay error: ${razorpayError.message}`);
}

    const order = await razorpay.orders.create({
      amount: plan.sp * 100,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { 
        userId: req.user.id, 
        subscriptionType, 
        duration, 
        days: plan.days 
      }
    });

    console.log('✅ Razorpay order created:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('❌ CREATE ORDER ERROR:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionType, duration } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment details incomplete'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Payment verification unavailable'
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service unavailable'
      });
    }

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const user = await User.findById(req.user.id);
    const plan = getPlanOrThrow(subscriptionType, duration);

    const now = new Date();
    const endTime = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

    user.subscription = subscriptionType;
    user.subscriptionStartTime = now;
    user.subscriptionEndTime = endTime;
    await user.save();

    await sendSubscriptionEmail(user.email, subscriptionType, endTime);

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        type: subscriptionType,
        startTime: now,
        endTime: endTime
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.json({ success: true, received: true });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const notes = payload.payment.entity.notes;
      
      if (notes && notes.userId) {
        const user = await User.findById(notes.userId);
        if (user) {
          const now = new Date();
          const endTime = new Date(now.getTime() + notes.days * 24 * 60 * 60 * 1000);
          
          user.subscription = notes.subscriptionType;
          user.subscriptionStartTime = now;
          user.subscriptionEndTime = endTime;
          await user.save();
        }
      }
    }

    res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

export const validateGiftCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is required'
      });
    }

    const giftCode = await GiftCode.findOne({ code: code.toUpperCase() });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid gift code'
      });
    }

    if (!giftCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: giftCode.isUsed ? 'Gift code already used' : 'Gift code expired'
      });
    }

    res.json({
      success: true,
      message: 'Valid gift code',
      giftCode: {
        subscriptionType: giftCode.subscriptionType,
        duration: giftCode.duration
      }
    });
  } catch (error) {
    console.error('Validate gift code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const applyGiftCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is required'
      });
    }

    const giftCode = await GiftCode.findOne({ code: code.toUpperCase() });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid gift code'
      });
    }

    if (!giftCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: giftCode.isUsed ? 'Gift code already used' : 'Gift code expired'
      });
    }

    const user = await User.findById(req.user.id);
    const now = new Date();
    const endTime = new Date(now.getTime() + giftCode.durationInDays * 24 * 60 * 60 * 1000);

    user.subscription = giftCode.subscriptionType;
    user.subscriptionStartTime = now;
    user.subscriptionEndTime = endTime;
    user.giftCodeUsed = true;
    user.giftCodeDetails = { code: giftCode.code, usedAt: now };
    await user.save();

    giftCode.isUsed = true;
    giftCode.usedBy = user._id;
    giftCode.usedAt = now;
    await giftCode.save();
    await GiftCode.findByIdAndDelete(giftCode._id);

    await sendSubscriptionEmail(user.email, giftCode.subscriptionType, endTime);

    res.json({
      success: true,
      message: 'Gift code applied successfully!',
      subscription: {
        type: user.subscription,
        startTime: now,
        endTime: endTime
      }
    });
  } catch (error) {
    console.error('Apply gift code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};