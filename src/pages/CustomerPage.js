import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import LoanForm from '../components/LoanForm';
import EditCustomerForm from '../components/EditCustomerForm';

function CustomerPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showLoanForm, setShowLoanForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const customerPromise = axios.get(`/api/customers/${id}`);
        const loansPromise = axios.get(`/api/customers/${id}/loans`);
        const [customerResponse, loansResponse] = await Promise.all([customerPromise, loansPromise]);
        setCustomer(customerResponse.data);
        setLoans(loansResponse.data);
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Customer not found or an error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, refreshTrigger]);

  // Helper to get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return <span className="badge bg-danger rounded-pill">Overdue</span>;
      case 'active':
        return <span className="badge bg-primary rounded-pill">Active</span>;
      case 'paid':
        return <span className="badge bg-success rounded-pill">Paid</span>;
      case 'forfeited':
        return <span className="badge bg-secondary rounded-pill">Forfeited</span>;
      default:
        return null;
    }
  };

  if (isLoading) return <div className="text-center p-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  if (error) return <div className="alert alert-danger"><p>{error}</p><Link to="/customers">Go back to Customers</Link></div>;
  if (!customer) return null;

  if (isEditing) {
      return (
          <EditCustomerForm 
              customer={customer} 
              onUpdate={() => { 
                  setIsEditing(false);
                  setRefreshTrigger(t => t + 1);
              }}
              onCancel={() => setIsEditing(false)}
          />
      );
  }
  
  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'overdue');
  const closedLoans = loans.filter(loan => loan.status === 'paid' || loan.status === 'forfeited');

  return (
    <div>
      {/* --- 1. CUSTOMER PROFILE HEADER (Full Width) --- */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-2 col-sm-3 text-center">
              <img 
                src={customer.customer_image_url || 'https://via.placeholder.com/150'} 
                alt={customer.name}
                className="img-fluid rounded-circle"
                style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
              />
            </div>
            <div className="col-md-7 col-sm-9">
              <h2 className="mb-1">{customer.name}</h2>
              <p className="text-muted mb-1">
                <i className="bi bi-phone me-2"></i>{customer.phone_number}
              </p>
              <p className="text-muted">
                <i className="bi bi-geo-alt me-2"></i>{customer.address}
              </p>
            </div>
            <div className="col-md-3 text-md-end mt-2 mt-md-0">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <i className="bi bi-pencil me-1"></i> Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. NEW TWO-COLUMN LAYOUT --- */}
      <div className="row">
        
        {/* --- 2A. LEFT COLUMN (Pledge Form) --- */}
        <div className="col-md-5 col-lg-4">
          <div className="d-grid mb-3">
            <button className={`btn ${showLoanForm ? 'btn-danger' : 'btn-primary'}`} onClick={() => setShowLoanForm(!showLoanForm)}>
              {showLoanForm ? <i className="bi bi-x-lg me-1"></i> : <i className="bi bi-plus-lg me-1"></i>}
              {showLoanForm ? 'Cancel New Pledge' : 'Create New Pledge'}
            </button>
          </div>
          
          {showLoanForm && (
            <LoanForm 
              customerId={id} 
              onLoanAdded={() => {
                setRefreshTrigger(t => t + 1);
                setShowLoanForm(false); // Hide form on success
              }} 
            />
          )}
        </div>

        {/* --- 2B. RIGHT COLUMN (Loan Lists) --- */}
        <div className="col-md-7 col-lg-8">
          
          {/* --- Active Loans Card --- */}
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h5 className="mb-0">Active Loans</h5>
            </div>
            <div className="card-body">
              {activeLoans.length > 0 ? (
                <div className="list-group list-group-flush">
                  {activeLoans.map(loan => (
                    <Link key={loan.loan_id} to={`/loans/${loan.loan_id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-0">
                      <div>
                        <strong>Book #: {loan.book_loan_number} (Loan #{loan.loan_id})</strong>
                          <span className="ms-2">- ₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</span>
                          <span className="text-muted ms-2">{loan.description ? `(${loan.description})` : ''}</span>
                        <small className="d-block text-muted">
                          Pledged: {new Date(loan.pledge_date).toLocaleDateString()} | Due: {new Date(loan.due_date).toLocaleDateString()}
                        </small>
                      </div>
                      {getStatusBadge(loan.status)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No active loans.</p>
              )}
            </div>
          </div>

          {/* --- Closed Loans Card --- */}
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h5 className="mb-0">Closed Loans</h5>
            </div>
            <div className="card-body">
              {closedLoans.length > 0 ? (
                <div className="list-group list-group-flush">
                  {closedLoans.map(loan => (
                    <Link key={loan.loan_id} to={`/loans/${loan.loan_id}`} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center px-0 list-group-item-light text-muted">
                      <div>
                        <strong>Book #: {loan.book_loan_number} (Loan #{loan.loan_id})</strong>
<span className="ms-2">- ₹{parseFloat(loan.principal_amount).toLocaleString('en-IN')}</span>
                        <small className="d-block text-muted">Pledged: {new Date(loan.pledge_date).toLocaleDateString()}</small>
                      </div>
                      {getStatusBadge(loan.status)}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No closed loans.</p>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <Link to="/customers" className="btn btn-secondary mt-3">
        <i className="bi bi-arrow-left me-1"></i>
        Back to Customers
      </Link>
    </div>
  );
}

export default CustomerPage;