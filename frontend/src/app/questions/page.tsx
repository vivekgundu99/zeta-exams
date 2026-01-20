// src/app/questions/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { questionAPI } from '@/lib/api';
import { Question } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

export default function QuestionsPage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | ''>('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject && selectedChapter) {
      fetchQuestions(1);
    }
  }, [selectedSubject, selectedChapter]);

  const fetchSubjects = async () => {
    try {
      const response = await questionAPI.getSubjects();
      setSubjects(response.data.subjects);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchChapters = async (subject: string) => {
    try {
      const response = await questionAPI.getChapters(subject);
      setChapters(response.data.chapters);
      setSelectedChapter('');
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const fetchQuestions = async (page: number) => {
    setLoading(true);
    try {
      const response = await questionAPI.getQuestions({
        subject: selectedSubject,
        chapter: selectedChapter,
        page,
        limit: 20
      });
      setQuestions(response.data.questions);
      setTotalPages(response.data.pagination.pages);
      setCurrentPage(page);
      setSelectedOption('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    const currentIndex = questions.findIndex(q => q._id === questions[0]._id);
    if (currentIndex > 0) {
      const newQuestions = questions.slice(currentIndex - 1, currentIndex - 1 + 20);
      setQuestions(newQuestions);
    } else if (currentPage > 1) {
      fetchQuestions(currentPage - 1);
    }
  };

  const handleNextQuestion = () => {
    const currentIndex = questions.findIndex(q => q._id === questions[questions.length - 1]._id);
    if (currentIndex < questions.length - 1) {
      const newQuestions = questions.slice(currentIndex + 1, currentIndex + 21);
      setQuestions(newQuestions);
    } else if (currentPage < totalPages) {
      fetchQuestions(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Chapter-wise Questions
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Select
            label="Select Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
              { value: '', label: 'Choose Subject' },
              ...subjects.map(s => ({ value: s, label: s }))
            ]}
          />
          
          <Select
            label="Select Chapter"
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            options={[
              { value: '', label: 'Choose Chapter' },
              ...chapters.map(c => ({ value: c, label: c }))
            ]}
            disabled={!selectedSubject}
          />
        </div>

        {/* Questions List */}
        {loading ? (
          <Loading text="Loading questions..." />
        ) : questions.length > 0 ? (
          <div className="space-y-8">
            {/* Table View */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sr. No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Question ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Question
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {questions.map((question, index) => (
                      <tr key={question._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {(currentPage - 1) * 20 + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {question.questionId}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="line-clamp-2">{question.question.replace(/\$/g, '')}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2">
              <Button
                onClick={() => fetchQuestions(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => fetchQuestions(pageNum)}
                    variant={currentPage === pageNum ? 'primary' : 'secondary'}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                onClick={() => fetchQuestions(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Individual Question View */}
            {questions.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Practice Questions
                </h2>
                <QuestionDisplay
                  question={questions[0]}
                  onAnswerSelect={setSelectedOption}
                  selectedOption={selectedOption}
                />
                
                <div className="flex justify-between mt-4">
                  <Button onClick={handlePreviousQuestion} variant="secondary">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button onClick={handleNextQuestion} variant="secondary">
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : selectedSubject && selectedChapter ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No questions found for this chapter.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Please select a subject and chapter to view questions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}