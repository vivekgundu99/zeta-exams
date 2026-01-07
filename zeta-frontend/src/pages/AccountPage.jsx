import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { User, Mail, Phone, Crown, Calendar, Lock, Edit2 } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { calculateDaysRemaining, formatDate } from '../utils/helpers';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.updatePassword(passwordData);
      if (response.success) {
        toast.success('Password updated successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = calculateDaysRemaining(user?.subscriptionEndTime);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your profile and subscription</p>
        </div>

        {/* Profile Section */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
            <button
              onClick={() => navigate('/user-details')}
              className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Edit2 size={18} />
              <span>Edit Details</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="text-primary-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-semibold text-gray-900">{user?.userDetails?.name || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-semibold text-gray-900">{user?.phoneNo}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="text-purple-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Exam Type</p>
                <p className="font-semibold text-gray-900">{user?.examType}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Subscription</h3>
            <button
              onClick={() => navigate('/subscription')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {user?.subscription === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
            </button>
          </div>

          <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Crown size={32} />
              <div>
                <h4 className="text-2xl font-bold">{user?.subscription?.toUpperCase()} Plan</h4>
                <p className="text-primary-100">Current subscription</p>
              </div>
            </div>

            {user?.subscription !== 'free' && (
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-primary-100 text-sm mb-1">Start Date</p>
                  <p className="font-semibold">{formatDate(user.subscriptionStartTime)}</p>
                </div>
                <div>
                  <p className="text-primary-100 text-sm mb-1">End Date</p>
                  <p className="font-semibold">{formatDate(user.subscriptionEndTime)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-primary-100 text-sm mb-1">Time Remaining</p>
                  <p className="font-semibold text-xl">
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Section */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Security</h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <Lock className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Password</p>
                <p className="text-sm text-gray-600">Last changed recently</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="input-field"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? <Loader size="sm" /> : 'Update Password'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountPage;