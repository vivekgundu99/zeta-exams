import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Search, Eye, Edit, Ban } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubscription, setFilterSubscription] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Subscription</th>
                    <th className="text-left py-3 px-4">Exam Type</th>
                    <th className="text-left py-3 px-4">Registered</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phoneNo}</p>
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
                      <td className="py-3 px-4">{user.examType || '-'}</td>
                      <td className="py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-primary-600 hover:text-primary-700 mr-2">
                          <Eye size={18} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-700 mr-2">
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeactivate(user._id)}
                          className="text-danger-600 hover:text-danger-700"
                        >
                          <Ban size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
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
    </div>
  );
};

export default AdminUsers;