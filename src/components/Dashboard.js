// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get the auth token from local storage
        const token = localStorage.getItem('token');
        if (!token) {
          setError("User not authenticated.");
          setIsLoading(false);
          return;
        }

        const response = await axios.get('/api/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

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

  if (!stats) return null;

  return (
    <div>
      <h1 className="mb-4">Financial Dashboard</h1>
      
      <div className="row">
        {/* Total Principal Out */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Total Principal Out</h5>
              <p className="card-text fs-2 fw-bold">{formatCurrency(stats.totalPrincipalOut)}</p>
            </div>
          </div>
        </div>

        {/* Interest Collected this Month */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Interest Collected (This Month)</h5>
              <p className="card-text fs-2 fw-bold">{formatCurrency(stats.interestCollectedThisMonth)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Active Loans */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Total Active Loans</h5>
              <p className="card-text fs-2 fw-bold">{stats.totalActiveLoans}</p>
            </div>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-danger">Overdue Loans</h5>
              <p className="card-text fs-2 fw-bold text-danger">{stats.totalOverdueLoans}</p>
              {stats.totalOverdueLoans > 0 && (
                <Link to="/loans/overdue" className="btn btn-danger">View Overdue</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;