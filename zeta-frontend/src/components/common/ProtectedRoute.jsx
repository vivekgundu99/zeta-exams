import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';
import { SUBSCRIPTION_LEVELS } from '../../utils/constants';

const ProtectedRoute = ({ children, requireSubscription = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('🛡️ ProtectedRoute Check:', {
    path: location.pathname,
    loading,
    isAuthenticated,
    hasUser: !!user,
    userDetailsCompleted: user?.userDetailsCompleted,
    examType: user?.examType,
    subscription: user?.subscription,
    requireSubscription
  });

  // Show loader while checking authentication
  if (loading) {
    console.log('⏳ Loading authentication state...');
    return <Loader fullScreen text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated - Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Check if user object exists
  if (!user) {
    console.log('❌ No user object found - Redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Allow access to user-details page if profile not completed
  if (location.pathname === '/user-details') {
    console.log('✅ Accessing user details page');
    return children;
  }

  // Check if user needs to complete profile
  if (!user.userDetailsCompleted) {
    console.log('⚠️ User details not completed - Redirecting to /user-details');
    return <Navigate to="/user-details" replace />;
  }

  // Allow access to exam selection page
  if (location.pathname === '/select-exam') {
    console.log('✅ Accessing exam selection page');
    return children;
  }

  // Check if user needs to select exam type
  if (!user.examType) {
    console.log('⚠️ Exam type not selected - Redirecting to /select-exam');
    return <Navigate to="/select-exam" replace />;
  }

  // Allow access to subscription page
  if (location.pathname === '/subscription') {
    console.log('✅ Accessing subscription page');
    return children;
  }

  // Check subscription level if required
  if (requireSubscription) {
    const userLevel = SUBSCRIPTION_LEVELS[user.subscription] || 0;
    const requiredLevel = SUBSCRIPTION_LEVELS[requireSubscription] || 0;

    console.log('🔒 Checking subscription:', {
      userSubscription: user.subscription,
      userLevel,
      requiredSubscription: requireSubscription,
      requiredLevel,
      hasAccess: userLevel >= requiredLevel
    });

    if (userLevel < requiredLevel) {
      console.log('⚠️ Insufficient subscription level - Redirecting to /subscription');
      return <Navigate to="/subscription" replace />;
    }
  }

  // All checks passed, render the protected component
  console.log('✅ All checks passed - Rendering protected route');
  return children;
};

export default ProtectedRoute;