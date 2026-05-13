import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UsersRoles from './pages/UsersRoles';
import Departments from './pages/Departments';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/Settings';
import Reports from './pages/Reports';
import MyTasks from './pages/MyTasks';
import CreateFile from './pages/CreateFile';
import FileTracking from './pages/FileTracking';
import CitizenPortal from './pages/CitizenPortal';
import Requests from './pages/Requests';
import Layout from './components/Layout';
import { LangProvider } from './govI18n';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setIsAuthenticated(true);
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <LangProvider>
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />
        <Route path="/citizen-portal" element={<CitizenPortal />} />
        <Route path="/" element={isAuthenticated ? <Layout setAuth={setIsAuthenticated} /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create-file" element={<CreateFile />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="file-tracking" element={<FileTracking />} />
          <Route path="users" element={<UsersRoles />} />
          <Route path="departments" element={<Departments />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="requests" element={<Requests />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
    </LangProvider>
  );
}

export default App;
