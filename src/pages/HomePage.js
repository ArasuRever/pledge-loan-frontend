import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Added useNavigate
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function HomePage({ userRole }) {
  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [closedLoans, setClosedLoans] = useState([]);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // 2. Initialize hook

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("User not authenticated.");
          setIsLoading(false);
          return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        const settingsPromise = axios.get(`${API_URL}/api/settings`, { headers });
        const recentPromise = axios.get(`${API_URL}/api/loans/recent/created`, { headers });
        const closedPromise = axios.get(`${API_URL}/api/loans/recent/closed`, { headers });
        
        const promises = [settingsPromise, recentPromise, closedPromise];
        if (userRole === 'admin') {
          promises.push(axios.get(`${API_URL}/api/dashboard/stats`, { headers }));
        }

        const results = await Promise.all(promises);

        const settingsRes = results[0];
        const recentRes = results[1];
        const closedRes = results[2];
        const statsRes = userRole === 'admin' ? results[3] : null;

        setBusinessDetails(settingsRes.data);
        setRecentLoans(recentRes.data);
        setClosedLoans(closedRes.data);
        if (statsRes) setStats(statsRes.data);
        else setStats({});

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="pb-5">
      
      {/* --- BUSINESS HEADER SECTION --- */}
      {businessDetails && (
        <div className="card shadow-sm border-0 mb-4 bg-light">
          <div className="card-body p-4">
            <div className="row align-items-center">
              {businessDetails.logo_url && (
                <div className="col-auto">
                  <img 
                    src={businessDetails.logo_url} 
                    alt="Business Logo" 
                    className="rounded shadow-sm bg-white p-1"
                    style={{ maxHeight: '80px', maxWidth: '80px' }} 
                  />
                </div>
              )}
              <div className="col">
                <h2 className="fw-bold text-primary mb-1">{businessDetails.business_name}</h2>
                {businessDetails.address && (
                  <p className="text-muted mb-1 small"><i className="bi bi-geo-alt-fill me-1"></i>{businessDetails.address}</p>
                )}
                <div className="d-flex gap-3 text-secondary small">
                   {businessDetails.phone_number && (
                     <span><i className="bi bi-telephone-fill me-1"></i>{businessDetails.phone_number}</span>
                   )}
                   {businessDetails.license_number && (
                     <span className="badge bg-secondary fw-normal">Lic: {businessDetails.license_number}</span>
                   )}
                </div>
              </div>
              <div className="col-auto text-end d-none d-md-block">
                 <h5 className="text-dark fw-bold mb-0">{today}</h5>
                 <span className="badge bg-primary rounded-pill">Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK ACTIONS ROW --- */}
      <div className="row mb-4 g-3">
        <div className="col-md-4">
          <Link to="/new-loan" className="text-decoration-none">
            <div className="card shadow-sm border-0 h-100 bg-primary text-white hover-scale">
              <div className="card-body d-flex align-items-center">
                <div className="fs-1 me-3"><i className="bi bi-plus-circle-fill"></i></div>
                <div><h5 className="card-title fw-bold mb-0">New Loan</h5><small className="opacity-75">Create pledge</small></div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/customers" className="text-decoration-none">
            <div className="card shadow-sm border-0 h-100 bg-success text-white hover-scale">
              <div className="card-body d-flex align-items-center">
                <div className="fs-1 me-3"><i className="bi bi-people-fill"></i></div>
                <div><h5 className="card-title fw-bold mb-0">Customers</h5><small className="opacity-75">Manage directory</small></div>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/loans" className="text-decoration-none">
             <div className="card shadow-sm border-0 h-100 bg-secondary text-white hover-scale">
              <div className="card-body d-flex align-items-center">
                <div className="fs-1 me-3"><i className="bi bi-search"></i></div>
                <div><h5 className="card-title fw-bold mb-0">Search</h5><small className="opacity-75">Find loans</small></div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* --- FINANCIAL STATS (Admin Only) --- */}
      {userRole === 'admin' && stats && (
        <div className="row mb-5 g-3">
          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm border-start border-4 border-primary h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small fw-bold">Principal Out</h6>
                <h3 className="mb-0 fw-bold text-dark">{formatCurrency(stats.totalPrincipalOut || 0)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm border-start border-4 border-success h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small fw-bold">Interest (Month)</h6>
                <h3 className="mb-0 fw-bold text-success">{formatCurrency(stats.interestCollectedThisMonth || 0)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
             <div className="card shadow-sm border-start border-4 border-info h-100">
              <div className="card-body">
                <h6 className="text-muted text-uppercase small fw-bold">Active Loans</h6>
                <h3 className="mb-0 fw-bold text-info">{stats.totalActiveLoans || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm border-start border-4 border-danger h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                   <div>
                      <h6 className="text-danger text-uppercase small fw-bold">Overdue Loans</h6>
                      <h3 className="mb-0 fw-bold text-danger">{stats.totalOverdueLoans || 0}</h3>
                   </div>
                   <Link to="/overdue" className="btn btn-sm btn-danger text-white shadow-sm">
                      View <i className="bi bi-arrow-right ms-1"></i>
                   </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RECENT ACTIVITY --- */}
      <div className="row">
        {/* RECENTLY CREATED */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3"><h6 className="mb-0 fw-bold text-primary">Recently Created</h6></div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-muted"><tr><th>#</th><th>Customer</th><th className="text-end">Amount</th><th></th></tr></thead>
                <tbody>
                  {recentLoans.length > 0 ? recentLoans.map(loan => (
                    // 3. Row is now Clickable
                    <tr 
                      key={loan.id} 
                      onClick={() => navigate(`/loans/${loan.id}`)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="fw-bold text-primary">#{loan.id}</td>
                      <td>{loan.customer_name}</td>
                      <td className="text-end fw-bold">{formatCurrency(loan.principal_amount)}</td>
                      <td className="text-end">
                        {/* Changed Link to span to prevent nested click conflicts */}
                        <span className="btn btn-sm btn-light rounded-circle"><i className="bi bi-chevron-right"></i></span>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="4" className="text-center py-3 text-muted">No recent loans.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RECENTLY CLOSED */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white py-3"><h6 className="mb-0 fw-bold text-success">Recently Closed</h6></div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small text-muted"><tr><th>#</th><th>Customer</th><th className="text-end">Amount</th><th></th></tr></thead>
                <tbody>
                  {closedLoans.length > 0 ? closedLoans.map(loan => (
                    // 3. Row is now Clickable
                    <tr 
                      key={loan.id} 
                      onClick={() => navigate(`/loans/${loan.id}`)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="text-muted text-decoration-line-through">#{loan.id}</td>
                      <td className="text-muted">{loan.customer_name}</td>
                      <td className="text-end text-muted">{formatCurrency(loan.principal_amount)}</td>
                      <td className="text-end">
                         <span className="btn btn-sm btn-light rounded-circle"><i className="bi bi-chevron-right"></i></span>
                      </td>
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