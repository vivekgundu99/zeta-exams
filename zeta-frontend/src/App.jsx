import TestAPIPage from './pages/TestAPIPage';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UserDetailsPage from './pages/UserDetailsPage';
import ExamSelectionPage from './pages/ExamSelectionPage';
import SubscriptionPage from './pages/SubscriptionPage';
import DashboardPage from './pages/DashboardPage';
import ChapterwiseQuestionsPage from './pages/ChapterwiseQuestionsPage';
import ChapterwiseTestPage from './pages/ChapterwiseTestPage';
import FormulasPage from './pages/FormulasPage';
import MockTestsPage from './pages/MockTestsPage';
import MockTestInterfacePage from './pages/MockTestInterfacePage';
import MockTestResultPage from './pages/MockTestResultPage';
import AccountPage from './pages/AccountPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminFormulas from './pages/admin/AdminFormulas';
import AdminMockTests from './pages/admin/AdminMockTests';
import AdminUsers from './pages/admin/AdminUsers';
import AdminGiftCodes from './pages/admin/AdminGiftCodes';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Loader from './components/common/Loader';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/test-api" element={<TestAPIPage />} />

            {/* Protected Routes */}
            <Route
              path="/user-details"
              element={
                <ProtectedRoute>
                  <UserDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/select-exam"
              element={
                <ProtectedRoute>
                  <ExamSelectionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions"
              element={
                <ProtectedRoute>
                  <ChapterwiseQuestionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chapter-tests"
              element={
                <ProtectedRoute requireSubscription="silver">
                  <ChapterwiseTestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/formulas"
              element={
                <ProtectedRoute requireSubscription="gold">
                  <FormulasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-tests"
              element={
                <ProtectedRoute requireSubscription="gold">
                  <MockTestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-test/:testId"
              element={
                <ProtectedRoute requireSubscription="gold">
                  <MockTestInterfacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-test/:testId/result/:attemptId"
              element={
                <ProtectedRoute requireSubscription="gold">
                  <MockTestResultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/questions"
              element={
                <AdminRoute>
                  <AdminQuestions />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/formulas"
              element={
                <AdminRoute>
                  <AdminFormulas />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/mock-tests"
              element={
                <AdminRoute>
                  <AdminMockTests />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/gift-codes"
              element={
                <AdminRoute>
                  <AdminGiftCodes />
                </AdminRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;