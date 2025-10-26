import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// --- Pages ---
import HomePage from './pages/HomePage';
import CustomersPage from './pages/CustomersPage';
import CustomerPage from './pages/CustomerPage';
import LoanPage from './pages/LoanPage';
import AllLoansPage from './pages/AllLoansPage';
import { OverdueLoansPage } from './pages/OverdueLoansPage';
import LoginPage from './pages/LoginPage';
import NewLoanWorkflowPage from './pages/NewLoanWorkflowPage';
import EditLoanPage from './pages/EditLoanPage';

// --- Components ---
import Navbar from './components/Navbar';

// Helper function to set the authorization token for Axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Axios Auth header SET"); // Debug log
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log("Axios Auth header CLEARED"); // Debug log
  }
};

function App() {
  // State for the authentication token
  const [token, setToken] = useState(localStorage.getItem('token'));
  // State to track if the initial token check is complete
  const [isInitializing, setIsInitializing] = useState(true); // Start as true

  // Effect runs once on component mount to check for stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log("App mounted, checking token:", storedToken); // Debug log
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken); // Set token for future API requests
    } else {
       setAuthToken(null); // Explicitly clear if no token found
    }
    // Mark initialization as complete
    setIsInitializing(false);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler for successful login
  const handleLoginSuccess = (newToken) => {
    console.log("Login successful, setting token"); // Debug log
    localStorage.setItem('token', newToken); // Store token in local storage
    setToken(newToken); // Update state
    setAuthToken(newToken); // Set Axios header
  };

  // Handler for logout
  const handleLogout = () => {
    console.log("Logout triggered"); // Debug log
    localStorage.removeItem('token'); // Remove token from storage
    setToken(null); // Update state
    setAuthToken(null); // Clear Axios header
  };

  // Show a loading indicator while the initial token check is happening
  if (isInitializing) {
    return <div className="container mt-5 text-center"><h5>Loading application...</h5></div>;
  }

  // Component to protect routes that require authentication
  const ProtectedRoute = ({ children }) => {
    // If initialization is done and there's no token, redirect to login
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    // Otherwise, render the requested component
    return children;
  };

  return (
    <Router>
      {/* Conditionally render Navbar only if logged in (token exists) */}
      {token && <Navbar onLogout={handleLogout} />}

      <div className="container mt-4">
        {/* Render Routes only after initialization is complete */}
        <Routes>
          {/* --- Public Login Route --- */}
          {/* If there's no token, show Login page. If token exists, redirect to Home. */}
          <Route
            path="/login"
            element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />}
          />

          {/* --- Protected Main Routes --- */}
          {/* Wrap each protected route's element with the ProtectedRoute component */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><AllLoansPage /></ProtectedRoute>} />
          <Route path="/overdue" element={<ProtectedRoute><OverdueLoansPage /></ProtectedRoute>} />
          <Route path="/new-loan" element={<ProtectedRoute><NewLoanWorkflowPage /></ProtectedRoute>} />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
          <Route path="/loans/:id" element={<ProtectedRoute><LoanPage /></ProtectedRoute>} />
          <Route path="/loans/:id/edit" element={<ProtectedRoute><EditLoanPage /></ProtectedRoute>} />

          {/* --- Catch-all Route --- */}
          {/* Redirects any unmatched path. If logged in, go to Home, otherwise go to Login. */}
           <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;