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
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { token, user: userData } = response;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Login successful!');
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, message: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        return { success: true, tempToken: response.tempToken };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      return { success: false, message: error.message };
    }
  };

  // Verify OTP function
  const verifyOTP = async (tempToken, otp) => {
    try {
      const response = await authAPI.verifyOTP({ tempToken, otp });
      
      if (response.success) {
        const { token, user: userData } = response;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        toast.success('Account created successfully!');
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      toast.error(error.message || 'OTP verification failed');
      return { success: false, message: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Refresh user profile
  const refreshUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.success) {
        updateUser(response.user);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Check if user has completed required steps
  const needsUserDetails = () => {
    return isAuthenticated && !user?.userDetailsCompleted;
  };

  const needsExamSelection = () => {
    return isAuthenticated && user?.userDetailsCompleted && !user?.examType;
  };

  const needsSubscription = () => {
    return isAuthenticated && user?.userDetailsCompleted && user?.examType && user?.subscription === 'free';
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};