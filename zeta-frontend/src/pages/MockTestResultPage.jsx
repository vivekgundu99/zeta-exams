import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { Award, TrendingUp, Clock, Target, CheckCircle, XCircle, Home } from 'lucide-react';
import { mockTestAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const MockTestResultPage = () => {
  const { testId, attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await mockTestAPI.getResult(testId, attemptId);
      if (response.success) {
        setResult(response.result);
      }
    } catch (error) {
      toast.error('Failed to load result');
      navigate('/mock-tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;
  if (!result) return null;

  const subjectData = [
    { subject: 'Physics', score: result.score.physics || 0, accuracy: result.subjectAnalysis?.physics?.accuracy || 0 },
    { subject: 'Chemistry', score: result.score.chemistry || 0, accuracy: result.subjectAnalysis?.chemistry?.accuracy || 0 },
    { subject: user.examType === 'JEE' ? 'Mathematics' : 'Biology', 
      score: result.score.mathematics || result.score.biology || 0, 
      accuracy: result.subjectAnalysis?.mathematics?.accuracy || result.subjectAnalysis?.biology?.accuracy || 0 
    }
  ];

  const pieData = [
    { name: 'Correct', value: result.correctAnswers, color: '#22c55e' },
    { name: 'Wrong', value: result.wrongAnswers, color: '#ef4444' },
    { name: 'Unattempted', value: result.unattemptedQuestions, color: '#9ca3af' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card mb-8 bg-gradient-to-r from-primary-500 to-primary-700 text-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-4">
              <Award size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Test Completed!</h1>
            <p className="text-primary-100 mb-6">Here's your detailed performance analysis</p>
            
            <div className="grid md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-primary-100 text-sm mb-1">Score</p>
                <p className="text-3xl font-bold">{result.score.total}</p>
                <p className="text-primary-100 text-xs">out of {result.totalQuestions * 4}</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-primary-100 text-sm mb-1">Accuracy</p>
                <p className="text-3xl font-bold">{result.accuracy}%</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-primary-100 text-sm mb-1">Percentile</p>
                <p className="text-3xl font-bold">{result.percentile || '--'}</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-primary-100 text-sm mb-1">Time Taken</p>
                <p className="text-3xl font-bold">{result.duration}</p>
                <p className="text-primary-100 text-xs">minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Correct</p>
                <p className="text-3xl font-bold text-success-600">{result.correctAnswers}</p>
              </div>
              <CheckCircle className="text-success-600" size={48} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Wrong</p>
                <p className="text-3xl font-bold text-danger-600">{result.wrongAnswers}</p>
              </div>
              <XCircle className="text-danger-600" size={48} />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Unattempted</p>
                <p className="text-3xl font-bold text-gray-600">{result.unattemptedQuestions}</p>
              </div>
              <Target className="text-gray-600" size={48} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Subject-wise Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Score</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Analysis */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Subject Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Subject</th>
                  <th className="text-center py-3 px-4">Attempted</th>
                  <th className="text-center py-3 px-4">Correct</th>
                  <th className="text-center py-3 px-4">Wrong</th>
                  <th className="text-center py-3 px-4">Score</th>
                  <th className="text-center py-3 px-4">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.subjectAnalysis || {}).map(([subject, data]) => (
                  <tr key={subject} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium capitalize">{subject}</td>
                    <td className="text-center py-3 px-4">{data.attempted}</td>
                    <td className="text-center py-3 px-4 text-success-600">{data.correct}</td>
                    <td className="text-center py-3 px-4 text-danger-600">{data.wrong}</td>
                    <td className="text-center py-3 px-4 font-semibold">{data.marks}</td>
                    <td className="text-center py-3 px-4">{data.accuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/mock-tests')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Home size={20} />
            <span>Back to Tests</span>
          </button>
          <button
            onClick={() => navigate(`/mock-test/${testId}`)}
            className="btn-primary"
          >
            Reattempt Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockTestResultPage;