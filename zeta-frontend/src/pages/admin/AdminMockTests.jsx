import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Plus, Eye, Trash2, HelpCircle } from 'lucide-react';
import { adminAPI, mockTestAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminMockTests = () => {
  const [loading, setLoading] = useState(false);
  const [tests, setTests] = useState([]);
  const [examType, setExamType] = useState('JEE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [formData, setFormData] = useState({
    testName: '',
    csvText: ''
  });

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

  const handleCreateTest = async () => {
    if (!formData.testName.trim()) {
      toast.error('Please enter test name');
      return;
    }

    if (!formData.csvText.trim()) {
      toast.error('Please enter questions in CSV format');
      return;
    }

    const questionCount = formData.csvText.split('\n').filter(l => l.trim()).length;
    const expectedCount = examType === 'JEE' ? 90 : 180;

    if (questionCount !== expectedCount) {
      toast.error(`${examType} mock test must have exactly ${expectedCount} questions. You have ${questionCount}.`);
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.createMockTest({
        examType,
        testName: formData.testName,
        csvText: formData.csvText
      });

      if (response.success) {
        toast.success('Mock test created successfully!');
        setShowCreateModal(false);
        setFormData({ testName: '', csvText: '' });
        fetchTests();
      }
    } catch (error) {
      toast.error(error.message);
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

  const getQuestionCount = () => {
    return formData.csvText.split('\n').filter(l => l.trim()).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mock Test Management</h1>
          <div className="flex space-x-3">
            <button onClick={() => setShowHelpModal(true)} className="btn-secondary flex items-center space-x-2">
              <HelpCircle size={20} />
              <span>Help</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
              <Plus size={20} />
              <span>Create Test</span>
            </button>
          </div>
        </div>

        <div className="card mb-8">
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="JEE">JEE (90 Questions)</option>
            <option value="NEET">NEET (180 Questions)</option>
          </select>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div key={test._id} className="card hover">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.testName}</h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>Questions: {test.totalQuestions}</p>
                  <p>Duration: {test.duration} minutes</p>
                  <p>Attempts: {test.totalAttempts}</p>
                  <p>Avg Score: {test.averageScore.toFixed(1)}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-1">
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="px-3 py-2 bg-danger-100 text-danger-700 rounded-lg hover:bg-danger-200 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {tests.length === 0 && !loading && (
              <div className="col-span-full card text-center py-12">
                <p className="text-gray-600">No mock tests found. Create your first test!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Test Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ testName: '', csvText: '' });
        }} 
        title={`Create ${examType} Mock Test`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Requirements:</strong> {examType === 'JEE' ? '90' : '180'} questions required
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Same CSV format as questions. Supports LaTeX: latex:formula
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Name</label>
            <input
              type="text"
              value={formData.testName}
              onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
              placeholder={`e.g., ${examType} Mock Test - January 2025`}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questions CSV Text ({getQuestionCount()}/{examType === 'JEE' ? 90 : 180})
            </label>
            <textarea
              value={formData.csvText}
              onChange={(e) => setFormData({ ...formData, csvText: e.target.value })}
              placeholder="Paste CSV formatted questions here. Each line = one question&#10;Example: M#Physics#Gravitation#Topic#Question?#OptA#OptB#OptC#OptD#A#####"
              className="input-field font-mono text-sm"
              rows="12"
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className={`${
                getQuestionCount() === (examType === 'JEE' ? 90 : 180) 
                  ? 'text-success-600' 
                  : 'text-warning-600'
              }`}>
                {getQuestionCount()} questions entered
              </span>
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-primary-600 hover:underline flex items-center space-x-1"
              >
                <HelpCircle size={14} />
                <span>CSV Format Help</span>
              </button>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ testName: '', csvText: '' });
              }} 
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateTest} 
              disabled={loading || !formData.testName || getQuestionCount() !== (examType === 'JEE' ? 90 : 180)}
              className="flex-1 btn-primary"
            >
              {loading ? <Loader size="sm" /> : 'Create Test'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        title="Mock Test Creation Guide"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Question Requirements</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>JEE:</strong> Exactly 90 questions (30 Physics, 30 Chemistry, 30 Maths)</li>
              <li>• <strong>NEET:</strong> Exactly 180 questions (45 Physics, 45 Chemistry, 90 Biology)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">CSV Format (Same as Questions)</h4>
            <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
              Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg
            </code>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Examples</h4>
            <div className="space-y-3 text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
              <div>
                <p className="text-gray-600 mb-1">Physics MCQ:</p>
                <p className="text-gray-800">M#Physics#Mechanics#Kinematics#A car accelerates from rest?#5 m/s²#10 m/s²#15 m/s²#20 m/s²#B#####</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Chemistry with LaTeX:</p>
                <p className="text-gray-800">M#Chemistry#Stoichiometry#Mole#Molar mass of latex:H_2O?#18 g/mol#20 g/mol#16 g/mol#22 g/mol#A#####</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Numerical:</p>
                <p className="text-gray-800">N#Maths#Calculus#Limits#Value of limit?#####5#####</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">LaTeX Support</h4>
            <p className="text-sm text-gray-600 mb-2">Use <code className="bg-gray-100 px-1">latex:formula</code> anywhere:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Chemical formulas: <code className="bg-gray-100 px-1">latex:H_2SO_4</code></li>
              <li>• Equations: <code className="bg-gray-100 px-1">latex:ax^2 + bx + c = 0</code></li>
              <li>• Calculus: <code className="bg-gray-100 px-1">latex:\int_0^1 x^2 dx</code></li>
              <li>• Greek letters: <code className="bg-gray-100 px-1">latex:\alpha, \beta, \gamma</code></li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800"><strong>Tips:</strong></p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Questions will be automatically numbered 1-90 (JEE) or 1-180 (NEET)</li>
              <li>• Each question gets 4 marks, -1 for wrong answer</li>
              <li>• Test duration is automatically set to 180 minutes</li>
              <li>• Questions are saved to database and can be reused</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminMockTests;