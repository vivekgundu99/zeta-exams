import express from 'express';
import {
  getSubscriptionPlans,
  createOrder,
  verifyPayment,
  razorpayWebhook,
  applyGiftCode,
  validateGiftCode
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public route for webhook
router.post('/webhook', express.raw({ type: 'application/json' }), razorpayWebhook);

// Protected routes
router.use(protect);

// Subscription plans
router.get('/plans', getSubscriptionPlans);

// Payment flow
router.post('/create-order', rateLimiter(5, 5), createOrder);
router.post('/verify-payment', rateLimiter(10, 5), verifyPayment);

// Gift code
router.post('/validate-giftcode', rateLimiter(5, 5), validateGiftCode);
router.post('/apply-giftcode', rateLimiter(5, 5), applyGiftCode);

export default router;