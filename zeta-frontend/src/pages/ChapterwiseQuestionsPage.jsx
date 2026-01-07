import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { BookOpen, CheckCircle, XCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { questionAPI } from '../services/api';
import toast from 'react-hot-toast';
import ProgressBar from '../components/common/ProgressBar';
import { DAILY_LIMITS, CLOUDFRONT_URL } from '../utils/constants';

const ChapterwiseQuestionsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Dropdowns
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  
  // Selected values
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Questions
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [questionsAttempted, setQuestionsAttempted] = useState(0);

  const limits = DAILY_LIMITS[user?.subscription || 'free'];
  const currentQuestion = questions[currentQuestionIndex];

  // Fetch subjects on mount
  useEffect(() => {
    if (user?.examType) {
      fetchSubjects();
    }
  }, [user?.examType]);

  const fetchSubjects = async () => {
    try {
      const response = await questionAPI.getSubjects(user.examType);
      if (response.success) {
        setSubjects(response.subjects);
      }
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchChapters = async (subject) => {
    try {
      setLoading(true);
      const response = await questionAPI.getChapters(user.examType, subject);
      if (response.success) {
        setChapters(response.chapters);
        setTopics([]);
        setQuestions([]);
      }
    } catch (error) {
      toast.error('Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subject, chapter) => {
    try {
      setLoading(true);
      const response = await questionAPI.getTopics(user.examType, subject, chapter);
      if (response.success) {
        setTopics(response.topics);
        setQuestions([]);
      }
    } catch (error) {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (subject, chapter, topic) => {
    try {
      setLoading(true);
      const response = await questionAPI.getQuestions(user.examType, subject, chapter, topic);
      if (response.success) {
        setQuestions(response.questions);
        setCurrentQuestionIndex(0);
        setShowResult(false);
        setUserAnswer('');
      }
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedChapter('');
    setSelectedTopic('');
    setChapters([]);
    setTopics([]);
    setQuestions([]);
    if (subject) {
      fetchChapters(subject);
    }
  };

  const handleChapterChange = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedTopic('');
    setTopics([]);
    setQuestions([]);
    if (chapter) {
      fetchTopics(selectedSubject, chapter);
    }
  };

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
    if (topic) {
      fetchQuestions(selectedSubject, selectedChapter, topic);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer) {
      toast.error('Please select/enter an answer');
      return;
    }

    try {
      const response = await questionAPI.submitAnswer({
        questionId: currentQuestion._id,
        userAnswer: userAnswer.toUpperCase()
      });

      if (response.success) {
        setResult(response);
        setShowResult(true);
        setQuestionsAttempted(prev => prev + 1);
        
        if (response.isCorrect) {
          toast.success('Correct! 🎉');
        } else {
          toast.error('Incorrect. Try again!');
        }
      }
    } catch (error) {
      if (error.message.includes('Daily limit')) {
        toast.error('Daily limit reached! Upgrade to continue.');
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowResult(false);
      setResult(null);
    } else {
      toast.success('All questions completed!');
    }
  };

  const renderQuestionImage = (url) => {
    if (!url) return null;
    return (
      <div className="my-4 p-4 bg-gray-50 rounded-lg">
        <img 
          src={`${CLOUDFRONT_URL}${url}`} 
          alt="Question" 
          className="max-w-full h-auto rounded"
          onError={(e) => e.target.style.display = 'none'}
        />
      </div>
    );
  };

  const renderOptionImage = (url) => {
    if (!url) return null;
    return (
      <img 
        src={`${CLOUDFRONT_URL}${url}`} 
        alt="Option" 
        className="w-20 h-20 object-contain ml-2"
        onError={(e) => e.target.style.display = 'none'}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chapterwise Questions</h1>
          <p className="text-gray-600">Practice questions topic by topic</p>
        </div>

        {/* Daily Limit Progress */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Progress</h3>
            <span className="text-sm text-gray-600">
              {questionsAttempted}/{limits.questions} questions today
            </span>
          </div>
          <ProgressBar
            current={questionsAttempted}
            total={limits.questions}
            color={questionsAttempted >= limits.questions ? 'danger' : 'primary'}
            showPercentage={false}
          />
          {questionsAttempted >= limits.questions && (
            <p className="mt-2 text-sm text-danger-600">
              Daily limit reached! Upgrade to continue practicing.
            </p>
          )}
        </div>

        {/* Dropdowns */}
        <div className="card mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Subject Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="input-field"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Chapter Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => handleChapterChange(e.target.value)}
                className="input-field"
                disabled={!selectedSubject}
              >
                <option value="">Select Chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter.name} value={chapter.name}>{chapter.name}</option>
                ))}
              </select>
            </div>

            {/* Topic Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="input-field"
                disabled={!selectedChapter}
              >
                <option value="">Select Topic</option>
                {topics.map((topic) => (
                  <option key={topic.name} value={topic.name}>
                    {topic.name} ({topic.questionCount} questions)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Question Display */}
        {loading ? (
          <Loader fullScreen text="Loading questions..." />
        ) : questions.length > 0 ? (
          <div className="card">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold">
                  {currentQuestionIndex + 1}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
                  <p className="text-xs text-gray-500">Serial: {currentQuestion.serialNumber}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {currentQuestion.type === 'S' ? 'Single Correct MCQ' : 'Numerical'}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <p className="text-lg text-gray-900 mb-4">{currentQuestion.question}</p>
              {renderQuestionImage(currentQuestion.questionImageUrl)}
            </div>

            {/* Options for MCQ */}
            {currentQuestion.type === 'S' && (
              <div className="space-y-3 mb-6">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <label
                    key={option}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      userAnswer === option
                        ? 'border-primary-600 bg-primary-50'
                        : showResult && result?.correctAnswer === option
                        ? 'border-success-500 bg-success-50'
                        : showResult && userAnswer === option && !result?.isCorrect
                        ? 'border-danger-500 bg-danger-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${showResult ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={userAnswer === option}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={showResult}
                      className="w-5 h-5 text-primary-600"
                    />
                    <div className="ml-3 flex-1 flex items-center">
                      <span className="font-semibold text-gray-900 mr-2">{option}.</span>
                      <span className="text-gray-700">{currentQuestion.options[option].text}</span>
                      {renderOptionImage(currentQuestion.options[option].imageUrl)}
                    </div>
                    {showResult && result?.correctAnswer === option && (
                      <CheckCircle className="text-success-500 ml-2" size={24} />
                    )}
                    {showResult && userAnswer === option && !result?.isCorrect && (
                      <XCircle className="text-danger-500 ml-2" size={24} />
                    )}
                  </label>
                ))}
              </div>
            )}

            {/* Input for Numerical */}
            {currentQuestion.type === 'N' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter numerical answer"
                  className="input-field"
                  disabled={showResult}
                />
              </div>
            )}

            {/* Result Display */}
            {showResult && result && (
              <div className={`p-4 rounded-lg mb-6 ${
                result.isCorrect ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {result.isCorrect ? (
                    <>
                      <CheckCircle className="text-success-600" size={24} />
                      <span className="text-success-900 font-semibold">Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-danger-600" size={24} />
                      <span className="text-danger-900 font-semibold">Incorrect Answer</span>
                    </>
                  )}
                </div>
                <p className="text-gray-700">
                  <span className="font-medium">Correct Answer:</span> {result.correctAnswer}
                </p>
                
                {result.solution && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium text-gray-900 mb-2">Solution:</p>
                    <p className="text-gray-700">{result.solution}</p>
                    {result.solutionImageUrl && renderQuestionImage(result.solutionImageUrl)}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>

              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer}
                  className="btn-primary disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>{currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish'}</span>
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <BookOpen className="text-gray-400 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Selected</h3>
            <p className="text-gray-600">Please select subject, chapter, and topic to start practicing</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterwiseQuestionsPage;