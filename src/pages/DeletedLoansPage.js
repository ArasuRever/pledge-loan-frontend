// src/pages/DeletedLoansPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DeletedLoansPage = ({ apiBaseUrl }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeletedLoans = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/loans/deleted`);
      setLoans(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching deleted loans:", err);
      setError("Failed to load deleted loans.");
    }
    setLoading(false);
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchDeletedLoans();
  }, [fetchDeletedLoans]);

  const handleRestore = async (loanId, bookLoanNumber) => {
    if (window.confirm(`Are you sure you want to restore Loan #${bookLoanNumber}?`)) {
      try {
        await axios.put(`${apiBaseUrl}/loans/${loanId}/restore`);
        alert('Loan restored successfully.');
        fetchDeletedLoans(); // Refresh the list
      } catch (err) {
        console.error("Error restoring loan:", err);
        alert(`Error: ${err.response?.data?.error || 'Failed to restore loan.'}`);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Deleted Loans (Recycle Bin)</h1>
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      {!loading && !error && loans.length === 0 && (
        <div className="text-gray-500">The recycle bin is empty.</div>
      )}

      {!loading && !error && loans.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Book #</th>
                <th className="py-2 px-4 border">Customer</th>
                <th className="py-2 px-4 border">Amount</th>
                <th className="py-2 px-4 border">Pledge Date</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-100 bg-red-50">
                  <td className="py-2 px-4 border">{loan.book_loan_number}</td>
                  <td className="py-2 px-4 border">
                    <Link to={`/customers/${loan.customer_id}`} className="text-blue-500 hover:underline">
                      {loan.customer_name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border">₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-4 border">{new Date(loan.pledge_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border text-center">
                    <button
                      onClick={() => handleRestore(loan.id, loan.book_loan_number)}
                      className="text-green-600 hover:underline font-bold"
                    >
                      Restore
                    </button>
                    <Link
                      to={`/loans/${loan.id}`}
                      className="ml-4 text-gray-500 hover:underline"
                    >
                      (View)
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeletedLoansPage;