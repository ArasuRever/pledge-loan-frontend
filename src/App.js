// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// --- Pages ---
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerPage from './pages/CustomerPage';
import LoanPage from './pages/LoanPage';
import AllLoansPage from './pages/AllLoansPage';
// --- FIX: Removed curly braces here ---
import OverdueLoansPage from './pages/OverdueLoansPage'; 
import LoginPage from './pages/LoginPage';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';
import EditLoanPage from './pages/EditLoanPage';
import ManageStaffPage from './pages/ManageStaffPage';
import RecycleBinPage from './pages/RecycleBinPage'; 
import DayBookPage from './pages/DayBookPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import Navbar from './components/Navbar';

const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); 
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      try {
        const decodedUser = jwtDecode(storedToken);
        setUser({ username: decodedUser.username, role: decodedUser.role });
      } catch (error) {
        handleLogout();
      }
    } else {
       setAuthToken(null);
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthToken(newToken);
    try {
      const decodedUser = jwtDecode(newToken);
      setUser({ username: decodedUser.username, role: decodedUser.role });
    } catch (error) {
      console.error("Error decoding token", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null);
    setUser(null); 
  };

  if (isInitializing) return <div className="container mt-5 text-center"><h5>Loading...</h5></div>;

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      {token && <Navbar user={user} onLogout={handleLogout} />}
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} />

          <Route path="/" element={<ProtectedRoute><HomePage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><AllLoansPage /></ProtectedRoute>} />
          <Route path="/overdue" element={<ProtectedRoute><OverdueLoansPage /></ProtectedRoute>} />
          <Route path="/new-loan" element={<ProtectedRoute><NewLoanWorkflowPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/manage-staff" element={<ProtectedRoute><ManageStaffPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans/:id" element={<ProtectedRoute><LoanPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans/:id/edit" element={<ProtectedRoute><EditLoanPage /></ProtectedRoute>} />
          <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBinPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/day-book" element={<ProtectedRoute><DayBookPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage userRole={user?.role} /></ProtectedRoute>} />

           <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;