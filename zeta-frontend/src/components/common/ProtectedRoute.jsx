import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';
import { SUBSCRIPTION_LEVELS } from '../../utils/constants';

const ProtectedRoute = ({ children, requireSubscription = null }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loader while checking authentication
  if (loading) {
    return <Loader fullScreen text="Loading..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to complete profile
  if (!user.userDetailsCompleted) {
    return <Navigate to="/user-details" replace />;
  }

  // Check if user needs to select exam type
  if (!user.examType) {
    return <Navigate to="/select-exam" replace />;
  }

  // Check subscription level if required
  if (requireSubscription) {
    const userLevel = SUBSCRIPTION_LEVELS[user.subscription] || 0;
    const requiredLevel = SUBSCRIPTION_LEVELS[requireSubscription] || 0;

    if (userLevel < requiredLevel) {
      return <Navigate to="/subscription" replace />;
    }
  }

  // All checks passed, render the protected component
  return children;
};

export default ProtectedRoute;