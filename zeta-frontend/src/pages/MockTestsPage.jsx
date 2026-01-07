import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { Target, Clock, Award, Play, Eye, AlertCircle } from 'lucide-react';
import { mockTestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const MockTestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, attempted, unattempted
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    fetchTests();
    checkOngoingTest();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await mockTestAPI.getAllTests(user.examType);
      if (response.success) {
        setTests(response.tests);
      }
    } catch (error) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const checkOngoingTest = async () => {
    try {
      const response = await mockTestAPI.getOngoingTest();
      if (response.success && response.hasOngoingTest) {
        toast.error('You have an ongoing test!', {
          duration: 5000,
          action: {
            label: 'Resume',
            onClick: () => navigate(`/mock-test/${response.test.testId}`)
          }
        });
      }
    } catch (error) {
      console.error('Error checking ongoing test:', error);
    }
  };

  const handleStartTest = (test) => {
    setSelectedTest(test);
    setShowStartModal(true);
  };

  const confirmStartTest = () => {
    setShowStartModal(false);
    navigate(`/mock-test/${selectedTest._id}`);
  };

  const filteredTests = tests.filter(test => {
    if (filter === 'attempted') return test.totalAttempts > 0;
    if (filter === 'unattempted') return test.totalAttempts === 0;
    return true;
  });

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Tests</h1>
          <p className="text-gray-600">Full-length practice tests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-8">
          {['all', 'attempted', 'unattempted'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors capitalize ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div key={test._id} className="card hover">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg flex items-center justify-center">
                  <Target className="text-white" size={24} />
                </div>
                {test.totalAttempts > 0 && (
                  <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-xs font-medium">
                    Attempted {test.totalAttempts}x
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">{test.testName}</h3>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-gray-600 text-sm">
                  <Target size={16} className="mr-2" />
                  <span>{test.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Clock size={16} className="mr-2" />
                  <span>{test.duration} Minutes</span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <Award size={16} className="mr-2" />
                  <span>{test.totalMarks} Marks</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleStartTest(test)}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Play size={18} />
                  <span>{test.totalAttempts > 0 ? 'Reattempt' : 'Start Test'}</span>
                </button>
                
                {test.totalAttempts > 0 && (
                  <button
                    onClick={() => navigate(`/mock-test/${test._id}/attempts`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="card text-center py-12">
            <Target className="text-gray-400 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600">No mock tests available for selected filter</p>
          </div>
        )}
      </div>

      {/* Start Test Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Start Mock Test"
        size="sm"
      >
        {selectedTest && (
          <div className="space-y-4">
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-warning-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-warning-800">
                  <p className="font-medium mb-2">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Once started, test cannot be paused</li>
                    <li>Test will auto-submit when time expires</li>
                    <li>All questions are loaded offline</li>
                    <li>You cannot leave the test page</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold text-gray-900">{selectedTest.totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">{selectedTest.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Marks:</span>
                <span className="font-semibold text-gray-900">{selectedTest.totalMarks}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setShowStartModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={confirmStartTest} className="flex-1 btn-primary">
                Start Test
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MockTestsPage;