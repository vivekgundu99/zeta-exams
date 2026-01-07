import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { BookMarked, ExternalLink } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const FormulasPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formulas, setFormulas] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [filteredFormulas, setFilteredFormulas] = useState([]);

  useEffect(() => {
    if (user?.examType) {
      fetchFormulas();
    }
  }, [user?.examType]);

  useEffect(() => {
    filterFormulas();
  }, [selectedSubject, selectedChapter, formulas]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllFormulas(user.examType);
      if (response.success) {
        setFormulas(response.formulas);
        const uniqueSubjects = [...new Set(response.formulas.map(f => f.subject))];
        setSubjects(uniqueSubjects);
      }
    } catch (error) {
      toast.error('Failed to load formulas');
    } finally {
      setLoading(false);
    }
  };

  const filterFormulas = () => {
    let filtered = formulas;
    if (selectedSubject) {
      filtered = filtered.filter(f => f.subject === selectedSubject);
    }
    if (selectedChapter) {
      filtered = filtered.filter(f => f.chapter === selectedChapter);
    }
    setFilteredFormulas(filtered);
  };

  const chapters = selectedSubject
    ? [...new Set(formulas.filter(f => f.subject === selectedSubject).map(f => f.chapter))]
    : [];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formulas & Quick Reference</h1>
          <p className="text-gray-600">Access all important formulas by chapter</p>
        </div>

        <div className="card mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedChapter('');
                }}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="input-field"
                disabled={!selectedSubject}
              >
                <option value="">All Chapters</option>
                {chapters.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormulas.map((formula) => (
            <div key={formula._id} className="card hover cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <BookMarked className="text-primary-600" size={32} />
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {formula.subject}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{formula.topicName}</h3>
              <p className="text-sm text-gray-600 mb-4">{formula.chapter}</p>
              <a
                href={formula.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
              >
                <span>View PDF</span>
                <ExternalLink size={16} className="ml-2" />
              </a>
            </div>
          ))}
        </div>

        {filteredFormulas.length === 0 && (
          <div className="card text-center py-12">
            <BookMarked className="text-gray-400 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Formulas Found</h3>
            <p className="text-gray-600">No formulas available for selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormulasPage;