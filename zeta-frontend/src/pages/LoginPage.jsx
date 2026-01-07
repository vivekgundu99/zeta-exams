import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Phone, LogIn, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    isAdmin: false
  });
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('email'); // 'email' or 'phone'

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.emailOrPhone || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const credentials = loginType === 'email'
        ? { email: formData.emailOrPhone, password: formData.password, isAdmin: formData.isAdmin }
        : { phoneNo: formData.emailOrPhone, password: formData.password, isAdmin: formData.isAdmin };

      const result = await login(credentials);

      if (result.success) {
        if (result.user.isAdmin) {
          navigate('/admin');
        } else if (!result.user.userDetailsCompleted) {
          navigate('/user-details');
        } else if (!result.user.examType) {
          navigate('/select-exam');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">Z</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Login to continue your preparation</p>
        </div>

        {/* Login Form Card */}
        <div className="card animate-slideUp">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin Toggle */}
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <Shield size={18} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Admin Login</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Login Type Toggle */}
            {!formData.isAdmin && (
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginType('email')}
                  className={`flex-1 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                    loginType === 'email'
                      ? 'bg-white shadow-sm text-primary-700'
                      : 'text-gray-600'
                  }`}
                >
                  <Mail size={16} className="inline mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('phone')}
                  className={`flex-1 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                    loginType === 'phone'
                      ? 'bg-white shadow-sm text-primary-700'
                      : 'text-gray-600'
                  }`}
                >
                  <Phone size={16} className="inline mr-2" />
                  Phone
                </button>
              </div>
            )}

            {/* Email/Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.isAdmin ? 'Admin Email' : loginType === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === 'email' ? (
                    <Mail className="text-gray-400" size={20} />
                  ) : (
                    <Phone className="text-gray-400" size={20} />
                  )}
                </div>
                <input
                  type={loginType === 'email' ? 'email' : 'tel'}
                  name="emailOrPhone"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  placeholder={formData.isAdmin ? 'admin@zetaexams.com' : loginType === 'email' ? 'your@email.com' : '9876543210'}
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Forgot Password?
              </Link>
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
                  <LogIn size={20} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Register Now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Zeta Exams. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;