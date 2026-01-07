# Zeta Exams Backend API

Complete backend API for Zeta Exams platform with authentication, subscriptions, questions management, and mock tests.

## 🚀 Features

- **Authentication**: JWT-based auth with OTP verification
- **User Management**: Profile, details, exam selection
- **Subscription System**: Razorpay integration for payments
- **Question Bank**: Bulk CSV upload, chapter-wise organization
- **Mock Tests**: Full-featured test interface with offline mode
- **Analytics**: Detailed performance tracking and reports
- **Admin Panel**: Complete management system
- **Gift Codes**: Automated generation and validation
- **Daily Limits**: Auto-reset at 4 AM IST

## 📁 Project Structure

```
src/
├── config/          # Database, Razorpay, Resend configs
├── models/          # Mongoose schemas
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Auth, validation, rate limiting
├── utils/           # Helper functions
└── index.js         # Entry point
```

## 🔧 Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Update .env with your credentials

# Run development server
npm run dev

# Run production server
npm start
```

## 🌍 Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PHONE_ENCRYPTION_KEY=your_encryption_key
RESEND_API_KEY=your_resend_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=vivekgundu999@gmail.com
CLOUDFRONT_BASE_URL=your_cloudfront_url
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/details` - Update user details
- `POST /api/user/select-exam` - Select exam type
- `PUT /api/user/password` - Update password
- `GET /api/user/stats` - Get user statistics

### Questions
- `GET /api/questions/subjects/:examType` - Get subjects
- `GET /api/questions/chapters/:examType/:subject` - Get chapters
- `GET /api/questions/topics/:examType/:subject/:chapter` - Get topics
- `GET /api/questions/topic/:examType/:subject/:chapter/:topic` - Get questions
- `POST /api/questions/submit-answer` - Submit answer
- `POST /api/questions/chapter-test/generate` - Generate chapter test
- `POST /api/questions/chapter-test/submit` - Submit chapter test

### Mock Tests
- `GET /api/mock-tests/all/:examType` - Get all mock tests
- `GET /api/mock-tests/:testId` - Get test details
- `POST /api/mock-tests/:testId/start` - Start mock test
- `POST /api/mock-tests/:testId/submit` - Submit mock test
- `GET /api/mock-tests/:testId/result/:attemptId` - Get result

### Subscription
- `GET /api/subscription/plans` - Get subscription plans
- `POST /api/subscription/create-order` - Create Razorpay order
- `POST /api/subscription/verify-payment` - Verify payment
- `POST /api/subscription/apply-giftcode` - Apply gift code

### Admin
- `POST /api/admin/questions/bulk-upload` - Bulk upload questions
- `POST /api/admin/questions/add` - Add single question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question
- `POST /api/admin/formulas/add` - Add formula
- `POST /api/admin/mock-tests/create` - Create mock test
- `GET /api/admin/users` - Get all users
- `POST /api/admin/giftcodes/generate` - Generate gift codes

### Analytics
- `GET /api/analytics/overview` - User analytics overview
- `GET /api/analytics/subject-wise/:examType` - Subject-wise analysis
- `GET /api/analytics/test-history` - Test history
- `GET /api/analytics/performance-trend` - Performance trend

## 📝 CSV Upload Format

For bulk question upload:

```
Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg
S#Physics#Mechanics#Kinematics#What is velocity?#Speed#Acceleration#Rate of change#Distance####A#url1####
N#Physics#Mechanics#Dynamics#Find acceleration?#####10##########
```

- **Type**: S (Single Correct MCQ) or N (Numerical)
- **Subject**: Physics, Chemistry, Mathematics, Biology
- Leave options empty for Numerical questions

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Phone number encryption
- Rate limiting
- Input validation and sanitization
- CORS protection
- Helmet security headers

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

## 📊 Database Models

- **User**: User accounts and subscriptions
- **Question**: Question bank with metadata
- **MockTest**: Mock test configurations
- **TestAttempt**: User test attempts and results
- **GiftCode**: Gift code management
- **Formula**: Formula PDFs by subject/chapter

## 🔄 Cron Jobs

- **Daily Limit Reset**: Runs at 4 AM IST daily
- Resets question, chapter test, and mock test limits

## 📞 Support

For issues or questions:
- Email: support@zetaexams.com
- GitHub: [Repository Link]

## 📄 License

MIT License - Zeta Exams 2024