import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // <-- 1. IMPORT ADDED

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // --- ⭐ 2. CHANGED: We now store the whole user object ---
  const [user, setUser] = useState(null); 
  
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log("App mounted, checking token:", storedToken);
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      try {
        // --- ⭐ 3. CHANGED: Decode token and store user ---
        const decodedUser = jwtDecode(storedToken); // { userId, username, role }
        setUser({ username: decodedUser.username, role: decodedUser.role });
      } catch (error) {
        console.error("Invalid token:", error);
        handleLogout(); // Clear bad token
      }
    } else {
       setAuthToken(null);
    }
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (newToken) => {
    console.log("Login successful, setting token");
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setAuthToken(newToken);
    try {
      // --- ⭐ 4. CHANGED: Decode token and store user on login ---
      const decodedUser = jwtDecode(newToken);
      
      // This is the log we added for debugging
      console.log("FRONTEND: Decoded token object:", decodedUser); 

      setUser({ username: decodedUser.username, role: decodedUser.role });
    } catch (error) {
      console.error("Error decoding new token:", error);
    }
  };

  const handleLogout = () => {
    console.log("Logout triggered");
    localStorage.removeItem('token');
    setToken(null);
    setAuthToken(null);
    // --- ⭐ 5. CHANGED: Clear the user object ---
    setUser(null); 
  };

  if (isInitializing) {
    return <div className="container mt-5 text-center"><h5>Loading application...</h5></div>;
  }

  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      {/* --- ⭐ 6. CHANGED: Pass the full user object to Navbar --- */}
      {token && <Navbar user={user} onLogout={handleLogout} />}

      <div className="container mt-4">
        <Routes>
          <Route
            path="/login"
            element={!token ? <LoginPage onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" replace />}
          />

          {/* --- ⭐ 7. CHANGED: Pass user.role to the pages that need it --- */}
          <Route path="/" element={<ProtectedRoute><HomePage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomersPage userRole={user?.role} /></ProtectedRoute>} />
          <Route path="/loans" element={<ProtectedRoute><AllLoansPage /></ProtectedRoute>} />
          <Route path="/overdue" element={<ProtectedRoute><OverdueLoansPage /></ProtectedRoute>} />
          <Route path="/new-loan" element={<ProtectedRoute><NewLoanWorkflowPage userRole={user?.role} /></ProtectedRoute>} />
          
          <Route path="/customers/:id" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
          <Route path="/loans/:id" element={<ProtectedRoute><LoanPage /></ProtectedRoute>} />
          <Route path="/loans/:id/edit" element={<ProtectedRoute><EditLoanPage /></ProtectedRoute>} />

           <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;