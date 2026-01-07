import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { 
  BookOpen, Target, FileText, BookMarked, Crown, TrendingUp, 
  Calendar, Award, Zap, Lock, ArrowRight 
} from 'lucide-react';
import { userAPI, analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import ProgressBar from '../components/common/ProgressBar';
import Card from '../components/common/Card';
import { calculateDaysRemaining } from '../utils/helpers';
import { DAILY_LIMITS } from '../utils/constants';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, subRes] = await Promise.all([
        userAPI.getStats(),
        userAPI.getSubscriptionInfo()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (subRes.success) setSubscriptionInfo(subRes.subscription);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader fullScreen text="Loading dashboard..." />
      </div>
    );
  }

  const limits = DAILY_LIMITS[user?.subscription || 'free'];
  const daysRemaining = calculateDaysRemaining(user?.subscriptionEndTime);

  const quickActions = [
    {
      title: 'Chapterwise Questions',
      description: 'Practice questions topic-wise',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-700',
      path: '/questions',
      locked: false
    },
    {
      title: 'Chapter Tests',
      description: '10 question tests per chapter',
      icon: FileText,
      color: 'from-green-500 to-green-700',
      path: '/chapter-tests',
      locked: user?.subscription === 'free',
      requiresLevel: 'silver'
    },
    {
      title: 'Formulas',
      description: 'Quick reference formulas',
      icon: BookMarked,
      color: 'from-purple-500 to-purple-700',
      path: '/formulas',
      locked: user?.subscription !== 'gold',
      requiresLevel: 'gold'
    },
    {
      title: 'Mock Tests',
      description: 'Full-length practice tests',
      icon: Target,
      color: 'from-orange-500 to-orange-700',
      path: '/mock-tests',
      locked: user?.subscription !== 'gold',
      requiresLevel: 'gold'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.userDetails?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600">
            Preparing for {user?.examType} • {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Subscription Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <Crown size={24} />
                <h3 className="text-xl font-bold">{user?.subscription?.toUpperCase()} Plan</h3>
              </div>
              
              {user?.subscription === 'free' ? (
                <p className="text-primary-100">
                  Unlock more features with premium plans
                </p>
              ) : (
                <p className="text-primary-100">
                  {daysRemaining > 0 ? (
                    <>Valid for {daysRemaining} more days</>
                  ) : (
                    <>Expired - Please renew</>
                  )}
                </p>
              )}
            </div>
            
            <button
              onClick={() => navigate('/subscription')}
              className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center space-x-2"
            >
              <Zap size={20} />
              <span>{user?.subscription === 'free' ? 'Upgrade Now' : 'Manage Plan'}</span>
            </button>
          </div>
        </Card>

        {/* Daily Limits */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="text-blue-600" size={24} />
                <h4 className="font-semibold text-gray-900">Questions</h4>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {subscriptionInfo?.currentUsage?.questions || 0}/{limits.questions}
              </span>
            </div>
            <ProgressBar
              current={subscriptionInfo?.currentUsage?.questions || 0}
              total={limits.questions}
              color="primary"
              showPercentage={false}
            />
            <p className="mt-2 text-sm text-gray-600">
              Resets daily at 4 AM IST
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="text-green-600" size={24} />
                <h4 className="font-semibold text-gray-900">Chapter Tests</h4>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {subscriptionInfo?.currentUsage?.chapterTests || 0}/{limits.chapterTests}
              </span>
            </div>
            <ProgressBar
              current={subscriptionInfo?.currentUsage?.chapterTests || 0}
              total={limits.chapterTests || 1}
              color="success"
              showPercentage={false}
            />
            {limits.chapterTests === 0 && (
              <p className="mt-2 text-sm text-warning-600 flex items-center">
                <Lock size={14} className="mr-1" />
                Requires Silver plan
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="text-orange-600" size={24} />
                <h4 className="font-semibold text-gray-900">Mock Tests</h4>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {subscriptionInfo?.currentUsage?.mockTests || 0}/{limits.mockTests}
              </span>
            </div>
            <ProgressBar
              current={subscriptionInfo?.currentUsage?.mockTests || 0}
              total={limits.mockTests || 1}
              color="warning"
              showPercentage={false}
            />
            {limits.mockTests === 0 && (
              <p className="mt-2 text-sm text-warning-600 flex items-center">
                <Lock size={14} className="mr-1" />
                Requires Gold plan
              </p>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  hover={!action.locked}
                  className={`relative ${action.locked ? 'opacity-60' : 'cursor-pointer'}`}
                  onClick={() => !action.locked && navigate(action.path)}
                >
                  {action.locked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="text-gray-400" size={20} />
                    </div>
                  )}

                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="text-white" size={24} />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>

                  {action.locked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/subscription');
                      }}
                      className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Crown size={16} />
                      <span>Upgrade to {action.requiresLevel}</span>
                    </button>
                  ) : (
                    <button className="w-full py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center justify-center space-x-2">
                      <span>Get Started</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalQuestionsAttempted || 0}
                </p>
              </div>
              <BookOpen className="text-blue-600" size={40} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tests Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats?.mockTestsCompleted || 0) + (stats?.chapterTestsCompleted || 0)}
                </p>
              </div>
              <Award className="text-green-600" size={40} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.averageScore || 0}
                </p>
              </div>
              <TrendingUp className="text-purple-600" size={40} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.averageAccuracy || 0}%
                </p>
              </div>
              <Target className="text-orange-600" size={40} />
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        {user?.subscription === 'free' && (
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Unlock Your Full Potential</h3>
                <p className="text-purple-100 mb-4 md:mb-0">
                  Get unlimited access to all features with our premium plans
                </p>
              </div>
              <button
                onClick={() => navigate('/subscription')}
                className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap"
              >
                View Plans
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;