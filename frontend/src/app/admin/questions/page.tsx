// src/app/admin/questions/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Upload, Search, Edit, Trash2 } from 'lucide-react';
import { questionAPI } from '@/lib/api';
import { Question } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'edit'>('add');
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Edit section
  const [searchType, setSearchType] = useState<'questionId' | 'serialNumber'>('questionId');
  const [searchValue, setSearchValue] = useState('');
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated]);

  const handleBulkAdd = async () => {
    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    setLoading(true);
    try {
      const response = await questionAPI.bulkAdd(csvData);
      toast.success(response.data.message);
      setCsvData('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter search value');
      return;
    }

    setLoading(true);
    try {
      const params = searchType === 'questionId' 
        ? { questionId: searchValue }
        : { serialNumber: searchValue };
      
      const response = await questionAPI.searchQuestion(
        params.questionId,
        params.serialNumber
      );
      setEditQuestion(response.data.question);
      toast.success('Question found!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Question not found');
      setEditQuestion(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editQuestion) return;

    setLoading(true);
    try {
      await questionAPI.updateQuestion(editQuestion._id, editQuestion);
      toast.success('Question updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update question');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editQuestion) return;
    
    if (!confirm('Are you sure you want to delete this question?')) return;

    setLoading(true);
    try {
      await questionAPI.deleteQuestion(editQuestion._id);
      toast.success('Question deleted successfully!');
      setEditQuestion(null);
      setSearchValue('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete question');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Manage Questions
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'primary' : 'secondary'}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Questions
          </Button>
          <Button
            onClick={() => setActiveTab('edit')}
            variant={activeTab === 'edit' ? 'primary' : 'secondary'}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Questions
          </Button>
        </div>

        {/* Add Section */}
        {activeTab === 'add' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Bulk Import Questions (CSV Format)
            </h2>
            
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                Format: Subject#Chapter#Question#Option A#Option B#Option C#Option D#Correct Option#Explanation#Question Image URL#Explanation Image URL
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Example: Physics#Mechanics#What is force?#F=ma#F=m/a#F=a/m#F=m+a#A#Force equals mass times acceleration##
              </p>
            </div>

            <Textarea
              label="CSV Data"
              placeholder="Paste your CSV data here..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />

            <Button
              onClick={handleBulkAdd}
              disabled={loading}
              className="w-full mt-4"
            >
              {loading ? 'Adding Questions...' : 'Add Questions'}
            </Button>
          </Card>
        )}

        {/* Edit Section */}
        {activeTab === 'edit' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Search Question
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Search By"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  options={[
                    { value: 'questionId', label: 'Question ID' },
                    { value: 'serialNumber', label: 'Serial Number' }
                  ]}
                />

                <div className="md:col-span-2">
                  <Input
                    label="Search Value"
                    placeholder={searchType === 'questionId' ? '0000001' : 'Chapter-1'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full mt-4"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search Question'}
              </Button>
            </Card>

            {editQuestion && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Edit Question
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Question ID"
                      value={editQuestion.questionId}
                      disabled
                    />
                    <Input
                      label="Serial Number"
                      value={editQuestion.serialNumber}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Subject"
                      value={editQuestion.subject}
                      onChange={(e) => setEditQuestion({...editQuestion, subject: e.target.value})}
                      options={[
                        { value: 'Physics', label: 'Physics' },
                        { value: 'Chemistry', label: 'Chemistry' },
                        { value: 'Biology', label: 'Biology' }
                      ]}
                    />
                    <Input
                      label="Chapter"
                      value={editQuestion.chapter}
                      onChange={(e) => setEditQuestion({...editQuestion, chapter: e.target.value})}
                    />
                  </div>

                  <Textarea
                    label="Question"
                    value={editQuestion.question}
                    onChange={(e) => setEditQuestion({...editQuestion, question: e.target.value})}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Option A"
                      value={editQuestion.optionA}
                      onChange={(e) => setEditQuestion({...editQuestion, optionA: e.target.value})}
                    />
                    <Input
                      label="Option B"
                      value={editQuestion.optionB}
                      onChange={(e) => setEditQuestion({...editQuestion, optionB: e.target.value})}
                    />
                    <Input
                      label="Option C"
                      value={editQuestion.optionC}
                      onChange={(e) => setEditQuestion({...editQuestion, optionC: e.target.value})}
                    />
                    <Input
                      label="Option D"
                      value={editQuestion.optionD}
                      onChange={(e) => setEditQuestion({...editQuestion, optionD: e.target.value})}
                    />
                  </div>

                  <Select
                    label="Correct Option"
                    value={editQuestion.correctOption}
                    onChange={(e) => setEditQuestion({...editQuestion, correctOption: e.target.value as any})}
                    options={[
                      { value: 'A', label: 'A' },
                      { value: 'B', label: 'B' },
                      { value: 'C', label: 'C' },
                      { value: 'D', label: 'D' }
                    ]}
                  />

                  <Textarea
                    label="Explanation"
                    value={editQuestion.explanation}
                    onChange={(e) => setEditQuestion({...editQuestion, explanation: e.target.value})}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Question Image URL (Optional)"
                      value={editQuestion.questionImageUrl || ''}
                      onChange={(e) => setEditQuestion({...editQuestion, questionImageUrl: e.target.value})}
                    />
                    <Input
                      label="Explanation Image URL (Optional)"
                      value={editQuestion.explanationImageUrl || ''}
                      onChange={(e) => setEditQuestion({...editQuestion, explanationImageUrl: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpdate}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Updating...' : 'Update Question'}
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={loading}
                      variant="danger"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Question
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}