// src/app/page.tsx
'use client';
import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DashboardCard } from '@/components/DashboardCard';
import { BookOpen, FileText, Target } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const { setTheme } = useThemeStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme === 'dark');
    
    // Check auth status
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Zeta Exams
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Your Complete NEET Exam Preparation Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Chapter-wise Questions"
            description="Practice questions organized by subjects and chapters with detailed explanations"
            icon={BookOpen}
            href="/questions"
            color="bg-blue-600"
          />
          
          <DashboardCard
            title="Formula PDFs"
            description="Access important formulas and notes for quick revision"
            icon={FileText}
            href="/formulas"
            color="bg-green-600"
          />
          
          <DashboardCard
            title="Mock Tests"
            description="Take full-length mock tests to evaluate your preparation"
            icon={Target}
            href="/mock-tests"
            color="bg-purple-600"
          />
        </div>
      </main>
    </div>
  );
}