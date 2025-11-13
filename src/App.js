// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Corrected import
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerPage from './pages/CustomerPage';
import AllLoansPage from './pages/AllLoansPage';
import LoanPage from './pages/LoanPage';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';
import OverdueLoansPage from './pages/OverdueLoansPage';
import ManageStaffPage from './pages/ManageStaffPage';
import EditLoanPage from './pages/EditLoanPage';

// --- ⭐ NEW IMPORTS ---
import DeletedCustomersPage from './pages/DeletedCustomersPage';
import DeletedLoansPage from './pages/DeletedLoansPage';

// --- ⭐ NEW: Function to get user role ---
const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.role;
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem('token');
      return null;
    }
  }
  return null;
};

// --- ⭐ NEW: Admin-only route guard ---
const AdminRoute = ({ children }) => {
  const userRole = getUserRole();
  return userRole === 'admin' ? children : <Navigate to="/" />;
};

// --- Private route guard (unchanged) ---
const PrivateRoute = ({ children }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />;
};

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  useEffect(() => {
    // This logic is from your .env and is correct
    const url = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001/api'
      : 'https://pledge-loan-api-as.onrender.com/api';
    setApiBaseUrl(url);

    // Set up axios interceptor to add the auth token
    const interceptor = axios.interceptors.request.use(
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

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  if (!apiBaseUrl) {
    return <div>Loading...</div>;
  }

  // Pass apiBaseUrl to all components via props
  const privateProps = (element) => React.cloneElement(element, { apiBaseUrl });
  const adminProps = (element) => <AdminRoute>{privateProps(element)}</AdminRoute>;

  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
      <Routes>
        <Route path="/login" element={<LoginPage apiBaseUrl={apiBaseUrl} />} />
        
        {/* Private Routes (Staff & Admin) */}
        <Route path="/" element={privateProps(<PrivateRoute><HomePage /></PrivateRoute>)} />
        <Route path="/customers" element={privateProps(<PrivateRoute><CustomersPage /></PrivateRoute>)} />
        <Route path="/customers/:id" element={privateProps(<PrivateRoute><CustomerPage /></PrivateRoute>)} />
        <Route path="/loans" element={privateProps(<PrivateRoute><AllLoansPage /></PrivateRoute>)} />
        <Route path="/loans/:id" element={privateProps(<PrivateRoute><LoanPage /></PrivateRoute>)} />
        <Route path="/loans/:id/edit" element={privateProps(<PrivateRoute><EditLoanPage /></PrivateRoute>)} />
        <Route path="/new-loan" element={privateProps(<PrivateRoute><NewLoanWorkflowPage /></PrivateRoute>)} />
        <Route path="/overdue-loans" element={privateProps(<PrivateRoute><OverdueLoansPage /></PrivateRoute>)} />

        {/* Admin Only Routes */}
        <Route path="/staff" element={adminProps(<ManageStaffPage />)} />
        
        {/* --- ⭐ NEW ADMIN ROUTES --- */}
        <Route path="/deleted-customers" element={adminProps(<DeletedCustomersPage />)} />
        <Route path="/deleted-loans" element={adminProps(<DeletedLoansPage />)} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </div>
    </Router>
  );
}

export default App;