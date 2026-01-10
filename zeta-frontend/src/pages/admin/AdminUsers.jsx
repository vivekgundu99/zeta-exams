import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Search, Eye, Edit, Ban, X } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page, filterSubscription]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filterSubscription) params.subscription = filterSubscription;

      const response = await adminAPI.getAllUsers(params);
      if (response.success) {
        setUsers(response.users);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserDetails(userId);
      if (response.success) {
        setUserDetails(response);
        setShowUserModal(true);
      }
    } catch (error) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await adminAPI.deactivateUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">User Management</h1>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field flex-1"
            />
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="input-field"
            >
              <option value="">All Subscriptions</option>
              <option value="free">Free</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <Loader />
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">User Info</th>
                    <th className="text-left py-3 px-4">Subscription</th>
                    <th className="text-left py-3 px-4">Exam Type</th>
                    <th className="text-left py-3 px-4">Registered</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.email}</p>
                          {user.userDetails?.name && (
                            <p className="text-sm text-gray-500">{user.userDetails.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.subscription === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                          user.subscription === 'silver' ? 'bg-gray-200 text-gray-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.subscription.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.examType ? (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                            {user.examType}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not set</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleViewUser(user._id)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDeactivate(user._id)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                            title="Deactivate User"
                          >
                            <Ban size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <Modal 
        isOpen={showUserModal} 
        onClose={() => {
          setShowUserModal(false);
          setUserDetails(null);
        }} 
        title="User Details"
        size="lg"
      >
        {userDetails && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{userDetails.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{userDetails.user.phoneNo}</p>
              </div>
            </div>

            {/* User Details */}
            {userDetails.user.userDetails && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Personal Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{userDetails.user.userDetails.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Profession</label>
                    <p className="text-gray-900 capitalize">{userDetails.user.userDetails.profession || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Grade</label>
                    <p className="text-gray-900">{userDetails.user.userDetails.grade || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preparing For</label>
                    <p className="text-gray-900">{userDetails.user.userDetails.preparingFor || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">College/School</label>
                    <p className="text-gray-900">{userDetails.user.userDetails.collegeName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">State</label>
                    <p className="text-gray-900">{userDetails.user.userDetails.state || 'N/A'}</p>
                  </div>
                  {userDetails.user.userDetails.lifeAmbition && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Life Ambition</label>
                      <p className="text-gray-900">{userDetails.user.userDetails.lifeAmbition}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscription Info */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Subscription</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Plan</label>
                  <p className="text-gray-900 capitalize font-semibold">{userDetails.user.subscription}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Exam Type</label>
                  <p className="text-gray-900">{userDetails.user.examType || 'Not selected'}</p>
                </div>
                {userDetails.user.subscriptionEndTime && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="text-gray-900">{formatDate(userDetails.user.subscriptionStartTime)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">End Date</label>
                      <p className="text-gray-900">{formatDate(userDetails.user.subscriptionEndTime)}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{userDetails.stats.mockTestsCompleted}</p>
                  <p className="text-sm text-gray-600">Mock Tests</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{userDetails.stats.chapterTestsCompleted}</p>
                  <p className="text-sm text-gray-600">Chapter Tests</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{userDetails.stats.averageScore.toFixed(0)}</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </div>

            {/* Registration Date */}
            <div className="border-t pt-4 text-sm text-gray-600">
              <p>Registered on: {formatDate(userDetails.user.createdAt)}</p>
              <p>User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userDetails.user._id}</code></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;