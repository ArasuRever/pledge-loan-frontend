// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

function Dashboard({ branchId }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const params = {};
        if (branchId && branchId !== 'all') {
            params.branchId = branchId;
        }

        const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
          params: params
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
  }, [branchId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) return (
      <div className="d-flex justify-content-center p-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stats) return null;

  // Use the new fields
  const principalOut = stats.totalPrincipalOut || 0;
  const interestOut = stats.totalOutstandingInterest || 0;
  // Calculate Total Outstanding Value
  const totalOutstandingValue = principalOut + interestOut;

  return (
    <div className="mb-4">
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-0">
            <i className="bi bi-speedometer2 me-2 text-primary"></i>Financial Overview
          </h4>
          <small className="text-muted">
            {branchId === 'all' ? 'Consolidated View (All Branches)' : 'Branch Snapshot'}
          </small>
        </div>
        <div className="bg-white px-3 py-2 rounded shadow-sm border">
            <small className="text-muted fw-bold d-block">TOTAL OUTSTANDING VALUE</small>
            <span className="fs-4 fw-bold text-primary">{formatCurrency(totalOutstandingValue)}</span>
        </div>
      </div>
      
      {/* STATS GRID */}
      <div className="row g-3">
        
        {/* 1. PRINCIPAL OUT */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Principal Out</h6>
                <div className="icon-shape bg-primary bg-opacity-10 text-primary rounded-circle p-2"><i className="bi bi-cash-stack fs-5"></i></div>
              </div>
              <h3 className="fw-bold text-dark mb-0">{formatCurrency(principalOut)}</h3>
              <small className="text-muted">Disbursed Principal</small>
            </div>
          </div>
        </div>

        {/* 2. INTEREST OUT (Updated) */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-warning">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Outstanding Interest</h6>
                <div className="icon-shape bg-warning bg-opacity-10 text-warning rounded-circle p-2"><i className="bi bi-graph-up-arrow fs-5"></i></div>
              </div>
              <h3 className="fw-bold text-dark mb-0">{formatCurrency(interestOut)}</h3>
              <small className="text-muted">Total Accrued Pending</small>
            </div>
          </div>
        </div>

        {/* 3. ACTIVE LOANS */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-muted small fw-bold mb-0">Active Loans</h6>
                <div className="icon-shape bg-info bg-opacity-10 text-info rounded-circle p-2"><i className="bi bi-files fs-5"></i></div>
              </div>
              <div className="d-flex align-items-baseline">
                <h3 className="fw-bold text-dark mb-0 me-2">{stats.loansActive}</h3>
                <span className="text-muted small">/ {stats.totalCustomers} Cust.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. OVERDUE */}
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-danger">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-uppercase text-danger small fw-bold mb-0">Overdue Loans</h6>
                <div className="icon-shape bg-danger bg-opacity-10 text-danger rounded-circle p-2"><i className="bi bi-exclamation-triangle-fill fs-5"></i></div>
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <h3 className="fw-bold text-danger mb-0">{stats.loansOverdue}</h3>
                {stats.loansOverdue > 0 && (
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