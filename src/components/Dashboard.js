// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(''); // '' means All Branches
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Branches on Load
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token');
        if(token) {
            const res = await axios.get(`${API_URL}/api/branches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to load branches");
      }
    };
    fetchBranches();
  }, []);

  // 2. Fetch Stats (Re-runs when selectedBranch changes)
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("User not authenticated.");
          setIsLoading(false);
          return;
        }

        // Add branchId query param if selected
        const query = selectedBranch ? `?branchId=${selectedBranch}` : '';
        
        const response = await axios.get(`${API_URL}/api/dashboard/stats${query}`, {
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
  }, [selectedBranch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && !stats) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 text-navy-900">Financial Dashboard</h1>
        
        {/* --- BRANCH SWITCHER --- */}
        <div className="d-flex align-items-center">
            <label className="me-2 fw-bold text-secondary">View:</label>
            <select 
                className="form-select w-auto shadow-sm border-navy-200"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
            >
                <option value="">All Branches (Overview)</option>
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
            </select>
        </div>
      </div>
      
      {/* STATS CARDS */}
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100 border-start border-4 border-primary">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Total Principal Out</h5>
              <p className="card-text fs-2 fw-bold text-navy-900">{formatCurrency(stats.totalPrincipalOut)}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100 border-start border-4 border-success">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Interest (This Month)</h5>
              <p className="card-text fs-2 fw-bold text-success">{formatCurrency(stats.interestCollectedThisMonth)}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100 border-start border-4 border-info">
            <div className="card-body">
              <h5 className="card-title text-muted text-uppercase small fw-bold">Total Customers</h5>
              <p className="card-text fs-2 fw-bold text-info">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Total Active Loans</h5>
              <p className="card-text fs-2 fw-bold">{stats.totalActiveLoans}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title text-danger">Overdue Loans</h5>
              <p className="card-text fs-2 fw-bold text-danger">{stats.totalOverdueLoans}</p>
              {stats.totalOverdueLoans > 0 && (
                <Link to="/loans/overdue" className="btn btn-sm btn-outline-danger mt-2">View List</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;