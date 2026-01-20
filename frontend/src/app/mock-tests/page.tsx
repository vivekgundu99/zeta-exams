// src/app/mock-tests/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Clock, BookOpen } from 'lucide-react';
import { mockTestAPI } from '@/lib/api';
import { MockTest } from '@/lib/types';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await mockTestAPI.getAllTests();
      setTests(response.data.tests);
    } catch (error) {
      toast.error('Failed to load mock tests');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string) => {
    router.push(`/mock-tests/${testId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Mock Tests
        </h1>

        {loading ? (
          <Loading text="Loading mock tests..." />
        ) : tests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <Card key={test._id}>
                <div className="flex flex-col h-full">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {test.testName}
                  </h3>
                  
                  <div className="space-y-2 mb-6 flex-grow">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <BookOpen className="w-5 h-5 mr-2" />
                      <span>{test.totalQuestions} Questions</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{test.duration} Minutes</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Marking: +{test.marking.positive} / {test.marking.negative}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleStartTest(test._id)}
                    className="w-full"
                  >
                    Start Test
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No mock tests available at the moment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}