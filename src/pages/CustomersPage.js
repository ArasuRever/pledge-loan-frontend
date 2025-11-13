// src/pages/CustomersPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Corrected import

const CustomersPage = ({ apiBaseUrl }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (e) {
        console.error("Token decode error:", e);
      }
    }
    fetchCustomers();
  }, [apiBaseUrl]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/customers`);
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers. Please try again.");
    }
    setLoading(false);
  };

  // --- ⭐ NEW DELETE FUNCTION ---
  const handleDelete = async (customerId, customerName) => {
    // Simple confirmation
    if (window.confirm(`Are you sure you want to delete ${customerName}?\nThis will also delete all their active loans.`)) {
      try {
        await axios.put(`${apiBaseUrl}/customers/${customerId}/delete`);
        alert('Customer deleted successfully.');
        fetchCustomers(); // Refresh the list
      } catch (err) {
        console.error("Error deleting customer:", err);
        alert(`Error: ${err.response?.data?.error || 'Failed to delete customer.'}`);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm)
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <input
        type="text"
        placeholder="Search by name or phone..."
        className="mb-4 p-2 border rounded w-full"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {loading && <div>Loading customers...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Name</th>
                <th className="py-2 px-4 border">Phone</th>
                <th className="py-2 px-4 border">Address</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border">{customer.name}</td>
                  <td className="py-2 px-4 border">{customer.phone_number}</td>
                  <td className="py-2 px-4 border">{customer.address}</td>
                  <td className="py-2 px-4 border text-center">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </Link>
                    {/* --- ⭐ NEW DELETE BUTTON (ADMIN ONLY) --- */}
                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="ml-4 text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
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

export default CustomersPage;