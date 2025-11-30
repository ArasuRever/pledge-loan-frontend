// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(''); // '' = All Branches
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
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

  // 2. Fetch Stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const query = selectedBranch ? `?branchId=${selectedBranch}` : '';
        const response = await axios.get(`${API_URL}/api/dashboard/stats${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Could not load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedBranch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && !stats) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return null;

  return (
    <div className="mb-4">
      {/* --- DASHBOARD HEADER & FILTER --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-0">
            <i className="bi bi-speedometer2 me-2 text-primary"></i>Financial Overview
          </h4>
          <small className="text-muted">Real-time snapshots of your business</small>
        </div>

        {/* Stylish Branch Selector */}
        <div className="bg-white p-2 rounded shadow-sm d-flex align-items-center border">
          <span className="text-secondary fw-bold small text-uppercase me-2 ps-2">
            <i className="bi bi-building me-1"></i>View:
          </span>
          <select 
            className="form-select form-select-sm border-0 fw-bold text-primary"
            style={{ minWidth: '150px', cursor: 'pointer', boxShadow: 'none' }}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches (HQ)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.branch_name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* --- STATS GRID --- */}
      <div className="row g-3">
        
        {/* 1. PRINCIPAL OUT (Primary Metric) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Principal Out</h6>
                <div className="icon-shape bg-primary bg-opacity-10 text-primary rounded-circle p-2">
                  <i className="bi bi-cash-stack fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold text-dark mb-0">{formatCurrency(stats.totalPrincipalOut)}</h3>
              <small className="text-muted">Active disbursement</small>
            </div>
          </div>
        </div>

        {/* 2. INTEREST COLLECTED (Success Metric) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-success">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Interest (Month)</h6>
                <div className="icon-shape bg-success bg-opacity-10 text-success rounded-circle p-2">
                  <i className="bi bi-graph-up-arrow fs-5"></i>
                </div>
              </div>
              <h3 className="fw-bold text-success mb-0">{formatCurrency(stats.interestCollectedThisMonth)}</h3>
              <small className="text-muted">Revenue this month</small>
            </div>
          </div>
        </div>

        {/* 3. ACTIVE LOANS & CUSTOMERS */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Active Loans</h6>
                <div className="icon-shape bg-info bg-opacity-10 text-info rounded-circle p-2">
                  <i className="bi bi-files fs-5"></i>
                </div>
              </div>
              <div className="d-flex align-items-baseline">
                <h3 className="fw-bold text-dark mb-0 me-2">{stats.totalActiveLoans}</h3>
                <span className="text-muted small">/ {stats.totalCustomers} Cust.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OVERDUE (Danger Metric) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-danger">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-danger small fw-bold mb-0">Overdue Loans</h6>
                <div className="icon-shape bg-danger bg-opacity-10 text-danger rounded-circle p-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <h3 className="fw-bold text-danger mb-0">{stats.totalOverdueLoans}</h3>
                {stats.totalOverdueLoans > 0 && (
                  <Link to="/overdue" className="btn btn-sm btn-outline-danger px-3 rounded-pill">
                    View <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;