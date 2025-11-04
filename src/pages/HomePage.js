import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 

const API_URL = process.env.REACT_APP_API_URL; // 1. ADD THIS

function HomePage({ userRole }) {
  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [closedLoans, setClosedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // --- ⭐ THIS IS THE FIX ---
        // We *always* fetch the basic lists.
        // 2. USE THE VARIABLE HERE
        const recentPromise = axios.get(`${API_URL}/api/loans/recent/created`, { headers });
        // 3. AND HERE
        const closedPromise = axios.get(`${API_URL}/api/loans/recent/closed`, { headers });
        
        if (userRole === 'admin') {
          // If user is admin, ALSO fetch the financial stats
          // 4. AND HERE
          const statsPromise = axios.get(`${API_URL}/api/dashboard/stats`, { headers });
          
          const [statsRes, recentRes, closedRes] = await Promise.all([
            statsPromise, 
            recentPromise, 
            closedPromise
          ]);

          setStats(statsRes.data);
          setRecentLoans(recentRes.data);
          setClosedLoans(closedRes.data);
        } else {
          // If user is not admin, just get the lists
          const [recentRes, closedRes] = await Promise.all([
            recentPromise, 
            closedPromise
          ]);
          setRecentLoans(recentRes.data);
          setClosedLoans(closedRes.data);
          // We set stats to an empty object to show we've "loaded" them
          setStats({}); 
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    // Run the fetch as soon as the app has figured out the role (or non-role)
    // App.js ensures userRole is set (e.g., 'admin' or 'staff') before rendering this
    fetchDashboardData();

  }, [userRole]); // Re-run if the role changes

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* --- Conditionally render stats for admin --- */}
      {userRole === 'admin' && stats && (
        <div className="row">
          {/* Total Principal Out */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="card-title text-muted">Total Principal Out</h6>
                <p className="card-text fs-2 fw-bold">{formatCurrency(stats.totalPrincipalOut)}</p>
              </div>
            </div>
          </div>
          {/* Interest Collected this Month */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="card-title text-muted">Interest Collected (This Month)</h6>
                <p className="card-text fs-2 fw-bold text-success">{formatCurrency(stats.interestCollectedThisMonth)}</p>
              </div>
            </div>
          </div>
          {/* Active Loans */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="card-title text-muted">Total Active Loans</h6>
                <p className="card-text fs-2 fw-bold">{stats.totalActiveLoans}</p>
              </div>
            </div>
          </div>
          {/* Overdue Loans */}
          <div className="col-md-6 col-lg-3 mb-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h6 className="card-title text-danger">Overdue Loans</h6>
                <p className="card-text fs-2 fw-bold text-danger">{stats.totalOverdueLoans}</p>

                {/* --- ⭐ CHANGED: Links to /overdue (fixed from your earlier message) --- */}
                {stats.totalOverdueLoans > 0 && (
                  <Link to="/overdue" className="btn btn-sm btn-danger">View Overdue</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* --- END OF CONDITIONAL STATS --- */}

      {/* --- RECENT ACTIVITY LISTS (Visible to all) --- */}
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Recently Created Loans</div>
            <ul className="list-group list-group-flush">
              {recentLoans.length > 0 ? recentLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - {formatCurrency(loan.principal_amount)}
                </Link>
              )) : <li className="list-group-item">No recent loans.</li>}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Recently Closed Loans</div>
            <ul className="list-group list-group-flush">
              {closedLoans.length > 0 ? closedLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action text-muted">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - {formatCurrency(loan.principal_amount)}
                </Link>
              )) : <li className="list-group-item">No recent loans.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;