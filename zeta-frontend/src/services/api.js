import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  (response) => response.data,
  (error) => {
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
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', { ...data, deviceId: getDeviceId() }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateDetails: (data) => api.put('/user/details', data),
  selectExam: (examType) => api.post('/user/select-exam', { examType }),
  updatePassword: (data) => api.put('/user/password', data),
  getStats: () => api.get('/user/stats'),
  getSubscriptionInfo: () => api.get('/user/subscription-info'),
  updateExamType: (examType) => api.put('/user/exam-type', { examType }),
};

// Question APIs
export const questionAPI = {
  getSubjects: (examType) => api.get(`/questions/subjects/${examType}`),
  getChapters: (examType, subject) => api.get(`/questions/chapters/${examType}/${subject}`),
  getTopics: (examType, subject, chapter) => api.get(`/questions/topics/${examType}/${subject}/${chapter}`),
  getQuestions: (examType, subject, chapter, topic) => api.get(`/questions/topic/${examType}/${subject}/${chapter}/${topic}`),
  submitAnswer: (data) => api.post('/questions/submit-answer', data),
  generateChapterTest: (data) => api.post('/questions/chapter-test/generate', data),
  submitChapterTest: (data) => api.post('/questions/chapter-test/submit', data),
};

// Mock Test APIs
export const mockTestAPI = {
  getAllTests: (examType) => api.get(`/mock-tests/all/${examType}`),
  getTestById: (testId) => api.get(`/mock-tests/${testId}`),
  startTest: (testId) => api.post(`/mock-tests/${testId}/start`),
  submitTest: (testId, data) => api.post(`/mock-tests/${testId}/submit`, data),
  getResult: (testId, attemptId) => api.get(`/mock-tests/${testId}/result/${attemptId}`),
  getAttempts: (testId) => api.get(`/mock-tests/${testId}/attempts`),
  getOngoingTest: () => api.get('/mock-tests/ongoing'),
};

// Subscription APIs
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  createOrder: (data) => api.post('/subscription/create-order', data),
  verifyPayment: (data) => api.post('/subscription/verify-payment', data),
  validateGiftCode: (code) => api.post('/subscription/validate-giftcode', { code }),
  applyGiftCode: (code) => api.post('/subscription/apply-giftcode', { code }),
};

// Analytics APIs
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getSubjectWise: (examType) => api.get(`/analytics/subject-wise/${examType}`),
  getChapterWise: (examType, subject) => api.get(`/analytics/chapter-wise/${examType}/${subject}`),
  getTestHistory: (params) => api.get('/analytics/test-history', { params }),
  getPerformanceTrend: (params) => api.get('/analytics/performance-trend', { params }),
  getStrengthWeakness: () => api.get('/analytics/strength-weakness'),
  getAccuracyReport: () => api.get('/analytics/accuracy-report'),
  getTimeAnalysis: () => api.get('/analytics/time-analysis'),
};

// Admin APIs
export const adminAPI = {
  // Questions
  bulkUploadQuestions: (formData) => api.post('/admin/questions/bulk-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addQuestion: (data) => api.post('/admin/questions/add', data),
  updateQuestion: (questionId, data) => api.put(`/admin/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/admin/questions/${questionId}`),
  searchQuestion: (params) => api.get('/admin/questions/search', { params }),
  
  // Formulas
  addFormula: (data) => api.post('/admin/formulas/add', data),
  updateFormula: (formulaId, data) => api.put(`/admin/formulas/${formulaId}`, data),
  deleteFormula: (formulaId) => api.delete(`/admin/formulas/${formulaId}`),
  getAllFormulas: (examType) => api.get(`/admin/formulas/${examType}`),
  
  // Mock Tests
  createMockTest: (data) => api.post('/admin/mock-tests/create', data),
  updateMockTest: (testId, data) => api.put(`/admin/mock-tests/${testId}`, data),
  deleteMockTest: (testId) => api.delete(`/admin/mock-tests/${testId}`),
  
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserSubscription: (userId, data) => api.put(`/admin/users/${userId}/subscription`, data),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`),
  
  // Gift Codes
  generateGiftCodes: (data) => api.post('/admin/giftcodes/generate', data),
  getAllGiftCodes: (params) => api.get('/admin/giftcodes', { params }),
  deleteGiftCode: (codeId) => api.delete(`/admin/giftcodes/${codeId}`),
  
  // Stats
  getAdminStats: () => api.get('/admin/stats'),
};

// Formula APIs (public)
export const formulaAPI = {
  getFormulas: (examType, subject, chapter) => {
    // This would be implemented based on your backend route
    return api.get(`/formulas/${examType}/${subject}/${chapter}`);
  }
};

export default api;