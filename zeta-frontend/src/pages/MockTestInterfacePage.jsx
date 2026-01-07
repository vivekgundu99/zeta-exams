import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Flag, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import { mockTestAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';

const MockTestInterfacePage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(10800); // 180 minutes
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  // Prevent page refresh/back
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Start test
  useEffect(() => {
    startTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!questionsLoaded || !testData) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questionsLoaded, testData]);

  const startTest = async () => {
    try {
      setLoading(true);
      const response = await mockTestAPI.startTest(testId);
      
      if (response.success) {
        setTestData(response);
        setAttemptId(response.attemptId);
        setTimeRemaining(response.duration * 60);
        
        // Initialize responses object
        const initialResponses = {};
        response.questions.forEach(q => {
          initialResponses[q._id] = {
            questionNumber: q.questionNumber,
            answer: '',
            isAttempted: false,
            timeTaken: 0
          };
        });
        setResponses(initialResponses);
        setQuestionsLoaded(true);
        toast.success('Test started! All questions loaded offline.');
      }
    } catch (error) {
      toast.error(error.message);
      navigate('/mock-tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        isAttempted: true
      }
    }));
  };

  const handleFlagQuestion = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitTest = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);

    try {
      const formattedResponses = Object.entries(responses).map(([questionId, data]) => ({
        questionNumber: data.questionNumber,
        userAnswer: data.answer,
        timeTaken: 0
      }));

      const flags = Array.from(flaggedQuestions).map(qId => 
        responses[qId]?.questionNumber
      );

      const response = await mockTestAPI.submitTest(testId, {
        attemptId,
        responses: formattedResponses,
        flags
      });

      if (response.success) {
        toast.success('Test submitted successfully!');
        navigate(response.redirectUrl || `/mock-test/${testId}/result/${attemptId}`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error('Time up! Auto-submitting test...');
    handleSubmitTest();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId) => {
    const response = responses[questionId];
    const isFlagged = flaggedQuestions.has(questionId);
    
    if (isFlagged) return 'flagged';
    if (!response?.isAttempted) return 'unattempted';
    if (response?.answer) return 'answered';
    return 'visited';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return 'bg-success-500 text-white';
      case 'visited': return 'bg-blue-500 text-white';
      case 'flagged': return 'bg-orange-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusCounts = () => {
    let answered = 0, visited = 0, unattempted = 0, flagged = 0;
    
    testData.questions.forEach(q => {
      const status = getQuestionStatus(q._id);
      if (status === 'answered') answered++;
      else if (status === 'visited') visited++;
      else if (status === 'flagged') flagged++;
      else unattempted++;
    });

    return { answered, visited, unattempted, flagged };
  };

  if (loading || !testData) {
    return <Loader fullScreen text="Loading test..." />;
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const stats = getStatusCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{testData.testName}</h2>
              <p className="text-sm text-gray-600">{user?.examType} Mock Test</p>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 600 ? 'bg-danger-100 text-danger-700' : 'bg-primary-100 text-primary-700'
              }`}>
                <Clock size={20} />
                <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="btn-primary flex items-center space-x-2"
              >
                <Send size={20} />
                <span>Submit Test</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold">
                    {currentQuestion.questionNumber}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Question {currentQuestion.questionNumber}</p>
                    <p className="text-xs text-gray-500">{currentQuestion.subject} • {currentQuestion.marks} marks</p>
                  </div>
                </div>

                <button
                  onClick={() => handleFlagQuestion(currentQuestion._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQuestion._id)
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Flag size={20} fill={flaggedQuestions.has(currentQuestion._id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <p className="text-lg text-gray-900 mb-4">{currentQuestion.question}</p>
                {currentQuestion.questionImageUrl && (
                  <img 
                    src={currentQuestion.questionImageUrl} 
                    alt="Question" 
                    className="max-w-full h-auto rounded-lg"
                  />
                )}
              </div>

              {/* Options (MCQ) */}
              {currentQuestion.type === 'S' && currentQuestion.options && (
                <div className="space-y-3 mb-6">
                  {['A', 'B', 'C', 'D'].map(option => (
                    <label
                      key={option}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        responses[currentQuestion._id]?.answer === option
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={option}
                        checked={responses[currentQuestion._id]?.answer === option}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        className="w-5 h-5 text-primary-600"
                      />
                      <span className="ml-3 flex-1">
                        <span className="font-semibold mr-2">{option}.</span>
                        {currentQuestion.options[option].text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Numerical Input */}
              {currentQuestion.type === 'N' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your answer (numerical value)
                  </label>
                  <input
                    type="text"
                    value={responses[currentQuestion._id]?.answer || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                    placeholder="Enter answer"
                    className="input-field text-center text-xl font-bold"
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <ChevronLeft size={20} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAnswerChange(currentQuestion._id, responses[currentQuestion._id]?.answer || '')}
                    className="px-4 py-2 bg-success-100 text-success-700 rounded-lg font-medium hover:bg-success-200"
                  >
                    Save & Next
                  </button>
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    disabled={currentQuestionIndex === testData.questions.length - 1}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              {/* Status Legend */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Legend</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-success-500 rounded-lg"></div>
                    <span>Answered ({stats.answered})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg"></div>
                    <span>Visited ({stats.visited})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg"></div>
                    <span>Flagged ({stats.flagged})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <span>Not Visited ({stats.unattempted})</span>
                  </div>
                </div>
              </div>

              {/* Section Headers & Question Grid */}
              <div className="space-y-6">
                {testData.config && Object.keys(testData.config).map(subject => {
                  const subjectQuestions = testData.questions.filter(
                    q => q.subject.toLowerCase() === subject.toLowerCase()
                  );
                  
                  return (
                    <div key={subject}>
                      <h4 className="font-semibold text-gray-900 mb-3 capitalize">{subject}</h4>
                      <div className="grid grid-cols-5 gap-2">
                        {subjectQuestions.map((q, idx) => {
                          const status = getQuestionStatus(q._id);
                          const isCurrent = q._id === currentQuestion._id;
                          
                          return (
                            <button
                              key={q._id}
                              onClick={() => setCurrentQuestionIndex(testData.questions.indexOf(q))}
                              className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                                getStatusColor(status)
                              } ${isCurrent ? 'ring-2 ring-primary-600 ring-offset-2' : ''}`}
                            >
                              {q.questionNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <AlertTriangle className="text-warning-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-warning-800">
              <p className="font-medium mb-1">Are you sure you want to submit?</p>
              <p>You have answered <strong>{stats.answered}</strong> out of <strong>{testData.totalQuestions}</strong> questions.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-success-50 rounded-lg">
              <p className="text-gray-600 mb-1">Answered</p>
              <p className="text-2xl font-bold text-success-600">{stats.answered}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="text-gray-600 mb-1">Unattempted</p>
              <p className="text-2xl font-bold text-gray-600">{stats.unattempted}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button onClick={() => setShowSubmitModal(false)} className="flex-1 btn-secondary">
              Review Again
            </button>
            <button onClick={handleSubmitTest} disabled={submitting} className="flex-1 btn-primary">
              {submitting ? <Loader size="sm" /> : 'Submit Test'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MockTestInterfacePage;