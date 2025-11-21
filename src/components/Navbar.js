// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function Navbar({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Sri KuberaLakshmi Bankers',
    logo: null,
    displayMode: 'both'
  });
  
  const [showLoansMenu, setShowLoansMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await axios.get(`${API_URL}/api/settings`, { headers });
        if (res.data) {
          setBusinessInfo({
            name: res.data.business_name || 'Sri KuberaLakshmi Bankers',
            logo: res.data.logo_url || null,
            displayMode: res.data.navbar_display_mode || 'both'
          });
        }
      } catch (err) {
        console.error("Error loading navbar settings", err);
      }
    };
    fetchSettings();
  }, []);

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

  const showLogo = (businessInfo.displayMode === 'both' || businessInfo.displayMode === 'logo_only') && businessInfo.logo;
  const showName = businessInfo.displayMode === 'both' || businessInfo.displayMode === 'name_only';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm" style={{ minHeight: '70px' }}>
      <div className="container-fluid">
        
        {/* --- UPDATED BRAND SECTION --- */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          
          {showLogo && (
            <img 
              src={businessInfo.logo} 
              alt="Logo" 
              className="me-2 rounded bg-white" 
              // FIX: Removed fixed width, increased height, added padding for breathing room
              style={{ 
                height: '50px',       // Taller height
                width: 'auto',        // Auto width (prevents shrinking/stretching)
                objectFit: 'contain', // Keeps aspect ratio
                padding: '2px'        // Small padding inside the white box
              }} 
            />
          )}

          {showName && (
             <span className="fw-bold fs-4">{businessInfo.name}</span>
          )}

        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
            
            <li className="nav-item">
              <Link className="nav-link" to="/customers">Customers</Link>
            </li>

            <li 
              className="nav-item dropdown"
              onMouseEnter={() => setShowLoansMenu(true)}
              onMouseLeave={() => setShowLoansMenu(false)}
            >
              <Link className="nav-link dropdown-toggle" to="#" role="button" aria-expanded={showLoansMenu}>
                Loans
              </Link>
              <ul className={`dropdown-menu ${showLoansMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                <li><Link className="dropdown-item fw-bold text-success" to="/new-loan"><i className="bi bi-plus-circle me-2"></i>New Loan</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item" to="/loans"><i className="bi bi-list-ul me-2"></i>All Loans</Link></li>
                {user?.role === 'admin' && (
                  <li><Link className="dropdown-item text-danger" to="/overdue"><i className="bi bi-exclamation-circle me-2"></i>Overdue</Link></li>
                )}
              </ul>
            </li>

            {user?.role === 'admin' && (
              <li 
                className="nav-item dropdown"
                onMouseEnter={() => setShowReportsMenu(true)}
                onMouseLeave={() => setShowReportsMenu(false)}
              >
                <Link className="nav-link dropdown-toggle" to="#" role="button" aria-expanded={showReportsMenu}>
                  Reports
                </Link>
                <ul className={`dropdown-menu ${showReportsMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                  <li><Link className="dropdown-item" to="/day-book"><i className="bi bi-journal-text me-2"></i>Day Book</Link></li>
                  <li><Link className="dropdown-item" to="/reports"><i className="bi bi-bar-chart-line me-2"></i>Financial Reports</Link></li>
                </ul>
              </li>
            )}

            {user?.role === 'admin' && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/recycle-bin">Recycle Bin</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/manage-staff">Manage Staff</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/settings">Settings</Link></li>
              </>
            )}
          </ul>

          {user && (
            <span className="navbar-text me-3 text-white-50 small">
              <i className="bi bi-person-circle me-1"></i> {user.username} ({user.role})
            </span>
          )}

          <form className="d-flex" onSubmit={handleSearch}>
            <input 
              className="form-control me-2 form-control-sm" 
              type="search" 
              placeholder="Search Loan #" 
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