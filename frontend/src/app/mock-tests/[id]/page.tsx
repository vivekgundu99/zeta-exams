// src/app/mock-tests/[id]/page.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { LaTeXText } from '@/components/LaTeXText';
import { Clock, ChevronLeft, ChevronRight, Flag, CheckCircle } from 'lucide-react';
import { mockTestAPI } from '@/lib/api';
import { MockTest, MockTestQuestion } from '@/lib/types';
import { useMockTestStore } from '@/store/mockTestStore';
import toast, { Toaster } from 'react-hot-toast';

export default function MockTestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<MockTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [visibleStart, setVisibleStart] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const {
    answers,
    flaggedQuestions,
    setTestId,
    setAnswer,
    toggleFlag,
    startTest,
    resetTest,
    getAnswer,
    startTime
  } = useMockTestStore();

  useEffect(() => {
    fetchTest();
    return () => resetTest();
  }, [testId]);

  useEffect(() => {
    if (!test || !startTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = test.duration * 60 - elapsed;
      
      if (remaining <= 0) {
        handleSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [test, startTime]);

  const fetchTest = async () => {
    try {
      const response = await mockTestAPI.getTest(testId);
      setTest(response.data.test);
      setTestId(testId);
      startTest();
      setTimeLeft(response.data.test.duration * 60);
    } catch (error) {
      toast.error('Failed to load test');
      router.push('/mock-tests');
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];
  const currentAnswer = getAnswer(currentQuestionIndex + 1);

  const handleOptionSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    setAnswer(currentQuestionIndex + 1, option);
  };

  const handleNext = () => {
    if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      adjustVisibleRange(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      adjustVisibleRange(currentQuestionIndex - 1);
    }
  };

  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index);
    adjustVisibleRange(index);
  };

  const adjustVisibleRange = (index: number) => {
    if (index < visibleStart) {
      setVisibleStart(index);
    } else if (index >= visibleStart + 30) {
      setVisibleStart(index - 29);
    }
  };

  const handleSubmit = async () => {
    if (!test || !startTime) return;
    
    const timeTaken = Math.floor((Date.now() - startTime) / 60000);
    
    try {
      const response = await mockTestAPI.submitTest(testId, answers, timeTaken);
      toast.success('Test submitted successfully!');
      router.push(`/mock-tests/${testId}/result`);
    } catch (error) {
      toast.error('Failed to submit test');
    }
  };

  const getQuestionStatus = (index: number) => {
    const answer = getAnswer(index + 1);
    const isFlagged = flaggedQuestions.has(index + 1);
    
    if (answer?.selectedOption) {
      return isFlagged ? 'answered-flagged' : 'answered';
    }
    if (isFlagged) return 'flagged';
    return 'unattempted';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-600 text-white';
      case 'flagged':
        return 'bg-yellow-600 text-white';
      case 'answered-flagged':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white';
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = {
    answered: answers.filter(a => a.selectedOption).length,
    unattempted: (test?.questions.length || 0) - answers.filter(a => a.selectedOption).length,
    flagged: flaggedQuestions.size
  };

  if (!test || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />

      {/* Header with Timer */}
      <div className="bg-white dark:bg-gray-900 shadow-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {test.testName}
              </h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600">Answered: {stats.answered}</span>
                <span className="text-gray-600 dark:text-gray-400">Unattempted: {stats.unattempted}</span>
                <span className="text-yellow-600">Flagged: {stats.flagged}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center px-4 py-2 rounded-lg ${
                timeLeft < 300 ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}>
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
              
              <Button onClick={() => setShowSubmitModal(true)} variant="success">
                Submit Test
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {/* Question Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {currentQuestionIndex + 1} of {test.questions.length}
                  </h3>
                </div>
                <Button
                  onClick={() => toggleFlag(currentQuestionIndex + 1)}
                  variant="secondary"
                  size="sm"
                >
                  <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestionIndex + 1) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
              </div>

              {/* Question */}
              <div className="mb-6">
                <div className="prose dark:prose-invert max-w-none mb-4">
                  <LaTeXText text={currentQuestion.question} />
                </div>
                {currentQuestion.questionImageUrl && (
                  <img
                    src={currentQuestion.questionImageUrl}
                    alt="Question"
                    className="max-w-full rounded-lg"
                  />
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {(['A', 'B', 'C', 'D'] as const).map((option) => (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      currentAnswer?.selectedOption === option
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="font-semibold mr-3">{option}.</span>
                      <div className="flex-1">
                        <LaTeXText text={currentQuestion[`option${option}`]} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  variant="secondary"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  variant="secondary"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-32">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Question Palette
              </h4>
              
              {/* Navigation arrows */}
              <div className="flex justify-between mb-4">
                <Button
                  onClick={() => setVisibleStart(Math.max(0, visibleStart - 30))}
                  disabled={visibleStart === 0}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {visibleStart + 1}-{Math.min(visibleStart + 30, test.questions.length)}
                </span>
                <Button
                  onClick={() => setVisibleStart(Math.min(test.questions.length - 30, visibleStart + 30))}
                  disabled={visibleStart + 30 >= test.questions.length}
                  variant="secondary"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Question boxes */}
              <div className="grid grid-cols-5 gap-2">
                {test.questions.slice(visibleStart, visibleStart + 30).map((_, idx) => {
                  const actualIndex = visibleStart + idx;
                  const status = getQuestionStatus(actualIndex);
                  return (
                    <button
                      key={actualIndex}
                      onClick={() => handleQuestionClick(actualIndex)}
                      className={`w-10 h-10 rounded flex items-center justify-center text-sm font-semibold transition-all ${getStatusColor(status)} ${
                        currentQuestionIndex === actualIndex ? 'ring-2 ring-primary-600 ring-offset-2' : ''
                      }`}
                    >
                      {actualIndex + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Unattempted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Flagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered & Flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Submit Test?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have answered {stats.answered} out of {test.questions.length} questions.
              Are you sure you want to submit?
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setShowSubmitModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} variant="success" className="flex-1">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}