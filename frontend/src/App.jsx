import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/user/DashboardPage';
import SubmissionsPage from './pages/user/SubmissionsPage';
import SubmissionDetailPage from './pages/user/SubmissionDetailPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminSubmissionDetailPage from './pages/admin/AdminSubmissionDetailPage';
import AppealsPage from './pages/admin/AppealsPage';
import PoliciesPage from './pages/admin/PoliciesPage';

const App = () => (
  <>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0a0a0a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#22C55E', secondary: '#0a0a0a' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#0a0a0a' } },
      }}
    />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AnalyticsPage />} />
        <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
        <Route path="/admin/submissions/:id" element={<AdminSubmissionDetailPage />} />
        <Route path="/admin/appeals" element={<AppealsPage />} />
        <Route path="/admin/policies" element={<PoliciesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </>
);

export default App;
