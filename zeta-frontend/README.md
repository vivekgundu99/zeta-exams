# Zeta Exams Frontend

Modern React-based frontend for Zeta Exams - JEE and NEET preparation platform.

## 🚀 Tech Stack

- **React 18** - UI Framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Razorpay** - Payment integration
- **Zustand** - State management

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Common UI components
│   ├── admin/          # Admin-specific components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── subscription/   # Subscription components
│   └── user/           # User-related components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── admin/         # Admin pages
│   └── *.jsx          # User pages
├── services/           # API services
├── styles/             # Global styles
├── utils/              # Utility functions
└── main.jsx           # Application entry point
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see backend README)

### Installation

1. **Clone and navigate to frontend directory**
   ```bash
   cd zeta-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your values:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_RAZORPAY_KEY_ID=your_razorpay_key
   VITE_CLOUDFRONT_URL=your_cloudfront_url
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will run at `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🔑 Key Features

### User Features
- 📧 Email/Phone registration with OTP verification
- 🔐 Single device login enforcement
- 📚 Chapter-wise questions with topic selection
- 📝 Chapter tests (10 questions)
- 🎯 Full-length mock tests (offline mode)
- 📊 Detailed analytics and performance tracking
- 💳 Subscription management (Free/Silver/Gold)
- 🎁 Gift code redemption
- 👤 Profile and account management

### Admin Features
- 📤 Bulk CSV question upload
- ➕ Single question management
- 📖 Formula management
- 🧪 Mock test creation
- 👥 User management
- 🎟️ Gift code generation
- 📈 Analytics dashboard

## 🎨 Styling

The project uses Tailwind CSS with custom configurations:

- **Primary Color**: Sky Blue (#0ea5e9)
- **Secondary Color**: Purple (#d946ef)
- **Custom shadows**: `shadow-soft`, `shadow-glow`
- **Custom animations**: `fadeIn`, `slideUp`, `slideDown`

### Custom Classes

```css
.btn-primary     /* Primary button */
.btn-secondary   /* Secondary button */
.card           /* Card container */
.input-field    /* Form input */
.gradient-text  /* Gradient text effect */
```

## 🔐 Authentication Flow

1. User registers with email + phone + password
2. OTP sent to email via Resend
3. OTP verification completes registration
4. User completes profile details (one-time)
5. User selects exam type (JEE/NEET)
6. User selects subscription plan
7. Redirect to dashboard

## 💳 Payment Integration

Using **Razorpay** for UPI payments:

```javascript
// Payment flow
1. User selects subscription plan
2. Frontend creates order via API
3. Razorpay checkout opens
4. User completes UPI payment
5. Backend verifies payment signature
6. Subscription activated
```

## 📱 Responsive Design

Fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚀 Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Environment Variables**
   
   Add in Vercel dashboard:
   - `VITE_API_URL` - Your backend API URL
   - `VITE_RAZORPAY_KEY_ID` - Razorpay key
   - `VITE_CLOUDFRONT_URL` - CloudFront URL

## 🔧 Configuration Files

- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration (if needed)
- `vercel.json` - Vercel deployment configuration

## 🐛 Common Issues

### Issue: API connection error
**Solution**: Ensure backend is running and `VITE_API_URL` is correct

### Issue: Payment not working
**Solution**: Check Razorpay key in `.env` and ensure webhook is configured

### Issue: Images not loading
**Solution**: Verify `VITE_CLOUDFRONT_URL` is correct

### Issue: Build errors
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Component Documentation

### Protected Routes
```jsx
<ProtectedRoute requireSubscription="gold">
  <Component />
</ProtectedRoute>
```

### Toast Notifications
```javascript
import toast from 'react-hot-toast';

toast.success('Success message');
toast.error('Error message');
toast.loading('Loading...');
```

### API Calls
```javascript
import { authAPI } from './services/api';

const response = await authAPI.login(credentials);
```

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript-style JSDoc comments
3. Follow React best practices
4. Test on multiple screen sizes
5. Ensure no console errors/warnings

## 📄 License

MIT License - Zeta Exams 2024

## 👨‍💻 Developer

Created by Vivek for Zeta Exams platform.

For issues or questions, contact: vivekgundu999@gmail.com