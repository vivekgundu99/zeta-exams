import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        console.log('Loading user from localStorage...');
        console.log('Token exists:', !!token);
        console.log('User data exists:', !!userData);
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          console.log('User loaded:', parsedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          console.log('No user data found in localStorage');
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { token, user: userData } = response;
        
        console.log('✅ Login successful');
        console.log('User data received:', userData);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Login successful!');
        return { success: true, user: userData };
      }
      
      console.log('❌ Login failed:', response.message);
      return { success: false, message: response.message };
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Login failed');
      return { success: false, message: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      const response = await authAPI.register(userData);
      
      if (response.success) {
        console.log('✅ Registration successful, temp token received');
        return { success: true, tempToken: response.tempToken };
      }
      
      console.log('❌ Registration failed:', response.message);
      return { success: false, message: response.message };
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast.error(error.message || 'Registration failed');
      return { success: false, message: error.message };
    }
  };

  // Verify OTP function
  const verifyOTP = async (tempToken, otp) => {
    try {
      console.log('🔑 Attempting OTP verification...');
      const response = await authAPI.verifyOTP({ tempToken, otp });
      
      if (response.success) {
        const { token, user: userData } = response;
        
        console.log('✅ OTP verified successfully');
        console.log('User data received:', userData);
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Account created successfully!');
        return { success: true, user: userData };
      }
      
      console.log('❌ OTP verification failed:', response.message);
      return { success: false, message: response.message };
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
      return { success: false, message: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
      console.log('✅ Logout complete');
    }
  };

  // Update user data
  const updateUser = (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      console.log('🔄 Updating user:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    try {
      console.log('🔄 Refreshing user profile...');
      const response = await userAPI.getProfile();
      if (response.success) {
        updateUser(response.user);
        console.log('✅ Profile refreshed');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Check if user has completed required steps
  const needsUserDetails = () => {
    const needs = isAuthenticated && !user?.userDetailsCompleted;
    console.log('Needs user details?', needs);
    return needs;
  };

  const needsExamSelection = () => {
    const needs = isAuthenticated && user?.userDetailsCompleted && !user?.examType;
    console.log('Needs exam selection?', needs);
    return needs;
  };

  const needsSubscription = () => {
    const needs = isAuthenticated && user?.userDetailsCompleted && user?.examType && user?.subscription === 'free';
    console.log('Needs subscription?', needs);
    return needs;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    verifyOTP,
    logout,
    updateUser,
    refreshUserProfile,
    needsUserDetails,
    needsExamSelection,
    needsSubscription,
    isAdmin: user?.isAdmin || false,
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};