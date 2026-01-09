import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import GiftCode from '../models/GiftCode.js';
import { sendSubscriptionEmail } from '../utils/emailService.js';

/* ======================================================
   Razorpay Initialization (UNCHANGED)
====================================================== */

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

/* ======================================================
   Subscription Plans (UNCHANGED)
====================================================== */

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

/* ======================================================
   SMALL HELPERS (ONLY DUPLICATION REMOVED)
====================================================== */

const getPlanOrThrow = (subscriptionType, duration) => {
  if (!subscriptionType || !duration) {
    throw new Error('Subscription type and duration are required');
  }
  if (!SUBSCRIPTION_PLANS[subscriptionType] || !SUBSCRIPTION_PLANS[subscriptionType][duration]) {
    throw new Error('Invalid subscription plan');
  }
  return SUBSCRIPTION_PLANS[subscriptionType][duration];
};

if (!razorpay) {
  console.error('❌ Razorpay not configured');
  return res.status(503).json({
    success: false,
    message: 'Payment service unavailable. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.'
  });
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const activateUserSubscription = async (userId, subscriptionType, days) => {
  const user = await User.findById(userId);
  const now = new Date();
  const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  user.subscription = subscriptionType;
  user.subscriptionStartTime = now;
  user.subscriptionEndTime = endTime;

  await user.save();
  await sendSubscriptionEmail(user.email, subscriptionType, endTime);

  return { now, endTime, user };
};

const getValidGiftCodeOrThrow = async (code) => {
  if (!code) throw new Error('Gift code is required');

  const giftCode = await GiftCode.findOne({ code: code.toUpperCase() });
  if (!giftCode) throw new Error('Invalid gift code');

  if (!giftCode.isValid()) {
    throw new Error(giftCode.isUsed ? 'Gift code already used' : 'Gift code expired');
  }
  return giftCode;
};

/* ======================================================
   CONTROLLERS
====================================================== */

// @desc    Get all subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    res.json({ success: true, plans: SUBSCRIPTION_PLANS });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const { subscriptionType, duration } = req.body;
    const plan = getPlanOrThrow(subscriptionType, duration);
    const razorpay = requireRazorpay();

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

    if (!verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const razorpay = requireRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const plan = getPlanOrThrow(subscriptionType, duration);
    const { now, endTime } = await activateUserSubscription(
      req.user.id,
      subscriptionType,
      plan.days
    );

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: { type: subscriptionType, startTime: now, endTime }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

// @desc    Razorpay webhook handler (UNCHANGED LOGIC)
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('⚠️ RAZORPAY_WEBHOOK_SECRET not configured');
      return res.json({ success: true, received: true });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Webhook event:', event);

    switch (event) {
      case 'payment.captured': {
        const notes = payload.payment.entity.notes;
        if (notes?.userId) {
          await activateUserSubscription(
            notes.userId,
            notes.subscriptionType,
            notes.days
          );
        }
        break;
      }

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
export const validateGiftCode = async (req, res) => {
  try {
    const giftCode = await getValidGiftCodeOrThrow(req.body.code);
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
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Apply gift code
export const applyGiftCode = async (req, res) => {
  try {
    const giftCode = await getValidGiftCodeOrThrow(req.body.code);

    const { now, endTime } = await activateUserSubscription(
      req.user.id,
      giftCode.subscriptionType,
      giftCode.durationInDays
    );

    giftCode.isUsed = true;
    giftCode.usedBy = req.user.id;
    giftCode.usedAt = now;
    await giftCode.save();
    await GiftCode.findByIdAndDelete(giftCode._id);

    res.json({
      success: true,
      message: 'Gift code applied successfully!',
      subscription: { type: giftCode.subscriptionType, startTime: now, endTime }
    });
  } catch (error) {
    console.error('Apply gift code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
