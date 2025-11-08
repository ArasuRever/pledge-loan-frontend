import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';

const API_URL = process.env.REACT_APP_API_URL; // 1. ADD THIS

// --- ⭐ CHANGED: Added userRole prop ---
function CustomersPage({ userRole }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      // 2. USE THE VARIABLE HERE
      const response = await axios.get(`${API_URL}/api/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone_number && customer.phone_number.includes(searchTerm))
  );

  return (
    <div className="row">
      {/* --- ⭐ CHANGED: Conditionally show Add Customer form --- */}
      {/* --- ⭐ CHANGED: Allow 'staff' to see this --- */}
      {(userRole === 'admin' || userRole === 'staff') && (
        <div className="col-md-4">
          <CustomerForm onCustomerAdded={fetchCustomers} />
        </div>
      )}

      {/* --- ⭐ CHANGED: Make list full-width if user is not admin --- */}
      <div className={(userRole === 'admin' || userRole === 'staff') ? "col-md-8" : "col-md-12"}>
        <h2>Customer List</h2>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="list-group">
          {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
            <Link
              key={customer.id}
              to={`/customers/${customer.id}`}
              className="list-group-item list-group-item-action"
            >
              <h5 className="mb-1">{customer.name}</h5>
              <p className="mb-1">{customer.phone_number}</p>
            </Link>
          )) : (
            <div className="list-group-item text-muted">No customers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;