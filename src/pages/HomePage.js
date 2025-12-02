// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Dashboard from '../components/Dashboard';

const API_URL = process.env.REACT_APP_API_URL;

function HomePage({ userRole, branchId }) {
  const [recentLoans, setRecentLoans] = useState([]);
  const [closedLoans, setClosedLoans] = useState([]);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Prepare Filter Params
        const params = {};
        if (branchId && branchId !== 'all') {
          params.branchId = branchId;
        }

        // 2. Fetch Data Parallel
        const [settingsRes, recentRes, closedRes] = await Promise.all([
            axios.get(`${API_URL}/api/settings`, { headers }), 
            axios.get(`${API_URL}/api/loans/recent/created`, { headers, params }).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/api/loans/recent/closed`, { headers, params }).catch(() => ({ data: [] }))
        ]);

        let displaySettings = settingsRes.data;

        // 3. Branch Specific Override
        // If we are looking at a specific branch, fetch its details to show correct address/phone
        if (branchId && branchId !== 'all') {
            try {
                const branchRes = await axios.get(`${API_URL}/api/branches/${branchId}`, { headers });
                // Merge: Keep global name/logo, override address/phone
                displaySettings = {
                    ...displaySettings,
                    address: branchRes.data.address || displaySettings.address,
                    phone_number: branchRes.data.phone_number || displaySettings.phone_number,
                    license_number: branchRes.data.license_number || displaySettings.license_number
                };
            } catch (bErr) {
                console.warn("Could not fetch branch details, using defaults");
            }
        }

        setBusinessDetails(displaySettings);
        setRecentLoans(recentRes.data || []);
        setClosedLoans(closedRes.data || []);

      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [branchId]); // Re-run when branchId changes

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="pb-5">
      
      {/* --- 1. BUSINESS HEADER (Dynamic based on Branch) --- */}
      <div 
        className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderLeft: '5px solid #0d6efd' }}
      >
        <div className="card-body p-4">
          <div className="row align-items-center">
            
            {/* Logo (Global) */}
            {businessDetails?.logo_url && (
              <div className="col-auto">
                <img 
                  src={businessDetails.logo_url} 
                  alt="Logo" 
                  className="rounded-circle shadow-sm bg-white p-1"
                  style={{ height: '80px', width: '80px', objectFit: 'contain' }} 
                />
              </div>
            )}
            
            {/* Info Stack (Dynamic Address/Phone) */}
            <div className="col">
              <h2 className="fw-bold text-dark mb-1" style={{ fontFamily: 'serif' }}>
                {businessDetails?.business_name || 'Sri KuberaLakshmi Bankers'}
              </h2>

              {businessDetails?.address && (
                <div className="text-muted small mb-2">
                  <i className="bi bi-geo-alt-fill text-danger me-1"></i>{businessDetails.address}
                </div>
              )}

              <div className="d-flex flex-wrap align-items-center gap-3">
                
                {businessDetails?.phone_number && (
                  <div className="fw-bold text-dark">
                    <i className="bi bi-telephone-fill text-success me-2"></i>{businessDetails.phone_number}
                  </div>
                )}

                {businessDetails?.license_number && (
                  <div className="bg-secondary bg-opacity-10 border border-secondary border-opacity-25 rounded-3 px-2 py-1">
                     <span className="text-secondary fw-bold small" style={{fontSize: '0.8rem'}}>
                       <i className="bi bi-patch-check-fill me-1"></i> 
                       Lic: {businessDetails.license_number}
                     </span>
                  </div>
                )}

                {branchId !== 'all' && (
                   <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                      <i className="bi bi-building me-1"></i> Branch Specific View
                   </div>
                )}
              </div>
            </div>

            {/* Date Badge */}
            <div className="col-auto d-none d-md-block text-end">
               <div className="badge bg-white text-dark shadow-sm border px-3 py-2 rounded-pill">
                  <i className="bi bi-calendar-day me-2 text-primary"></i>{today}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. DASHBOARD --- */}
      {(userRole === 'admin' || userRole === 'manager') && (
        <Dashboard branchId={branchId} />
      )}

      {/* --- 3. QUICK ACTIONS --- */}
      <h6 className="fw-bold text-secondary mb-3 mt-4 text-uppercase small ls-1"><i className="bi bi-grid-fill me-2"></i>Quick Actions</h6>
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <Link to="/new-loan" className="text-decoration-none">
            <div className="card shadow-sm border-0 h-100 bg-primary text-white hover-scale position-relative overflow-hidden">
              <div className="card-body d-flex align-items-center p-3">
                <div className="bg-white rounded-circle me-3 d-flex justify-content-center align-items-center shadow-sm" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-plus-lg fs-3 text-primary"></i>
                </div>
                <div>
                    <h6 className="fw-bold mb-0 fs-5">New Loan</h6>
                    <small className="opacity-75" style={{fontSize: '0.8rem'}}>Create pledge</small>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/customers" className="text-decoration-none">
            <div className="card shadow-sm border-0 h-100 bg-success text-white hover-scale position-relative overflow-hidden">
              <div className="card-body d-flex align-items-center p-3">
                <div className="bg-white rounded-circle me-3 d-flex justify-content-center align-items-center shadow-sm" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-people-fill fs-3 text-success"></i>
                </div>
                <div>
                    <h6 className="fw-bold mb-0 fs-5">Customers</h6>
                    <small className="opacity-75" style={{fontSize: '0.8rem'}}>View directory</small>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/loans" className="text-decoration-none">
             <div className="card shadow-sm border-0 h-100 bg-warning text-dark hover-scale position-relative overflow-hidden">
              <div className="card-body d-flex align-items-center p-3">
                <div className="bg-white rounded-circle me-3 d-flex justify-content-center align-items-center shadow-sm" style={{width: '50px', height: '50px'}}>
                    <i className="bi bi-search fs-3 text-warning"></i>
                </div>
                <div>
                    <h6 className="fw-bold mb-0 fs-5">Search</h6>
                    <small className="opacity-75 text-dark" style={{fontSize: '0.8rem'}}>Find records</small>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* --- 4. RECENT LISTS --- */}
      <div className="row g-4">
        {/* Created Table... (Existing Code) */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-clock-history me-2"></i>Recently Created</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-muted"><tr><th>Loan #</th><th>Customer</th><th className="text-end">Amount</th><th></th></tr></thead>
                <tbody>
                  {recentLoans.length > 0 ? recentLoans.map(loan => (
                    <tr key={loan.id} onClick={() => navigate(`/loans/${loan.id}`)} style={{ cursor: 'pointer' }}>
                      <td className="fw-bold text-primary">#{loan.book_loan_number || loan.id}</td>
                      <td>{loan.customer_name}</td>
                      <td className="text-end fw-bold">{formatCurrency(loan.principal_amount)}</td>
                      <td className="text-end"><i className="bi bi-chevron-right text-muted small"></i></td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-center py-3 text-muted">No recent loans.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Closed Table... (Existing Code) */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-success"><i className="bi bi-check-circle me-2"></i>Recently Closed</h6>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-muted"><tr><th>Loan #</th><th>Customer</th><th className="text-end">Amount</th><th></th></tr></thead>
                <tbody>
                  {closedLoans.length > 0 ? closedLoans.map(loan => (
                    <tr key={loan.id} onClick={() => navigate(`/loans/${loan.id}`)} style={{ cursor: 'pointer' }}>
                      <td className="text-muted text-decoration-line-through">#{loan.book_loan_number || loan.id}</td>
                      <td className="text-muted">{loan.customer_name}</td>
                      <td className="text-end text-muted">{formatCurrency(loan.principal_amount)}</td>
                      <td className="text-end"><i className="bi bi-chevron-right text-muted small"></i></td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-center py-3 text-muted">No closed loans.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;