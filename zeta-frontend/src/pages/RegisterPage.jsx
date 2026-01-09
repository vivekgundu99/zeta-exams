import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Phone, UserPlus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, verifyOTP } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    phoneNo: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.phoneNo || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email');
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('Sending registration data:', {
        email: formData.email,
        phoneNo: formData.phoneNo,
        password: '***' // Don't log password
      });

      const result = await register(formData);

      console.log('Registration result:', result);

      if (result.success) {
        setTempToken(result.tempToken);
        setShowOTPModal(true);
        toast.success('OTP sent to your email!');
      } else {
        console.error('Registration failed:', result);
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);

    try {
      const result = await verifyOTP(tempToken, otp);

      if (result.success) {
        toast.success('Registration successful!');
        navigate('/user-details');
      } else {
        toast.error(result.message || 'OTP verification failed');
      }
    } catch (error) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'bg-danger-500' },
      { strength: 2, label: 'Fair', color: 'bg-warning-500' },
      { strength: 3, label: 'Good', color: 'bg-yellow-500' },
      { strength: 4, label: 'Strong', color: 'bg-success-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-success-600' }
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
          <p className="text-gray-600">Join Zeta Exams and start your preparation</p>
        </div>

        {/* Registration Form Card */}
        <div className="card animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400" size={20} />
                </div>
                <input
                  type="tel"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="input-field pl-10"
                  maxLength="10"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Used for login and account security</p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.label === 'Weak' ? 'text-danger-500' : passwordStrength.label === 'Fair' ? 'text-warning-500' : 'text-success-500'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field pl-10"
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-danger-500">Passwords do not match</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader size="sm" />
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Zeta Exams. All rights reserved.
        </p>
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={showOTPModal}
        onClose={() => {}}
        title="Verify Email"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Mail className="text-primary-600" size={32} />
            </div>
            <p className="text-gray-600 mb-4">
              We've sent a 6-digit OTP to<br />
              <span className="font-semibold text-gray-900">{formData.email}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="input-field text-center text-2xl tracking-widest font-bold"
              maxLength="6"
            />
          </div>

          <button
            onClick={handleOTPVerify}
            disabled={otpLoading || otp.length !== 6}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {otpLoading ? <Loader size="sm" /> : (
              <>
                <CheckCircle size={20} className="mr-2" />
                Verify & Continue
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Didn't receive OTP?{' '}
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Resend
            </button>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RegisterPage;