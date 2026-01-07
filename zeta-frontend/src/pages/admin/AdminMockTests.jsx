import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { adminAPI, mockTestAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminMockTests = () => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [examType, setExamType] = useState('JEE');

  useEffect(() => {
    fetchTests();
  }, [examType]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await mockTestAPI.getAllTests(examType);
      if (response.success) {
        setTests(response.tests);
      }
    } catch (error) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await adminAPI.deleteMockTest(id);
      toast.success('Test deleted');
      fetchTests();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mock Test Management</h1>
          <button className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Create Test</span>
          </button>
        </div>

        <div className="card mb-8">
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="JEE">JEE</option>
            <option value="NEET">NEET</option>
          </select>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.testName}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>Questions: {test.totalQuestions}</p>
                  <p>Duration: {test.duration} minutes</p>
                  <p>Attempts: {test.totalAttempts}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm">
                    <Eye size={16} className="mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="px-3 py-2 bg-danger-100 text-danger-700 rounded-lg hover:bg-danger-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMockTests;