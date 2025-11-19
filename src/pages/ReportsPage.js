// src/pages/ReportsPage.js
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function ReportsPage({ userRole }) {
  // Default to first and last day of current month
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/reports/financial-summary`, {
        params: { startDate, endDate }
      });
      setReportData(response.data);
    } catch (err) {
      console.error("Report Error:", err);
      setError("Failed to generate report.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    return parseFloat(val || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    });
  };

  if (userRole !== 'admin') {
    return <div className="alert alert-danger m-4">Access Denied. Admins only.</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Financial Reports</h2>

      {/* --- Date Filter Form --- */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={fetchReport} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-bold">Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                required 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-bold">End Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                required 
              />
            </div>
            <div className="col-md-4">
              <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* --- Report Results --- */}
      {reportData && (
        <div className="row g-4">
          
          {/* NET PROFIT CARD */}
          <div className="col-md-12">
            <div className="card text-center border-success shadow-sm">
              <div className="card-header bg-success text-white fw-bold">
                NET PROFIT (Interest - Discounts)
              </div>
              <div className="card-body">
                <h1 className="display-4 text-success fw-bold">
                  {formatCurrency(reportData.netProfit)}
                </h1>
                <p className="card-text text-muted">
                  From {new Date(reportData.startDate).toLocaleDateString()} to {new Date(reportData.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="col-md-6">
            <div className="card h-100 shadow-sm border-primary">
              <div className="card-header bg-primary text-white">Collections (Inflow)</div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <span>Interest Collected:</span>
                  <span className="fw-bold text-success">+ {formatCurrency(reportData.totalInterest)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Principal Repaid:</span>
                  <span className="fw-bold text-primary">+ {formatCurrency(reportData.totalPrincipalRepaid)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 shadow-sm border-warning">
              <div className="card-header bg-warning text-dark">Outflow & Adjustments</div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-3">
                  <span>New Loans/Top-ups (Disbursed):</span>
                  <span className="fw-bold text-danger">- {formatCurrency(reportData.totalDisbursed)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Discounts Given:</span>
                  <span className="fw-bold text-warning">- {formatCurrency(reportData.totalDiscount)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default ReportsPage;