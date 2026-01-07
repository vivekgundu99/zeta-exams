import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Users, BookOpen, Target, Gift, TrendingUp } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getAdminStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Manage Questions', path: '/admin/questions', icon: BookOpen, color: 'from-blue-500 to-blue-700' },
    { title: 'Manage Formulas', path: '/admin/formulas', icon: BookOpen, color: 'from-green-500 to-green-700' },
    { title: 'Mock Tests', path: '/admin/mock-tests', icon: Target, color: 'from-purple-500 to-purple-700' },
    { title: 'Users', path: '/admin/users', icon: Users, color: 'from-orange-500 to-orange-700' },
    { title: 'Gift Codes', path: '/admin/gift-codes', icon: Gift, color: 'from-pink-500 to-pink-700' }
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              Free: {stats?.users?.free} | Silver: {stats?.users?.silver} | Gold: {stats?.users?.gold}
            </p>
          </div>

          <div className="card">
            <p className="text-gray-600 mb-1">Questions</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.questions?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              JEE: {stats?.questions?.jee} | NEET: {stats?.questions?.neet}
            </p>
          </div>

          <div className="card">
            <p className="text-gray-600 mb-1">Mock Tests</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.tests?.mockTests || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              Attempts: {stats?.tests?.totalAttempts || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-gray-600 mb-1">Gift Codes</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.giftCodes?.active || 0}</p>
            <p className="text-sm text-gray-500 mt-1">
              Used: {stats?.giftCodes?.used || 0}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="card hover text-center"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
          <div className="space-y-2">
            {stats?.recentActivity?.users?.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.subscription === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                  user.subscription === 'silver' ? 'bg-gray-200 text-gray-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {user.subscription.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;