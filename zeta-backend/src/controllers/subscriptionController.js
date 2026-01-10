import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import GiftCode from '../models/GiftCode.js';
import { sendSubscriptionEmail } from '../utils/emailService.js';

// Lazy initialization - only create instance when needed
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

// Subscription plans pricing
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

// Helper function to get plan
const getPlanOrThrow = (subscriptionType, duration) => {
  const plan = SUBSCRIPTION_PLANS[subscriptionType]?.[duration];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }
  return plan;
};

// @desc    Get all subscription plans
// @route   GET /api/subscription/plans
// @access  Private
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

// @desc    Create Razorpay order
// @route   POST /api/subscription/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { subscriptionType, duration } = req.body;
    const plan = getPlanOrThrow(subscriptionType, duration);
    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      console.error('❌ Razorpay not configured');
      return res.status(503).json({
        success: false,
        message: 'Payment service unavailable. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.'
      });
    }

    const order = await razorpay.orders.create({
      amount: plan.sp * 100,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { userId: req.user.id, subscriptionType, duration, days: plan.days }
    });

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
    console.error('Create order error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment and activate subscription
// @route   POST /api/subscription/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      subscriptionType,
      duration
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment details are incomplete'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Payment verification service is not configured'
      });
    }

    // Verify signature
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
      console.error('❌ Razorpay not configured');
      return res.status(503).json({
        success: false,
        message: 'Payment service unavailable.'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    // Update user subscription
    const user = await User.findById(req.user.id);
    const plan = getPlanOrThrow(subscriptionType, duration);

    const now = new Date();
    const endTime = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);

    user.subscription = subscriptionType;
    user.subscriptionStartTime = now;
    user.subscriptionEndTime = endTime;
    await user.save();

    // Send confirmation email
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

// @desc    Razorpay webhook handler
// @route   POST /api/subscription/webhook
// @access  Public (with signature verification)
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET not configured');
      return res.json({ success: true, received: true });
    }

    // Verify webhook signature
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

    console.log('Webhook event:', event);

    // Handle different events
    switch (event) {
      case 'payment.captured':
        const order = payload.payment.entity.order_id;
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
            
            console.log(`Subscription activated for user ${notes.userId}`);
          }
        }
        break;

      case 'payment.failed':
        console.log('Payment failed:', payload.payment.entity.error_description);
        break;

      default:
        console.log('Unhandled event:', event);
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

// @desc    Validate gift code
// @route   POST /api/subscription/validate-giftcode
// @access  Private
export const validateGiftCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is required'
      });
    }

    const giftCode = await GiftCode.findOne({ 
      code: code.toUpperCase() 
    });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid gift code'
      });
    }

    if (!giftCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: giftCode.isUsed 
          ? 'Gift code already used' 
          : 'Gift code expired'
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

// @desc    Apply gift code
// @route   POST /api/subscription/apply-giftcode
// @access  Private
export const applyGiftCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Gift code is required'
      });
    }

    const giftCode = await GiftCode.findOne({ 
      code: code.toUpperCase() 
    });

    if (!giftCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid gift code'
      });
    }

    if (!giftCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: giftCode.isUsed 
          ? 'Gift code already used' 
          : 'Gift code expired'
      });
    }

    // Apply subscription to user
    const user = await User.findById(req.user.id);
    const now = new Date();
    const endTime = new Date(now.getTime() + giftCode.durationInDays * 24 * 60 * 60 * 1000);

    user.subscription = giftCode.subscriptionType;
    user.subscriptionStartTime = now;
    user.subscriptionEndTime = endTime;
    user.giftCodeUsed = true;
    user.giftCodeDetails = {
      code: giftCode.code,
      usedAt: now
    };
    await user.save();

    // Mark gift code as used and delete
    giftCode.isUsed = true;
    giftCode.usedBy = user._id;
    giftCode.usedAt = now;
    await giftCode.save();
    
    // Delete the used gift code
    await GiftCode.findByIdAndDelete(giftCode._id);

    // Send confirmation email
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