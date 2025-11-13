import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// --- ⭐ FIX 1: Removed 'export' from this line ---
const OverdueLoansPage = ({ apiBaseUrl }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOverdueLoans();
  }, [apiBaseUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOverdueLoans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/loans/overdue`);
      setLoans(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching overdue loans:", err);
      setError("Failed to load overdue loans.");
    }
    setLoading(false);
  };

  const filteredLoans = loans.filter(loan => 
    loan.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.book_loan_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Overdue Loans</h1>
      <input
        type="text"
        placeholder="Search by customer name or book #..."
        className="mb-4 p-2 border rounded w-full"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Book #</th>
                <th className="py-2 px-4 border">Customer</th>
                <th className="py-2 px-4 border">Amount</th>
                <th className="py-2 px-4 border">Pledge Date</th>
                <th className="py-2 px-4 border">Due Date</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-100 bg-red-50">
                  <td className="py-2 px-4 border">{loan.book_loan_number}</td>
                  <td className="py-2 px-4 border">
                    <Link to={`/customers/${loan.customer_id}`} className="text-blue-500 hover:underline">
                      {loan.customer_name}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border">₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-4 border">{new Date(loan.pledge_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border font-bold text-red-600">{new Date(loan.due_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">
                    <Link to={`/loans/${loan.id}`} className="text-blue-500 hover:underline">View Loan</Link>
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

// --- ⭐ FIX 2: Added this default export at the bottom ---
export default OverdueLoansPage;