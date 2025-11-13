// src/pages/LoanPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { jwtDecode } from 'jwt-decode'; // Corrected import
import PaymentForm from '../components/PaymentForm';
import PrintableInvoice from '../components/PrintableInvoice';

const LoanPage = ({ apiBaseUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate(); // For redirecting
  const [loan, setLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [calculated, setCalculated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null); // --- ⭐ NEW

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showAddPrincipal, setShowAddPrincipal] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Get user role
      const token = localStorage.getItem('token');
      if (token) {
        setUserRole(jwtDecode(token).role);
      }

      const response = await axios.get(`${apiBaseUrl}/loans/${id}`);
      setLoan(response.data.loanDetails);
      setTransactions(response.data.transactions);
      setCalculated(response.data.calculated);
      setError(null);
    } catch (err) {
      console.error("Error fetching loan details:", err);
      setError("Failed to load loan details.");
    }
    setLoading(false);
  }, [apiBaseUrl, id]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  // --- ⭐ NEW DELETE FUNCTION ---
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this loan (Book #: ${loan.book_loan_number})?`)) {
      try {
        await axios.put(`${apiBaseUrl}/loans/${id}/delete`);
        alert('Loan deleted successfully.');
        navigate('/loans'); // Redirect to all loans list
      } catch (err) {
        console.error("Error deleting loan:", err);
        alert(`Error: ${err.response?.data?.error || 'Failed to delete loan.'}`);
      }
    }
  };
  
  // ... (rest of the file is unchanged, including handleAddPrincipal, handleSettle, etc.) ...
  
  const handleAddPrincipal = async (amount) => {
    try {
      await axios.post(`${apiBaseUrl}/loans/${id}/add-principal`, { additionalAmount: amount });
      fetchLoanDetails();
      setShowAddPrincipal(false);
    } catch (err) {
      console.error("Error adding principal:", err);
      alert("Error: " + (err.response?.data?.error || "Failed to add principal."));
    }
  };

  const handleSettle = async (discount) => {
    try {
      await axios.post(`${apiBaseUrl}/loans/${id}/settle`, { discountAmount: discount });
      fetchLoanDetails();
      setShowSettle(false);
    } catch (err) {
      console.error("Error settling loan:", err);
      alert("Error: " + (err.response?.data?.error || "Failed to settle loan."));
    }
  };

  const isLoanActive = loan && (loan.status === 'active' || loan.status === 'overdue');

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!loan) return <div>Loan not found.</div>;

  return (
    <div className="container mx-auto p-4">
      
      {/* --- Action Buttons --- */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setShowPaymentForm(!showPaymentForm)}
          disabled={!isLoanActive}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Add Payment
        </button>
        <button
          onClick={() => setShowAddPrincipal(true)}
          disabled={!isLoanActive}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Add Principal
        </button>
        <button
          onClick={() => setShowSettle(true)}
          disabled={!isLoanActive}
          className="bg-yellow-500 text-black px-4 py-2 rounded disabled:bg-gray-400"
        >
          Settle Loan
        </button>
        <Link to={`/loans/${id}/edit`} className="bg-gray-500 text-white px-4 py-2 rounded">
          Edit Loan
        </Link>
        <button
          onClick={() => setShowInvoice(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Print Invoice
        </button>

        {/* --- ⭐ NEW DELETE BUTTON (ADMIN ONLY) --- */}
        {userRole === 'admin' && isLoanActive && (
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Delete Loan
          </button>
        )}
      </div>

      {/* ... (rest of the file is unchanged: modals, forms, details display) ... */}
      {showPaymentForm && isLoanActive && (
        <PaymentForm
          loanId={id}
          apiBaseUrl={apiBaseUrl}
          calculated={calculated}
          onSuccess={() => {
            fetchLoanDetails();
            setShowPaymentForm(false);
          }}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
      {/* ... Modals for Add Principal, Settle, and Invoice ... */}
      {/* Add Principal Modal */}
      {showAddPrincipal && isLoanActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Add Principal (Disburse)</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAddPrincipal(e.target.amount.value); }}>
              <input type="number" name="amount" placeholder="Amount to add" className="p-2 border rounded w-full mb-4" required />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddPrincipal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Disburse</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Settle Loan Modal */}
      {showSettle && isLoanActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-30">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Settle Loan</h2>
            <p className="mb-4">Calculated amount due: <strong>₹{calculated.amountDue}</strong></p>
            <form onSubmit={(e) => { e.preventDefault(); handleSettle(e.target.discount.value); }}>
              <input type="number" name="discount" placeholder="Discount amount (optional)" className="p-2 border rounded w-full mb-4" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSettle(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-yellow-500 text-black px-4 py-2 rounded">Settle</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Invoice Modal */}
      {showInvoice && (
        <PrintableInvoice
          loan={loan}
          calculated={calculated}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* --- Loan Details --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Loan Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Loan #{loan.book_loan_number}</h2>
          {loan.customer_image_url && (
            <img src={loan.customer_image_url} alt={loan.customer_name} className="w-24 h-24 rounded-full object-cover mb-4" />
          )}
          <p className="text-lg"><strong>Customer:</strong> <Link to={`/customers/${loan.customer_id}`} className="text-blue-500 hover:underline">{loan.customer_name}</Link></p>
          <p className="text-lg"><strong>Phone:</strong> {loan.phone_number}</p>
          <p className={`text-lg font-bold ${loan.status === 'overdue' ? 'text-red-500' : 'text-green-600'}`}>
            Status: {loan.status.toUpperCase()}
          </p>
          {loan.customer_status === 'deleted' && (
            <p className="text-lg font-bold text-red-700 bg-red-100 p-2 rounded">
              CUSTOMER IS DELETED
            </p>
          )}
        </div>

        {/* Financials Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Financials</h2>
          <p className="text-lg"><strong>Principal:</strong> ₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</p>
          <p className="text-lg"><strong>Interest Rate:</strong> {loan.interest_rate}% per month</p>
          <p className="text-lg"><strong>Pledge Date:</strong> {new Date(loan.pledge_date).toLocaleDateString()}</p>
          <p className="text-lg"><strong>Due Date:</strong> {new Date(loan.due_date).toLocaleDateString()}</p>
          <hr className="my-4" />
          <p className="text-xl font-bold">Total Paid: <span className="text-green-600">₹{parseFloat(calculated.totalPaid).toLocaleString('en-IN')}</span></p>
          <p className="text-xl font-bold">Amount Due: <span className="text-red-600">₹{parseFloat(calculated.amountDue).toLocaleString('en-IN')}</span></p>
        </div>

        {/* Item Card */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Pledged Item</h2>
          {loan.item_image_data_url && (
            <img src={loan.item_image_data_url} alt={loan.description} className="w-full h-48 object-cover rounded-lg mb-4" />
          )}
          <p className="text-lg"><strong>Type:</strong> {loan.item_type}</p>
          <p className="text-lg"><strong>Description:</strong> {loan.description}</p>
          <p className="text-lg"><strong>Weight:</strong> {loan.weight} g</p>
          <p className="text-lg"><strong>Quality:</strong> {loan.quality}</p>
        </div>
      </div>
      
      {/* --- Transactions List --- */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
        {/* ... (transactions list table is unchanged) ... */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Type</th>
                <th className="py-2 px-4 border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border">{new Date(tx.payment_date).toLocaleString()}</td>
                  <td className="py-2 px-4 border">{tx.payment_type}</td>
                  <td className={`py-2 px-4 border font-bold ${tx.payment_type === 'disbursement' ? 'text-blue-600' : 'text-green-600'}`}>
                    {tx.payment_type === 'disbursement' ? '+' : ''}₹{parseFloat(tx.amount_paid).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanPage;