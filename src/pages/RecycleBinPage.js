// src/pages/RecycleBinPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

function RecycleBinPage({ userRole }) {
  const [deletedData, setDeletedData] = useState({ customers: [], loans: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchDeletedData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/api/recycle-bin/deleted`);
        setDeletedData(response.data);
      } catch (err) {
        console.error("Error fetching recycle bin data:", err);
        setError("Failed to load recycle bin data.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userRole === 'admin') {
      fetchDeletedData();
    }
  }, [userRole, refreshTrigger]);

  const handleRestoreCustomer = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to restore customer: ${customerName}? This will also restore their associated closed loans.`)) {
      try {
        const response = await axios.post(`${API_URL}/api/customers/${customerId}/restore`);
        alert(response.data.message);
        setRefreshTrigger(t => t + 1); // Refresh the list
      } catch (err) {
        const errorMsg = err.response?.data?.error || "Failed to restore customer.";
        console.error("Restore Customer Error:", err);
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  const handleRestoreLoan = async (loanId, bookNumber) => {
    if (window.confirm(`Are you sure you want to restore loan: Book #${bookNumber}?`)) {
      try {
        const response = await axios.post(`${API_URL}/api/loans/${loanId}/restore`);
        alert(response.data.message);
        setRefreshTrigger(t => t + 1); // Refresh the list
      } catch (err)
 {
        const errorMsg = err.response?.data?.error || "Failed to restore loan.";
        console.error("Restore Loan Error:", err);
        alert(`Error: ${errorMsg}`);
      }
    }
  };

  if (userRole !== 'admin') {
    return <div className="alert alert-danger">Access Denied.</div>;
  }

  if (isLoading) {
    return <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container">
      <h2 className="mb-4">Recycle Bin</h2>

      <div className="row">
        {/* Deleted Customers */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Deleted Customers ({deletedData.customers.length})</h5>
            </div>
            <div className="card-body">
              {deletedData.customers.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {deletedData.customers.map(customer => (
                    <li key={customer.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{customer.name}</strong> (ID: {customer.id})
                        <br />
                        <small className="text-muted">{customer.phone_number}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleRestoreCustomer(customer.id, customer.name)}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No deleted customers.</p>
              )}
            </div>
          </div>
        </div>

        {/* Deleted Loans */}
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Deleted Loans ({deletedData.loans.length})</h5>
            </div>
            <div className="card-body">
              {deletedData.loans.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {deletedData.loans.map(loan => (
                    <li key={loan.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Book #: {loan.book_loan_number}</strong> (Loan ID: {loan.id})
                        <br />
                        <small className="text-muted">Customer: {loan.customer_name}</small>
                      </div>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleRestoreLoan(loan.id, loan.book_loan_number)}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No deleted loans.</p>
              )}
            </div>
             <div className="card-footer small text-muted">
                Note: Loans for customers who are also in the recycle bin will not appear here. Restore the customer first.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecycleBinPage;