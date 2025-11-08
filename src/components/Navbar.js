// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL; // 1. ADD THIS

// --- ⭐ CHANGED: Accept `user` prop ---
function Navbar({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      // 2. USE THE VARIABLE HERE
      const response = await axios.get(`${API_URL}/api/loans/find-by-book-number/${searchTerm}`);
      navigate(`/loans/${response.data.loanId}`);
      setSearchTerm('');
    } catch (error) {
      alert('Loan not found.');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">PledgeManager</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/customers">Customers</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/loans">Loans</Link>
            </li>
            
            {/* --- ⭐ CHANGED: Check for user.role --- */}
            {user?.role === 'admin' && (
              <> {/* <-- Use a fragment to group admin links --> */}
                <li className="nav-item">
                  <Link className="nav-link text-danger fw-bold" to="/overdue">Overdue</Link>
                </li>
                
                {/* 👇 1. ADD THIS NEW LINK 👇 */}
                <li className="nav-item">
                  <Link className="nav-link" to="/manage-staff">Manage Staff</Link>
                </li>
              </>
            )}

            <li className="nav-item">
              <Link className="nav-link text-success fw-bold" to="/new-loan">New Loan</Link>
            </li>
          </ul>

          {/* --- ⭐ NEW: WELCOME MESSAGE --- */}
          {user && (
            <span className="navbar-text me-3">
              Welcome, {user.username} ({user.role})
            </span>
          )}
          {/* --- END NEW MESSAGE --- */}

          <form className="d-flex" onSubmit={handleSearch}>
            <input 
              className="form-control me-2" 
              type="search" 
              placeholder="Search by Book Loan #" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-success" type="submit">Search</button>
          </form>
          <button className="btn btn-outline-light ms-2" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;