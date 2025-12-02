// src/pages/DayBookPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DayBookPage = ({ userRole, branchId }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDayBook();
    // eslint-disable-next-line
  }, [selectedDate, branchId]); // Refetch when date OR branch changes

  const fetchDayBook = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Prepare params
      const params = { date: selectedDate };
      if (branchId && branchId !== 'all') {
        params.branchId = branchId;
      }

      const response = await axios.get(`${API_URL}/api/reports/day-book`, { 
        headers, 
        params 
      });
      setData(response.data);
    } catch (err) {
      console.error("Error fetching Day Book:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  let currentBalance = data ? (parseFloat(data.openingBalance) || 0) : 0;
  let totalCredit = 0;
  let totalDebit = 0;

  // Logic to show Branch Column (Admin viewing All)
  const showBranchCol = userRole === 'admin' && branchId === 'all';

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
           <h3 className="text-primary fw-bold mb-0"><i className="bi bi-book-half me-2"></i>Day Book (Chitta)</h3>
           {showBranchCol && <small className="text-muted">Consolidated View (All Branches)</small>}
        </div>
        
        <input 
          type="date" 
          className="form-control w-auto fw-bold shadow-sm" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : data ? (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-bordered mb-0 align-middle">
                <thead className="table-light text-center small text-uppercase">
                  <tr>
                    <th style={{width: '100px'}}>Time</th>
                    {showBranchCol && <th>Branch</th>}
                    <th>Particulars</th>
                    <th>Ref / Loan #</th>
                    <th className="text-success">Credit (IN)</th>
                    <th className="text-danger">Debit (OUT)</th>
                    <th className="bg-light">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {/* OPENING BALANCE ROW */}
                  <tr className="table-warning fw-bold">
                    <td className="text-center">-</td>
                    {showBranchCol && <td className="text-center">-</td>}
                    <td>OPENING BALANCE b/f</td>
                    <td className="text-center">-</td>
                    <td className="text-end">-</td>
                    <td className="text-end">-</td>
                    <td className="text-end">{formatCurrency(data.openingBalance)}</td>
                  </tr>

                  {/* TRANSACTIONS */}
                  {data.transactions.length === 0 ? (
                    <tr>
                        <td colSpan={showBranchCol ? 7 : 6} className="text-center text-muted py-4">
                            No transactions found for this date.
                        </td>
                    </tr>
                  ) : (
                    data.transactions.map((tx) => {
                      const isCredit = ['interest', 'principal', 'settlement'].includes(tx.payment_type);
                      const amount = parseFloat(tx.amount_paid);
                      
                      if (isCredit) {
                        currentBalance += amount;
                        totalCredit += amount;
                      } else {
                        currentBalance -= amount;
                        totalDebit += amount;
                      }

                      return (
                        <tr key={tx.id}>
                          <td className="text-center text-muted small">
                            {new Date(tx.created_at || tx.payment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          
                          {/* Conditional Branch Cell */}
                          {showBranchCol && (
                             <td className="small text-secondary">{tx.branch_name || 'Main'}</td>
                          )}

                          <td>
                            <span className="fw-bold text-dark">{tx.customer_name}</span>
                            <div className="small text-muted text-capitalize">{tx.payment_type}</div>
                          </td>
                          <td className="text-center text-primary small">{tx.book_loan_number}</td>
                          
                          {/* Credit Col */}
                          <td className="text-end text-success fw-medium">
                            {isCredit ? formatCurrency(amount) : ''}
                          </td>
                          
                          {/* Debit Col */}
                          <td className="text-end text-danger fw-medium">
                            {!isCredit ? formatCurrency(amount) : ''}
                          </td>

                          {/* Running Balance */}
                          <td className="text-end fw-bold bg-light">
                            {formatCurrency(currentBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* FOOTER TOTALS */}
                <tfoot className="table-light border-top-3">
                  <tr className="align-middle">
                    <td colSpan={showBranchCol ? 4 : 3} className="text-end fw-bold text-muted">DAY TOTALS:</td>
                    <td className="text-end fw-bold text-success fs-5">{formatCurrency(totalCredit)}</td>
                    <td className="text-end fw-bold text-danger fs-5">{formatCurrency(totalDebit)}</td>
                    <td className="bg-light"></td>
                  </tr>
                  <tr className="table-primary border-top-2">
                    <td colSpan={showBranchCol ? 6 : 5} className="text-end fw-bold text-uppercase fs-4">Closing Cash Balance:</td>
                    <td className="text-end fw-bold fs-4 text-primary">{formatCurrency(currentBalance)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DayBookPage;