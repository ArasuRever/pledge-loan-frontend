import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';

const API_URL = process.env.REACT_APP_API_URL;

function CustomersPage({ userRole, branchId }) {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const params = {};
      if (branchId && branchId !== 'all') {
        params.branchId = branchId;
      }

      const response = await axios.get(`${API_URL}/api/customers`, { headers, params });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
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

  // Helper to render Avatar
  const renderAvatar = (customer) => {
    if (customer.customer_image_url) {
      return <img src={customer.customer_image_url} alt={customer.name} className="rounded-circle" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />;
    }
    return (
      <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '50px', height: '50px', fontSize: '1.2rem' }}>
        {customer.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="row g-4">
      {/* --- LEFT COLUMN: CREATE FORM --- */}
      {showAddForm && (
        <div className="col-lg-4 col-md-5">
          <div className="sticky-top" style={{ top: '20px', zIndex: 1 }}>
             <CustomerForm onCustomerAdded={fetchCustomers} />
          </div>
        </div>
      )}

      {/* --- RIGHT COLUMN: DIRECTORY --- */}
      <div className={showAddForm ? "col-lg-8 col-md-7" : "col-12"}>
        <div className="card shadow-sm border-0 h-100">
          
          {/* HEADER & SEARCH */}
          <div className="card-header bg-white py-4 border-bottom border-light">
             <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                  <h4 className="mb-1 text-dark fw-bold">Customer Directory</h4>
                  <p className="text-muted small mb-0">Manage details and view history</p>
                </div>
                
                <div className="input-group shadow-sm" style={{ maxWidth: '350px' }}>
                    <span className="input-group-text bg-white border-end-0 ps-3"><i className="bi bi-search text-muted"></i></span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search Name or Phone..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
             </div>
          </div>
          
          {/* LIST CONTAINER */}
          <div className="list-group list-group-flush overflow-auto custom-scrollbar" style={{ maxHeight: '75vh', minHeight: '300px' }}>
            {isLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => (
                  <Link
                    key={customer.id}
                    to={`/customers/${customer.id}`}
                    className="list-group-item list-group-item-action py-3 px-4 border-bottom-0 border-top"
                    style={{ transition: 'background-color 0.2s' }}
                  >
                    <div className="d-flex align-items-center">
                      
                      {/* Avatar */}
                      <div className="me-3">
                        {renderAvatar(customer)}
                      </div>

                      {/* Info */}
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 fw-bold text-dark">{customer.name}</h6>
                          {showBranchContext && customer.branch_name && (
                             <span className="badge bg-light text-secondary border">{customer.branch_name}</span>
                          )}
                        </div>
                        <div className="text-muted small mt-1">
                          <i className="bi bi-telephone me-1"></i> {customer.phone_number}
                          <span className="mx-2">•</span>
                          <span className="text-truncate d-inline-block" style={{ maxWidth: '150px', verticalAlign: 'middle' }}>
                            {customer.address || 'No Address'}
                          </span>
                        </div>
                      </div>

                      {/* Stats Badges */}
                      <div className="d-none d-sm-flex gap-2 ms-3">
                        {parseInt(customer.overdue_loan_count) > 0 && (
                          <div className="badge bg-danger bg-opacity-10 text-danger px-2 py-2" title="Overdue Loans">
                            {customer.overdue_loan_count} <i className="bi bi-exclamation-circle-fill ms-1"></i>
                          </div>
                        )}
                        {parseInt(customer.active_loan_count) > 0 && (
                          <div className="badge bg-success bg-opacity-10 text-success px-2 py-2" title="Active Loans">
                            {customer.active_loan_count} <i className="bi bi-file-earmark-check-fill ms-1"></i>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="ms-3 text-muted">
                        <i className="bi bi-chevron-right"></i>
                      </div>
                    </div>
                  </Link>
                ))
            ) : (
              <div className="text-center py-5 text-muted">
                <div className="mb-3"><i className="bi bi-people fs-1 opacity-25"></i></div>
                <p>No customers found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-white border-top text-end text-muted small py-3">
             Showing {filteredCustomers.length} records
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;