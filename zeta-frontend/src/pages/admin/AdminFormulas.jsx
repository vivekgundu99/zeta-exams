import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminFormulas = () => {
  const [loading, setLoading] = useState(false);
  const [formulas, setFormulas] = useState([]);
  const [examType, setExamType] = useState('JEE');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    chapter: '',
    topicName: '',
    pdfUrl: '',
    description: ''
  });

  useEffect(() => {
    fetchFormulas();
  }, [examType]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllFormulas(examType);
      if (response.success) {
        setFormulas(response.formulas);
      }
    } catch (error) {
      toast.error('Failed to load formulas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFormula = async () => {
    if (!formData.subject || !formData.chapter || !formData.topicName || !formData.pdfUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminAPI.addFormula({ ...formData, examType });
      if (response.success) {
        toast.success('Formula added successfully');
        setShowAddModal(false);
        setFormData({ subject: '', chapter: '', topicName: '', pdfUrl: '', description: '' });
        fetchFormulas();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this formula?')) return;

    try {
      await adminAPI.deleteFormula(id);
      toast.success('Formula deleted');
      fetchFormulas();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Formula Management</h1>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Add Formula</span>
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
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Subject</th>
                    <th className="text-left py-3 px-4">Chapter</th>
                    <th className="text-left py-3 px-4">Topic</th>
                    <th className="text-left py-3 px-4">PDF URL</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formulas.map((formula) => (
                    <tr key={formula._id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{formula.subject}</td>
                      <td className="py-3 px-4">{formula.chapter}</td>
                      <td className="py-3 px-4">{formula.topicName}</td>
                      <td className="py-3 px-4">
                        <a href={formula.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                          View PDF
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => handleDelete(formula._id)} className="text-danger-600 hover:text-danger-700">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Formula">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Chapter"
            value={formData.chapter}
            onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Topic Name"
            value={formData.topicName}
            onChange={(e) => setFormData({ ...formData, topicName: e.target.value })}
            className="input-field"
          />
          <input
            type="text"
            placeholder="PDF URL"
            value={formData.pdfUrl}
            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
            className="input-field"
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows="3"
          />
          <button onClick={handleAddFormula} className="w-full btn-primary">
            Add Formula
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminFormulas;