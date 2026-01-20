// src/app/admin/mock-tests/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Plus, Trash2, Clock, BookOpen } from 'lucide-react';
import { mockTestAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

interface MockTestInfo {
  id: string;
  testName: string;
  totalQuestions: number;
  duration: number;
  createdAt: string;
}

export default function AdminMockTestsPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [loading, setLoading] = useState(false);
  
  // Add section
  const [addData, setAddData] = useState({
    testName: '',
    duration: '180',
    totalQuestions: '180',
    csvData: ''
  });

  // Manage section
  const [tests, setTests] = useState<MockTestInfo[]>([]);
  
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchTests();
    }
  }, [activeTab]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await mockTestAPI.getAllTestsAdmin();
      setTests(response.data.tests);
    } catch (error) {
      toast.error('Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addData.testName || !addData.csvData) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await mockTestAPI.addTest(
        addData.testName,
        addData.csvData,
        parseInt(addData.duration),
        parseInt(addData.totalQuestions)
      );
      toast.success('Mock test created successfully!');
      setAddData({
        testName: '',
        duration: '180',
        totalQuestions: '180',
        csvData: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create mock test');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testId: string, testName: string) => {
    if (!confirm(`Are you sure you want to delete "${testName}"?`)) return;

    setLoading(true);
    try {
      await mockTestAPI.deleteTest(testId);
      toast.success('Mock test deleted successfully!');
      fetchTests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete mock test');
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
          Manage Mock Tests
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'primary' : 'secondary'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Mock Test
          </Button>
          <Button
            onClick={() => setActiveTab('manage')}
            variant={activeTab === 'manage' ? 'primary' : 'secondary'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Manage Tests
          </Button>
        </div>

        {/* Add Section */}
        {activeTab === 'add' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Create New Mock Test
            </h2>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                CSV Format:
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                Question#Option A#Option B#Option C#Option D#Correct Option#Explanation#Question Image URL#Explanation Image URL
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Example: What is Newton's first law?#Law of inertia#Law of acceleration#Law of action#Law of motion#A#First law states inertia##
              </p>
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> NEET has 180 questions (Physics: 45, Chemistry: 45, Biology: 90).
                  Add questions sequentially in this order.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Test Name *"
                placeholder="e.g., NEET Mock Test 2024 - 1"
                value={addData.testName}
                onChange={(e) => setAddData({...addData, testName: e.target.value})}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Duration (minutes) *"
                  type="number"
                  placeholder="180"
                  value={addData.duration}
                  onChange={(e) => setAddData({...addData, duration: e.target.value})}
                />

                <Input
                  label="Total Questions *"
                  type="number"
                  placeholder="180"
                  value={addData.totalQuestions}
                  onChange={(e) => setAddData({...addData, totalQuestions: e.target.value})}
                />
              </div>

              <Textarea
                label="CSV Data *"
                placeholder="Paste your CSV data here (one question per line)..."
                value={addData.csvData}
                onChange={(e) => setAddData({...addData, csvData: e.target.value})}
                rows={20}
                className="font-mono text-sm"
              />

              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Questions in CSV: <strong>{addData.csvData.split('\n').filter(line => line.trim()).length}</strong>
                </p>
              </div>

              <Button
                onClick={handleAdd}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Mock Test...' : 'Create Mock Test'}
              </Button>
            </div>
          </Card>
        )}

        {/* Manage Section */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {loading ? (
              <Card>
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading mock tests...</p>
                </div>
              </Card>
            ) : tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {test.testName}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {test.totalQuestions} Questions
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {test.duration} Minutes
                        </div>
                        <div>
                          Created: {new Date(test.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(test.id, test.testName)}
                      disabled={loading}
                      variant="danger"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No mock tests found. Create your first mock test!
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}