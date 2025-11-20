// src/pages/CustomerPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditCustomerForm from '../components/EditCustomerForm';
import LoanForm from '../components/LoanForm'; 

// --- Modal Styles ---
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 1050,
    padding: '20px'
};
const modalContentStyle = {
    backgroundColor: 'white', borderRadius: '12px', 
    width: '100%', maxWidth: '900px',
    maxHeight: '90vh', overflowY: 'auto',
    position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const CustomerPage = ({ userRole }) => {
  const API_URL = process.env.REACT_APP_API_URL;

  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [error, setError] = useState('');

  // Fetch Data
  const fetchData = async () => {
    try {
      const [customerRes, loansRes] = await Promise.all([
        axios.get(`${API_URL}/api/customers/${id}`),
        axios.get(`${API_URL}/api/customers/${id}/loans`)
      ]);

      setCustomer(customerRes.data);
      setLoans(loansRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to load customer data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, API_URL]);

  const handleUpdateSuccess = (updatedCustomer) => {
    setCustomer(updatedCustomer);
    setIsEditing(false);
  };

  const handleLoanAdded = () => {
    setShowLoanForm(false); 
    fetchData(); 
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will move the customer to Recycle Bin.")) return;
    try {
      await axios.delete(`${API_URL}/api/customers/${id}`);
      alert("Customer moved to Recycle Bin.");
      navigate('/customers');
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete customer.");
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;
  if (!customer) return <div className="alert alert-warning m-4">Customer not found.</div>;

  return (
    <div className="container pb-5">
      {/* Header Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4 mt-3">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div className="d-flex gap-2">
          <button className="btn btn-warning" onClick={() => setIsEditing(!isEditing)}>
            <i className="bi bi-pencil me-1"></i> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
          
          {userRole === 'admin' && (
             <button className="btn btn-danger" onClick={handleDelete}>
                <i className="bi bi-trash me-1"></i> Delete
             </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <EditCustomerForm customer={customer} onUpdateSuccess={handleUpdateSuccess} onCancel={() => setIsEditing(false)} />
      ) : (
        <div className="row mb-4">
          {/* --- LEFT COL: Customer Profile --- */}
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4 d-flex flex-column">
                 {/* Profile Image */}
                 <div className="mb-3 d-flex justify-content-center">
                   {customer.customer_image_url ? (
                      <img 
                        src={customer.customer_image_url} 
                        alt={customer.name} 
                        className="rounded-circle shadow-sm" 
                        style={{ width: '130px', height: '130px', objectFit: 'cover', border: '4px solid #fff' }} 
                      />
                   ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '130px', height: '130px', fontSize: '3rem', fontWeight: 'bold' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                   )}
                 </div>
                 
                 <h3 className="card-title fw-bold text-dark mb-1">{customer.name}</h3>
                 <p className="text-muted mb-3"><i className="bi bi-telephone-fill me-2 text-primary"></i>{customer.phone_number}</p>
                 
                 <div className="card bg-light border-0 p-3 mb-3 text-start">
                    <small className="text-uppercase text-muted fw-bold mb-1 d-block" style={{fontSize: '0.75rem'}}>Address</small>
                    <p className="mb-0 text-dark small">{customer.address || 'No Address Provided'}</p>
                 </div>
                 
                 {/* KYC Section */}
                 {(customer.id_proof_number || customer.nominee_name) && (
                   <div className="text-start mb-4">
                      <h6 className="text-uppercase text-primary small fw-bold border-bottom pb-2 mb-2">Details</h6>
                      {customer.id_proof_number && (
                        <div className="mb-2 d-flex justify-content-between small">
                          <span className="text-muted">ID ({customer.id_proof_type}):</span>
                          <span className="fw-medium text-truncate" style={{maxWidth: '150px'}}>{customer.id_proof_number}</span>
                        </div>
                      )}
                      {customer.nominee_name && (
                        <div className="mb-0 d-flex justify-content-between small">
                          <span className="text-muted">Nominee ({customer.nominee_relation}):</span>
                          <span className="fw-medium text-truncate" style={{maxWidth: '150px'}}>{customer.nominee_name}</span>
                        </div>
                      )}
                   </div>
                 )}

                 {/* Create Pledge Button */}
                 <div className="mt-auto">
                    <button 
                        className="btn btn-success w-100 py-2 fw-bold shadow-sm" 
                        onClick={() => setShowLoanForm(true)}
                    >
                        <i className="bi bi-plus-circle-fill me-2"></i>
                        Create New Pledge
                    </button>
                 </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COL: Loan History --- */}
          <div className="col-md-8">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-primary"><i className="bi bi-clock-history me-2"></i>Loan History</h5>
                <span className="badge bg-light text-dark border">{loans.length} Records</span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Loan #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-5 text-muted">No loans found for this customer.</td></tr>
                    ) : (
                        loans.map(loan => (
                            <tr key={loan.loan_id}>
                                <td className="fw-bold ps-3 text-primary">{loan.book_loan_number}</td>
                                <td>{new Date(loan.pledge_date).toLocaleDateString()}</td>
                                <td className="fw-bold">₹{parseFloat(loan.principal_amount).toFixed(2)}</td>
                                <td>
                                    <span className={`badge rounded-pill bg-${
                                        loan.status === 'active' ? 'success' : 
                                        loan.status === 'overdue' ? 'danger' : 
                                        loan.status === 'paid' ? 'secondary' : 'warning'
                                    } px-3 py-2`}>
                                        {loan.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <Link to={`/loans/${loan.loan_id}`} className="btn btn-sm btn-outline-primary border-0">
                                        View <i className="bi bi-chevron-right ms-1"></i>
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL FOR CREATE PLEDGE --- */}
      {showLoanForm && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle} className="animate__animated animate__fadeInUp">
                  {/* 1. Standard Bootstrap Close Button (Top Right) */}
                  <button 
                    type="button" 
                    className="btn-close position-absolute top-0 end-0 m-3" 
                    aria-label="Close" 
                    onClick={() => setShowLoanForm(false)}
                    style={{zIndex: 10}}
                  ></button>

                  <div className="p-2">
                    <LoanForm 
                        customerId={id} 
                        onLoanAdded={handleLoanAdded} 
                        onCancel={() => setShowLoanForm(false)} // 2. Pass cancel handler to form
                    />
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default CustomerPage;