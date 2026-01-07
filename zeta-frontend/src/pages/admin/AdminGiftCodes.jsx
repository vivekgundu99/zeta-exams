import { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import Loader from '../../components/common/Loader';
import { Plus, Trash2, Download } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const AdminGiftCodes = () => {
  const [loading, setLoading] = useState(false);
  const [giftCodes, setGiftCodes] = useState([]);
  const [filter, setFilter] = useState(''); // '' = all, 'true' = used, 'false' = unused
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionType: 'silver',
    duration: '1month',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    fetchGiftCodes();
  }, [filter]);

  const fetchGiftCodes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter) params.isUsed = filter;

      const response = await adminAPI.getAllGiftCodes(params);
      if (response.success) {
        setGiftCodes(response.giftCodes);
      }
    } catch (error) {
      toast.error('Failed to load gift codes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (formData.quantity < 1 || formData.quantity > 100) {
      toast.error('Quantity must be between 1 and 100');
      return;
    }

    try {
      const response = await adminAPI.generateGiftCodes(formData);
      if (response.success) {
        toast.success(`${formData.quantity} gift codes generated!`);
        setShowGenerateModal(false);
        setFormData({ subscriptionType: 'silver', duration: '1month', quantity: 1, notes: '' });
        fetchGiftCodes();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this gift code?')) return;

    try {
      await adminAPI.deleteGiftCode(id);
      toast.success('Gift code deleted');
      fetchGiftCodes();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const exportToCSV = () => {
    const csv = ['Code,Type,Duration,Used,Used By,Created At'].concat(
      giftCodes.map(gc => 
        `${gc.code},${gc.subscriptionType},${gc.duration},${gc.isUsed},${gc.usedBy?.email || '-'},${new Date(gc.createdAt).toLocaleDateString()}`
      )
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giftcodes_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gift Code Management</h1>
          <div className="flex space-x-3">
            <button onClick={exportToCSV} className="btn-secondary flex items-center space-x-2">
              <Download size={20} />
              <span>Export CSV</span>
            </button>
            <button onClick={() => setShowGenerateModal(true)} className="btn-primary flex items-center space-x-2">
              <Plus size={20} />
              <span>Generate Codes</span>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="card mb-8">
          <div className="flex space-x-2">
            {[
              { value: '', label: 'All' },
              { value: 'false', label: 'Unused' },
              { value: 'true', label: 'Used' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gift Codes Table */}
        {loading ? (
          <Loader />
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Code</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Used By</th>
                    <th className="text-center py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {giftCodes.map((code) => (
                    <tr key={code._id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                          {code.code}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          code.subscriptionType === 'gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {code.subscriptionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">{code.duration}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          code.isUsed ? 'bg-danger-100 text-danger-700' : 'bg-success-100 text-success-700'
                        }`}>
                          {code.isUsed ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {code.usedBy?.email || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!code.isUsed && (
                          <button
                            onClick={() => handleDelete(code._id)}
                            className="text-danger-600 hover:text-danger-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Gift Codes">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Type</label>
            <select
              value={formData.subscriptionType}
              onChange={(e) => setFormData({ ...formData, subscriptionType: e.target.value })}
              className="input-field"
            >
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="input-field"
            >
              <option value="1month">1 Month</option>
              <option value="6months">6 Months</option>
              <option value="1year">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity (Max: 100)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows="2"
            />
          </div>

          <button onClick={handleGenerate} className="w-full btn-primary">
            Generate {formData.quantity} Code{formData.quantity > 1 ? 's' : ''}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminGiftCodes;