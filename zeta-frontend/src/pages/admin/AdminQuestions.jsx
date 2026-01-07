import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Upload, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminQuestions = () => {
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [examType, setExamType] = useState('JEE');
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState([]);

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('examType', examType);

      const response = await adminAPI.bulkUploadQuestions(formData);
      if (response.success) {
        toast.success(`${response.successCount} questions uploaded successfully!`);
        setCsvFile(null);
        if (response.errors.length > 0) {
          console.log('Errors:', response.errors);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    try {
      const response = await adminAPI.searchQuestion({ query: searchQuery, examType });
      if (response.success) {
        setQuestions(response.questions);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Question Management</h1>

        {/* Bulk Upload Section */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload (CSV)</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 font-medium mb-2">CSV Format:</p>
            <code className="text-xs text-blue-700">
              Type#Subject#Chapter#Topic#Question#OptA#OptB#OptC#OptD#Answer#QImg#OptAImg#OptBImg#OptCImg#OptDImg
            </code>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="input-field"
            >
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="input-field"
            />

            <button
              onClick={handleCSVUpload}
              disabled={loading || !csvFile}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Upload size={20} />
              <span>{loading ? 'Uploading...' : 'Upload CSV'}</span>
            </button>
          </div>
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
            />
            <button onClick={handleSearch} className="btn-primary">
              <Search size={20} />
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
                      <td className="py-3 px-4">{q.questionId}</td>
                      <td className="py-3 px-4">{q.serialNumber}</td>
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
    </div>
  );
};

export default AdminQuestions;