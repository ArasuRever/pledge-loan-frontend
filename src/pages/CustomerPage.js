// src/pages/CustomerPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditCustomerForm from '../components/EditCustomerForm';

const CustomerPage = ({ userRole }) => {
  const API_URL = process.env.REACT_APP_API_URL; // e.g. https://your-app.onrender.com

  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // FIXED: Added '/api' before /customers
        const customerRes = await axios.get(`${API_URL}/api/customers/${id}`);
        setCustomer(customerRes.data);
        
        // FIXED: Added '/api' before /customers
        const loansRes = await axios.get(`${API_URL}/api/customers/${id}/loans`);
        setLoans(loansRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError('Failed to load customer data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, API_URL]);

  const handleUpdateSuccess = (updatedCustomer) => {
    setCustomer(updatedCustomer);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will move the customer and closed loans to the Recycle Bin.")) return;
    try {
      // FIXED: Added '/api'
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
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-2"></i>Back
        </button>
        <div>
          <button className="btn btn-warning me-2" onClick={() => setIsEditing(!isEditing)}>
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
          {/* Profile Card */}
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                 {/* Profile Image Logic */}
                 <div className="mb-3 d-flex justify-content-center">
                   {customer.customer_image_url ? (
                      <img 
                        src={customer.customer_image_url} 
                        alt={customer.name} 
                        className="rounded-circle shadow-sm" 
                        style={{ width: '140px', height: '140px', objectFit: 'cover', border: '4px solid #fff' }} 
                      />
                   ) : (
                      <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: '140px', height: '140px', fontSize: '3.5rem', fontWeight: 'bold' }}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                   )}
                 </div>
                 
                 <h3 className="card-title fw-bold text-dark mb-1">{customer.name}</h3>
                 <p className="text-muted mb-3"><i className="bi bi-telephone-fill me-2 text-primary"></i>{customer.phone_number}</p>
                 
                 <div className="card bg-light border-0 p-3 mb-3 text-start">
                    <small className="text-uppercase text-muted fw-bold mb-2 d-block">Address</small>
                    <p className="mb-0 text-dark">{customer.address || 'No Address Provided'}</p>
                 </div>
                 
                 {/* KYC & Nominee Section - Only show if data exists */}
                 {(customer.id_proof_number || customer.nominee_name) && (
                   <div className="text-start mt-4">
                      <h6 className="text-uppercase text-primary small fw-bold border-bottom pb-2 mb-3">Additional Details</h6>
                      
                      {customer.id_proof_number && (
                        <div className="mb-3">
                          <small className="text-muted d-block">ID Proof ({customer.id_proof_type})</small>
                          <span className="fw-medium">{customer.id_proof_number}</span>
                        </div>
                      )}
                      
                      {customer.nominee_name && (
                        <div className="mb-0">
                          <small className="text-muted d-block">Nominee ({customer.nominee_relation})</small>
                          <span className="fw-medium">{customer.nominee_name}</span>
                        </div>
                      )}
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Loan History Column */}
          <div className="col-md-8">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3 border-bottom-0">
                <h5 className="mb-0 fw-bold text-primary"><i className="bi bi-clock-history me-2"></i>Loan History</h5>
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
                                    <Link to={`/loans/${loan.loan_id}`} className="btn btn-sm btn-light border">
                                        View
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
    </div>
  );
};

export default CustomerPage;