import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, hasPerm } from './AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import { AccessDenied } from './components/ui';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import EnquiryPage from './pages/shared/EnquiryPage';
import StaffPage from './pages/shared/StaffPage';
import Students from './pages/institute/Students';
import Courses from './pages/institute/Courses';
import InstPayments from './pages/institute/Payments';
import Certificates from './pages/institute/Certificates';
import Alumni from './pages/institute/Alumni';
import Clients from './pages/it/Clients';
import Projects from './pages/it/Projects';
import ITPayments from './pages/it/Payments';
import Expenses from './pages/finance/Expenses';
import OtherIncome from './pages/finance/OtherIncome';
import Accounts from './pages/finance/Accounts';
import Reports from './pages/finance/Reports';

function Guard({ perm, children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (perm && !hasPerm(user, perm)) return <AccessDenied />;
  return children;
}

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="institute/enquiries" element={<Guard perm="inst.enquiries"><EnquiryPage title="Enquiries" endpoint="inst/enquiries" withCourse /></Guard>} />
            <Route path="institute/students" element={<Guard perm="inst.students"><Students /></Guard>} />
            <Route path="institute/courses" element={<Guard perm="inst.courses"><Courses /></Guard>} />
            <Route path="institute/payment" element={<Guard perm="inst.payment"><InstPayments /></Guard>} />
            <Route path="institute/certificates" element={<Guard perm="inst.certificate"><Certificates /></Guard>} />
            <Route path="institute/trainers" element={<Guard perm="inst.trainers"><StaffPage title="Trainers" endpoint="inst/trainers" addLabel="Add Trainer" idPrefix="TR" /></Guard>} />
            <Route path="institute/alumni" element={<Guard perm="inst.alumni"><Alumni /></Guard>} />
            <Route path="it/enquiries" element={<Guard perm="it.enquiries"><EnquiryPage title="Enquiries" endpoint="it/enquiries" withCompany withProject /></Guard>} />
            <Route path="it/clients" element={<Guard perm="it.clients"><Clients /></Guard>} />
            <Route path="it/staffs" element={<Guard perm="it.staffs"><StaffPage title="Staffs" endpoint="it/staffs" addLabel="Add Staff" idPrefix="IT" /></Guard>} />
            <Route path="it/projects" element={<Guard perm="it.projects"><Projects /></Guard>} />
            <Route path="it/payment" element={<Guard perm="it.payment"><ITPayments /></Guard>} />
            <Route path="finance/expenses" element={<Guard perm="fin.expenses"><Expenses /></Guard>} />
            <Route path="finance/other-income" element={<Guard perm="fin.otherincome"><OtherIncome /></Guard>} />
            <Route path="finance/accounts" element={<Guard perm="fin.accounts"><Accounts /></Guard>} />
            <Route path="finance/reports" element={<Guard perm="fin.report"><Reports /></Guard>} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}