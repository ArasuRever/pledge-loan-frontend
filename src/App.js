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
import OverdueLoansPage from './pages/OverdueLoansPage'; 
import LoginPage from './pages/LoginPage';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';
import EditLoanPage from './pages/EditLoanPage';
import ManageStaffPage from './pages/ManageStaffPage';
import RecycleBinPage from './pages/RecycleBinPage'; 
import DayBookPage from './pages/DayBookPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ManageBranchesPage from './pages/ManageBranchesPage';
import CreateBranchPage from './pages/CreateBranchPage';
import BranchDetailsPage from './pages/BranchDetailsPage';

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
  
  // GLOBAL STATE: Selected Branch (Default 'all' for Admin, specific UUID for others)
  const [selectedBranchId, setSelectedBranchId] = useState('all');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ 
          username: decoded.username, 
          role: decoded.role,
          branchId: decoded.branchId,
          branchName: decoded.branchName
        });

        // Initialize Branch Context
        if (decoded.role === 'admin') {
          // Admin can switch, but defaults to 'all' or previous selection if persisted
          setSelectedBranchId('all'); 
        } else {
          // Manager/Staff LOCKED to their branch
          setSelectedBranchId(decoded.branchId);
        }

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
      const decoded = jwtDecode(newToken);
      setUser({ 
        username: decoded.username, 
        role: decoded.role,
        branchId: decoded.branchId,
        branchName: decoded.branchName
      });

      // Set Branch Context on Login
      if (decoded.role === 'admin') {
        setSelectedBranchId('all');
      } else {
        setSelectedBranchId(decoded.branchId);
      }

    } catch (error) {
      console.error("Error decoding token", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null);
    setUser(null); 
    setSelectedBranchId('all');
  };

  if (isInitializing) return <div className="container mt-5 text-center"><h5>Loading...</h5></div>;

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <Router>
      {token && (
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          selectedBranchId={selectedBranchId}
          setSelectedBranchId={setSelectedBranchId}
        />
      )}
      
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} />

          {/* PASS branchId TO RELEVANT PAGES */}
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />
          
          <Route path="/customers" element={
            <ProtectedRoute>
              <CustomersPage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />
          
          <Route path="/loans" element={
            <ProtectedRoute>
              <AllLoansPage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />
          
          <Route path="/overdue" element={
            <ProtectedRoute>
              <OverdueLoansPage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />
          
          <Route path="/day-book" element={
            <ProtectedRoute>
              <DayBookPage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <ReportsPage userRole={user?.role} branchId={selectedBranchId} />
            </ProtectedRoute>
          } />

          {/* Standard Pages (No Branch Filter usually needed for single item views or strictly admin pages) */}
          <Route path="/new-loan" element={<ProtectedRoute><NewLoanWorkflowPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/manage-staff" element={<ProtectedRoute><ManageStaffPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans/:id" element={<ProtectedRoute><LoanPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans/:id/edit" element={<ProtectedRoute><EditLoanPage /></ProtectedRoute>} />
          <Route path="/recycle-bin" element={<ProtectedRoute><RecycleBinPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/manage-branches" element={<ProtectedRoute><ManageBranchesPage /></ProtectedRoute>} />
          <Route path="/branches/new" element={<ProtectedRoute><CreateBranchPage /></ProtectedRoute>} />
          <Route path="/branches/:id" element={<ProtectedRoute><BranchDetailsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage userRole={user?.role} /></ProtectedRoute>} />

           <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;