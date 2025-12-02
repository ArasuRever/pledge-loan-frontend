// src/pages/CustomersPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';

const API_URL = process.env.REACT_APP_API_URL;

function CustomersPage({ userRole, branchId }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Filter by branchId if provided and not 'all'
      const params = {};
      if (branchId && branchId !== 'all') {
        params.branchId = branchId;
      }

      const response = await axios.get(`${API_URL}/api/customers`, {
        headers,
        params
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [branchId]); 

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone_number && customer.phone_number.includes(searchTerm))
  );

  const showAddForm = ['admin', 'manager', 'staff'].includes(userRole);
  const showBranchContext = userRole === 'admin' && branchId === 'all';

  return (
    <div className="row g-4">
      {/* 1. Add Customer Form (Left Side) */}
      {showAddForm && (
        <div className="col-md-4">
          <div className="sticky-top" style={{ top: '20px', zIndex: 1 }}>
             <CustomerForm onCustomerAdded={fetchCustomers} />
          </div>
        </div>
      )}

      {/* 2. Customer List (Right Side / Full Width) */}
      <div className={showAddForm ? "col-md-8" : "col-md-12"}>
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white py-3">
             <h4 className="mb-3 text-dark fw-bold">Customer Directory</h4>
             <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control border-start-0 bg-light"
                  placeholder="Search by Name or Phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          {/* SCROLLABLE LIST CONTAINER */}
          <div 
            className="list-group list-group-flush overflow-auto" 
            style={{ maxHeight: '70vh', minHeight: '300px' }}
          >
            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="list-group-item list-group-item-action py-3 px-4"
              >
                <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                  <h6 className="mb-0 fw-bold text-primary">{customer.name}</h6>
                  {showBranchContext && customer.branch_name && (
                     <span className="badge bg-light text-secondary border small">
                       {customer.branch_name}
                     </span>
                  )}
                </div>
                <div className="text-muted small">
                  <i className="bi bi-telephone me-2"></i>{customer.phone_number || 'N/A'}
                </div>
              </Link>
            )) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-person-x fs-1 d-block mb-2 opacity-50"></i>
                No customers found.
              </div>
            )}
          </div>
          
          <div className="card-footer bg-light text-end text-muted small py-2">
             Showing {filteredCustomers.length} records
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;