import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customers');
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
    customer.phone_number.includes(searchTerm)
  );

  return (
    <div className="row">
      <div className="col-md-4">
        <CustomerForm onCustomerAdded={fetchCustomers} />
      </div>
      <div className="col-md-8">
        <h2>Customer List</h2>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search by name or phone number..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="list-group">
          {filteredCustomers.map(customer => (
            <Link
              key={customer.id}
              to={`/customers/${customer.id}`}
              className="list-group-item list-group-item-action"
            >
              <h5 className="mb-1">{customer.name}</h5>
              <p className="mb-1">{customer.phone_number}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;