// src/lib/api.ts
import axios from 'axios';
import type { Question, Formula, MockTestAnswer } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify: () => api.get('/auth/verify'),
  setup: (email: string, password: string) =>
    api.post('/auth/setup', { email, password }),
};

// Question APIs
export const questionAPI = {
  getQuestions: (params: { subject?: string; chapter?: string; page?: number; limit?: number }) =>
    api.get('/questions', { params }),
  getSubjects: () => api.get('/questions/subjects'),
  getChapters: (subject: string) => api.get('/questions/chapters', { params: { subject } }),
  searchQuestion: (questionId?: string, serialNumber?: string) =>
    api.get('/questions/search', { params: { questionId, serialNumber } }),
  bulkAdd: (csvData: string) => api.post('/questions/bulk', { csvData }),
  updateQuestion: (id: string, data: Partial<Question>) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/questions/${id}`),
};

// Formula APIs
export const formulaAPI = {
  getFormula: (subject: string, chapter: string) =>
    api.get('/formulas', { params: { subject, chapter } }),
  getAllFormulas: () => api.get('/formulas/all'),
  getSubjects: () => api.get('/formulas/subjects'),
  getChapters: (subject: string) => api.get('/formulas/chapters', { params: { subject } }),
  addFormula: (data: { subject: string; chapter: string; pdfUrl: string; shortNote?: string }) =>
    api.post('/formulas', data),
  updateFormula: (id: string, data: Partial<Formula>) => api.put(`/formulas/${id}`, data),
  deleteFormula: (id: string) => api.delete(`/formulas/${id}`),
};

// Mock Test APIs
export const mockTestAPI = {
  getAllTests: () => api.get('/mocktests'),
  getTest: (id: string) => api.get(`/mocktests/${id}`),
  submitTest: (id: string, answers: MockTestAnswer[], timeTaken: number) =>
    api.post(`/mocktests/${id}/submit`, { answers, timeTaken }),
  addTest: (testName: string, csvData: string, duration?: number, totalQuestions?: number) =>
    api.post('/mocktests', { testName, csvData, duration, totalQuestions }),
  getAllTestsAdmin: () => api.get('/mocktests/admin/all'),
  deleteTest: (id: string) => api.delete(`/mocktests/${id}`),
};

export default api;