import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, BookOpen, CheckCircle } from 'lucide-react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';

const ExamSelectionPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');

  const exams = [
    {
      id: 'JEE',
      name: 'JEE Main',
      fullName: 'Joint Entrance Examination (Main)',
      description: 'Engineering entrance exam for IITs, NITs, and other technical institutes',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      pattern: '90 Questions | 180 Minutes | 300 Marks',
      icon: '🎯',
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'NEET',
      name: 'NEET',
      fullName: 'National Eligibility cum Entrance Test',
      description: 'Medical entrance exam for MBBS, BDS, and other medical courses',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      pattern: '180 Questions | 180 Minutes | 720 Marks',
      icon: '🏥',
      color: 'from-green-500 to-green-700'
    }
  ];

  const handleSelect = async (examType) => {
    setSelectedExam(examType);
    setLoading(true);

    try {
      const response = await userAPI.selectExam(examType);
      
      if (response.success) {
        updateUser({ examType });
        toast.success(`${examType} selected successfully!`);
        setTimeout(() => navigate('/subscription'), 500);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <Target className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">Choose Your Exam</h1>
          <p className="text-gray-600 text-lg">Select the exam you're preparing for</p>
        </div>

        {/* Exam Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className={`card hover cursor-pointer transform transition-all duration-300 ${
                selectedExam === exam.id ? 'ring-4 ring-primary-500 shadow-2xl scale-105' : 'hover:shadow-xl hover:-translate-y-2'
              }`}
              onClick={() => !loading && handleSelect(exam.id)}
            >
              {/* Selected Badge */}
              {selectedExam === exam.id && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary-500 text-white rounded-full p-2">
                    <CheckCircle size={24} />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-20 h-20 bg-gradient-to-br ${exam.color} rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-lg`}>
                {exam.icon}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{exam.fullName}</p>

              {/* Description */}
              <p className="text-gray-700 mb-6">{exam.description}</p>

              {/* Subjects */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {exam.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pattern */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2 text-gray-600">
                  <BookOpen size={18} />
                  <span className="text-sm font-medium">{exam.pattern}</span>
                </div>
              </div>

              {/* Select Button */}
              <button
                disabled={loading && selectedExam === exam.id}
                className={`mt-6 w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  selectedExam === exam.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {loading && selectedExam === exam.id ? (
                  <Loader size="sm" />
                ) : selectedExam === exam.id ? (
                  'Selected'
                ) : (
                  `Select ${exam.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1 opacity-50">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>Step 1</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-primary-600"></div>
              <span className="font-medium">Step 2</span>
            </div>
            <span>→</span>
            <div className="flex items-center space-x-1 opacity-50">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>Step 3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSelectionPage;