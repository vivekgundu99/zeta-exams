import { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Upload, Search, Edit, Trash2, HelpCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [examType, setExamType] = useState('JEE');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleCSVUpload = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV text');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.bulkUploadQuestions({ csvText, examType });
      
      if (response.success) {
        toast.success(`${response.successCount} questions uploaded successfully!`);
        setCsvText('');
        
        if (response.errors && response.errors.length > 0) {
          console.log('Errors:', response.errors);
          toast.error(`${response.errorCount} questions failed. Check console for details.`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.searchQuestion({ query: searchQuery, examType });
      if (response.success) {
        setQuestions(response.questions);
        if (response.questions.length === 0) {
          toast.info('No questions found');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getQuestionCount = () => {
    return csvText.split('\n').filter(line => line.trim()).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
          <button 
            onClick={() => setShowHelpModal(true)} 
            className="btn-secondary flex items-center space-x-2"
          >
            <HelpCircle size={20} />
            <span>CSV Format Help</span>
          </button>
        </div>

        {/* Bulk Upload Section */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Questions (CSV Format)</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Quick Examples:</p>
            <div className="space-y-2 text-xs text-blue-700 font-mono">
              <p><strong>MCQ:</strong> M#Physics#Gravitation#Escape velocity#What is the escape velocity of Earth?#10 km/sec#11 km/sec#12 km/sec#13 km/sec#B#####</p>
              <p><strong>Numerical:</strong> N#Physics#Gravitation#Escape velocity#What is the escape velocity of Earth in km/sec?#####11#####</p>
              <p><strong>With LaTeX:</strong> M#Chemistry#Stoichiometry#Mole#What is latex:H_2O called?#Water#Air#Gas#Solid#A#####</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="input-field max-w-xs"
            >
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Text ({getQuestionCount()} questions)
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste CSV formatted text here. Each line = one question&#10;Example: M#Physics#Gravitation#Escape velocity#What is the escape velocity?#10 km/s#11 km/s#12 km/s#13 km/s#B#####"
              className="input-field font-mono text-sm"
              rows="10"
            />
          </div>

          <button
            onClick={handleCSVUpload}
            disabled={loading || !csvText.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader size="sm" /> : <Upload size={20} />}
            <span>{loading ? 'Uploading...' : 'Upload Questions'}</span>
          </button>
        </div>

        {/* Search Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Questions</h3>
          
          <div className="flex space-x-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Question ID or Serial Number"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} className="btn-primary" disabled={loading}>
              {loading ? <Loader size="sm" /> : <Search size={20} />}
            </button>
          </div>

          {questions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Serial</th>
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-left py-3 px-4">Chapter</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q._id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-mono text-sm">{q.questionId}</td>
                      <td className="py-3 px-4 font-mono text-sm">{q.serialNumber}</td>
                      <td className="py-3 px-4">{q.subject}</td>
                      <td className="py-3 px-4">{q.chapter}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                          {q.type === 'S' ? 'MCQ' : 'Numerical'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="text-primary-600 hover:text-primary-700 mr-2">
                          <Edit size={18} />
                        </button>
                        <button className="text-danger-600 hover:text-danger-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      <Modal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
        title="CSV Format Help" 
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Format Structure</h4>
            <p className="text-sm text-gray-600 mb-2">Each question is one line with 15 fields separated by #:</p>
            <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
              Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg
            </code>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Question Types</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>M or S</strong> = Multiple Choice (MCQ) - Must have 4 options</li>
              <li><strong>N</strong> = Numerical - Options should be empty (#####)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">LaTeX Support</h4>
            <p className="text-sm text-gray-600 mb-2">Use <code className="bg-gray-100 px-1">latex:formula</code> in any text field:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Water formula: <code className="bg-gray-100 px-1">latex:H_2O</code></li>
              <li>• Quadratic: <code className="bg-gray-100 px-1">latex:ax^2 + bx + c = 0</code></li>
              <li>• Integral: <code className="bg-gray-100 px-1">latex:\int_0^1 x^2 dx</code></li>
              <li>• Sigma: <code className="bg-gray-100 px-1">latex:\sum_&#123;i=1&#125;^n i</code></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Complete Examples</h4>
            <div className="space-y-3 text-xs font-mono bg-gray-50 p-3 rounded overflow-x-auto">
              <div>
                <p className="text-gray-600 mb-1">MCQ with LaTeX:</p>
                <p className="text-gray-800">M#Chemistry#Stoichiometry#Mole#What is latex:H_2O?#Water#Hydrogen#Oxygen#Gas#A#####</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Numerical:</p>
                <p className="text-gray-800">N#Physics#Gravitation#Escape velocity#Escape velocity of Earth in km/s?#####11#####</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Math with LaTeX:</p>
                <p className="text-gray-800">M#Maths#Calculus#Integration#Solve latex:\int x^2 dx#latex:x^3/3#latex:x^2/2#latex:2x^3#latex:x^4#A#####</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800"><strong>Important:</strong></p>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>• Each line must have exactly 15 # symbols (16 parts)</li>
              <li>• Empty fields still need # separator</li>
              <li>• Answer for MCQ: A, B, C, or D</li>
              <li>• Answer for Numerical: exact number</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminQuestions;