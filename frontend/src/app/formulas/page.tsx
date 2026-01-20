// src/app/formulas/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { FileText, ExternalLink } from 'lucide-react';
import { formulaAPI } from '@/lib/api';
import { Formula } from '@/lib/types';
import toast, { Toaster } from 'react-hot-toast';

export default function FormulasPage() {
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [formula, setFormula] = useState<Formula | null>(null);
  const [loading, setLoading] = useState(false);

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
      fetchFormula();
    }
  }, [selectedSubject, selectedChapter]);

  const fetchSubjects = async () => {
    try {
      const response = await formulaAPI.getSubjects();
      setSubjects(response.data.subjects);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchChapters = async (subject: string) => {
    try {
      const response = await formulaAPI.getChapters(subject);
      setChapters(response.data.chapters);
      setSelectedChapter('');
      setFormula(null);
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const fetchFormula = async () => {
    setLoading(true);
    try {
      const response = await formulaAPI.getFormula(selectedSubject, selectedChapter);
      setFormula(response.data.formula);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No formula found for this chapter');
      } else {
        toast.error('Failed to load formula');
      }
      setFormula(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Formula PDFs
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

        {/* Formula Display */}
        {loading ? (
          <Loading text="Loading formula..." />
        ) : formula ? (
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {formula.subject} - {formula.chapter}
                </h2>
                {formula.shortNote && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {formula.shortNote}
                  </p>
                )}
              </div>
              <FileText className="w-12 h-12 text-primary-600" />
            </div>

            <div className="mt-6">
              <Button
                onClick={() => window.open(formula.pdfUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PDF
              </Button>
            </div>

            {/* PDF Preview */}
            <div className="mt-6">
              <iframe
                src={formula.pdfUrl}
                className="w-full h-[600px] border rounded-lg"
                title="Formula PDF"
              />
            </div>
          </Card>
        ) : selectedSubject && selectedChapter ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No formula PDF found for this chapter.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Please select a subject and chapter to view formulas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}