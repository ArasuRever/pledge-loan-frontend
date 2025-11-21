// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function Navbar({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Hover Dropdowns
  const [showLoansMenu, setShowLoansMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
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
        <Link className="navbar-brand" to="/">Sri KuberaLakshmi Bankers</Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            
            {/* 1. Customers (Single Link) */}
            <li className="nav-item">
              <Link className="nav-link" to="/customers">Customers</Link>
            </li>

            {/* 2. Loans Dropdown (Hoverable) */}
            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowLoansMenu(true)}
              onMouseLeave={() => setShowLoansMenu(false)}
            >
              <Link 
                className="nav-link dropdown-toggle" 
                to="#" 
                role="button" 
                aria-expanded={showLoansMenu}
              >
                Loans
              </Link>
              <ul className={`dropdown-menu ${showLoansMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                <li>
                    <Link className="dropdown-item fw-bold text-success" to="/new-loan">
                        <i className="bi bi-plus-circle me-2"></i>New Loan
                    </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                    <Link className="dropdown-item" to="/loans">
                        <i className="bi bi-list-ul me-2"></i>All Loans
                    </Link>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <Link className="dropdown-item text-danger" to="/overdue">
                        <i className="bi bi-exclamation-circle me-2"></i>Overdue
                    </Link>
                  </li>
                )}
              </ul>
            </li>

            {/* 3. Reports Dropdown (Hoverable) - Admin Only */}
            {user?.role === 'admin' && (
              <li 
                className="nav-item dropdown"
                onMouseEnter={() => setShowReportsMenu(true)}
                onMouseLeave={() => setShowReportsMenu(false)}
              >
                <Link 
                  className="nav-link dropdown-toggle" 
                  to="#" 
                  role="button" 
                  aria-expanded={showReportsMenu}
                >
                  Reports
                </Link>
                <ul className={`dropdown-menu ${showReportsMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                  <li>
                    <Link className="dropdown-item" to="/day-book">
                        <i className="bi bi-journal-text me-2"></i>Day Book
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/reports">
                        <i className="bi bi-bar-chart-line me-2"></i>Financial Reports
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* 4. Other Admin Links */}
            {user?.role === 'admin' && (
              <>
                <li className="nav-item">
                    <Link className="nav-link" to="/recycle-bin">Recycle Bin</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" to="/manage-staff">Manage Staff</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" to="/settings">Settings</Link>
                </li>
              </>
            )}
          </ul>

          {/* User Info & Search */}
          {user && (
            <span className="navbar-text me-3 text-white-50 small">
              <i className="bi bi-person-circle me-1"></i> {user.username} ({user.role})
            </span>
          )}

          <form className="d-flex" onSubmit={handleSearch}>
            <input 
              className="form-control me-2 form-control-sm" 
              type="search" 
              placeholder="Search Book Loan #" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-success btn-sm" type="submit">Search</button>
          </form>
          <button className="btn btn-outline-secondary btn-sm ms-2 text-white" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;