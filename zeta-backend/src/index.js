import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/database.js';
import { resetDailyLimits } from './utils/dailyLimitReset.js';
import { razorpayWebhook } from './controllers/subscriptionController.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import questionRoutes from './routes/questions.js';
import mockTestRoutes from './routes/mockTest.js';
import subscriptionRoutes from './routes/subscription.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());

// Webhook route BEFORE express.json() to get raw body
app.post('/api/subscription/webhook', 
  express.raw({ type: 'application/json' }), 
  razorpayWebhook
);

// Now apply JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Zeta Exams API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      user: '/api/user',
      questions: '/api/questions',
      mockTests: '/api/mock-tests',
      subscription: '/api/subscription',
      analytics: '/api/analytics',
      admin: '/api/admin'
    }
  });
});

// Health check - make it async and connect to DB
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({ 
      success: true,
      status: 'OK', 
      message: 'Zeta Exams API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API Routes - Mount them correctly
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// Cron job to reset daily limits at 4 AM IST (only in non-serverless)
if (!process.env.VERCEL) {
  cron.schedule('0 4 * * *', async () => {
    console.log('Running daily limit reset job at 4 AM IST');
    await resetDailyLimits();
  }, {
    timezone: "Asia/Kolkata"
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - MUST BE LAST
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: ['/api/health', '/api/auth', '/api/user', '/api/questions', '/api/mock-tests', '/api/subscription', '/api/analytics', '/api/admin']
  });
});

// Export for Vercel - CORRECTED
export default async function handler(req, res) {
  // Connect to database first
  await connectDB();
  // Then handle the request
  return app(req, res);
}

// Start server (only if not in Vercel serverless environment)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Zeta Backend running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  }).catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });
}