// src/app/admin/formulas/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formulaAPI } from '@/lib/api';
import { Formula } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminFormulasPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(false);
  
  // Add section
  const [addData, setAddData] = useState({
    subject: '',
    chapter: '',
    pdfUrl: '',
    shortNote: ''
  });

  // Edit section
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'edit') {
      fetchSubjects();
    }
  }, [activeTab]);

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
      setEditFormula(null);
    } catch (error) {
      toast.error('Failed to load chapters');
    }
  };

  const fetchFormula = async () => {
    setLoading(true);
    try {
      const response = await formulaAPI.getFormula(selectedSubject, selectedChapter);
      setEditFormula(response.data.formula);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No formula found for this chapter');
      } else {
        toast.error('Failed to load formula');
      }
      setEditFormula(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!addData.subject || !addData.chapter || !addData.pdfUrl) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await formulaAPI.addFormula(addData);
      toast.success('Formula added successfully!');
      setAddData({ subject: '', chapter: '', pdfUrl: '', shortNote: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add formula');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editFormula) return;

    setLoading(true);
    try {
      await formulaAPI.updateFormula(editFormula._id, editFormula);
      toast.success('Formula updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update formula');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editFormula) return;
    
    if (!confirm('Are you sure you want to delete this formula?')) return;

    setLoading(true);
    try {
      await formulaAPI.deleteFormula(editFormula._id);
      toast.success('Formula deleted successfully!');
      setEditFormula(null);
      setSelectedChapter('');
      fetchSubjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete formula');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <Toaster position="top-right" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Manage Formula PDFs
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab('add')}
            variant={activeTab === 'add' ? 'primary' : 'secondary'}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Formula
          </Button>
          <Button
            onClick={() => setActiveTab('edit')}
            variant={activeTab === 'edit' ? 'primary' : 'secondary'}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Formula
          </Button>
        </div>

        {/* Add Section */}
        {activeTab === 'add' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add New Formula PDF
            </h2>

            <div className="space-y-4">
              <Select
                label="Subject *"
                value={addData.subject}
                onChange={(e) => setAddData({...addData, subject: e.target.value})}
                options={[
                  { value: '', label: 'Select Subject' },
                  { value: 'Physics', label: 'Physics' },
                  { value: 'Chemistry', label: 'Chemistry' },
                  { value: 'Biology', label: 'Biology' }
                ]}
              />

              <Input
                label="Chapter Name *"
                placeholder="e.g., Mechanics, Organic Chemistry, Cell Biology"
                value={addData.chapter}
                onChange={(e) => setAddData({...addData, chapter: e.target.value})}
              />

              <Input
                label="PDF URL *"
                placeholder="https://example.com/formula.pdf"
                value={addData.pdfUrl}
                onChange={(e) => setAddData({...addData, pdfUrl: e.target.value})}
              />

              <Textarea
                label="Short Note (Optional)"
                placeholder="Brief description of the formula content..."
                value={addData.shortNote}
                onChange={(e) => setAddData({...addData, shortNote: e.target.value})}
                rows={3}
              />

              <Button
                onClick={handleAdd}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Adding Formula...' : 'Add Formula'}
              </Button>
            </div>
          </Card>
        )}

        {/* Edit Section */}
        {activeTab === 'edit' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Select Formula to Edit
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  options={[
                    { value: '', label: 'Select Subject' },
                    ...subjects.map(s => ({ value: s, label: s }))
                  ]}
                />

                <Select
                  label="Chapter"
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  options={[
                    { value: '', label: 'Select Chapter' },
                    ...chapters.map(c => ({ value: c, label: c }))
                  ]}
                  disabled={!selectedSubject}
                />
              </div>
            </Card>

            {editFormula && (
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Edit Formula
                </h2>

                <div className="space-y-4">
                  <Select
                    label="Subject"
                    value={editFormula.subject}
                    onChange={(e) => setEditFormula({...editFormula, subject: e.target.value})}
                    options={[
                      { value: 'Physics', label: 'Physics' },
                      { value: 'Chemistry', label: 'Chemistry' },
                      { value: 'Biology', label: 'Biology' }
                    ]}
                  />

                  <Input
                    label="Chapter Name"
                    value={editFormula.chapter}
                    onChange={(e) => setEditFormula({...editFormula, chapter: e.target.value})}
                  />

                  <Input
                    label="PDF URL"
                    value={editFormula.pdfUrl}
                    onChange={(e) => setEditFormula({...editFormula, pdfUrl: e.target.value})}
                  />

                  <Textarea
                    label="Short Note"
                    value={editFormula.shortNote || ''}
                    onChange={(e) => setEditFormula({...editFormula, shortNote: e.target.value})}
                    rows={3}
                  />

                  {/* PDF Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PDF Preview
                    </label>
                    <iframe
                      src={editFormula.pdfUrl}
                      className="w-full h-64 border rounded-lg"
                      title="Formula PDF Preview"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleUpdate}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Updating...' : 'Update Formula'}
                    </Button>
                    <Button
                      onClick={handleDelete}
                      disabled={loading}
                      variant="danger"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Formula
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