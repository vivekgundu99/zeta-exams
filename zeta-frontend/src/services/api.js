import axios from 'axios';

// IMPORTANT: Remove '/api' from VITE_API_URL in .env
// It should be: VITE_API_URL=https://zeta-exams-backend.vercel.app
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('API URL:', API_URL); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.baseURL + config.url); // Debug log
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status); // Debug log
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response || error.message); // Debug log
    
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'Something went wrong';
      
      // Handle 401 - Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Error in request setup
      return Promise.reject(new Error('Request failed. Please try again.'));
    }
  }
);

// Helper function to get device ID
const getDeviceId = () => {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
};

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  verifyOTP: (data) => api.post('/api/auth/verify-otp', data),
  login: (data) => api.post('/api/auth/login', { ...data, deviceId: getDeviceId() }),
  logout: () => api.post('/api/auth/logout'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateDetails: (data) => api.put('/api/user/details', data),
  selectExam: (examType) => api.post('/api/user/select-exam', { examType }),
  updatePassword: (data) => api.put('/api/user/password', data),
  getStats: () => api.get('/api/user/stats'),
  getSubscriptionInfo: () => api.get('/api/user/subscription-info'),
  updateExamType: (examType) => api.put('/api/user/exam-type', { examType }),
};

// Question APIs
export const questionAPI = {
  getSubjects: (examType) => api.get(`/api/questions/subjects/${examType}`),
  getChapters: (examType, subject) => api.get(`/api/questions/chapters/${examType}/${subject}`),
  getTopics: (examType, subject, chapter) => api.get(`/api/questions/topics/${examType}/${subject}/${chapter}`),
  getQuestions: (examType, subject, chapter, topic) => api.get(`/api/questions/topic/${examType}/${subject}/${chapter}/${topic}`),
  submitAnswer: (data) => api.post('/api/questions/submit-answer', data),
  generateChapterTest: (data) => api.post('/api/questions/chapter-test/generate', data),
  submitChapterTest: (data) => api.post('/api/questions/chapter-test/submit', data),
};

// Mock Test APIs
export const mockTestAPI = {
  getAllTests: (examType) => api.get(`/api/mock-tests/all/${examType}`),
  getTestById: (testId) => api.get(`/api/mock-tests/${testId}`),
  startTest: (testId) => api.post(`/api/mock-tests/${testId}/start`),
  submitTest: (testId, data) => api.post(`/api/mock-tests/${testId}/submit`, data),
  getResult: (testId, attemptId) => api.get(`/api/mock-tests/${testId}/result/${attemptId}`),
  getAttempts: (testId) => api.get(`/api/mock-tests/${testId}/attempts`),
  getOngoingTest: () => api.get('/api/mock-tests/ongoing'),
};

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () => api.get('/api/subscription/plans'),
  createOrder: (data) => api.post('/api/subscription/create-order', data),
  verifyPayment: (data) => api.post('/api/subscription/verify-payment', data),
  validateGiftCode: (code) => api.post('/api/subscription/validate-giftcode', { code }),
  applyGiftCode: (code) => api.post('/api/subscription/apply-giftcode', { code }),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/api/analytics/overview'),
  getSubjectWise: (examType) => api.get(`/api/analytics/subject-wise/${examType}`),
  getChapterWise: (examType, subject) => api.get(`/api/analytics/chapter-wise/${examType}/${subject}`),
  getTestHistory: (params) => api.get('/api/analytics/test-history', { params }),
  getPerformanceTrend: (params) => api.get('/api/analytics/performance-trend', { params }),
  getStrengthWeakness: () => api.get('/api/analytics/strength-weakness'),
  getAccuracyReport: () => api.get('/api/analytics/accuracy-report'),
  getTimeAnalysis: () => api.get('/api/analytics/time-analysis'),
};

// Admin API - Updated for CSV text input
export const adminAPI = {
  // Questions - Changed from FormData to JSON
  bulkUploadQuestions: (data) => api.post('/api/admin/questions/bulk-upload', data, {
    headers: { 'Content-Type': 'application/json' } // Changed from multipart/form-data
  }),
  addQuestion: (data) => api.post('/api/admin/questions/add', data),
  updateQuestion: (questionId, data) => api.put(`/api/admin/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/api/admin/questions/${questionId}`),
  searchQuestion: (params) => api.get('/api/admin/questions/search', { params }),
  
  // Formulas
  addFormula: (data) => api.post('/api/admin/formulas/add', data),
  updateFormula: (formulaId, data) => api.put(`/api/admin/formulas/${formulaId}`, data),
  deleteFormula: (formulaId) => api.delete(`/api/admin/formulas/${formulaId}`),
  getAllFormulas: (examType) => api.get(`/api/admin/formulas/${examType}`),
  
  // Mock Tests
  createMockTest: (data) => api.post('/api/admin/mock-tests/create', data),
  updateMockTest: (testId, data) => api.put(`/api/admin/mock-tests/${testId}`, data),
  deleteMockTest: (testId) => api.delete(`/api/admin/mock-tests/${testId}`),
  
  // Users - FIXED: Proper user details endpoint
  getAllUsers: (params) => api.get('/api/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/api/admin/users/${userId}`),
  updateUserSubscription: (userId, data) => api.put(`/api/admin/users/${userId}/subscription`, data),
  deactivateUser: (userId) => api.put(`/api/admin/users/${userId}/deactivate`),
  
  // Gift Codes
  generateGiftCodes: (data) => api.post('/api/admin/giftcodes/generate', data),
  getAllGiftCodes: (params) => api.get('/api/admin/giftcodes', { params }),
  deleteGiftCode: (codeId) => api.delete(`/api/admin/giftcodes/${codeId}`),
  
  // Stats
  getAdminStats: () => api.get('/api/admin/stats'),
};

// Formula APIs (public)
export const formulaAPI = {
  getFormulas: (examType, subject, chapter) => {
    return api.get(`/api/formulas/${examType}/${subject}/${chapter}`);
  }
};

export default api;