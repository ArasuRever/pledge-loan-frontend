// src/pages/CustomerPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { jwtDecode } from 'jwt-decode'; // Corrected import
import EditCustomerForm from '../components/EditCustomerForm';

const CustomerPage = ({ apiBaseUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate(); // For redirecting after delete
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userRole, setUserRole] = useState(null); // --- ⭐ NEW

  const fetchCustomerAndLoans = useCallback(async () => {
    setLoading(true);
    try {
      // Get user role
      const token = localStorage.getItem('token');
      if (token) {
        setUserRole(jwtDecode(token).role);
      }

      // Fetch customer
      const customerRes = await axios.get(`${apiBaseUrl}/customers/${id}`);
      setCustomer(customerRes.data);

      // Fetch loans
      const loansRes = await axios.get(`${apiBaseUrl}/customers/${id}/loans`);
      setLoans(loansRes.data);

      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data.");
    }
    setLoading(false);
  }, [apiBaseUrl, id]);

  useEffect(() => {
    fetchCustomerAndLoans();
  }, [fetchCustomerAndLoans]);

  // --- ⭐ NEW DELETE FUNCTION ---
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}?\nThis will also delete all their active loans.`)) {
      try {
        await axios.put(`${apiBaseUrl}/customers/${id}/delete`);
        alert('Customer deleted successfully.');
        navigate('/customers'); // Redirect to customers list
      } catch (err) {
        console.error("Error deleting customer:", err);
        alert(`Error: ${err.response?.data?.error || 'Failed to delete customer.'}`);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!customer) return <div>Customer not found.</div>;

  return (
    <div className="container mx-auto p-4">
      {isEditing ? (
        <EditCustomerForm
          customer={customer}
          apiBaseUrl={apiBaseUrl}
          onSuccess={() => {
            setIsEditing(false);
            fetchCustomerAndLoans();
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Edit Customer
              </button>
              {/* --- ⭐ NEW DELETE BUTTON (ADMIN ONLY) --- */}
              {userRole === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-2"
                >
                  Delete Customer
                </button>
              )}
            </div>
          </div>
          {customer.customer_image_url && (
            <img 
              src={customer.customer_image_url} 
              alt={customer.name} 
              className="w-32 h-32 rounded-full object-cover mb-4" 
            />
          )}
          <p className="text-lg mb-2"><strong>Phone:</strong> {customer.phone_number}</p>
          <p className="text-lg"><strong>Address:</strong> {customer.address}</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Loans</h2>
        {/* ... (rest of the loan list is unchanged) ... */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Book #</th>
                <th className="py-2 px-4 border">Amount</th>
                <th className="py-2 px-4 border">Description</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Pledge Date</th>
                <th className="py-2 px-4 border">Due Date</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.loan_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border">{loan.book_loan_number}</td>
                  <td className="py-2 px-4 border">₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</td>
                  <td className="py-2 px-4 border">{loan.description}</td>
                  <td className="py-2 px-4 border">{loan.status}</td>
                  <td className="py-2 px-4 border">{new Date(loan.pledge_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">{new Date(loan.due_date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border">
                    <Link to={`/loans/${loan.loan_id}`} className="text-blue-500 hover:underline">View</Link>
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

export default CustomerPage;