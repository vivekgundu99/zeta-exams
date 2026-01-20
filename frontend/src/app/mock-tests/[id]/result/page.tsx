// src/app/mock-tests/[id]/result/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LaTeXText } from '@/components/LaTeXText';
import { CheckCircle, XCircle, Award, Clock, Target } from 'lucide-react';
import { mockTestAPI } from '@/lib/api';
import { MockTest } from '@/lib/types';
import { useMockTestStore } from '@/store/mockTestStore';

export default function MockTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<MockTest | null>(null);
  const { answers, resetTest } = useMockTestStore();

  useEffect(() => {
    fetchTest();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const response = await mockTestAPI.getTest(testId);
      setTest(response.data.test);
    } catch (error) {
      router.push('/mock-tests');
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Calculate results
  const results = test.questions.map((question, index) => {
    const answer = answers.find(a => a.questionNumber === index + 1);
    const isCorrect = answer?.selectedOption === question.correctOption;
    return {
      question,
      selectedOption: answer?.selectedOption || '',
      isCorrect,
      index: index + 1
    };
  });

  const correct = results.filter(r => r.isCorrect).length;
  const incorrect = results.filter(r => !r.isCorrect && r.selectedOption).length;
  const unattempted = results.filter(r => !r.selectedOption).length;
  const totalScore = correct * test.marking.positive + incorrect * test.marking.negative;
  const percentage = ((correct / test.questions.length) * 100).toFixed(2);

  const handleRetakeTest = () => {
    resetTest();
    router.push(`/mock-tests/${testId}`);
  };

  const handleBackToTests = () => {
    resetTest();
    router.push('/mock-tests');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Test Results: {test.testName}
        </h1>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {totalScore}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Total Score</p>
          </Card>

          <Card className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-3xl font-bold text-green-600 mb-1">
              {correct}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Correct</p>
          </Card>

          <Card className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h3 className="text-3xl font-bold text-red-600 mb-1">
              {incorrect}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Incorrect</p>
          </Card>

          <Card className="text-center">
            <Target className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {percentage}%
            </h3>
            <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button onClick={handleRetakeTest} className="flex-1">
            Retake Test
          </Button>
          <Button onClick={handleBackToTests} variant="secondary" className="flex-1">
            Back to Tests
          </Button>
        </div>

        {/* Detailed Answers */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Detailed Solutions
        </h2>

        <div className="space-y-6">
          {results.map((result) => (
            <Card key={result.index}>
              <div className="space-y-4">
                {/* Question Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      Question {result.index}
                    </span>
                    {result.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : result.selectedOption ? (
                      <XCircle className="w-6 h-6 text-red-500" />
                    ) : (
                      <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded">
                        Not Attempted
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {result.isCorrect && (
                      <span className="text-green-600 font-semibold">
                        +{test.marking.positive}
                      </span>
                    )}
                    {!result.isCorrect && result.selectedOption && (
                      <span className="text-red-600 font-semibold">
                        {test.marking.negative}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="prose dark:prose-invert max-w-none">
                  <LaTeXText text={result.question.question} />
                  {result.question.questionImageUrl && (
                    <img
                      src={result.question.questionImageUrl}
                      alt="Question"
                      className="mt-4 max-w-full rounded-lg"
                    />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D'] as const).map((option) => {
                    const isCorrect = option === result.question.correctOption;
                    const isSelected = option === result.selectedOption;
                    
                    let bgColor = 'bg-gray-50 dark:bg-gray-900';
                    let borderColor = 'border-gray-300 dark:border-gray-700';
                    
                    if (isCorrect) {
                      bgColor = 'bg-green-50 dark:bg-green-900/20';
                      borderColor = 'border-green-500';
                    } else if (isSelected && !isCorrect) {
                      bgColor = 'bg-red-50 dark:bg-red-900/20';
                      borderColor = 'border-red-500';
                    }

                    return (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border-2 ${bgColor} ${borderColor}`}
                      >
                        <div className="flex items-start">
                          <span className="font-semibold mr-3">{option}.</span>
                          <div className="flex-1">
                            <LaTeXText text={result.question[`option${option}`]} />
                          </div>
                          {isCorrect && (
                            <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-600 ml-2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Explanation:
                  </h4>
                  <div className="prose dark:prose-invert max-w-none">
                    <LaTeXText text={result.question.explanation} />
                    {result.question.explanationImageUrl && (
                      <img
                        src={result.question.explanationImageUrl}
                        alt="Explanation"
                        className="mt-4 max-w-full rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}