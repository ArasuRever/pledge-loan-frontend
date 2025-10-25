import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // We'll need axios to fetch data

function HomePage() {
  // 1. Create state to hold our dashboard data
  const [stats, setStats] = useState({ active_loans: 0, total_disbursed: 0 });
  const [recentLoans, setRecentLoans] = useState([]);
  const [closedLoans, setClosedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch all dashboard data when the page loads
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // We'll fetch all three data points at the same time for speed
        const statsPromise = axios.get('http://localhost:3001/api/dashboard/stats');
        const recentPromise = axios.get('http://localhost:3001/api/loans/recent/created');
        const closedPromise = axios.get('http://localhost:3001/api/loans/recent/closed');

        // Wait for all requests to finish
        const [statsRes, recentRes, closedRes] = await Promise.all([
          statsPromise, 
          recentPromise, 
          closedPromise
        ]);

        setStats(statsRes.data);
        setRecentLoans(recentRes.data);
        setClosedLoans(closedRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Handle error (e.g., set an error state)
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // The empty array means this runs once when the page loads

  if (isLoading) {
    return <div className="text-center mt-5">Loading Dashboard...</div>;
  }

  // 3. Render the new dashboard layout
  return (
    <div>
      {/* --- KPI STAT CARDS --- */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card text-white bg-primary shadow-sm">
            <div className="card-body text-center">
              <h3 className="card-title">{stats.active_loans}</h3>
              <p className="card-text">Active Loans</p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card text-white bg-success shadow-sm">
            <div className="card-body text-center">
              <h3 className="card-title">₹{parseFloat(stats.total_disbursed).toLocaleString('en-IN')}</h3>
              <p className="card-text">Total Disbursed (Active)</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- RECENT ACTIVITY LISTS --- */}
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Loans Created This Week</div>
            <ul className="list-group list-group-flush">
              {recentLoans.length > 0 ? recentLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - ₹{loan.principal_amount}
                </Link>
              )) : <li className="list-group-item">No loans created this week.</li>}
            </ul>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Loans Closed This Week</div>
            <ul className="list-group list-group-flush">
              {closedLoans.length > 0 ? closedLoans.map(loan => (
                <Link key={loan.id} to={`/loans/${loan.id}`} className="list-group-item list-group-item-action text-muted">
                  Loan #{loan.id} for <strong>{loan.customer_name}</strong> - ₹{loan.principal_amount}
                </Link>
              )) : <li className="list-group-item">No loans closed this week.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;