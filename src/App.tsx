import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './hooks/useAuth';
import {
  ChangePasswordPage,
  RegisterProfilePage,
  RegisterUserPage,
} from './pages/AdminPages';
import AccountingPage from './pages/AccountingPage';
import CarrierMasterPage from './pages/CarrierMasterPage';
import ChecklistPage from './pages/ChecklistPage';
import DeliveryPortMasterPage from './pages/DeliveryPortMasterPage';
import HblEditPage from './pages/HblEditPage';
import LoadingPortMasterPage from './pages/LoadingPortMasterPage';
import LocationPage from './pages/LocationPage';
import Login from './pages/Login';
import MloMasterPage from './pages/MloMasterPage';
import PendingStatementPage from './pages/PendingStatementPage';
import { NotFoundPage } from './pages/Placeholders';
import SeaConsolePage from './pages/SeaConsolePage';
import SeaHblListPage from './pages/SeaHblListPage';
import SeaMblRegisterPage from './pages/SeaMblRegisterPage';
import SubmissionReportPage from './pages/SubmissionReportPage';
import api from './utils/api';
import { initAutoOpenDatePicker } from './utils/autoOpenDatePicker';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

const AppRoutes: React.FC = () => {
  const { isAuthenticated, needsLocationSelect } = useAuth();
  const currentPath = useLocation().pathname;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (needsLocationSelect && currentPath !== '/location') {
    return (
      <AppLayout>
        <Routes>
          <Route path="*" element={<Navigate to="/location" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/mbl-register" replace />} />
        <Route path="/login" element={<Navigate to="/mbl-register" replace />} />
        <Route path="/mbl-register" element={<ProtectedRoute><SeaMblRegisterPage /></ProtectedRoute>} />
        <Route path="/mbl-register/hbl-list/:id" element={<ProtectedRoute><SeaHblListPage /></ProtectedRoute>} />
        <Route path="/mbl" element={<ProtectedRoute><SeaConsolePage /></ProtectedRoute>} />
        <Route path="/hbl/:id" element={<ProtectedRoute><HblEditPage /></ProtectedRoute>} />
        <Route path="/checklist/:id" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
        <Route path="/pending-statement" element={<ProtectedRoute><PendingStatementPage /></ProtectedRoute>} />
        <Route path="/submission-report" element={<ProtectedRoute><SubmissionReportPage /></ProtectedRoute>} />
        <Route path="/masters/carriers" element={<ProtectedRoute><CarrierMasterPage /></ProtectedRoute>} />
        <Route path="/masters/mlos" element={<ProtectedRoute><MloMasterPage /></ProtectedRoute>} />
        <Route path="/masters/loading-ports" element={<ProtectedRoute><LoadingPortMasterPage /></ProtectedRoute>} />
        <Route path="/masters/delivery-ports" element={<ProtectedRoute><DeliveryPortMasterPage /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />
        <Route path="/admin/register-user" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterUserPage /></ProtectedRoute>} />
        <Route path="/admin/register-profile" element={<ProtectedRoute roles={['master_admin', 'admin']}><RegisterProfilePage /></ProtectedRoute>} />
        <Route path="/admin/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['master_admin', 'admin']}><NotFoundPage /></ProtectedRoute>} />
        <Route path="/accounting/*" element={<ProtectedRoute roles={['master_admin', 'admin']}><AccountingPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
};

const useKeepAlive = () => {
  useEffect(() => {
    const ping = () => api.get('/health').catch(() => {});
    ping();
    const id = setInterval(ping, 14 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
};

const App: React.FC = () => {
  useKeepAlive();
  useEffect(() => initAutoOpenDatePicker(), []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              border: '1px solid #d4dbff',
              boxShadow: '0 18px 45px rgba(24, 64, 242, 0.12)',
              fontSize: 13,
              fontFamily: 'Barlow, sans-serif',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
