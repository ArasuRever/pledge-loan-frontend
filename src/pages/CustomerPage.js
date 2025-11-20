// src/pages/CustomerPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditCustomerForm from '../components/EditCustomerForm';

const CustomerPage = ({ userRole }) => {
  // --- RESTORED API_URL CONSTANT ---
  const API_URL = process.env.REACT_APP_API_URL;

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
        // --- USING API_URL HERE ---
        const customerRes = await axios.get(`${API_URL}/customers/${id}`);
        setCustomer(customerRes.data);
        
        // --- AND HERE ---
        const loansRes = await axios.get(`${API_URL}/customers/${id}/loans`);
        setLoans(loansRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError('Failed to load customer data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, API_URL]); // Added API_URL to dependency array

  const handleUpdateSuccess = (updatedCustomer) => {
    setCustomer(updatedCustomer);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This will move the customer and closed loans to the Recycle Bin.")) return;
    try {
      // --- USING API_URL HERE ---
      await axios.delete(`${API_URL}/customers/${id}`);
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
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
          {/* Customer Profile Card */}
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                 {customer.customer_image_url ? (
                    <img 
                      src={customer.customer_image_url} 
                      alt={customer.name} 
                      className="img-fluid rounded-circle mb-3" 
                      style={{ width: '150px', height: '150px', objectFit: 'cover', border: '4px solid #f8f9fa' }} 
                    />
                 ) : (
                    <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '150px', height: '150px', fontSize: '3rem' }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                 )}
                 <h3 className="card-title">{customer.name}</h3>
                 <p className="text-muted"><i className="bi bi-telephone-fill me-2"></i>{customer.phone_number}</p>
                 <p className="text-muted"><i className="bi bi-geo-alt-fill me-2"></i>{customer.address || 'No Address'}</p>
                 
                 <hr/>
                 
                 {/* New KYC & Nominee Section */}
                 <div className="text-start px-3">
                    <h6 className="text-uppercase text-muted small fw-bold">KYC Details</h6>
                    <p className="mb-1"><strong>ID Type:</strong> {customer.id_proof_type || 'Not Provided'}</p>
                    <p className="mb-3"><strong>ID Number:</strong> {customer.id_proof_number || '---'}</p>
                    
                    <h6 className="text-uppercase text-muted small fw-bold">Nominee</h6>
                    <p className="mb-1"><strong>Name:</strong> {customer.nominee_name || '---'}</p>
                    <p className="mb-0"><strong>Relation:</strong> {customer.nominee_relation || '---'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Loan History Column (Unchanged) */}
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-header bg-white py-3">
                <h5 className="mb-0">Loan History</h5>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Loan #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-4 text-muted">No loans found for this customer.</td></tr>
                    ) : (
                        loans.map(loan => (
                            <tr key={loan.loan_id}>
                                <td className="fw-bold">{loan.book_loan_number}</td>
                                <td>{new Date(loan.pledge_date).toLocaleDateString()}</td>
                                <td>₹{parseFloat(loan.principal_amount).toFixed(2)}</td>
                                <td>
                                    <span className={`badge rounded-pill bg-${
                                        loan.status === 'active' ? 'success' : 
                                        loan.status === 'overdue' ? 'danger' : 
                                        loan.status === 'paid' ? 'secondary' : 'warning'
                                    }`}>
                                        {loan.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <Link to={`/loans/${loan.loan_id}`} className="btn btn-sm btn-outline-primary">
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