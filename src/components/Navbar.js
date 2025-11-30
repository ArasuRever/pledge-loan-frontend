// src/components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function Navbar({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Store search results
  const [showSuggestions, setShowSuggestions] = useState(false); // Toggle dropdown
  
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Sri KuberaLakshmi Bankers',
    logo: null,
    displayMode: 'both'
  });
  
  const [showLoansMenu, setShowLoansMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const navigate = useNavigate();
  const searchContainerRef = useRef(null); // To detect clicks outside

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
        console.error("Error loading settings", err);
      }
    };
    fetchSettings();

    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LIVE SEARCH LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(searchTerm)}`, { headers });
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Search error", err);
      }
    }, 300); // Wait 300ms after typing stops

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectSuggestion = (item) => {
    setSearchTerm('');
    setShowSuggestions(false);
    if (item.type === 'loan') {
      navigate(`/loans/${item.id}`);
    } else {
      navigate(`/customers/${item.id}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // If suggestions exist, go to the first one
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  const showLogo = (businessInfo.displayMode === 'both' || businessInfo.displayMode === 'logo_only') && businessInfo.logo;
  const showName = businessInfo.displayMode === 'both' || businessInfo.displayMode === 'name_only';

  return (
    <nav className="navbar navbar-expand-xl navbar-dark bg-dark mb-4 shadow-sm" style={{ minHeight: '80px' }}>
      <div className="container-fluid">
        
        {/* BRAND SECTION */}
        <Link className="navbar-brand d-flex align-items-center me-3" to="/">
          {showLogo && (
            <img 
              src={businessInfo.logo} 
              alt="Logo" 
              className="me-2 rounded bg-white" 
              style={{ height: '50px', width: 'auto', objectFit: 'contain', padding: '2px' }} 
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
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-xl-center">
            
            <li className="nav-item">
              <Link className="nav-link fs-6 fw-500" to="/customers">Customers</Link>
            </li>

            {/* LOANS */}
            <li 
              className="nav-item dropdown mx-1"
              onMouseEnter={() => setShowLoansMenu(true)}
              onMouseLeave={() => setShowLoansMenu(false)}
            >
              <Link className="nav-link dropdown-toggle fs-6 fw-500" to="#" role="button" aria-expanded={showLoansMenu}>
                Loans
              </Link>
              <ul className={`dropdown-menu shadow-sm ${showLoansMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                <li><Link className="dropdown-item py-1 fw-bold text-success" to="/new-loan"><i className="bi bi-plus-circle me-2"></i>New Loan</Link></li>
                <li><hr className="dropdown-divider my-1" /></li>
                <li><Link className="dropdown-item py-1" to="/loans"><i className="bi bi-list-ul me-2"></i>All Loans</Link></li>
                {user?.role === 'admin' && (
                  <li><Link className="dropdown-item py-1 text-danger" to="/overdue"><i className="bi bi-exclamation-circle me-2"></i>Overdue</Link></li>
                )}
              </ul>
            </li>

            {user?.role === 'admin' && (
              <>
                {/* REPORTS */}
                <li 
                  className="nav-item dropdown mx-1"
                  onMouseEnter={() => setShowReportsMenu(true)}
                  onMouseLeave={() => setShowReportsMenu(false)}
                >
                  <Link className="nav-link dropdown-toggle fs-6 fw-500" to="#" role="button" aria-expanded={showReportsMenu}>
                    Reports
                  </Link>
                  <ul className={`dropdown-menu shadow-sm ${showReportsMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                    <li><Link className="dropdown-item py-1" to="/day-book"><i className="bi bi-journal-text me-2"></i>Day Book</Link></li>
                    <li><Link className="dropdown-item py-1" to="/reports"><i className="bi bi-bar-chart-line me-2"></i>Financial Reports</Link></li>
                  </ul>
                </li>

                {/* BRANCHES */}
                <li 
                  className="nav-item dropdown mx-1"
                  onMouseEnter={() => setShowBranchMenu(true)}
                  onMouseLeave={() => setShowBranchMenu(false)}
                >
                  <Link className="nav-link dropdown-toggle fs-6 fw-500" to="#" role="button" aria-expanded={showBranchMenu}>
                    Branches
                  </Link>
                  <ul className={`dropdown-menu shadow-sm ${showBranchMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                    <li><Link className="dropdown-item py-1 fw-bold text-primary" to="/branches/new"><i className="bi bi-plus-circle me-2"></i>Create New</Link></li>
                    <li><Link className="dropdown-item py-1" to="/manage-branches"><i className="bi bi-building me-2"></i>View All</Link></li>
                  </ul>
                </li>

                {/* ADMIN */}
                <li 
                  className="nav-item dropdown mx-1"
                  onMouseEnter={() => setShowAdminMenu(true)}
                  onMouseLeave={() => setShowAdminMenu(false)}
                >
                  <Link className="nav-link dropdown-toggle fs-6 text-warning" to="#" role="button" aria-expanded={showAdminMenu}>
                    <i className="bi bi-shield-lock-fill me-1"></i>Admin
                  </Link>
                  <ul className={`dropdown-menu shadow-sm ${showAdminMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                    <li><Link className="dropdown-item py-1" to="/manage-staff"><i className="bi bi-people me-2"></i>Manage Staff</Link></li>
                    <li><Link className="dropdown-item py-1" to="/recycle-bin"><i className="bi bi-trash me-2"></i>Recycle Bin</Link></li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li><Link className="dropdown-item py-1 fw-bold" to="/settings"><i className="bi bi-gear-fill me-2"></i>Settings</Link></li>
                  </ul>
                </li>
              </>
            )}
          </ul>

          {/* USER INFO & SEARCH */}
          <div className="d-flex align-items-center mt-2 mt-xl-0">
            {user && (
                <span className="navbar-text me-3 text-white small" style={{fontSize: '0.9rem'}}>
                  <i className="bi bi-person-circle me-1"></i> 
                  <span className="fw-bold ms-1">{user.username}</span> 
                  <span className="opacity-75 ms-1">({user.role})</span>
                </span>
            )}

            {/* --- LIVE SEARCH BAR --- */}
            <div className="position-relative" ref={searchContainerRef}>
                <form className="d-flex" onSubmit={handleSearchSubmit}>
                    <div className="input-group"> 
                        <input 
                          className="form-control border-secondary" 
                          type="search" 
                          placeholder="Name, Phone, Loan #" 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                          style={{minWidth: '220px'}} 
                        />
                        <button className="btn btn-warning px-3 fw-bold text-dark d-flex align-items-center" type="submit">
                            <i className="bi bi-search me-2"></i> Search
                        </button>
                    </div>
                </form>

                {/* DROPDOWN RESULTS */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="position-absolute w-100 bg-white shadow rounded-bottom mt-1 overflow-hidden" style={{zIndex: 1050, left: 0}}>
                        <ul className="list-group list-group-flush text-start">
                            {suggestions.map((item, index) => (
                                <button 
                                    key={`${item.type}-${item.id}`} 
                                    className="list-group-item list-group-item-action py-2 px-3 border-bottom-0"
                                    onClick={() => handleSelectSuggestion(item)}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className={`me-3 rounded-circle p-2 ${item.type === 'loan' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'}`}>
                                            <i className={`bi ${item.type === 'loan' ? 'bi-file-earmark-text' : 'bi-person'}`}></i>
                                        </div>
                                        <div>
                                            <div className="fw-bold text-dark small">{item.title}</div>
                                            <div className="text-muted" style={{fontSize: '0.75rem'}}>{item.subtitle}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {/* --------------------- */}
            
            <button className="btn btn-link nav-link btn-sm ms-3 text-danger" onClick={onLogout} title="Logout">
                <i className="bi bi-box-arrow-right fs-4"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;