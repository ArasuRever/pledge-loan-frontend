// src/components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function Navbar({ user, onLogout, selectedBranchId, setSelectedBranchId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [businessInfo, setBusinessInfo] = useState({
    name: 'Sri KuberaLakshmi Bankers',
    logo: null,
    displayMode: 'both'
  });

  const [branches, setBranches] = useState([]);
  
  // Dropdown States
  const [showLoansMenu, setShowLoansMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const navigate = useNavigate();
  const searchContainerRef = useRef(null); 

  // --- 1. Fetch Settings & Branches ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch Business Settings
        const settingsRes = await axios.get(`${API_URL}/api/settings`, { headers });
        if (settingsRes.data) {
          setBusinessInfo({
            name: settingsRes.data.business_name || 'Sri KuberaLakshmi Bankers',
            logo: settingsRes.data.logo_url || null,
            displayMode: settingsRes.data.navbar_display_mode || 'both'
          });
        }

        // Fetch Branches if Admin
        if (user?.role === 'admin') {
          const branchRes = await axios.get(`${API_URL}/api/branches`, { headers });
          setBranches(branchRes.data);
        }

      } catch (err) {
        console.error("Error loading navbar data", err);
      }
    };

    fetchData();

    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // --- 2. Live Search Logic ---
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
    }, 300); 

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

            {/* LOANS DROPDOWN */}
            <li 
              className="nav-item dropdown mx-1"
              onMouseEnter={() => setShowLoansMenu(true)}
              onMouseLeave={() => setShowLoansMenu(false)}
            >
              <Link 
                className="nav-link dropdown-toggle fs-6 fw-500" 
                to="#" 
                role="button" 
                aria-expanded={showLoansMenu}
              >
                Loans
              </Link>
              <ul className={`dropdown-menu ${showLoansMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                <li><Link className="dropdown-item py-1 fw-bold" to="/new-loan"><i className="bi bi-plus-circle"></i>New Loan</Link></li>
                <li><div className="dropdown-divider"></div></li>
                <li><Link className="dropdown-item py-1" to="/loans"><i className="bi bi-list-ul"></i>All Loans</Link></li>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <li><Link className="dropdown-item py-1 text-danger" to="/overdue"><i className="bi bi-exclamation-circle"></i>Overdue</Link></li>
                )}
              </ul>
            </li>

            {/* REPORTS DROPDOWN */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <li 
                className="nav-item dropdown mx-1"
                onMouseEnter={() => setShowReportsMenu(true)}
                onMouseLeave={() => setShowReportsMenu(false)}
              >
                <Link className="nav-link dropdown-toggle fs-6 fw-500" to="#" role="button" aria-expanded={showReportsMenu}>
                  Reports
                </Link>
                <ul className={`dropdown-menu ${showReportsMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                  <li><Link className="dropdown-item py-1" to="/day-book"><i className="bi bi-journal-text"></i>Day Book</Link></li>
                  <li><Link className="dropdown-item py-1" to="/reports"><i className="bi bi-bar-chart-line"></i>Financial Reports</Link></li>
                </ul>
              </li>
            )}

            {user?.role === 'admin' && (
              <>
                {/* BRANCHES DROPDOWN - Clickable Main Link */}
                <li 
                  className="nav-item dropdown mx-1"
                  onMouseEnter={() => setShowBranchMenu(true)}
                  onMouseLeave={() => setShowBranchMenu(false)}
                >
                  <Link 
                    className="nav-link dropdown-toggle fs-6 fw-500" 
                    to="/manage-branches"  
                    onClick={(e) => {
                        // Allow navigation but prevent immediate dropdown toggle conflict if any
                    }}
                    role="button" 
                    aria-expanded={showBranchMenu}
                  >
                    Branches
                  </Link>
                  <ul className={`dropdown-menu ${showBranchMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                    <li><Link className="dropdown-item py-1 fw-bold" to="/branches/new"><i className="bi bi-plus-circle"></i>Create New</Link></li>
                    <li><Link className="dropdown-item py-1" to="/manage-branches"><i className="bi bi-building"></i>View All</Link></li>
                  </ul>
                </li>

                {/* ADMIN DROPDOWN */}
                <li 
                  className="nav-item dropdown mx-1"
                  onMouseEnter={() => setShowAdminMenu(true)}
                  onMouseLeave={() => setShowAdminMenu(false)}
                >
                  <Link className="nav-link dropdown-toggle fs-6 text-warning" to="#" role="button" aria-expanded={showAdminMenu}>
                    <i className="bi bi-shield-lock-fill me-1"></i>Admin
                  </Link>
                  <ul className={`dropdown-menu ${showAdminMenu ? 'show' : ''}`} style={{marginTop: 0}}>
                    <li><Link className="dropdown-item py-1" to="/manage-staff"><i className="bi bi-people"></i>Manage Staff</Link></li>
                    <li><Link className="dropdown-item py-1" to="/recycle-bin"><i className="bi bi-trash"></i>Recycle Bin</Link></li>
                    <li><div className="dropdown-divider"></div></li>
                    <li><Link className="dropdown-item py-1 fw-bold" to="/settings"><i className="bi bi-gear-fill"></i>Settings</Link></li>
                  </ul>
                </li>
              </>
            )}
          </ul>

          {/* RIGHT SIDE */}
          <div className="d-flex align-items-center mt-2 mt-xl-0 gap-3">
            
            {/* Branch Selector */}
            {user && (
              <div>
                {user.role === 'admin' ? (
                  <select 
                    className="form-select form-select-sm fw-bold border-warning bg-light text-dark" 
                    style={{ minWidth: '140px', cursor: 'pointer' }}
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    title="Switch Branch View"
                  >
                    <option value="all">🏢 All Branches</option>
                    {branches.map(b => (
                      /* CRITICAL FIX: Use b.id instead of b.branch_id */
                      <option key={b.id} value={b.id}>📍 {b.branch_name}</option>
                    ))}
                  </select>
                ) : (
                  <span className="badge bg-secondary border border-light p-2">
                    <i className="bi bi-building me-1"></i> {user.branchName || 'My Branch'}
                  </span>
                )}
              </div>
            )}

            {/* User Info */}
            {user && (
                <div className="text-white small lh-1 text-end d-none d-md-block">
                   <div className="fw-bold"><i className="bi bi-person-circle me-1"></i> {user.username}</div>
                   <div className="opacity-75" style={{fontSize: '0.75rem'}}>{user.role.toUpperCase()}</div>
                </div>
            )}

            {/* Search Bar with Fixed Button */}
            <div className="position-relative" ref={searchContainerRef}>
                <form className="d-flex" onSubmit={handleSearchSubmit}>
                    <div className="input-group"> 
                        <input 
                          className="form-control border-secondary form-control-sm" 
                          type="search" 
                          placeholder="Search..." 
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                          style={{minWidth: '180px'}} 
                        />
                        <button className="btn btn-warning btn-sm px-3 text-dark fw-bold d-flex align-items-center" type="submit">
                            <i className="bi bi-search me-1"></i> Search
                        </button>
                    </div>
                </form>

                {/* Search Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="position-absolute w-100 bg-white shadow rounded-bottom mt-1 overflow-hidden" style={{zIndex: 1050, left: 0}}>
                        <ul className="list-group list-group-flush text-start">
                            {suggestions.map((item) => (
                                <button 
                                    key={`${item.type}-${item.id}`} 
                                    className="list-group-item list-group-item-action py-2 px-3 border-bottom-0"
                                    onClick={() => handleSelectSuggestion(item)}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className={`me-2 rounded-circle p-1 ${item.type === 'loan' ? 'bg-primary bg-opacity-10 text-primary' : 'bg-success bg-opacity-10 text-success'}`}>
                                            <i className={`bi ${item.type === 'loan' ? 'bi-file-earmark-text' : 'bi-person'}`}></i>
                                        </div>
                                        <div className="text-truncate" style={{maxWidth: '150px'}}>
                                            <div className="fw-bold text-dark small">{item.title}</div>
                                            <div className="text-muted" style={{fontSize: '0.7rem'}}>{item.subtitle}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            
            {/* Logout Button */}
            <button 
              className="btn btn-outline-danger btn-sm d-flex align-items-center px-3" 
              onClick={onLogout} 
              title="Logout"
            >
                <i className="bi bi-power me-2"></i> Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;