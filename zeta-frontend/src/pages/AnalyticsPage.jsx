import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { TrendingUp, Target, Award, BookOpen } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState(null);
  const [performanceTrend, setPerformanceTrend] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, subjectRes, trendRes] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getSubjectWise(user.examType),
        analyticsAPI.getPerformanceTrend({ days: 30, testType: 'mock' })
      ]);

      if (overviewRes.success) setOverview(overviewRes.analytics);
      if (subjectRes.success) setSubjectAnalysis(subjectRes.subjectAnalysis);
      if (trendRes.success) setPerformanceTrend(trendRes.trend);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  const subjectData = subjectAnalysis ? Object.entries(subjectAnalysis).map(([subject, data]) => ({
    subject: subject.charAt(0).toUpperCase() + subject.slice(1),
    accuracy: parseFloat(data.averageAccuracy) || 0,
    score: parseFloat(data.averageScore) || 0
  })) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Questions Attempted</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.totalQuestionsAttempted || 0}</p>
              </div>
              <BookOpen className="text-blue-600" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tests Completed</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.totalTestsAttempted || 0}</p>
              </div>
              <Award className="text-green-600" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.averageMockScore || 0}</p>
              </div>
              <TrendingUp className="text-purple-600" size={40} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-gray-900">{overview?.averageAccuracy || 0}%</p>
              </div>
              <Target className="text-orange-600" size={40} />
            </div>
          </div>
        </div>

        {/* Performance Trend */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} />
              <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject-wise Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-4">
            {subjectData.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{subject.subject}</span>
                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p className="font-semibold text-gray-900">{subject.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Score</p>
                    <p className="font-semibold text-gray-900">{subject.score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;