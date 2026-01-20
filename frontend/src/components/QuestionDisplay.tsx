// src/components/QuestionDisplay.tsx
import React, { useState } from 'react';
import { Question } from '@/lib/types';
import { LaTeXText } from './LaTeXText';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface QuestionDisplayProps {
  question: Question;
  showAnswer?: boolean;
  onAnswerSelect?: (option: 'A' | 'B' | 'C' | 'D') => void;
  selectedOption?: 'A' | 'B' | 'C' | 'D' | '';
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  showAnswer = false,
  onAnswerSelect,
  selectedOption,
}) => {
  const [submitted, setSubmitted] = useState(showAnswer);

  const handleOptionClick = (option: 'A' | 'B' | 'C' | 'D') => {
    if (!submitted && onAnswerSelect) {
      onAnswerSelect(option);
    }
  };

  const handleSubmit = () => {
    if (selectedOption) {
      setSubmitted(true);
    }
  };

  const getOptionClass = (option: 'A' | 'B' | 'C' | 'D') => {
    const baseClass = 'p-4 rounded-lg border-2 cursor-pointer transition-all';
    
    if (!submitted) {
      return `${baseClass} ${
        selectedOption === option
          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
      }`;
    }

    if (option === question.correctOption) {
      return `${baseClass} border-green-600 bg-green-50 dark:bg-green-900/20`;
    }

    if (selectedOption === option && option !== question.correctOption) {
      return `${baseClass} border-red-600 bg-red-50 dark:bg-red-900/20`;
    }

    return `${baseClass} border-gray-300 dark:border-gray-600`;
  };

  return (
    <Card>
      <div className="space-y-6">
        {/* Question Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Question ID: {question.questionId} | Serial: {question.serialNumber}
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
              {question.subject} - {question.chapter}
            </p>
          </div>
        </div>

        {/* Question */}
        <div className="prose dark:prose-invert max-w-none">
          <LaTeXText text={question.question} />
          {question.questionImageUrl && (
            <img
              src={question.questionImageUrl}
              alt="Question"
              className="mt-4 max-w-full rounded-lg"
            />
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((option) => (
            <div
              key={option}
              className={getOptionClass(option)}
              onClick={() => handleOptionClick(option)}
            >
              <div className="flex items-start">
                <span className="font-semibold mr-3">{option}.</span>
                <div className="flex-1">
                  <LaTeXText text={question[`option${option}`]} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!submitted && onAnswerSelect && (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}

        {/* Explanation */}
        {submitted && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Explanation:
            </h4>
            <div className="prose dark:prose-invert max-w-none">
              <LaTeXText text={question.explanation} />
              {question.explanationImageUrl && (
                <img
                  src={question.explanationImageUrl}
                  alt="Explanation"
                  className="mt-4 max-w-full rounded-lg"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};