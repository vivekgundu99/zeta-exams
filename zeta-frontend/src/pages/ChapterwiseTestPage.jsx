import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { FileText, Clock, Award, TrendingUp } from 'lucide-react';
import { questionAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';

const ChapterwiseTestPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  
  // Test state
  const [testActive, setTestActive] = useState(false);
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (user?.examType) {
      fetchSubjects();
    }
  }, []);

  useEffect(() => {
    let timer;
    if (testActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [testActive, timeRemaining]);

  const fetchSubjects = async () => {
    try {
      const response = await questionAPI.getSubjects(user.examType);
      if (response.success) setSubjects(response.subjects);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchChapters = async (subject) => {
    try {
      const response = await questionAPI.getChapters(user.examType, subject);
      if (response.success) setChapters(response.chapters);
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedSubject || !selectedChapter) {
      toast.error('Please select subject and chapter');
      return;
    }

    setLoading(true);
    try {
      const response = await questionAPI.generateChapterTest({
        examType: user.examType,
        subject: selectedSubject,
        chapter: selectedChapter
      });

      if (response.success) {
        setTestData(response);
        setTestActive(true);
        setCurrentQuestionIndex(0);
        setResponses({});
        setTimeRemaining(1200);
        toast.success('Test generated! Good luck! 🎯');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitTest = async () => {
    if (Object.keys(responses).length === 0) {
      toast.error('Please attempt at least one question');
      return;
    }

    setLoading(true);
    try {
      const formattedResponses = testData.questions.map(q => ({
        questionId: q._id,
        userAnswer: responses[q._id] || '',
        timeTaken: Math.floor((1200 - timeRemaining) / testData.questions.length)
      }));

      const response = await questionAPI.submitChapterTest({
        testId: testData.testId,
        responses: formattedResponses
      });

      if (response.success) {
        setResult(response.result);
        setShowResult(true);
        setTestActive(false);
        toast.success('Test submitted successfully!');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = testData?.questions[currentQuestionIndex];

  if (showResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-4">
                <Award className="text-success-600" size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Test Completed!</h2>
              <p className="text-gray-600">Here's how you performed</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-3xl font-bold text-primary-600">{result?.score || 0}</p>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Correct</p>
                <p className="text-3xl font-bold text-success-600">{result?.correct || 0}</p>
              </div>
              <div className="text-center p-4 bg-danger-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Wrong</p>
                <p className="text-3xl font-bold text-danger-600">{result?.wrong || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-purple-600">{result?.accuracy || 0}%</p>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Take Another Test
              </button>
              <button onClick={() => setShowResult(false)} className="btn-secondary">
                Review Answers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chapter Tests</h1>
          <p className="text-gray-600">10 random questions from selected chapter</p>
        </div>

        {!testActive ? (
          <div className="card max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Generate New Test</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedChapter('');
                    if (e.target.value) fetchChapters(e.target.value);
                  }}
                  className="input-field"
                >
                  <option value="">Select Subject</option>
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
                  <option value="">Select Chapter</option>
                  {chapters.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateTest}
              disabled={loading || !selectedChapter}
              className="w-full btn-primary"
            >
              {loading ? <Loader size="sm" /> : 'Generate Test'}
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Question Panel */}
            <div className="lg:col-span-2 card">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="text-primary-600" size={20} />
                  <span className={`font-bold ${timeRemaining < 60 ? 'text-danger-600' : 'text-gray-900'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <span className="text-gray-600">
                  Question {currentQuestionIndex + 1} of {testData.questions.length}
                </span>
              </div>

              <p className="text-lg text-gray-900 mb-6">{currentQuestion.question}</p>

              {currentQuestion.type === 'S' ? (
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <label key={opt} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500">
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={opt}
                        checked={responses[currentQuestion._id] === opt}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        className="w-5 h-5 text-primary-600"
                      />
                      <span className="ml-3">{opt}. {currentQuestion.options[opt].text}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={responses[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  placeholder="Enter answer"
                  className="input-field"
                />
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary"
                >
                  Previous
                </button>
                {currentQuestionIndex < testData.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="btn-primary"
                  >
                    Next
                  </button>
                ) : (
                  <button onClick={handleSubmitTest} className="btn-primary">
                    Submit Test
                  </button>
                )}
              </div>
            </div>

            {/* Navigator */}
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-4">Question Navigator</h4>
              <div className="grid grid-cols-5 gap-2">
                {testData.questions.map((q, idx) => (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-10 h-10 rounded-lg font-semibold ${
                      idx === currentQuestionIndex
                        ? 'bg-primary-600 text-white'
                        : responses[q._id]
                        ? 'bg-success-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterwiseTestPage;