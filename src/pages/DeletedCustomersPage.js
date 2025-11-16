// src/pages/DeletedCustomersPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DeletedCustomersPage = ({ apiBaseUrl }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeletedCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/customers/deleted`);
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching deleted customers:", err);
      setError("Failed to load deleted customers.");
    }
    setLoading(false);
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchDeletedCustomers();
  }, [fetchDeletedCustomers]);

  const handleRestore = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to restore ${customerName}?\nThis will also restore their associated loans.`)) {
      try {
        await axios.put(`${apiBaseUrl}/customers/${customerId}/restore`);
        alert('Customer restored successfully.');
        fetchDeletedCustomers(); // Refresh the list
      } catch (err) {
        console.error("Error restoring customer:", err);
        alert(`Error: ${err.response?.data?.error || 'Failed to restore customer.'}`);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Deleted Customers (Recycle Bin)</h1>
      
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      {!loading && !error && customers.length === 0 && (
        <div className="text-gray-500">The recycle bin is empty.</div>
      )}

      {!loading && !error && customers.length > 0 && (
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
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-100 bg-red-50">
                  <td className="py-2 px-4 border">{customer.name}</td>
                  <td className="py-2 px-4 border">{customer.phone_number}</td>
                  <td className="py-2 px-4 border">{customer.address}</td>
                  <td className="py-2 px-4 border text-center">
                    <button
                      onClick={() => handleRestore(customer.id, customer.name)}
                      className="text-green-600 hover:underline font-bold"
                    >
                      Restore
                    </button>
                    <Link
                      to={`/customers/${customer.id}`}
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

export default DeletedCustomersPage;