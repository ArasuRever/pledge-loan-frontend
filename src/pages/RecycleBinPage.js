// src/pages/RecycleBinPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function RecycleBinPage({ userRole }) {
  const [data, setData] = useState({ customers: [], loans: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await axios.get(`${API_URL}/api/recycle-bin/deleted`);
      setData(response.data);
    } catch (err) {
      setError("Failed to fetch recycle bin data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to RESTORE this customer and all their loans?")) return;
    try {
      const response = await axios.post(`${API_URL}/api/customers/${id}/restore`);
      setMessage(response.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to restore customer.");
    }
  };

  const handleRestoreLoan = async (id) => {
    if (!window.confirm("Are you sure you want to RESTORE this loan?")) return;
    try {
      const response = await axios.post(`${API_URL}/api/loans/${id}/restore`);
      setMessage(response.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to restore loan.");
    }
  };
  
  // --- NEW: PERMANENT DELETE CUSTOMER ---
  const handlePermanentDeleteCustomer = async (id, name) => {
    if (!window.confirm(`⚠️ WARNING: Are you absolutely sure you want to PERMANENTLY DELETE customer ${name} and ALL their associated data (loans, items, transactions)? This cannot be undone.`)) return;
    try {
      const response = await axios.delete(`${API_URL}/api/customers/${id}/permanent-delete`);
      setMessage(response.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to permanently delete customer.");
    }
  };

  // --- NEW: PERMANENT DELETE LOAN ---
  const handlePermanentDeleteLoan = async (id, bookNumber) => {
    if (!window.confirm(`⚠️ WARNING: Are you absolutely sure you want to PERMANENTLY DELETE loan #${bookNumber} and ALL associated data (item, transactions, history)? This cannot be undone.`)) return;
    try {
      const response = await axios.delete(`${API_URL}/api/loans/${id}/permanent-delete`);
      setMessage(response.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to permanently delete loan.");
    }
  };

  if (userRole !== 'admin') {
    return <div className="alert alert-danger m-4">Access Denied. Admins only.</div>;
  }

  const renderCustomerRow = (customer) => (
    <tr key={customer.id}>
      <td>Customer</td>
      <td>{customer.id}</td>
      <td>{customer.name}</td>
      <td>{customer.phone_number}</td>
      <td>
        <button className="btn btn-sm btn-success me-2" onClick={() => handleRestoreCustomer(customer.id)}>Restore</button>
        <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDeleteCustomer(customer.id, customer.name)}>
            <i className="bi bi-trash"></i> Delete Forever
        </button>
      </td>
    </tr>
  );

  const renderLoanRow = (loan) => (
    <tr key={loan.id}>
      <td>Loan</td>
      <td>{loan.id}</td>
      <td>Loan #{loan.book_loan_number} ({loan.customer_name})</td>
      <td>N/A</td>
      <td>
        <button className="btn btn-sm btn-success me-2" onClick={() => handleRestoreLoan(loan.id)}>Restore</button>
        <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDeleteLoan(loan.id, loan.book_loan_number)}>
            <i className="bi bi-trash"></i> Delete Forever
        </button>
      </td>
    </tr>
  );

  return (
    <div>
      <h2 className="mb-4">Recycle Bin</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title">Deleted Items ({data.customers.length + data.loans.length})</h5>
            <table className="table table-hover mt-3">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
                  <th>Details</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map(renderCustomerRow)}
                {data.loans.map(renderLoanRow)}
                {(data.customers.length + data.loans.length) === 0 && (
                    <tr><td colSpan="5" className="text-center text-muted">The recycle bin is empty.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecycleBinPage;