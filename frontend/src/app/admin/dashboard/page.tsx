// src/app/admin/dashboard/page.tsx
'use client';
import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardCard } from '@/components/DashboardCard';
import { BookOpen, FileText, Target } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage questions, formulas, and mock tests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Manage Questions"
            description="Add, edit, and delete chapter-wise questions in bulk"
            icon={BookOpen}
            href="/admin/questions"
            color="bg-blue-600"
          />
          
          <DashboardCard
            title="Manage Formulas"
            description="Add and manage formula PDFs for different subjects"
            icon={FileText}
            href="/admin/formulas"
            color="bg-green-600"
          />
          
          <DashboardCard
            title="Manage Mock Tests"
            description="Create and manage full-length mock tests"
            icon={Target}
            href="/admin/mock-tests"
            color="bg-purple-600"
          />
        </div>
      </main>
    </div>
  );
}