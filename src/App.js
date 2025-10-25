import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios'; // 1. IMPORT AXIOS

// --- Pages ---
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerPage from './pages/CustomerPage';
import LoanPage from './pages/LoanPage';
import AllLoansPage from './pages/AllLoansPage';
import { OverdueLoansPage } from './pages/OverdueLoansPage';
import LoginPage from './pages/LoginPage';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';

// --- Components ---
import Navbar from './components/Navbar';

// 2. This helper function sets the token for all future Axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // 3. This hook runs ONCE when the app loads
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken); // Set token for all API requests
    }
  }, []); // Empty array = runs once on load

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthToken(newToken); // 4. Set token on new login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null); // 5. Clear token on logout
  };

  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      {token && <Navbar onLogout={handleLogout} />}
      
      <div className="container mt-4">
        <Routes>
          {/* --- Public Login Route --- */}
          <Route 
            path="/login" 
            element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />} 
          />

          {/* --- Protected Main Routes --- */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><AllLoansPage /></ProtectedRoute>} />
          <Route path="/overdue" element={<ProtectedRoute><OverdueLoansPage /></ProtectedRoute>} />
          <Route path="/new-loan" element={<ProtectedRoute><NewLoanWorkflowPage /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
          <Route path="/loans/:id" element={<ProtectedRoute><LoanPage /></ProtectedRoute>} />

          {/* Catch-all to redirect to home or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;